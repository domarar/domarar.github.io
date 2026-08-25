from pathlib import Path
from urllib.request import urlretrieve
from collections import defaultdict, deque
import re
import json

import pdfplumber
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

all_text = []

def whitespace_free_key(value):
    return re.sub(r"\s+", "", str(value or ""))


def combine_clean_text_with_layout(clean_text, layout_text):
    """Use clean words from pypdf and indentation only from pdfplumber."""
    layout_indents = defaultdict(deque)

    for layout_line in str(layout_text or "").splitlines():
        if not layout_line.strip():
            continue

        key = whitespace_free_key(layout_line)
        indent = len(layout_line) - len(layout_line.lstrip(" "))
        layout_indents[key].append(indent)

    combined_lines = []

    for clean_line in str(clean_text or "").splitlines():
        if not clean_line.strip():
            combined_lines.append("")
            continue

        key = whitespace_free_key(clean_line)
        matches = layout_indents.get(key)
        indent = matches.popleft() if matches else 0

        combined_lines.append(
            f'{" " * indent}{clean_line.strip()}'
        )

    return "\n".join(combined_lines)


clean_reader = PdfReader(PDF_PATH)

with pdfplumber.open(PDF_PATH) as layout_pdf:
    if len(clean_reader.pages) != len(layout_pdf.pages):
        raise RuntimeError(
            "The clean and layout extractors returned different page counts."
        )

    print(f"PDF pages: {len(clean_reader.pages)}")

    for page_number, clean_page in enumerate(
        clean_reader.pages,
        start=1,
    ):
        layout_page = layout_pdf.pages[page_number - 1]

        # Visible wording always comes from normal pypdf extraction. The
        # pdfplumber pass contributes indentation only, so layout artefacts
        # such as "leikvalla r" can never enter the final text.
        clean_text = clean_page.extract_text() or ""
        layout_text = layout_page.extract_text(layout=True) or ""
        text = combine_clean_text_with_layout(clean_text, layout_text)

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
    r"(?m)^[ \t]*Bls\.\s*\d+\s*/\s*\d+\s*$",
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
    r"(?m)^[ \t]*(\d{1,2})\.\s*grein\s*-\s*(.+)$"
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

    raw_text = full_text[start:end].strip("\r\n")

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
        r"(?m)^[ \t]*(\d{1,2})\.\s+([^\n]+)$"
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

        section_text = raw_text[start:end].strip("\r\n")

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
    "Til öryggis",
    "Meginreglur",
    "Meginreglur fyrir MLT",
    "Forskrift fyrir og kröfur til MLT",
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
    "Hagnaður",
    "Agarefsingar",
    "Meiðsli",
    "Utanaðkomandi truflun",
    "Brot og refsiákvæði",
    "Boltinn fer í markið",
    "Óbein aukaspyrna – merkjagjöf",
    "Óbein aukaspyrna - merkjagjöf",
    "Túlkun lagagreinarinnar",
    "Leikbrot sem leiða til brottvísunar",
    "Ef, eftir töku vítaspyrnu",
    "Háð neðangreindum ákvæðum skal hvort lið fyrir sig taka fimm spyrnur",
    "Innáskiptingar og brottrekstrar á meðan á vítaspyrnukeppni stendur",
}

LAW_SECONDARY_HEADINGS = {
    "Áður en vítaspyrnukeppnin hefst",
    "Á meðan á vítaspyrnukeppninni stendur",
}

SENTENCE_END_RE = re.compile(r'[.!?…][\"\'’”»)]*$')
LOWERCASE_START_RE = re.compile(r"^[a-záðéíóúýþæö]")


def normalize_content_line(line):
    text = re.sub(r"\s+", " ", str(line or "").strip())
    return re.sub(r"\s+([,.;:!?])", r"\1", text)


def strip_final_period(text):
    return str(text).rstrip(".:").strip()


def ends_sentence(text):
    return bool(SENTENCE_END_RE.search(str(text).strip()))


