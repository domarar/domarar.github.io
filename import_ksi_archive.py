import json
import re
import urllib.request

from bs4 import BeautifulSoup

ICELANDIC_MONTHS = {
    "janúar": 1,
    "febrúar": 2,
    "mars": 3,
    "apríl": 4,
    "maí": 5,
    "júní": 6,
    "júlí": 7,
    "ágúst": 8,
    "september": 9,
    "október": 10,
    "nóvember": 11,
    "desember": 12,
}
def parse_ksi_date(date_text, year):
    cleaned = " ".join(date_text.split())

    parts = cleaned.split(" ")

    day = int(parts[1].replace(".", ""))
    month_name = parts[2].lower()
    time_text = parts[3]

    month = ICELANDIC_MONTHS[month_name]

    return f"{year}-{month:02d}-{day:02d}T{time_text}:00"

def parse_officials(report_html):
    soup = BeautifulSoup(report_html, "html.parser")

    role_map = {
        "Dómari": "Referee",
        "Aðstoðardómari 1": "Assistant Referee 1",
        "Aðstoðardómari 2": "Assistant Referee 2",
        "Fjórði dómari": "Fourth Official",
        "Dómaraeftirlitsmaður": "Referee Observer",
    }

    officials = []

    for role_text, role_name in role_map.items():
        role_span = soup.find(
            "span",
            string=lambda value:
                value
                and value.strip() == role_text
        )

        if not role_span:
            continue

        parent = role_span.parent

        name_spans = parent.find_all(
            "span",
            class_=lambda value:
                value
                and "body-4" in value
        )

        full_name = ""

        for span in name_spans:
            classes = span.get("class", [])

            if "hidden" not in classes:
                full_name = span.get_text(" ", strip=True)
                break

        if not full_name:
            continue

        officials.append({
            "personId": None,
            "name": full_name,
            "role": role_name,
            "orderNumber": len(officials) + 1,
        })

    return officials

COMPETITIONS_2025 = [
    {
        "id": 190366,
        "name": "Besta deild karla 2025",
        "gender": "Male",
        "type": "Deild",
    },
    {
        "id": 190371,
        "name": "Besta deild karla 2025 - Neðri hluti",
        "gender": "Male",
        "type": "Deild",
    },
    {
        "id": 190373,
        "name": "Besta deild karla 2025 - Efri hluti",
        "gender": "Male",
        "type": "Deild",
    },
    {
        "id": 190359,
        "name": "Lengjudeild karla 2025",
        "gender": "Male",
        "type": "Deild",
    },
    {
        "id": 190370,
        "name": "Lengjudeild karla 2025 - Umspil",
        "gender": "Male",
        "type": "Deild",
    },
    {
        "id": 190365,
        "name": "2. deild karla 2025",
        "gender": "Male",
        "type": "Deild",
    },
    {
        "id": 190372,
        "name": "Besta deild kvenna 2025",
        "gender": "Female",
        "type": "Deild",
    },
    {
        "id": 190360,
        "name": "Besta deild kvenna 2025 - Efri hluti",
        "gender": "Female",
        "type": "Deild",
    },
    {
        "id": 190355,
        "name": "Besta deild kvenna 2025 - Neðri hluti",
        "gender": "Female",
        "type": "Deild",
    },
    {
        "id": 190375,
        "name": "Lengjudeild kvenna 2025",
        "gender": "Female",
        "type": "Deild",
    },
]

BASE_URL = "https://www.ksi.is/oll-mot/mot"

all_matches_by_competition = []

for competition in COMPETITIONS_2025:
    competition_id = competition["id"]
    competition_name = competition["name"]

    print()
    print(f"=== {competition_name} ({competition_id}) ===")

    all_match_ids = []
    all_html_pages = []
    page = 1

    while True:
        url = (
            f"{BASE_URL}"
            f"?id={competition_id}"
            f"&banner-tab=matches-and-results"
            f"&page={page}"
            f"&toggle=results"
        )

        print(f"Fetching page {page}...")

        request = urllib.request.Request(
            url,
            headers={
                "User-Agent": "Mozilla/5.0"
            }
        )

        with urllib.request.urlopen(
            request,
            timeout=30
        ) as response:
            html = response.read().decode("utf-8")

        all_html_pages.append(html)

        match_ids = re.findall(
            r'/leikir-og-urslit/felagslid/leikur\?id=(\d+)',
            html
        )

        unique_page_ids = list(dict.fromkeys(match_ids))

        new_ids = [
            match_id
            for match_id in unique_page_ids
            if match_id not in all_match_ids
        ]

        if not new_ids:
            print("No new matches found. Stopping.")
            break

        print(f"Found {len(new_ids)} new matches")

        all_match_ids.extend(new_ids)
        page += 1

    all_matches_by_competition.append({
        "competition": competition,
        "match_ids": all_match_ids,
        "html_pages": all_html_pages,
    })


