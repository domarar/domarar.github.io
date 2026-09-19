import sys
import json
import re
from pathlib import Path
from collections import defaultdict
from datetime import datetime, timezone, timedelta


YEAR = sys.argv[1] if len(sys.argv) > 1 else "2026"

ARCHIVE_FILE = Path(f"data/archive-{YEAR}.json")

CURRENT_GAMES_FILE = (
    Path("data/games.json")
    if YEAR == "2026"
    else None
)

SPLIT_FIXTURES_FILE = (
    Path("data/archive.json")
    if YEAR == "2026"
    else None
)

OUTPUT_FILE = (
    Path("data/standings.json")
    if YEAR == "2026"
    else Path(f"data/standings-{YEAR}.json")
)


# ============================================================
# COMPETITION NAME
# ============================================================

def clean_competition_name(name):
    if not name:
        return "Unknown"

    name = name.replace("Íslandsmót KSÍ - ", "")

    # Remove season year:
    # 2026, 2027, 2028 etc.
    name = re.sub(r"\s20\d{2}", "", name)

    return name.strip()


def get_split_base_competition(competition):
    """
    Examples:

    Besta deild karla - Efri hluti
        -> Besta deild karla

    Besta deild kvenna - Neðri hluti
        -> Besta deild kvenna
    """

    for suffix in (
        " - Efri hluti",
        " - Neðri hluti",
    ):
        if competition.endswith(suffix):
            return competition[:-len(suffix)].strip()

    return None


# ============================================================
# MATCH STATE
# ============================================================

def game_should_count(game):
    home_score = game.get("homeScore")
    away_score = game.get("awayScore")
    match_date = game.get("date")

    if home_score is None or away_score is None:
        return False

    if not match_date:
        return False

    try:
        kickoff = datetime.fromisoformat(
            match_date.replace("Z", "+00:00")
        )

        if kickoff.tzinfo is None:
            kickoff = kickoff.replace(
                tzinfo=timezone.utc
            )

    except ValueError:
        return False

    now = datetime.now(timezone.utc)

    # Never count a future match just because
    # a placeholder score exists.
    if now < kickoff:
        return False

    return True


def game_is_live(game):
    status = game.get("status")
    home_score = game.get("homeScore")
    away_score = game.get("awayScore")
    match_date = game.get("date")

    if home_score is None or away_score is None:
        return False

    if not match_date:
        return False

    if status == "PLAYED":
        return False

    try:
        kickoff = datetime.fromisoformat(
            match_date.replace("Z", "+00:00")
        )

        if kickoff.tzinfo is None:
            kickoff = kickoff.replace(
                tzinfo=timezone.utc
            )

    except ValueError:
        return False

    now = datetime.now(timezone.utc)

    return (
        now >= kickoff
        and now <= kickoff + timedelta(
            hours=2,
            minutes=15,
        )
    )


# ============================================================
# DATA LOADING
# ============================================================

def load_all_games():
    games_by_id = {}

    # Full-season archive
    if ARCHIVE_FILE.exists():
        with open(
            ARCHIVE_FILE,
            "r",
            encoding="utf-8",
        ) as f:
            archive_data = json.load(f)

        for game in archive_data.get("games", []):
            game_id = game.get("id")

            if game_id is not None:
                games_by_id[game_id] = game

    # Fresh/current KSÍ data overwrites old versions
    # of the same match.
    if (
        CURRENT_GAMES_FILE
        and CURRENT_GAMES_FILE.exists()
    ):
        with open(
            CURRENT_GAMES_FILE,
            "r",
            encoding="utf-8",
        ) as f:
            current_data = json.load(f)

        for game in current_data.get("games", []):
            game_id = game.get("id")

            if game_id is not None:
                games_by_id[game_id] = game

    return list(games_by_id.values())


def load_split_fixture_games():
    if (
        not SPLIT_FIXTURES_FILE
        or not SPLIT_FIXTURES_FILE.exists()
    ):
        return []

    with open(
        SPLIT_FIXTURES_FILE,
        "r",
        encoding="utf-8",
    ) as f:
        data = json.load(f)

    return data.get("games", [])


# ============================================================
# TABLE HELPERS
# ============================================================

def empty_team_stats():
    return {
        "played": 0,
        "won": 0,
        "drawn": 0,
        "lost": 0,
        "goalsFor": 0,
        "goalsAgainst": 0,
        "points": 0,
    }


def add_stats(target, source):
    for key in (
        "played",
        "won",
        "drawn",
        "lost",
        "goalsFor",
        "goalsAgainst",
        "points",
    ):
        target[key] += source.get(key, 0)


# ============================================================
# SPLIT LEAGUE MERGE
# ============================================================

