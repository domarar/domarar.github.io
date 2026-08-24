import glob
import json
from datetime import datetime, timezone


combined_games_by_id = {}
included_years = []

archive_files = sorted(
    glob.glob("data/archive-20??.json")
)

print("Combining:")

for archive_file in archive_files:
    print(f"  {archive_file}")

    with open(
        archive_file,
        "r",
        encoding="utf-8"
    ) as file:
        archive_data = json.load(file)

    file_year = archive_data.get("year")

    if file_year is not None:
        included_years.append(file_year)

    for game in archive_data.get("games", []):
        game_id = game.get("id")

        if game_id is not None:
            combined_games_by_id[game_id] = game


combined_games = list(
    combined_games_by_id.values()
)

combined_games.sort(
    key=lambda game: game.get("date") or ""
)


combined_output = {
    "updatedAt": datetime.now(
        timezone.utc
    ).isoformat(),
    "years": sorted(set(included_years)),
    "gameCount": len(combined_games),
    "games": combined_games
}


with open(
    "data/archive.json",
    "w",
    encoding="utf-8"
) as file:
    json.dump(
        combined_output,
        file,
        ensure_ascii=False,
        indent=2
    )


print()
print(f"Combined total: {len(combined_games)}")
print(f"Years: {sorted(set(included_years))}")
print("Saved to data/archive.json")