unique_match_ids = all_match_ids
parsed_matches = []
parsed_match_ids = set()

for competition_data in all_matches_by_competition:
    competition = competition_data["competition"]
    all_html_pages = competition_data["html_pages"]

    for page_html in all_html_pages:
        soup = BeautifulSoup(page_html, "html.parser")

        match_links = soup.find_all(
            "a",
            href=re.compile(
                r"/leikir-og-urslit/felagslid/leikur\?id=\d+"
            )
        )

        for link in match_links:
            href = link.get("href", "")

            match = re.search(
                r"id=(\d+)",
                href
            )

            if not match:
                continue

            match_id = int(match.group(1))

            if match_id in parsed_match_ids:
                continue

            card = link.find_parent(
                "div",
                class_=lambda value:
                    value
                    and "grid-cols-[70%_auto]" in value
            )

            if not card:
                continue

            team_names = [
                span.get_text(" ", strip=True)
                for span in card.find_all(
                    "span",
                    class_=lambda value:
                        value
                        and "body-4" in value
                        and "group-hover:underline" in value
                )
            ]

            team_logos = [
                img.get("src", "")
                for img in card.find_all(
                    "img",
                    alt=True
                )
            ]

            score_span = card.find(
                "span",
                class_=lambda value:
                    value
                    and "body-4" in value
                    and "whitespace-nowrap" in value
            )

            venue_span = card.find(
                "span",
                class_=lambda value:
                    value
                    and "body-5" in value
                    and "text-ellipsis" in value
            )

            date_span = card.find(
                "span",
                class_=lambda value:
                    value
                    and "body-5" in value
            )

            score_text = (
                score_span.get_text(" ", strip=True)
                if score_span
                else ""
            )

            score_match = re.match(
                r"(\d+)\s*-\s*(\d+)",
                score_text
            )

            home_score = (
                int(score_match.group(1))
                if score_match
                else None
            )

            away_score = (
                int(score_match.group(2))
                if score_match
                else None
            )

            home_team = (
                team_names[0]
                if len(team_names) > 0
                else ""
            )

            away_team = (
                team_names[1]
                if len(team_names) > 1
                else ""
            )

            parsed_matches.append({
                "id": match_id,
                "date": parse_ksi_date(
                    date_span.get_text(" ", strip=True),
                    2025
                ) if date_span else "",
                "description": f"{home_team} - {away_team}",
                "competition": competition["name"],
                "gender": competition["gender"],
                "competitionType": competition["type"],
                "home": home_team,
                "away": away_team,
                "homeLogo": (
                    team_logos[0]
                    if len(team_logos) > 0
                    else ""
                ),
                "awayLogo": (
                    team_logos[1]
                    if len(team_logos) > 1
                    else ""
                ),
                "facility": (
                    venue_span.get_text(" ", strip=True)
                    if venue_span
                    else ""
                ),
                "status": "PLAYED",
                "liveStatus": None,
                "homeScore": home_score,
                "awayScore": away_score,
                "officials": [],
            })

            parsed_match_ids.add(match_id)


    print()
print(f"Parsed match cards: {len(parsed_matches)}")
print()
print("First parsed match:")
print(parsed_matches[0])

print()
print("Fetching officials for parsed matches...")

for index, match in enumerate(parsed_matches, start=1):
    match_id = match["id"]

    print(
        f"{index}/{len(parsed_matches)} - "
        f"{match_id}: fetching officials..."
    )

    report_url = (
        "https://www.ksi.is/leikir-og-urslit/felagslid/leikur"
        f"?id={match_id}"
        "&banner-tab=report"
    )

    request = urllib.request.Request(
        report_url,
        headers={
            "User-Agent": "Mozilla/5.0"
        }
    )

    try:
        with urllib.request.urlopen(
            request,
            timeout=30
        ) as response:
            report_html = response.read().decode("utf-8")

        match["officials"] = parse_officials(report_html)

        print(
            f"    Found {len(match['officials'])} officials"
        )

    except Exception as error:
        print(f"    ERROR: {error}")

output = {
    "year": 2025,
    "games": parsed_matches,
}

with open(
    "data/archive-2025-test.json",
    "w",
    encoding="utf-8"
) as file:
    json.dump(
        output,
        file,
        ensure_ascii=False,
        indent=2
    )

print()
print(
    f"Saved {len(parsed_matches)} matches "
    f"to data/archive-2025-test.json"
)       
from collections import Counter

competition_counts = Counter(
    match["competition"]
    for match in parsed_matches
)

print()
print("Competition breakdown:")

for competition, count in competition_counts.items():
    print(f"{competition}: {count}")

print()
print(f"TOTAL: {len(parsed_matches)}")
