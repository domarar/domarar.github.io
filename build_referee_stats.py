#!/usr/bin/env python3
"""Generate referee appearance and discipline statistics by season and league."""

import argparse
import json
import re
from collections import defaultdict
from datetime import datetime, timezone
from pathlib import Path


LEAGUE_PATTERN = re.compile(
    r"(Besta deild (?:karla|kvenna)|Lengjudeild (?:karla|kvenna)|[234]\. deild karla)",
    re.IGNORECASE,
)

REFEREE_ROLES = {"dómari", "referee"}
ASSISTANT_ROLES = {
    "aðstoðardómari 1",
    "aðstoðardómari 2",
    "assistant referee 1",
    "assistant referee 2",
}
FOURTH_OFFICIAL_ROLES = {
    "fjórði dómari",
    "fourth official",
}


def normalize_text(value):
    return " ".join(str(value or "").strip().split())


def official_group(role):
    normalized = normalize_text(role).casefold()
    if normalized in REFEREE_ROLES:
        return "referee"
    if normalized in ASSISTANT_ROLES:
        return "assistant"
    if normalized in FOURTH_OFFICIAL_ROLES:
        return "fourthOfficial"
    return None


def league_name(competition):
    match = LEAGUE_PATTERN.search(normalize_text(competition))
    if not match:
        return None
    value = match.group(1)
    return value[0].upper() + value[1:]


def event_counts(report):
    totals = {"yellow": 0, "red": 0, "penalty": 0}
    for event in report.get("events") or []:
        event_type = normalize_text((event.get("eventType") or {}).get("fcdName")).upper()
        phase = normalize_text((event.get("matchPhase") or {}).get("fcdName")).upper()
        if event_type == "YELLOW":
            totals["yellow"] += 1
        elif event_type in {"RED", "SECOND_YELLOW", "EXPULSION"}:
            totals["red"] += 1
        elif event_type == "PENALTY" and phase != "PEN":
            totals["penalty"] += 1
    return totals


def rounded(value):
    return round(value + 1e-12, 2)


def build_statistics(archive_path, reports_dir):
    archive = json.loads(Path(archive_path).read_text(encoding="utf-8"))
    reports_dir = Path(reports_dir)
    groups = defaultdict(lambda: {
        "games": 0,
        "reports": 0,
        "leagueEvents": {"yellow": 0, "red": 0, "penalty": 0},
        "referees": defaultdict(lambda: {
            "name": "", "personId": None, "appearances": 0,
            "reportedGames": 0, "yellow": 0, "red": 0, "penalty": 0,
        }),
        "assistants": defaultdict(lambda: {
            "name": "", "personId": None, "appearances": 0,
        }),
        "fourthOfficials": defaultdict(lambda: {
            "name": "", "personId": None, "appearances": 0,
        }),
    })

    for game in archive.get("games") or []:
        if normalize_text(game.get("status")).upper() != "PLAYED":
            continue
        league = league_name(game.get("competition"))
        if not league:
            continue
        year_match = re.match(r"(20\d{2})", normalize_text(game.get("date")))
        if not year_match:
            continue
        year = int(year_match.group(1))
        key = (year, league)
        group = groups[key]
        group["games"] += 1

        referee_entry = None
        for official in game.get("officials") or []:
            role_group = official_group(official.get("role"))
            if not role_group:
                continue
            name = normalize_text(official.get("name"))
            if not name:
                continue
            identity = name.casefold()
            bucket_name = {
                "referee": "referees",
                "assistant": "assistants",
                "fourthOfficial": "fourthOfficials",
            }[role_group]
            bucket = group[bucket_name]
            entry = bucket[identity]
            entry["name"] = name
            entry["personId"] = entry["personId"] or official.get("personId")
            entry["appearances"] += 1
            if role_group == "referee":
                referee_entry = entry

        report_path = reports_dir / f"{game.get('id')}.json"
        if not report_path.exists():
            continue
        try:
            report = json.loads(report_path.read_text(encoding="utf-8"))
        except (OSError, json.JSONDecodeError):
            continue
        counts = event_counts(report)
        group["reports"] += 1
        for metric, value in counts.items():
            group["leagueEvents"][metric] += value
        if referee_entry is not None:
            referee_entry["reportedGames"] += 1
            for metric, value in counts.items():
                referee_entry[metric] += value

    seasons = defaultdict(list)
    for (year, league), group in sorted(groups.items()):
        report_count = group["reports"]
        league_averages = {
            metric: rounded(value / report_count) if report_count else None
            for metric, value in group["leagueEvents"].items()
        }

        referees = []
        for entry in group["referees"].values():
            reported = entry["reportedGames"]
            item = dict(entry)
            item["averages"] = {
                metric: rounded(item[metric] / reported) if reported else None
                for metric in ("yellow", "red", "penalty")
            }
            referees.append(item)

        referees.sort(key=lambda item: (-item["appearances"], item["name"].casefold()))
        assistants = sorted(
            (dict(item) for item in group["assistants"].values()),
            key=lambda item: (-item["appearances"], item["name"].casefold()),
        )
        fourth_officials = sorted(
            (dict(item) for item in group["fourthOfficials"].values()),
            key=lambda item: (-item["appearances"], item["name"].casefold()),
        )

        seasons[str(year)].append({
            "name": league,
            "playedGames": group["games"],
            "reportCoverage": {
                "available": report_count,
                "total": group["games"],
                "complete": report_count == group["games"],
            },
            "leagueAverages": league_averages,
            "referees": referees,
            "assistants": assistants,
            "fourthOfficials": fourth_officials,
        })

    preferred = {
        name: index for index, name in enumerate([
            "Besta deild karla", "Besta deild kvenna",
            "Lengjudeild karla", "Lengjudeild kvenna",
            "2. deild karla", "3. deild karla", "4. deild karla",
        ])
    }
    for leagues in seasons.values():
        leagues.sort(key=lambda item: preferred.get(item["name"], 999))

    return {
        "generatedAt": datetime.now(timezone.utc).isoformat(),
        "methodology": {
            "appearances": "Played matches only; referee and assistant roles counted separately.",
            "yellow": "YELLOW events.",
            "red": "RED, SECOND_YELLOW and EXPULSION events.",
            "penalty": "PENALTY events outside penalty shoot-outs.",
        },
        "seasons": dict(sorted(seasons.items(), reverse=True)),
    }


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--archive", default="data/archive.json")
    parser.add_argument("--reports", default="data/match-reports")
    parser.add_argument("--output", default="data/referee-stats.json")
    args = parser.parse_args()
    result = build_statistics(args.archive, args.reports)
    output = Path(args.output)
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(json.dumps(result, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"Wrote {output}")


if __name__ == "__main__":
    main()