def starts_lowercase(text):
    return bool(LOWERCASE_START_RE.match(str(text).strip()))


def get_bullet(line):
    expanded = str(line).replace("\t", "    ")
    stripped = expanded.lstrip(" ")
    indent = len(expanded) - len(stripped)

    if re.match(r"^•\s*", stripped):
        return 1, "•", re.sub(r"^•\s*", "", stripped).strip(), indent

    if re.match(r"^[✓✔]\s*", stripped):
        marker = stripped[0]
        return 2, marker, re.sub(r"^[✓✔]\s*", "", stripped).strip(), indent

    if re.match(r"^[○◦]\s*", stripped):
        marker = stripped[0]
        return 2, marker, re.sub(r"^[○◦]\s*", "", stripped).strip(), indent

    # The PDF sometimes extracts a hollow sub-bullet as a plain letter o.
    if re.match(r"^o\s+", stripped):
        return 2, "○", re.sub(r"^o\s+", "", stripped).strip(), indent

    return None


def build_content_blocks(raw_text):
    blocks = []
    paragraph_lines = []
    current_list = None
    list_base_indent = None

    def flush_paragraph():
        nonlocal paragraph_lines

        text = normalize_content_line(" ".join(paragraph_lines))

        if text:
            blocks.append({
                "type": "paragraph",
                "text": text,
            })

        paragraph_lines = []

    def flush_list():
        nonlocal current_list, list_base_indent

        if current_list and current_list["items"]:
            blocks.append(current_list)

        current_list = None
        list_base_indent = None

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
            marker_level, marker, text, indent = bullet
            text = normalize_content_line(text)
            flush_paragraph()
            law_list = ensure_list()

            if list_base_indent is None:
                list_base_indent = indent

            level = 2 if (
                marker_level == 2
                or indent >= list_base_indent + 2
            ) else 1

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
                entry["text"] = normalize_content_line(
                    f'{entry["text"]} {line}'
                )
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


def get_law_intro(raw_text):
    """Return all official text before a law's first numbered section."""
    first_section = re.search(
        r"(?m)^[ \t]*1\.\s+[^\n]+$",
        str(raw_text or ""),
    )

    if not first_section:
        return ""

    return str(raw_text or "")[:first_section.start()].strip("\r\n ")


def blocks_to_legacy_text(blocks):
    """Keep the existing laws.js intro fallback readable and searchable."""
    lines = []

    for block in blocks:
        if block["type"] == "list":
            for item in block.get("items", []):
                lines.append(f'• {item["text"]}')

                for child in item.get("children", []):
                    marker = child.get("marker") or "○"
                    lines.append(f'{marker} {child["text"]}')
        else:
            lines.append(block.get("text", ""))

    return "\n".join(line for line in lines if line)


# =========================================
# SPLIT LAW 12 INTO TOPICS
# =========================================

