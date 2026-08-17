import json
from pathlib import Path
from collections import defaultdict

ARCHIVE_FILE = Path("data/archive-2026.json")
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
    status = game.get("status")
    home_score = game.get("homeScore")
    away_score = game.get("awayScore")

    if status != "PLAYED":
        return False

    if home_score is None or away_score is None:
        return False

    return True


def generate_standings():
    with open(ARCHIVE_FILE, "r", encoding="utf-8") as f:
        data = json.load(f)
        games = data["games"]

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