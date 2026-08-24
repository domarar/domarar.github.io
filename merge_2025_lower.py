import json

MAIN_FILE = "data/archive-2025.json"
LOWER_FILE = "data/archive-2025-lower-test.json"
OUTPUT_FILE = "data/archive-2025.json"


with open(
    MAIN_FILE,
    "r",
    encoding="utf-8"
) as file:
    main_data = json.load(file)


with open(
    LOWER_FILE,
    "r",
    encoding="utf-8"
) as file:
    lower_data = json.load(file)


main_games = main_data.get("games", [])
lower_games = lower_data.get("games", [])


games_by_id = {}

for game in main_games:
    game_id = game.get("id")

    if game_id is not None:
        games_by_id[game_id] = game


before_count = len(games_by_id)


for game in lower_games:
    game_id = game.get("id")

    if game_id is not None:
        games_by_id[game_id] = game


merged_games = list(games_by_id.values())

merged_games.sort(
    key=lambda game: game.get("date") or ""
)


main_data["year"] = 2025
main_data["games"] = merged_games
main_data["gameCount"] = len(merged_games)


with open(
    OUTPUT_FILE,
    "w",
    encoding="utf-8"
) as file:
    json.dump(
        main_data,
        file,
        ensure_ascii=False,
        indent=2
    )


added_count = len(merged_games) - before_count


print()
print(f"Original 2025 games: {before_count}")
print(f"Lower division games supplied: {len(lower_games)}")
print(f"New games added: {added_count}")
print(f"Final 2025 total: {len(merged_games)}")
print()
print("Saved merged archive to:")
print(OUTPUT_FILE)