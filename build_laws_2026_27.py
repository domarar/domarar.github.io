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
# STRUCTURED CONTENT BLOCKS
# =========================================

LAW_INTERNAL_HEADINGS = {
    "Aðferð",
    "Meginreglur",
    "Framkvæmd",
    "Opinber mót",
    "Aðrir leikir",
    "Framlenging",
    "Endurteknar skiptingar",
    "Varanlegar viðbótarskiptingar vegna heilahristings",
    "Höfuðbúnaður",
    "Rafræn samskipti",
    "Rafrænn búnaður til mælinga á frammistöðu og staðsetningum (EPTS)",
    "Rafræn búnaður til mælinga á frammistöðu og staðsetningum (EPTS)",
    "Annar búnaður",
    "Meiðsli",
    "Utanaðkomandi truflun",
    "Brot og refsiákvæði",
    "Boltinn fer í markið",
    "Óbein aukaspyrna – merkjagjöf",
    "Óbein aukaspyrna - merkjagjöf",
    "Túlkun lagagreinarinnar",
    "Leikbrot sem leiða til brottvísunar",
    "Háð neðangreindum ákvæðum skal hvort lið fyrir sig taka fimm spyrnur",
    "Innskiptingar og brottrekstrar á meðan á vítaspyrnukeppni stendur",
}

LAW_SECONDARY_HEADINGS = {
    "Áður en vítaspyrnukeppnin hefst",
    "Á meðan á vítaspyrnukeppninni stendur",
}

SENTENCE_END_RE = re.compile(r'[.!?…][\"\'’”»)]*$')
LOWERCASE_START_RE = re.compile(r"^[a-záðéíóúýþæö]")


def normalize_content_line(line):
    return re.sub(r"\s+", " ", str(line or "").strip())


def strip_final_period(text):
    return str(text).rstrip(".").strip()


def ends_sentence(text):
    return bool(SENTENCE_END_RE.search(str(text).strip()))


def starts_lowercase(text):
    return bool(LOWERCASE_START_RE.match(str(text).strip()))


def get_bullet(line):
    stripped = str(line).lstrip()

    if re.match(r"^•\s*", stripped):
        return 1, "•", re.sub(r"^•\s*", "", stripped).strip()

    if re.match(r"^[✓✔]\s*", stripped):
        marker = stripped[0]
        return 2, marker, re.sub(r"^[✓✔]\s*", "", stripped).strip()

    if re.match(r"^[○◦]\s*", stripped):
        marker = stripped[0]
        return 2, marker, re.sub(r"^[○◦]\s*", "", stripped).strip()

    # The PDF sometimes extracts a hollow sub-bullet as a plain letter o.
    if re.match(r"^o\s+", stripped):
        return 2, "○", re.sub(r"^o\s+", "", stripped).strip()

    return None


def build_content_blocks(raw_text):
    blocks = []
    paragraph_lines = []
    current_list = None

    def flush_paragraph():
        nonlocal paragraph_lines

        text = " ".join(paragraph_lines).strip()
        text = re.sub(r"\s+", " ", text)

        if text:
            blocks.append({
                "type": "paragraph",
                "text": text,
            })

        paragraph_lines = []

    def flush_list():
        nonlocal current_list

        if current_list and current_list["items"]:
            blocks.append(current_list)

        current_list = None

    def ensure_list():
        nonlocal current_list

        if current_list is None:
            current_list = {
                "type": "list",
                "items": [],
            }

        return current_list

    def last_list_entry():
        if not current_list or not current_list["items"]:
            return None

        main_item = current_list["items"][-1]

        if main_item["children"]:
            return main_item["children"][-1]

        return main_item

    for raw_line in str(raw_text or "").splitlines():
        line = normalize_content_line(raw_line)

        # Blank PDF/page-break lines carry no semantic meaning.
        if not line:
            continue

        clean_heading = strip_final_period(line)

        if clean_heading in LAW_SECONDARY_HEADINGS:
            flush_paragraph()
            flush_list()
            blocks.append({
                "type": "secondary-heading",
                "text": line,
            })
            continue

        if clean_heading in LAW_INTERNAL_HEADINGS:
            flush_paragraph()
            flush_list()
            blocks.append({
                "type": "heading",
                "text": line,
            })
            continue

        if line.startswith("*"):
            flush_paragraph()
            flush_list()
            blocks.append({
                "type": "note",
                "text": line,
            })
            continue

        bullet = get_bullet(raw_line)

        if bullet:
            level, marker, text = bullet
            flush_paragraph()
            law_list = ensure_list()

            if level == 1:
                law_list["items"].append({
                    "text": text,
                    "children": [],
                })
            elif law_list["items"]:
                law_list["items"][-1]["children"].append({
                    "text": text,
                    "marker": marker,
                })
            else:
                law_list["items"].append({
                    "text": text,
                    "children": [],
                })

            continue

        if current_list:
            entry = last_list_entry()

            if entry and (
                not ends_sentence(entry["text"])
                or starts_lowercase(line)
            ):
                entry["text"] = re.sub(
                    r"\s+",
                    " ",
                    f'{entry["text"]} {line}',
                ).strip()
                continue

            flush_list()

        # A completed extracted line is a stable paragraph boundary. An
        # unfinished line is only a visual PDF wrap and is joined forward.
        if (
            paragraph_lines
            and ends_sentence(paragraph_lines[-1])
            and not starts_lowercase(line)
        ):
            flush_paragraph()

        paragraph_lines.append(line)

    flush_paragraph()
    flush_list()

    return blocks


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

            for topic in section["topics"]:
                topic["blocks"] = build_content_blocks(
                    topic["raw_text"]
                )

                # Add structured penalty summary table to Law 14
    if law["number"] == 14:
        for section in sections:
            if section["number"] == 3:
                section["type"] = "table"
                section["table"] = LAW_14_TABLE

    for section in sections:
        section_main_text = section["raw_text"]

        if law["number"] == 17:
            fifa_cutoff = section_main_text.find(
                "Gæðastaðall FIFA"
            )

            if fifa_cutoff != -1:
                section_main_text = section_main_text[:fifa_cutoff].strip()

        topics = section.get("topics", [])

        if topics:
            first_topic_position = section_main_text.find(
                topics[0]["title"]
            )

            if first_topic_position != -1:
                section_main_text = section_main_text[
                    :first_topic_position
                ].strip()

        section["blocks"] = build_content_blocks(
            section_main_text
        )

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