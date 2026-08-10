import json
import sys
import urllib.request
from pathlib import Path

MATCH_ID = int(sys.argv[1])

endpoint = "https://www.abler.io/comet-backend/graphql"

output_folder = Path("data/match-reports")
output_folder.mkdir(parents=True, exist_ok=True)
query = """
query KsiMatchSheet($matchId: Int!) {
  match(matchId: $matchId) {
    id
    liveStatus
    currentMinute
    dateTimeUTC
    round
    attendance

    competition {
      id
      name
    }

    facility {
      name
    }

    homeTeam {
      id
      name
      picture
    }

    awayTeam {
      id
      name
      picture
    }

    homeTeamResult {
      current
    }

    awayTeamResult {
      current
    }

    lineups {
      home {
        players {
          roleId
          personId
          name
          shortName
          shirtNumber
          starting
          captain
          position
          orderNumber
          hideProfile
        }
      }

      away {
        players {
          roleId
          personId
          name
          shortName
          shirtNumber
          starting
          captain
          position
          orderNumber
          hideProfile
        }
      }
    }

    events {
      eventId

      eventType {
        fcdName
      }

      displayMinute
      orderNumber

      matchPhase {
        fcdName
      }

      player {
        personId
        name
        hideProfile
      }

      player2 {
        personId
        name
        hideProfile
      }

      homeTeam

      teamOfficial {
        personId
        name
        shortName
      }
    }
  }
}
"""
payload = {
    "operationName": "KsiMatchSheet",
    "variables": {
        "matchId": MATCH_ID
    },
    "query": query
}
request = urllib.request.Request(
    endpoint,
    data=json.dumps(payload).encode("utf-8"),
    headers={
        "Content-Type": "application/json",
        "User-Agent": "domarar-match-report"
    },
    method="POST"
)

print(f"Fetching match report for {MATCH_ID}...")

with urllib.request.urlopen(request) as response:
    result = json.loads(response.read().decode("utf-8"))
if result.get("errors"):
    raise RuntimeError(
        json.dumps(
            result["errors"],
            ensure_ascii=False,
            indent=2
        )
    )

match = (
    result
    .get("data", {})
    .get("match")
)

if not match:
    raise RuntimeError("No match data returned.")

output_file = output_folder / f"{MATCH_ID}.json"

with output_file.open(
    "w",
    encoding="utf-8"
) as file:
    json.dump(
        match,
        file,
        ensure_ascii=False,
        indent=2
    )

print(f"Saved match report to {output_file}")