def split_topics(section_text, topic_titles):
    matches = []

    for title in topic_titles:
        pattern = re.compile(
            rf"(?m)^[ \t]*{re.escape(title)}\s*$"
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

        topic_text = section_text[start:end].strip("\r\n")

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
# LAW 1 DIMENSION TABLES
# =========================================

LAW_1_DIMENSION_TABLES = {
    3: {
        "before": "Hliðarlínan skal vera lengri en marklínan.",
        "rows": [
            {
                "label": "Lengd (hliðarlína):",
                "minimum": "90m",
                "maximum": "120m",
            },
            {
                "label": "Lengd (marklína):",
                "minimum": "45m",
                "maximum": "90m",
            },
        ],
        "after": (
            "Mótareglur geta kveðið á um lengdir mark- og "
            "hliðarlínanna innan ofangreindra marka."
        ),
    },
    4: {
        "rows": [
            {
                "label": "Lengd (hliðarlína):",
                "minimum": "100m",
                "maximum": "110m",
            },
            {
                "label": "Lengd (marklína):",
                "minimum": "64m",
                "maximum": "75m",
            },
        ],
        "after": (
            "Mótareglur geta kveðið á um lengdir mark- og "
            "hliðarlínanna innan ofangreindra marka."
        ),
        "notes": [
            (
                "Mælt er frá ytri brúnum línanna enda tilheyra þær "
                "þeim svæðum sem þær afmarka."
            ),
            (
                "Mælt er frá miðju vítapunktsins að brún "
                "marklínunnar nær marknetinu."
            ),
        ],
    },
}


def build_dimension_blocks(table_data):
    blocks = []

    if table_data.get("before"):
        blocks.append({
            "type": "paragraph",
            "text": table_data["before"],
        })

    blocks.append({
        "type": "dimension-table",
        "rows": table_data["rows"],
    })

    if table_data.get("after"):
        blocks.append({
            "type": "paragraph",
            "text": table_data["after"],
        })

    if table_data.get("notes"):
        blocks.append({
            "type": "list",
            "items": [
                {
                    "text": note,
                    "children": [],
                }
                for note in table_data["notes"]
            ],
        })

    return blocks


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
                section_main_text = section_main_text[:fifa_cutoff].rstrip()
                section["raw_text"] = section_main_text

        topics = section.get("topics", [])

        if topics:
            first_topic_position = section_main_text.find(
                topics[0]["title"]
            )

            if first_topic_position != -1:
                section_main_text = section_main_text[
                    :first_topic_position
                ].rstrip()

        section["blocks"] = build_content_blocks(
            section_main_text
        )

        if (
            law["number"] == 1
            and section["number"] in LAW_1_DIMENSION_TABLES
        ):
            section["blocks"] = build_dimension_blocks(
                LAW_1_DIMENSION_TABLES[section["number"]]
            )

    structured_law = {
        "number": law["number"],
        "id": law["id"],
        "title": law["title"],
        "sections": sections
    }

    intro_raw_text = get_law_intro(law["raw_text"])

    if intro_raw_text:
        intro_blocks = build_content_blocks(intro_raw_text)
        structured_law["intro"] = blocks_to_legacy_text(intro_blocks)
        structured_law["intro_blocks"] = intro_blocks

    structured_laws.append(structured_law)


final_output = {
    "edition": "2026/27",
    "language": "is",
    "source": "KSÍ",
    "laws": structured_laws
}


# =========================================
# VALIDATE BEFORE WRITING
# =========================================

EXPECTED_SECTION_COUNTS = {
    1: 13, 2: 3, 3: 10, 4: 6, 5: 7, 6: 4,
    7: 5, 8: 2, 9: 2, 10: 3, 11: 4, 12: 5,
    13: 3, 14: 3, 15: 2, 16: 2, 17: 2,
}

if [law["number"] for law in structured_laws] != list(range(1, 18)):
    raise RuntimeError("Validation failed: the output does not contain Laws 1-17.")

for law in structured_laws:
    expected = EXPECTED_SECTION_COUNTS[law["number"]]
    actual = len(law["sections"])

    if actual != expected:
        raise RuntimeError(
            f'Validation failed: Law {law["number"]} has '
            f'{actual} sections; expected {expected}.'
        )

law_12_output = next(law for law in structured_laws if law["number"] == 12)
law_12_topic_count = sum(
    len(section.get("topics", []))
    for section in law_12_output["sections"]
)

if law_12_topic_count != len(LAW_12_TOPIC_TITLES):
    raise RuntimeError(
        "Validation failed: Law 12 topic count is "
        f"{law_12_topic_count}; expected {len(LAW_12_TOPIC_TITLES)}."
    )

law_1_output = next(law for law in structured_laws if law["number"] == 1)

law_1_section_1 = next(
    item for item in law_1_output["sections"]
    if item["number"] == 1
)

if law_1_section_1["title"] != "Yfirborð leikvallar":
    raise RuntimeError(
        "Validation failed: Law 1 Section 1 title was damaged during "
        f'extraction: {law_1_section_1["title"]!r}'
    )

for section_number in (3, 4):
    section = next(
        item for item in law_1_output["sections"]
        if item["number"] == section_number
    )

    dimension_blocks = [
        block for block in section["blocks"]
        if block.get("type") == "dimension-table"
    ]

    if len(dimension_blocks) != 1:
        raise RuntimeError(
            f"Validation failed: Law 1 Section {section_number} "
            "does not contain exactly one dimension table."
        )

EXPECTED_HEADING_BLOCKS = {
    (1, 10): [
        "Til öryggis",
    ],
    (1, 11): [
        "Meginreglur fyrir MLT",
        "Forskrift fyrir og kröfur til MLT",
    ],
    (3, 2): [
        "Opinber mót",
        "Framlenging",
        "Aðrir leikir",
        "Endurteknar skiptingar",
        "Varanlegar viðbótarskiptingar vegna heilahristings",
    ],
    (4, 4): [
        "Höfuðbúnaður",
        "Rafræn samskipti",
        "Rafrænn búnaður til mælinga á frammistöðu og staðsetningum (EPTS)",
    ],
    (4, 5): [
        "Meginreglur",
        "Túlkun lagagreinarinnar",
    ],
    (5, 3): [
        "Hagnaður",
        "Agarefsingar",
        "Meiðsli",
        "Utanaðkomandi truflun",
    ],
    (5, 5): [
        "Annar búnaður",
    ],
    (8, 1): [
        "Aðferð",
        "Brot og refsiákvæði",
    ],
    (8, 2): [
        "Aðferð",
        "Brot og refsiákvæði",
    ],
    (10, 3): [
        "Framkvæmd",
        "Áður en vítaspyrnukeppnin hefst",
        "Á meðan á vítaspyrnukeppninni stendur",
        "Háð neðangreindum ákvæðum skal hvort lið fyrir sig taka fimm spyrnur",
        "Innáskiptingar og brottrekstrar á meðan á vítaspyrnukeppni stendur",
    ],
    (13, 1): [
        "Óbein aukaspyrna - merkjagjöf",
        "Boltinn fer í markið",
    ],
    (14, 2): [
        "Ef, eftir töku vítaspyrnu",
    ],
}

for (law_number, section_number), expected_headings in (
    EXPECTED_HEADING_BLOCKS.items()
):
    law = next(
        item for item in structured_laws
        if item["number"] == law_number
    )
    section = next(
        item for item in law["sections"]
        if item["number"] == section_number
    )
    actual_headings = {
        strip_final_period(block.get("text", ""))
        for block in section["blocks"]
        if block.get("type") in {"heading", "secondary-heading"}
    }
    missing_headings = set(expected_headings) - actual_headings

    if missing_headings:
        raise RuntimeError(
            f"Validation failed: Law {law_number} Section "
            f"{section_number} flattened headings "
            f"{sorted(missing_headings)}."
        )

expected_intro_laws = {6, 8, 12, 14, 15, 16, 17}
actual_intro_laws = {
    law["number"] for law in structured_laws if law.get("intro")
}

if actual_intro_laws != expected_intro_laws:
    raise RuntimeError(
        "Validation failed: law introductions found for "
        f"{sorted(actual_intro_laws)}; expected {sorted(expected_intro_laws)}."
    )

if "Gæðastaðall FIFA (FIFA Quality Programme - FQP)" in json.dumps(
    structured_laws,
    ensure_ascii=False,
):
    raise RuntimeError(
        "Validation failed: the FIFA appendix leaked into Law 17."
    )

print()
print("Validation passed:")
print("- 17 laws")
print("- all expected numbered sections")
print(f"- {law_12_topic_count} Law 12 topics")
print('- clean title: "Yfirborð leikvallar"')
print("- dimension tables for Law 1 Sections 3 and 4")
print(
    f"- {sum(len(items) for items in EXPECTED_HEADING_BLOCKS.values())} "
    "audited internal headings"
)
print(f"- introductions for Laws {sorted(actual_intro_laws)}")


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