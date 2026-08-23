from pathlib import Path
from urllib.request import urlretrieve
import re
import json

from pypdf import PdfReader


PDF_URL = (
    "https://cms.ksi.is//media/l05bkx3a/"
    "knattspyrnulo-gin-2026-27i-slenskur-texti-a-n-var.pdf"
)

PDF_PATH = Path("data/laws/knattspyrnulogin-2026-27-is.pdf")
TEXT_PATH = Path("data/laws/knattspyrnulogin-2026-27-is.txt")
JSON_PATH = Path("data/laws/laws-auto-2026-27-is.json")

# =========================================
# DOWNLOAD PDF
# =========================================

if not PDF_PATH.exists():
    print("Downloading KSÍ Laws PDF...")
    urlretrieve(PDF_URL, PDF_PATH)
    print("Download complete.")


# =========================================
# READ PDF
# =========================================

reader = PdfReader(PDF_PATH)

print(f"PDF pages: {len(reader.pages)}")

all_text = []

for page_number, page in enumerate(reader.pages, start=1):
    text = page.extract_text() or ""

    all_text.append(
        f"\n\n===== PAGE {page_number} =====\n\n{text}"
    )

full_text = "".join(all_text)
# Remove PDF/importer page markers
full_text = re.sub(
    r"(?m)^===== PAGE \d+ =====\s*$",
    "",
    full_text
)

# Remove KSÍ PDF page numbers
full_text = re.sub(
    r"(?m)^Bls\.\s*\d+\s*/\s*\d+\s*$",
    "",
    full_text
)

TEXT_PATH.write_text(
    full_text,
    encoding="utf-8"
)

print("Extracted text saved to:")
print(TEXT_PATH)


# =========================================
# FIND THE 17 LAWS
# =========================================

print()
print("----- FOUND LAWS -----")
print()

law_pattern = re.compile(
    r"(?m)^(\d{1,2})\.\s*grein\s*-\s*(.+)$"
)

matches = list(law_pattern.finditer(full_text))

laws = []

for index, match in enumerate(matches):
    law_number = int(match.group(1))
    law_title = match.group(2).strip()

    start = match.end()

    if index + 1 < len(matches):
        end = matches[index + 1].start()
    else:
        end = len(full_text)

    raw_text = full_text[start:end].strip()

    laws.append({
        "number": law_number,
        "id": f"law-{law_number}",
        "title": law_title,
        "raw_text": raw_text
    })

    print(f"{law_number}: {law_title}")

print()
print(f"Total laws found: {len(laws)}")


# =========================================
# CREATE BASIC AUTO JSON
# =========================================

output_data = {
    "edition": "2026/27",
    "language": "is",
    "source": "KSÍ",
    "laws": laws
}

JSON_PATH.write_text(
    json.dumps(
        output_data,
        ensure_ascii=False,
        indent=2
    ),
    encoding="utf-8"
)

print()
print("Automatic Laws JSON created:")
print(JSON_PATH)


# =========================================
# SECTION SPLITTER
# =========================================

def split_sections(raw_text, law_number):
    section_pattern = re.compile(
        r"(?m)^(\d{1,2})\.\s+([^\n]+)$"
    )

    section_matches = list(
        section_pattern.finditer(raw_text)
    )

    sections = []

    for index, match in enumerate(section_matches):
        section_number = int(match.group(1))
        section_title = match.group(2).strip()

        start = match.end()

        if index + 1 < len(section_matches):
            end = section_matches[index + 1].start()
        else:
            end = len(raw_text)

        section_text = raw_text[start:end].strip()

        sections.append({
            "number": section_number,
            "id": f"law-{law_number}-section-{section_number}",
            "title": section_title,
            "raw_text": section_text
        })

    return sections


# =========================================
# TEST LAW 12
# =========================================

law_12 = next(
    law for law in laws
    if law["number"] == 12
)

law_12_sections = split_sections(
    law_12["raw_text"],
    law_12["number"]
)

print()
print("----- STRUCTURED LAW 12 -----")
print()

for section in law_12_sections:
    print(
        f'{section["number"]}: '
        f'{section["title"]} '
        f'({len(section["raw_text"])} characters)'
    )

print()
print(
    f"Law 12 sections found: "
    f"{len(law_12_sections)}"
)
# =========================================
# TEST SECTIONS FOR ALL 17 LAWS
# =========================================

print()
print("----- ALL LAW SECTIONS -----")
print()

for law in laws:
    sections = split_sections(
    law["raw_text"],
    law["number"]
)

    print(
        f'LAW {law["number"]}: '
        f'{law["title"]} '
        f'→ {len(sections)} sections'
    )

    for section in sections:
        print(
            f'   {section["number"]}. '
            f'{section["title"]}'
        )

    print()
# =========================================
# LAW 12 TOPIC HEADINGS
# =========================================

LAW_12_TOPIC_TITLES = [
    "Boltinn handleikinn",
    "Að leika með háskalegum hætti",
    "Að hindra framrás mótherja án snertingar",
    "Beðið með að hefja leik að nýju til þess að sýna spjald",
    "Hagnaður",
    "Áminningarverð leikbrot",
    "Áminningar fyrir óíþróttamannslega framkomu",
    "Marki fagnað",
    "Að tefja að leikur geti hafist að nýju",
    "Leikbrot sem leiða til brottvísunar",
    "Neitað um mark eða upplagt marktækifæri (RUPL)",
    "Alvarlega grófur leikur",
    "Ofsaleg framkoma",
    "Forráðamenn liðs.",
    "Tiltal",
    "Áminning",
    "Brottvísun",
    "Leikbrot sem fela í sér að hlut (eða boltanum) sé kastað",
]


