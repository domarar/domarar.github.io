import json
import urllib.request

endpoint = "https://www.abler.io/comet-backend/graphql"

query = """
query CometMatches(
    $first: Int!,
    $filter: CometMatchFilterInput,
    $sort: CometMatchSort
) {
    cometMatches(
        first: $first,
        filter: $filter,
        sort: $sort
    ) {
        totalCount
        edges {
            node {
                matchId
                matchDate

                competition {
                    name
                    category
                    gender
                    competitionType
                }

                homeTeam {
                    name
                }

                awayTeam {
                    name
                }
            }
        }
    }
}
"""

payload = {
    "operationName": "CometMatches",
    "variables": {
        "first": 100,
        "filter": {
            "categories": ["Adults"],
            "dateFrom": "2025-08-01T00:00:00.000+00:00",
            "dateTo": "2025-08-15T23:59:59.999+00:00"
        },
        "sort": "NEXT_FIRST"
    },
    "query": query
}

request = urllib.request.Request(
    endpoint,
    data=json.dumps(payload).encode("utf-8"),
    headers={
        "Content-Type": "application/json",
        "User-Agent": "domarar-test"
    },
    method="POST"
)

with urllib.request.urlopen(request, timeout=60) as response:
    result = json.load(response)

matches = (
    result
    .get("data", {})
    .get("cometMatches", {})
)

print()
print("TOTAL:", matches.get("totalCount"))
print()

for edge in matches.get("edges", []):
    match = edge["node"]
    competition = match.get("competition") or {}
    home = (match.get("homeTeam") or {}).get("name")
    away = (match.get("awayTeam") or {}).get("name")

    print(
        match.get("matchDate"),
        "|",
        competition.get("name"),
        "| category:",
        competition.get("category"),
        "|",
        home,
        "-",
        away
    )