def apply_split_league_carry_over(
    competitions,
    split_members,
):
    """
    A split competition keeps the regular-season totals.

    Example:

    Besta deild kvenna
        18 games / 35 points

    Besta deild kvenna - Efri hluti
        2 games / 4 points

    Final split table:
        20 games / 39 points
    """

    split_competitions = list(
        split_members.keys()
    )

    for split_competition in split_competitions:

        base_competition = (
            get_split_base_competition(
                split_competition
            )
        )

        if not base_competition:
            continue

        regular_table = competitions.get(
            base_competition
        )

        if not regular_table:
            print(
                "Warning: no regular-season table for "
                f"{split_competition}"
            )
            continue

        split_table = competitions.get(
            split_competition,
            {},
        )

        team_names = split_members.get(
            split_competition,
            set(),
        )

        if not team_names:
            continue

        combined_table = defaultdict(
            empty_team_stats
        )

        for team_name in team_names:

            # Carry over everything earned
            # before the league split.
            if team_name in regular_table:
                add_stats(
                    combined_table[team_name],
                    regular_table[team_name],
                )

            # Add split-phase matches played so far.
            if team_name in split_table:
                add_stats(
                    combined_table[team_name],
                    split_table[team_name],
                )

        competitions[
            split_competition
        ] = combined_table


# ============================================================
# GENERATE
# ============================================================

def generate_standings():
    games = load_all_games()

    split_fixture_games = (
        load_split_fixture_games()
    )

    competitions = defaultdict(
        lambda: defaultdict(
            empty_team_stats
        )
    )

    live_teams = defaultdict(set)

    split_members = defaultdict(set)

    # --------------------------------------------------------
    # First determine membership of every split league.
    #
    # Use BOTH normal game data and the larger fixture source,
    # because a team belongs to a split group even before all
    # split matches have been played.
    # --------------------------------------------------------

    membership_games = [
        *games,
        *split_fixture_games,
    ]

    for game in membership_games:

        competition = clean_competition_name(
            game.get("competition")
        )

        if not get_split_base_competition(
            competition
        ):
            continue

        home = game.get("home")
        away = game.get("away")

        if home:
            split_members[
                competition
            ].add(home)

        if away:
            split_members[
                competition
            ].add(away)

    # --------------------------------------------------------
    # Calculate each competition on its own first.
    # --------------------------------------------------------

    for game in games:

        competition = clean_competition_name(
            game.get("competition")
        )

        home = game.get("home")
        away = game.get("away")

        if not home or not away:
            continue

        if not game_should_count(game):
            continue

        home_score = game.get(
            "homeScore"
        )

        away_score = game.get(
            "awayScore"
        )

        if game_is_live(game):
            live_teams[
                competition
            ].add(home)

            live_teams[
                competition
            ].add(away)

        home_team = competitions[
            competition
        ][home]

        away_team = competitions[
            competition
        ][away]

        # Games played
        home_team["played"] += 1
        away_team["played"] += 1

        # Goals
        home_team["goalsFor"] += (
            home_score
        )

        home_team["goalsAgainst"] += (
            away_score
        )

        away_team["goalsFor"] += (
            away_score
        )

        away_team["goalsAgainst"] += (
            home_score
        )

        # Result / points
        if home_score > away_score:

            home_team["won"] += 1
            away_team["lost"] += 1

            home_team["points"] += 3

        elif away_score > home_score:

            away_team["won"] += 1
            home_team["lost"] += 1

            away_team["points"] += 3

        else:

            home_team["drawn"] += 1
            away_team["drawn"] += 1

            home_team["points"] += 1
            away_team["points"] += 1

    # --------------------------------------------------------
    # Now turn each split table into:
    #
    # regular season + split phase
    #
    # Works automatically for both:
    # Besta deild karla
    # Besta deild kvenna
    # --------------------------------------------------------

    apply_split_league_carry_over(
        competitions,
        split_members,
    )

    # --------------------------------------------------------
    # Output
    # --------------------------------------------------------

    output = {}

    for competition, teams in (
        competitions.items()
    ):

        table = []

        for team_name, stats in (
            teams.items()
        ):

            goal_difference = (
                stats["goalsFor"]
                - stats["goalsAgainst"]
            )

            table.append(
                {
                    "team": team_name,
                    "played": stats[
                        "played"
                    ],
                    "won": stats[
                        "won"
                    ],
                    "drawn": stats[
                        "drawn"
                    ],
                    "lost": stats[
                        "lost"
                    ],
                    "goalsFor": stats[
                        "goalsFor"
                    ],
                    "goalsAgainst": stats[
                        "goalsAgainst"
                    ],
                    "goalDifference":
                        goal_difference,
                    "points": stats[
                        "points"
                    ],
                    "isLive":
                        team_name
                        in live_teams[
                            competition
                        ],
                }
            )

        # Points first,
        # then goal difference,
        # then goals scored.
        table.sort(
            key=lambda team: (
                team["points"],
                team[
                    "goalDifference"
                ],
                team["goalsFor"],
            ),
            reverse=True,
        )

        for index, team in enumerate(
            table,
            start=1,
        ):
            team["position"] = index

        output[
            competition
        ] = table

    with open(
        OUTPUT_FILE,
        "w",
        encoding="utf-8",
    ) as f:
        json.dump(
            output,
            f,
            ensure_ascii=False,
            indent=2,
        )

    print(
        "Standings generated successfully: "
        f"{OUTPUT_FILE}"
    )


if __name__ == "__main__":
    generate_standings()