import json
import subprocess
import sys
import time
from pathlib import Path


YEAR = sys.argv[1] if len(sys.argv) > 1 else "2025"

archive_file = Path(f"data/archive-{YEAR}.json")
reports_dir = Path("data/match-reports")

REQUEST_DELAY = 3
ERROR_DELAY = 45

if not archive_file.exists():
    raise SystemExit(f"Archive not found: {archive_file}")

reports_dir.mkdir(parents=True, exist_ok=True)

with archive_file.open(encoding="utf-8") as file:
    data = json.load(file)

games = data.get("games", [])

print(f"\nDÓMARAR — Match report backfill {YEAR}")
print(f"Found {len(games)} archived matches.\n")

downloaded = 0
skipped = 0
failed = 0

for index, game in enumerate(games, start=1):
    match_id = game.get("id")

    if not match_id:
        continue

    report_file = reports_dir / f"{match_id}.json"

    if report_file.exists():
        skipped += 1
        print(f"[{index}/{len(games)}] Already exists: {match_id}")
        continue

    print(f"[{index}/{len(games)}] Fetching: {match_id}")

    try:
        subprocess.run(
            [
                sys.executable,
                "fetch_match_report.py",
                str(match_id),
            ],
            check=True,
        )

        downloaded += 1

        time.sleep(REQUEST_DELAY)

    except subprocess.CalledProcessError:
        failed += 1

        print(f"FAILED: {match_id}")
        print(f"Waiting {ERROR_DELAY} seconds before continuing...")

        time.sleep(ERROR_DELAY)

print("\n------------------------------")
print(f"Backfill {YEAR} finished")
print(f"Downloaded: {downloaded}")
print(f"Already existed: {skipped}")
print(f"Failed: {failed}")
print("------------------------------")