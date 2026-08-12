import json
from collections import Counter

with open(
    "data/archive-2025-test.json",
    "r",
    encoding="utf-8"
) as file:
    data = json.load(file)

games = data["games"]

counts = Counter(
    game["competition"]
    for game in games
)

print()
print("Competition breakdown:")

for competition, count in counts.items():
    print(f"{competition}: {count}")

print()
print(f"TOTAL: {len(games)}")