import json
import subprocess
import time
from pathlib import Path


ARCHIVE_FILE = Path("data/archive.json")
REPORTS_FOLDER = Path("data/match-reports")


REPORTS_FOLDER.mkdir(parents=True, exist_ok=True)


with ARCHIVE_FILE.open(
    "r",
    encoding="utf-8"
) as file:
    archive = json.load(file)


games = archive.get("games", [])


played_games = [
    game
    for game in games
    if game.get("status") == "PLAYED"
]


print(f"Found {len(played_games)} played archived games.")


games_to_process = played_games


for game in games_to_process:
    match_id = game.get("id")

    if not match_id:
        continue

    report_file = REPORTS_FOLDER / f"{match_id}.json"

    print(f"{match_id}: fetching/updating match report...")

    print(f"{match_id}: fetching match report...")

    try:
        subprocess.run(
            [
                "py",
                "fetch_match_report.py",
                str(match_id)
            ],
            check=True
        )

        print(f"{match_id}: done")

    except subprocess.CalledProcessError as error:
        print(f"{match_id}: FAILED - {error}")
    except Exception as error:
        print(f"{match_id}: UNEXPECTED ERROR - {error}")

    time.sleep(1)
