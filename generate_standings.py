import json
import re
from pathlib import Path
from collections import defaultdict
from datetime import datetime, timezone, timedelta

from competition_rules import COMPETITION_RULES

ARCHIVE_FILE = Path("data/archive-2026.json")
CURRENT_GAMES_FILE = Path("data/games.json")
SPLIT_FIXTURES_FILE = Path("data/archive.json")
OUTPUT_FILE = Path("data/standings.json")


def clean_competition_name(name):
    if not name:
        return "Unknown"

    name = name.replace("Íslandsmót KSÍ - ", "")

    # Remove season year automatically:
    # 2026, 2027, 2028 etc.
    name = re.sub(r"\s20\d{2}", "", name)

    return name.strip()


def game_should_count(game):
    home_score = game.get("homeScore")
    away_score = game.get("awayScore")
    match_date = game.get("date")

    # No score available
    if home_score is None or away_score is None:
        return False

    # No kickoff time
    if not match_date:
        return False

    try:
        kickoff = datetime.fromisoformat(
            match_date.replace("Z", "+00:00")
        )
        if kickoff.tzinfo is None:
            kickoff = kickoff.replace(tzinfo=timezone.utc)
    except ValueError:
        return False

    now = datetime.now(timezone.utc)

    # Never include a match before kickoff
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
            kickoff = kickoff.replace(tzinfo=timezone.utc)
    except ValueError:
        return False

    now = datetime.now(timezone.utc)

    return (
        now >= kickoff
        and now <= kickoff + timedelta(hours=2, minutes=15)
    )

def load_all_games():
    games_by_id = {}

    # Full-season archive
    if ARCHIVE_FILE.exists():
        with open(ARCHIVE_FILE, "r", encoding="utf-8") as f:
            archive_data = json.load(f)

        for game in archive_data.get("games", []):
            game_id = game.get("id")

            if game_id is not None:
                games_by_id[game_id] = game

    # Fresh games from the automatic KSÍ update.
    # These overwrite archive versions of the same match.
    if CURRENT_GAMES_FILE.exists():
        with open(CURRENT_GAMES_FILE, "r", encoding="utf-8") as f:
            current_data = json.load(f)

        for game in current_data.get("games", []):
            game_id = game.get("id")

            if game_id is not None:
                games_by_id[game_id] = game

    return list(games_by_id.values())

def load_split_fixture_games():
    if not SPLIT_FIXTURES_FILE.exists():
        return []

    with open(
        SPLIT_FIXTURES_FILE,
        "r",
        encoding="utf-8",
    ) as f:
        data = json.load(f)

    return data.get("games", [])

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


def apply_competition_rules(
    competitions,
    live_teams,
    split_members,
):
    for base_competition, rule in COMPETITION_RULES.items():

        if rule.get("type") != "split_league":
            continue

        regular_table = competitions.get(base_competition)

        if not regular_table:
            continue

        split_groups = rule.get("split_groups", {})

        for group_name, group_rule in split_groups.items():

            split_competition = (
                f"{base_competition} - {group_name}"
            )

            # Split matches that have actually been played.
            # Before the split starts this can be empty.
            split_table = competitions.get(
                split_competition,
                {},
            )

            # Team membership comes from future split fixtures.
            split_team_names = set(
                split_members.get(
                    split_competition,
                    set(),
                )
            )

            if not split_team_names:
                continue

            combined_table = defaultdict(empty_team_stats)

            for team_name in split_team_names:

                # Carry over the full regular-season record.
                if team_name in regular_table:
                    add_stats(
                        combined_table[team_name],
                        regular_table[team_name],
                    )

                # Add any split matches already played.
                if team_name in split_table:
                    add_stats(
                        combined_table[team_name],
                        split_table[team_name],
                    )

            competitions[split_competition] = combined_table

def generate_standings():
    games = load_all_games()

    competitions = defaultdict(
        lambda: defaultdict(empty_team_stats)
    )

    live_teams = defaultdict(set)

    split_members = defaultdict(set)

    split_fixture_games = load_split_fixture_games()

    for game in games:

        competition = clean_competition_name(
            game.get("competition")
        )

        home = game.get("home")
        away = game.get("away")

        # Remember teams belonging to split competitions,
        # even when their matches have not been played yet.
        if (
            competition.endswith("- Efri hluti")
            or competition.endswith("- Neðri hluti")
        ):
            if home:
                split_members[competition].add(home)

            if away:
                split_members[competition].add(away)

        if not game_should_count(game):
            continue
        home_score = game.get("homeScore")
        away_score = game.get("awayScore")

        if game_is_live(game):
            live_teams[competition].add(home)
            live_teams[competition].add(away)

        home_team = competitions[competition][home]
        away_team = competitions[competition][away]

        # Games played
        home_team["played"] += 1
        away_team["played"] += 1

        # Goals
        home_team["goalsFor"] += home_score
        home_team["goalsAgainst"] += away_score

        away_team["goalsFor"] += away_score
        away_team["goalsAgainst"] += home_score

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


    apply_competition_rules(
    competitions,
    live_teams,
    split_members,
)

    output = {}

    for competition, teams in competitions.items():

        table = []

        for team_name, stats in teams.items():

            goal_difference = (
                stats["goalsFor"] - stats["goalsAgainst"]
            )

            table.append(
                {
    "team": team_name,
    "played": stats["played"],
    "won": stats["won"],
    "drawn": stats["drawn"],
    "lost": stats["lost"],
    "goalsFor": stats["goalsFor"],
    "goalsAgainst": stats["goalsAgainst"],
    "goalDifference": goal_difference,
    "points": stats["points"],
    "isLive": team_name in live_teams[competition],
}
                )
            
    

        # Temporary/basic sorting:
        # points first, then goal difference
        table.sort(
    key=lambda team: (
        team["points"],
        team["goalDifference"],
        team["goalsFor"],
    ),
    reverse=True,
)

        # Add league position
        for index, team in enumerate(table, start=1):
            team["position"] = index

        output[competition] = table

    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        json.dump(
            output,
            f,
            ensure_ascii=False,
            indent=2,
        )

    print(
        f"Standings generated successfully: {OUTPUT_FILE}"
    )


if __name__ == "__main__":
    generate_standings()