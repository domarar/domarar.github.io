import json
from pathlib import Path
from collections import defaultdict
from datetime import datetime, timezone, timedelta

ARCHIVE_FILE = Path("data/archive-2026.json")
CURRENT_GAMES_FILE = Path("data/games.json")
OUTPUT_FILE = Path("data/standings.json")


def clean_competition_name(name):
    if not name:
        return "Unknown"

    # Example:
    # "Íslandsmót KSÍ - Besta deild karla 2026"
    # becomes:
    # "Besta deild karla"

    name = name.replace("Íslandsmót KSÍ - ", "")
    name = name.replace(" 2026", "")

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

def generate_standings():
    games = load_all_games()

    competitions = defaultdict(
        lambda: defaultdict(
            lambda: {
                "played": 0,
                "goalsFor": 0,
                "goalsAgainst": 0,
                "points": 0,
            }
        )
    )
    live_teams = defaultdict(set)

    for game in games:

        if not game_should_count(game):
            continue

        competition = clean_competition_name(
            game.get("competition")
        )

        home = game.get("home")
        away = game.get("away")

        home_score = game.get("homeScore")
        away_score = game.get("awayScore")

        if not home or not away:
            continue

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

        # Points
        if home_score > away_score:
            home_team["points"] += 3

        elif away_score > home_score:
            away_team["points"] += 3

        else:
            home_team["points"] += 1
            away_team["points"] += 1

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
                        "goalDifference": goal_difference,
                        "goalsFor": stats["goalsFor"],
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