# =========================================
# SPLIT LAW 12 INTO TOPICS
# =========================================

def split_topics(section_text, topic_titles):
    matches = []

    for title in topic_titles:
        pattern = re.compile(
            rf"(?m)^{re.escape(title)}\s*$"
        )

        match = pattern.search(section_text)

        if match:
            matches.append({
                "title": title,
                "start": match.start(),
                "end": match.end()
            })

    matches.sort(
        key=lambda item: item["start"]
    )

    topics = []

    for index, match in enumerate(matches):
        start = match["end"]

        if index + 1 < len(matches):
            end = matches[index + 1]["start"]
        else:
            end = len(section_text)

        topic_text = section_text[start:end].strip()

        topics.append({
            "id": f"law-12-topic-{index + 1}",
            "title": match["title"],
            "raw_text": topic_text
        })

    return topics


# =========================================
# TEST LAW 12 TOPIC HEADINGS
# =========================================

print()
print("----- LAW 12 TOPIC TEST -----")
print()

found_topics = []

for topic_title in LAW_12_TOPIC_TITLES:
    if topic_title in law_12["raw_text"]:
        found_topics.append(topic_title)
        print(f"FOUND: {topic_title}")
    else:
        print(f"MISSING: {topic_title}")

print()
print(
    f"Law 12 topics found: "
    f"{len(found_topics)} / {len(LAW_12_TOPIC_TITLES)}"
)


# =========================================
# TEST STRUCTURED LAW 12 TOPICS
# =========================================

print()
print("----- STRUCTURED LAW 12 TOPICS -----")
print()

for section in law_12_sections:
    topics = split_topics(
        section["raw_text"],
        LAW_12_TOPIC_TITLES
    )

    print(
        f'SECTION {section["number"]}: '
        f'{section["title"]}'
    )

    for topic in topics:
        print(
            f'   → {topic["title"]} '
            f'({len(topic["raw_text"])} characters)'
        )

    print()

# =========================================
# LAW 14 PENALTY SUMMARY TABLE
# =========================================

LAW_14_TABLE = {
    "headers": [
        "Brot",
        "Mark",
        "Ekki mark"
    ],
    "rows": [
        {
            "label": "Sóknarmaður fer inn í vítateiginn",
            "goal": "Áhrif: spyrnan endurtekin\nEngin áhrif: mark",
            "no_goal": "Áhrif: óbein aukaspyrna\nEngin áhrif: ekki endurtekin"
        },
        {
            "label": "Varnarmaður fer inn í vítateiginn",
            "goal": "Áhrif: mark\nEngin áhrif: mark",
            "no_goal": "Áhrif: spyrnan endurtekin\nEngin áhrif: ekki endurtekin"
        },
        {
            "label": "Leikmenn beggja liða fara inn í vítateiginn",
            "goal": "Áhrif: spyrnan endurtekin\nEngin áhrif: mark",
            "no_goal": "Áhrif: spyrnan endurtekin\nEngin áhrif: ekki endurtekin"
        },
        {
            "label": "Brot markvarðar",
            "goal": "Mark",
            "no_goal": "Ekki varin: spyrnan ekki endurtekin nema spyrnandinn sé greinilega truflaður.\nVarin: spyrnan endurtekin og tiltal á markvörðinn; áminning fyrir öll slík endurtekin brot"
        },
        {
            "label": "Markvörður og spyrnandinn brjóta af sér á sama tíma",
            "goal": "Óbein aukaspyrna og áminning á spyrnandann",
            "no_goal": "Óbein aukaspyrna og áminning á spyrnandann"
        },
        {
            "label": "Boltanum spyrnt aftur á bak",
            "goal": "Óbein aukaspyrna",
            "no_goal": "Óbein aukaspyrna"
        },
        {
            "label": "Ólögleg gabbspyrna",
            "goal": "Óbein aukaspyrna og áminning á spyrnandann",
            "no_goal": "Óbein aukaspyrna og áminning á spyrnandann"
        },
        {
            "label": "Rangur spyrnandi (ekki sá auðkenndi)",
            "goal": "Óbein aukaspyrna og áminning á rangan spyrnanda",
            "no_goal": "Óbein aukaspyrna og áminning á rangan spyrnanda"
        }
    ]
}
# =========================================
# BUILD FINAL STRUCTURED JSON
# =========================================

structured_laws = []

for law in laws:
    sections = split_sections(
        law["raw_text"],
        law["number"]
    )

    # Add topic structure to Law 12
    if law["number"] == 12:
        for section in sections:
            section["topics"] = split_topics(
                section["raw_text"],
                LAW_12_TOPIC_TITLES
            )

                # Add structured penalty summary table to Law 14
    if law["number"] == 14:
        for section in sections:
            if section["number"] == 3:
                section["type"] = "table"
                section["table"] = LAW_14_TABLE

    structured_laws.append({
        "number": law["number"],
        "id": law["id"],
        "title": law["title"],
        "sections": sections
    })


final_output = {
    "edition": "2026/27",
    "language": "is",
    "source": "KSÍ",
    "laws": structured_laws
}


FINAL_JSON_PATH = Path(
    "data/laws/laws-2026-27-is-structured.json"
)

FINAL_JSON_PATH.write_text(
    json.dumps(
        final_output,
        ensure_ascii=False,
        indent=2
    ),
    encoding="utf-8"
)

print()
print("Final structured Laws JSON created:")
print(FINAL_JSON_PATH)