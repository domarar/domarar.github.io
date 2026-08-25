// =========================================
// DÓMARAR — LAWS OF THE GAME
// CLEAN REBUILD
// =========================================

let lawsData = null;

const lawsSearchState = {
    query: "",
    variants: [],
    results: [],
    currentIndex: -1
};


// =========================================
// CONFIG
// =========================================

const LAW_INTERNAL_HEADINGS = new Set([
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
    "Innáskiptingar og brottrekstrar á meðan á vítaspyrnukeppni stendur"
]);

const LAW_SECONDARY_HEADINGS = new Set([
    "Áður en vítaspyrnukeppnin hefst",
    "Á meðan á vítaspyrnukeppninni stendur"
]);


// =========================================
// LOAD
// =========================================

async function loadLaws() {
    const lawsContent = document.querySelector(".laws-content");

    if (!lawsContent) return;

    try {
        const response = await fetch(
            "data/laws/laws-2026-27-is-structured.json"
        );

        if (!response.ok) {
            throw new Error("Could not load Laws data");
        }

        lawsData = await response.json();

        const edition = document.querySelector(".laws-edition");

        if (edition) {
            edition.textContent = lawsData.edition || "";
        }

        renderLawOverview();

    } catch (error) {
        console.error("Laws error:", error);

        lawsContent.innerHTML = `
            <div class="laws-test-card">
                <h2>Villa við að sækja lögin</h2>
                <p>Ekki tókst að hlaða gögnum.</p>
            </div>
        `;
    }
}


// =========================================
// OVERVIEW
// =========================================

function renderLawOverview() {
    const lawsContent = document.querySelector(".laws-content");

    if (!lawsContent || !lawsData) return;

    lawsContent.innerHTML = "";

    const overview = document.createElement("div");
    overview.className = "laws-overview";

    lawsData.laws.forEach(law => {
        const button = document.createElement("button");

        button.className = "law-overview-card";
        button.type = "button";

        button.innerHTML = `
            <div class="law-overview-number">
                ${law.number}
            </div>

            <div class="law-overview-title">
                ${law.title}
            </div>

            <div class="law-overview-arrow">
                →
            </div>
        `;

        button.addEventListener("click", () => {
            lawsSearchState.currentIndex = -1;
            renderSingleLaw(law.number);
        });

        overview.appendChild(button);
    });

    lawsContent.appendChild(overview);
}


// =========================================
// VISIBLE SECTIONS
// =========================================

function getVisibleLawSections(law) {
    const sections = Array.isArray(law.sections)
        ? law.sections
        : [];

    if (Number(law.number) !== 17) {
        return sections;
    }

    const cutoffIndex = sections.findIndex(section => {
        const text = `
            ${section.title || ""}
            ${section.raw_text || ""}
        `.toLowerCase();

        return text.includes("fifa gæðastaðall");
    });

    if (cutoffIndex === -1) {
        return sections;
    }

    return sections.slice(0, cutoffIndex);
}


// =========================================
// TEXT HELPERS
// =========================================

function escapeLawHtml(value) {
    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");
}

function normalizeLawLine(line) {
    return String(line ?? "")
        .replace(/\r/g, "")
        .replace(/\u00a0/g, " ")
        .trim();
}

function stripFinalPeriod(text) {
    return text.replace(/[.:]+$/, "").trim();
}

function isInternalHeading(line) {
    const clean = stripFinalPeriod(line);

    return (
        LAW_INTERNAL_HEADINGS.has(line) ||
        LAW_INTERNAL_HEADINGS.has(clean)
    );
}

function isSecondaryHeading(line) {
    const clean = stripFinalPeriod(line);

    return (
        LAW_SECONDARY_HEADINGS.has(line) ||
        LAW_SECONDARY_HEADINGS.has(clean)
    );
}

function looksLikeNote(line) {
    return /^\*/.test(line);
}

function getBulletMarker(line) {
    const trimmed = line.trimStart();

    if (/^•\s*/.test(trimmed)) {
        return { level: 1, marker: "•" };
    }

    if (/^[✓✔]\s*/.test(trimmed)) {
        return { level: 2, marker: "✓" };
    }

    if (/^[○◦]\s*/.test(trimmed)) {
        return { level: 2, marker: "○" };
    }

    return null;
}

function stripBulletMarker(line) {
    return line
        .trimStart()
        .replace(/^•\s*/, "")
        .replace(/^[✓✔]\s*/, "")
        .replace(/^[○◦]\s*/, "")
        .trim();
}


// =========================================
// CONTENT RENDERER
// =========================================

function renderLawContent(rawText, structuredBlocks = null) {
    if (Array.isArray(structuredBlocks)) {
    return structuredBlocks
        .map(renderLawBlock)
        .join("");
}

    if (!rawText) return "";

    const sourceLines = String(rawText)
        .split("\n")
        .map(line => line.replace(/\r/g, ""));

    const blocks = [];

    let paragraphLines = [];
    let currentList = null;
    let hadBlankLine = false;

    function endsWithSentencePunctuation(text) {
        return /[.!?…]$/.test(String(text).trim());
    }

    function startsWithLowercase(text) {
        return /^[a-záðéíóúýþæö]/.test(String(text).trim());
    }

    function flushParagraph() {
        if (!paragraphLines.length) return;

        const text = paragraphLines
            .map(normalizeLawLine)
            .filter(Boolean)
            .join(" ")
            .replace(/\s+/g, " ")
            .trim();

        if (text) {
            blocks.push({
                type: "paragraph",
                text
            });
        }

        paragraphLines = [];
    }

    function flushList() {
        if (!currentList || !currentList.items.length) {
            currentList = null;
            return;
        }

        blocks.push(currentList);
        currentList = null;
    }

    function ensureList() {
        if (!currentList) {
            currentList = {
                type: "list",
                items: []
            };
        }

        return currentList;
    }

    function addMainBullet(text) {
        flushParagraph();

        const list = ensureList();

        list.items.push({
            text,
            children: []
        });
    }

    function addChildBullet(text, marker) {
        flushParagraph();

        const list = ensureList();

        if (!list.items.length) {
            list.items.push({
                text,
                children: []
            });
            return;
        }

        list.items[list.items.length - 1].children.push({
            text,
            marker
        });
    }

    function getLastListEntry() {
        if (!currentList?.items?.length) return null;

        const mainItem =
            currentList.items[currentList.items.length - 1];

        if (mainItem.children?.length) {
            return mainItem.children[
                mainItem.children.length - 1
            ];
        }

        return mainItem;
    }

    function appendToLastListEntry(text) {
        const entry = getLastListEntry();

        if (!entry) return false;

        entry.text = `${entry.text} ${text}`
            .replace(/\s+/g, " ")
            .trim();

        return true;
    }

    for (let i = 0; i < sourceLines.length; i++) {
        const rawLine = sourceLines[i];
        const line = normalizeLawLine(rawLine);

        if (!line) {
            // PDF extraction often inserts blank lines between wrapped lines.
            // Remember the gap, but do not create a paragraph automatically.
            hadBlankLine = true;
            continue;
        }

        if (isSecondaryHeading(line)) {
            flushParagraph();
            flushList();

            blocks.push({
                type: "secondary-heading",
                text: line
            });

            hadBlankLine = false;
            continue;
        }

        if (isInternalHeading(line)) {
            flushParagraph();
            flushList();

            blocks.push({
                type: "heading",
                text: line
            });

            hadBlankLine = false;
            continue;
        }

        if (looksLikeNote(line)) {
            flushParagraph();
            flushList();

            blocks.push({
                type: "note",
                text: line
            });

            hadBlankLine = false;
            continue;
        }

        const bullet = getBulletMarker(rawLine);

        if (bullet) {
            const text = stripBulletMarker(rawLine);

            if (bullet.level === 1) {
                addMainBullet(text);
            } else {
                addChildBullet(text, bullet.marker);
            }

            hadBlankLine = false;
            continue;
        }

        // A wrapped bullet can continue on the following unmarked PDF line.
        if (currentList) {
            const entry = getLastListEntry();
            const continuesBullet =
                entry &&
                (!endsWithSentencePunctuation(entry.text) ||
                    startsWithLowercase(line));

            if (continuesBullet) {
                appendToLastListEntry(line);
                hadBlankLine = false;
                continue;
            }

            flushList();
        }

        // Preserve genuine paragraph breaks without trusting every PDF gap.
        if (
            paragraphLines.length > 0 &&
            endsWithSentencePunctuation(
                paragraphLines[paragraphLines.length - 1]
            ) &&
            !startsWithLowercase(line)
        ) {
            flushParagraph();
        }

        paragraphLines.push(line);
        hadBlankLine = false;
    }

    flushParagraph();
    flushList();

    return blocks.map(renderLawBlock).join("");
    }

function renderLawBlock(block) {
    if (block.type === "heading") {
        return `
            <h4 class="law-inline-heading">
                ${escapeLawHtml(block.text)}
            </h4>
        `;
    }

    if (block.type === "secondary-heading") {
        return `
            <h5 class="law-inline-subheading">
                ${escapeLawHtml(block.text)}
            </h5>
        `;
    }

    if (block.type === "note") {
        return `
            <p class="law-note">
                ${escapeLawHtml(block.text)}
            </p>
        `;
    }

    if (block.type === "dimension-table") {
        const rows = Array.isArray(block.rows)
            ? block.rows
            : [];

        return `
            <div class="law-table-wrap law-dimension-table-wrap">
                <table class="law-table law-dimension-table">
                    <tbody>
                        ${rows.map(row => `
                            <tr>
                                <th rowspan="2" scope="rowgroup">
                                    ${escapeLawHtml(row.label)}
                                </th>

                                <td>minnst</td>
                                <td>${escapeLawHtml(row.minimum)}</td>
                            </tr>

                            <tr>
                                <td>mest</td>
                                <td>${escapeLawHtml(row.maximum)}</td>
                            </tr>
                        `).join("")}
                    </tbody>
                </table>
            </div>
        `;
    }

    if (block.type === "list") {
        return `
            <ul class="law-bullet-list">
                ${block.items.map(renderLawListItem).join("")}
            </ul>
        `;
    }

    return `
        <p>${escapeLawHtml(block.text)}</p>
    `;
}

function renderLawListItem(item) {
    const childrenHtml = item.children?.length
        ? `
            <ul class="law-sub-bullet-list">
                ${item.children
                    .map(child => `
                        <li data-marker="${escapeLawHtml(child.marker)}">
                            ${escapeLawHtml(child.text)}
                        </li>
                    `)
                    .join("")}
            </ul>
        `
        : "";

    return `
        <li>
            ${escapeLawHtml(item.text)}
            ${childrenHtml}
        </li>
    `;
}


// =========================================
// TOPICS
// =========================================

function renderTopic(topic) {
    return `
        <div
            class="law-topic"
            id="${topic.id}"
        >
            <h4 class="law-topic-title">
                ${escapeLawHtml(topic.title)}
            </h4>

            <div class="law-topic-content">
                ${renderLawContent(topic.raw_text, topic.blocks)}
            </div>
        </div>
    `;
}

function renderTopicGroup(parentTopic, subtopics) {
    const subtopicsHtml = subtopics
        .map(subtopic => `
            <div
                class="law-subtopic"
                id="${subtopic.id}"
            >
                <h5 class="law-subtopic-title">
                    ${escapeLawHtml(subtopic.title)}
                </h5>

                <div class="law-topic-content">
                    ${renderLawContent(subtopic.raw_text, subtopic.blocks)}
                </div>
            </div>
        `)
        .join("");

    return `
        <div
            class="law-topic law-topic-group"
            id="${parentTopic.id}"
        >
            <h4 class="law-topic-title">
                ${escapeLawHtml(parentTopic.title)}
            </h4>

            <div class="law-topic-content">
                ${renderLawContent(parentTopic.raw_text, parentTopic.blocks)}
            </div>

            <div class="law-subtopics">
                ${subtopicsHtml}
            </div>
        </div>
    `;
}

function renderTopics(law, section) {
    if (!Array.isArray(section.topics)) {
        return "";
    }

    const topics = section.topics;
    let html = "";

    for (let i = 0; i < topics.length; i++) {
        const topic = topics[i];

        const normalizedTitle =
            stripFinalPeriod(topic.title.trim());

        const isTeamOfficialsParent =
            Number(law.number) === 12 &&
            normalizedTitle === "Forráðamenn liðs";

        if (!isTeamOfficialsParent) {
            html += renderTopic(topic);
            continue;
        }

        const childTitles = new Set([
            "Tiltal",
            "Áminning",
            "Brottvísun"
        ]);

        const subtopics = [];
        let j = i + 1;

        while (j < topics.length) {
            const childTitle =
                stripFinalPeriod(topics[j].title.trim());

            if (!childTitles.has(childTitle)) {
                break;
            }

            subtopics.push(topics[j]);
            j++;
        }

        html += renderTopicGroup(topic, subtopics);

        i = j - 1;
    }

    return html;
}


// =========================================
// TABLE
// =========================================

function renderLawTable(section) {
    const headers = section.table.headers
        .map(header => `<th>${escapeLawHtml(header)}</th>`)
        .join("");

    const rows = section.table.rows
        .map(row => `
            <tr>
                <td>${escapeLawHtml(row.label)}</td>
                <td>${escapeLawHtml(row.goal).replace(/\n/g, "<br>")}</td>
                <td>${escapeLawHtml(row.no_goal).replace(/\n/g, "<br>")}</td>
            </tr>
        `)
        .join("");

    return `
        <section
            class="law-section law-table-section"
            id="${section.id}"
        >
            <h3>
                <span>${section.number}.</span>
                ${escapeLawHtml(section.title)}
            </h3>

            <div class="law-table-wrap">
                <table class="law-table">
                    <thead>
                        <tr>${headers}</tr>
                    </thead>

                    <tbody>
                        ${rows}
                    </tbody>
                </table>
            </div>
        </section>
    `;
}


// =========================================
// LAW-TO-LAW NAVIGATION
// =========================================

function renderLawBottomNavigation(lawNumber) {
    const laws = Array.isArray(lawsData?.laws)
        ? lawsData.laws
        : [];

    const currentIndex = laws.findIndex(
        law => Number(law.number) === Number(lawNumber)
    );

    if (currentIndex === -1) return "";

    const previousLaw = laws[currentIndex - 1] || null;
    const nextLaw = laws[currentIndex + 1] || null;

    const previousHtml = previousLaw
        ? `
            <button
                class="law-bottom-nav-button law-bottom-nav-previous"
                type="button"
                data-law-number="${previousLaw.number}"
            >
                <span class="law-bottom-nav-direction">
                    ← Fyrri grein
                </span>

                <span class="law-bottom-nav-title">
                    ${previousLaw.number}. ${escapeLawHtml(previousLaw.title)}
                </span>
            </button>
        `
        : `<span class="law-bottom-nav-spacer" aria-hidden="true"></span>`;

    const nextHtml = nextLaw
        ? `
            <button
                class="law-bottom-nav-button law-bottom-nav-next"
                type="button"
                data-law-number="${nextLaw.number}"
            >
                <span class="law-bottom-nav-direction">
                    Næsta grein →
                </span>

                <span class="law-bottom-nav-title">
                    ${nextLaw.number}. ${escapeLawHtml(nextLaw.title)}
                </span>
            </button>
        `
        : `<span class="law-bottom-nav-spacer" aria-hidden="true"></span>`;

    return `
        <nav
            class="law-bottom-navigation"
            aria-label="Fletta á milli knattspyrnulaga"
        >
            ${previousHtml}

            <button
                class="law-bottom-overview-button"
                type="button"
            >
                Allar greinar
            </button>

            ${nextHtml}
        </nav>
    `;
}

function renderLawDesktopNavigator(currentLawNumber) {
    if (!lawsData || !Array.isArray(lawsData.laws)) {
        return "";
    }

    const navigationItems = lawsData.laws
        .map(law => {
            const isCurrent =
                Number(law.number) ===
                Number(currentLawNumber);

            return `
                <button
                    class="law-desktop-nav-button${
                        isCurrent ? " is-active" : ""
                    }"
                    type="button"
                    data-law-number="${law.number}"
                    ${
                        isCurrent
                            ? 'aria-current="page"'
                            : ""
                    }
                >
                    <span class="law-desktop-nav-number">
                        ${law.number}
                    </span>

                    <span class="law-desktop-nav-title">
                        ${escapeLawHtml(law.title)}
                    </span>
                </button>
            `;
        })
        .join("");

    return `
        <aside
            class="law-desktop-navigator"
            aria-label="Knattspyrnulögin"
        >
            <div class="law-desktop-navigator-inner">

                <div class="law-desktop-nav-heading">
                    Knattspyrnulögin
                </div>

                <div class="law-desktop-nav-subheading">
                    Greinar 1–17
                </div>

                <div class="law-desktop-nav-list">
                    ${navigationItems}
                </div>

            </div>
        </aside>
    `;
}
// =========================================
// SINGLE LAW
// =========================================

function renderSingleLaw(lawNumber, options = {}) {
    const lawsContent = document.querySelector(".laws-content");

    if (!lawsContent || !lawsData) return;

    const law = lawsData.laws.find(
        item => Number(item.number) === Number(lawNumber)
    );

    if (!law) return;

    const sectionsHtml = getVisibleLawSections(law)
        .map(section => {
            let sectionMainText = section.raw_text || "";

            if (Number(law.number) === 17) {
                const fifaCutoff =
                    sectionMainText.indexOf("Gæðastaðall FIFA");

                if (fifaCutoff !== -1) {
                    sectionMainText =
                        sectionMainText
                            .slice(0, fifaCutoff)
                            .trim();
                }
            }

            if (
                Array.isArray(section.topics) &&
                section.topics.length > 0
            ) {
                const firstTopicTitle =
                    section.topics[0].title;

                const topicPosition =
                    sectionMainText.indexOf(firstTopicTitle);

                if (topicPosition !== -1) {
                    sectionMainText =
                        sectionMainText
                            .slice(0, topicPosition)
                            .trim();
                }
            }

            if (
                section.type === "table" &&
                section.table
            ) {
                return renderLawTable(section);
            }

            const contentHtml =
                renderLawContent(
                    sectionMainText,
                    section.blocks
                );

            const topicsHtml =
                renderTopics(law, section);

            return `
                <section
                    class="law-section"
                    id="${section.id}"
                >
                    <button
                        class="law-section-toggle"
                        type="button"
                        aria-expanded="false"
                    >
                        <h3>
                            <span>${section.number}.</span>
                            ${escapeLawHtml(section.title)}
                        </h3>

                        <span class="law-section-chevron">
                            ⌄
                        </span>
                    </button>

                    <div class="law-section-body">
                        ${contentHtml}
                        ${topicsHtml}
                    </div>
                </section>
            `;
        })
        .join("");

    const introHtml = law.intro
        ? `
            <div class="law-intro">
                ${renderLawContent(
                    law.intro,
                    law.intro_blocks
                )}
            </div>
        `
        : "";

    lawsContent.innerHTML = `
        ${renderLawDesktopNavigator(law.number)}

        <div class="single-law">

            <button
                class="laws-back-button"
                type="button"
            >
                ← Knattspyrnulögin
            </button>

            <header class="single-law-header">

                <div class="single-law-number">
                    ${law.number}
                </div>

                <div class="single-law-label">
                    GREIN
                </div>

                <h2>
                    ${escapeLawHtml(law.title)}
                </h2>

            </header>

            ${introHtml}

            <div class="law-sections">
                ${sectionsHtml}
            </div>

            ${renderLawBottomNavigation(law.number)}

        </div>
    `;

    setupSingleLawEvents();

    if (options.scrollToTop !== false) {
    if (window.innerWidth >= 1450) {
        const readingTop =
            lawsContent.getBoundingClientRect().top +
            window.scrollY -
            20;

        window.scrollTo({
            top: Math.max(0, readingTop),
            behavior: "auto"
        });
    } else {
        window.scrollTo({
            top: 0,
            behavior: "smooth"
        });
    }
}
}


// =========================================
// SINGLE LAW EVENTS
// =========================================

function setupSingleLawEvents() {
    const showLawOverview = () => {
        lawsSearchState.currentIndex = -1;
        renderLawOverview();

        window.scrollTo({
            top: 0,
            behavior: "smooth"
        });
    };

    const backButton =
        document.querySelector(".laws-back-button");

    if (backButton) {
        backButton.addEventListener("click", showLawOverview);
    }

    const bottomOverviewButton =
        document.querySelector(".law-bottom-overview-button");

    if (bottomOverviewButton) {
        bottomOverviewButton.addEventListener(
            "click",
            showLawOverview
        );
    }

    document
        .querySelectorAll(".law-bottom-nav-button")
        .forEach(button => {
            button.addEventListener("click", () => {
                const targetLawNumber = Number(
                    button.dataset.lawNumber
                );

                lawsSearchState.currentIndex = -1;
                renderSingleLaw(targetLawNumber);
            });
        });
    document
    .querySelectorAll(".law-desktop-nav-button")
    .forEach(button => {
        button.addEventListener("click", () => {
            const targetLawNumber = Number(
                button.dataset.lawNumber
            );

            if (!Number.isFinite(targetLawNumber)) {
                return;
            }

            lawsSearchState.currentIndex = -1;
            renderSingleLaw(targetLawNumber);
        });
    });

const desktopNavigator =
    document.querySelector(
        ".law-desktop-navigator-inner"
    );

const activeDesktopNavButton =
    document.querySelector(
        ".law-desktop-nav-button.is-active"
    );

if (
    desktopNavigator &&
    activeDesktopNavButton &&
    desktopNavigator.clientHeight > 0
) {
    desktopNavigator.scrollTop = Math.max(
        0,
        activeDesktopNavButton.offsetTop -
            desktopNavigator.clientHeight / 2 +
            activeDesktopNavButton.offsetHeight / 2
    );
}
    document
        .querySelectorAll(".law-section-toggle")
        .forEach(toggle => {
            toggle.addEventListener("click", () => {
                if (window.innerWidth > 600) return;

                const section =
                    toggle.closest(".law-section");

                if (!section) return;

                const wasOpen =
                    section.classList.contains("is-open");

                document
                    .querySelectorAll(".law-section.is-open")
                    .forEach(openSection => {
                        openSection.classList.remove("is-open");

                        const openToggle =
                            openSection.querySelector(
                                ".law-section-toggle"
                            );

                        if (openToggle) {
                            openToggle.setAttribute(
                                "aria-expanded",
                                "false"
                            );
                        }
                    });

                if (!wasOpen) {
                    section.classList.add("is-open");

                    toggle.setAttribute(
                        "aria-expanded",
                        "true"
                    );
                }
            });
        });
}


// =========================================
// SEARCH HELPERS
// =========================================

function getSearchSnippet(text, query) {
    if (!text) return "";

    const lowerText = text.toLowerCase();
    const index = lowerText.indexOf(query);

    if (index === -1) return "";

    const start = Math.max(0, index - 55);

    const end = Math.min(
        text.length,
        index + query.length + 85
    );

    let snippet = text
        .slice(start, end)
        .replace(/\s+/g, " ")
        .trim();

    if (start > 0) {
        snippet = "… " + snippet;
    }

    if (end < text.length) {
        snippet += " …";
    }

    return snippet;
}

function getSearchVariants(query) {
    const variants = [query];

    const numberWords = {
        "1": "eitt",
        "2": "tvær",
        "3": "þrjár",
        "4": "fjórar",
        "5": "fimm",
        "6": "sex",
        "7": "sjö",
        "8": "átta",
        "9": "níu",
        "10": "tíu"
    };

    Object.entries(numberWords)
        .forEach(([number, word]) => {
            if (query.includes(number)) {
                variants.push(
                    query.replace(number, word)
                );
            }
        });

    return [...new Set(variants)];
}

function escapeSearchRegExp(value) {
    return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function getFirstMatchingVariant(text, variants) {
    const lowerText = String(text || "").toLowerCase();

    return variants.find(
        variant => lowerText.includes(variant)
    ) || "";
}

function renderHighlightedSearchText(value, variants) {
    const text = String(value || "");

    if (!variants.length) {
        return escapeLawHtml(text);
    }

    const pattern = new RegExp(
        `(${variants
            .slice()
            .sort((a, b) => b.length - a.length)
            .map(escapeSearchRegExp)
            .join("|")})`,
        "gi"
    );

    return text
        .split(pattern)
        .map((part, index) => {
            const escapedPart = escapeLawHtml(part);

            if (index % 2 === 0) {
                return escapedPart;
            }

            return `
                <mark class="laws-search-highlight">
                    ${escapedPart}
                </mark>
            `;
        })
        .join("");
}

function getSectionMainSearchText(section) {
    let sectionText = String(section.raw_text || "");

    if (
        Array.isArray(section.topics) &&
        section.topics.length > 0
    ) {
        const firstTopicTitle = section.topics[0].title;
        const topicPosition = sectionText.indexOf(firstTopicTitle);

        if (topicPosition !== -1) {
            sectionText = sectionText.slice(0, topicPosition);
        }
    }

    return sectionText;
}

function buildLawsSearchResults(query, variants) {
    const results = [];
    const resultKeys = new Set();

    const addResult = result => {
        const key = `${result.lawNumber}:${result.targetId || "law"}`;

        if (resultKeys.has(key)) return;

        resultKeys.add(key);
        results.push(result);
    };

    lawsData.laws.forEach(law => {
        const lawTitleMatch = getFirstMatchingVariant(
            law.title,
            variants
        );

        const lawIntroMatch = getFirstMatchingVariant(
            law.intro,
            variants
        );

        if (lawTitleMatch || lawIntroMatch) {
            addResult({
                lawNumber: law.number,
                targetId: null,
                type: "Grein",
                title: `${law.number}. ${law.title}`,
                matchText: lawIntroMatch
                    ? getSearchSnippet(law.intro, lawIntroMatch)
                    : ""
            });
        }

        getVisibleLawSections(law)
            .forEach(section => {
                const sectionTitleMatch =
                    getFirstMatchingVariant(
                        section.title,
                        variants
                    );

                const sectionMainText =
                    getSectionMainSearchText(section);

                const sectionTextMatch =
                    getFirstMatchingVariant(
                        sectionMainText,
                        variants
                    );

                if (sectionTitleMatch || sectionTextMatch) {
                    addResult({
                        lawNumber: law.number,
                        targetId: section.id,
                        type: `Grein ${law.number}`,
                        title: `${section.number}. ${section.title}`,
                        matchText: sectionTextMatch
                            ? getSearchSnippet(
                                sectionMainText,
                                sectionTextMatch
                            )
                            : ""
                    });
                }

                if (!Array.isArray(section.topics)) return;

                section.topics.forEach(topic => {
                    const topicTitleMatch =
                        getFirstMatchingVariant(
                            topic.title,
                            variants
                        );

                    const topicTextMatch =
                        getFirstMatchingVariant(
                            topic.raw_text,
                            variants
                        );

                    if (!topicTitleMatch && !topicTextMatch) {
                        return;
                    }

                    addResult({
                        lawNumber: law.number,
                        targetId: topic.id,
                        type: `Grein ${law.number}`,
                        title: topic.title,
                        matchText: topicTextMatch
                            ? getSearchSnippet(
                                topic.raw_text,
                                topicTextMatch
                            )
                            : ""
                    });
                });
            });
    });

    return results;
}

function removeLawsSearchHighlights() {
    document
        .querySelectorAll("mark.laws-search-highlight")
        .forEach(mark => {
            mark.replaceWith(
                document.createTextNode(mark.textContent || "")
            );
        });

    document
        .querySelectorAll(".laws-search-navigator")
        .forEach(navigator => navigator.remove());
}

function applyLawsSearchHighlights(root, variants) {
    if (!root || !variants.length) return [];

    const patternSource = variants
        .slice()
        .sort((a, b) => b.length - a.length)
        .map(escapeSearchRegExp)
        .join("|");

    if (!patternSource) return [];

    const testPattern = new RegExp(patternSource, "i");
    const splitPattern = new RegExp(`(${patternSource})`, "gi");

    const walker = document.createTreeWalker(
        root,
        NodeFilter.SHOW_TEXT,
        {
            acceptNode(node) {
                const parent = node.parentElement;

                if (!parent || !node.nodeValue?.trim()) {
                    return NodeFilter.FILTER_REJECT;
                }

                if (
                    parent.closest(
                        ".laws-search-navigator, " +
                        ".law-bottom-navigation, " +
                        ".laws-back-button, mark"
                    )
                ) {
                    return NodeFilter.FILTER_REJECT;
                }

                return testPattern.test(node.nodeValue)
                    ? NodeFilter.FILTER_ACCEPT
                    : NodeFilter.FILTER_REJECT;
            }
        }
    );

    const matchingTextNodes = [];

    while (walker.nextNode()) {
        matchingTextNodes.push(walker.currentNode);
    }

    matchingTextNodes.forEach(textNode => {
        const fragment = document.createDocumentFragment();

        textNode.nodeValue
            .split(splitPattern)
            .forEach((part, index) => {
                if (!part) return;

                if (index % 2 === 0) {
                    fragment.appendChild(
                        document.createTextNode(part)
                    );
                    return;
                }

                const mark = document.createElement("mark");
                mark.className = "laws-search-highlight";
                mark.textContent = part;
                fragment.appendChild(mark);
            });

        textNode.replaceWith(fragment);
    });

    return [
        ...root.querySelectorAll("mark.laws-search-highlight")
    ];
}

function renderActiveSearchNavigator() {
    const singleLaw = document.querySelector(".single-law");

    if (!singleLaw || lawsSearchState.currentIndex < 0) return;

    const total = lawsSearchState.results.length;
    const position = lawsSearchState.currentIndex + 1;

    const navigator = document.createElement("div");
    navigator.className = "laws-search-navigator";
    navigator.innerHTML = `
        <button
            class="laws-search-nav-button laws-search-nav-previous"
            type="button"
            aria-label="Fyrri leitarniðurstaða"
            ${position === 1 ? "disabled" : ""}
        >
            ←
        </button>

        <div class="laws-search-nav-status">
            <span class="laws-search-nav-query">
                „${escapeLawHtml(lawsSearchState.query)}“
            </span>

            <span>
                Niðurstaða ${position} af ${total}
            </span>
        </div>

        <button
            class="laws-search-nav-button laws-search-nav-next"
            type="button"
            aria-label="Næsta leitarniðurstaða"
            ${position === total ? "disabled" : ""}
        >
            →
        </button>
    `;

    const backButton = singleLaw.querySelector(".laws-back-button");

    if (backButton) {
        backButton.insertAdjacentElement("afterend", navigator);
    } else {
        singleLaw.prepend(navigator);
    }

    navigator
        .querySelector(".laws-search-nav-previous")
        ?.addEventListener("click", () => {
            openLawsSearchResult(
                lawsSearchState.currentIndex - 1
            );
        });

    navigator
        .querySelector(".laws-search-nav-next")
        ?.addEventListener("click", () => {
            openLawsSearchResult(
                lawsSearchState.currentIndex + 1
            );
        });
}

function openLawsSearchResult(resultIndex) {
    const result = lawsSearchState.results[resultIndex];

    if (!result) return;

    lawsSearchState.currentIndex = resultIndex;

    renderSingleLaw(
        result.lawNumber,
        { scrollToTop: false }
    );

    renderActiveSearchNavigator();

    requestAnimationFrame(() => {
        const lawsContent =
            document.querySelector(".laws-content");

        const highlights = applyLawsSearchHighlights(
            lawsContent,
            lawsSearchState.variants
        );

        const target = result.targetId
            ? document.getElementById(result.targetId)
            : document.querySelector(".single-law-header");

        const section = target?.closest(".law-section");

        if (section) {
            section.classList.add("is-open");

            section
                .querySelector(".law-section-toggle")
                ?.setAttribute("aria-expanded", "true");
        }

        const targetHighlight =
            target?.querySelector("mark.laws-search-highlight") ||
            highlights[0] ||
            null;

        if (targetHighlight) {
            targetHighlight.classList.add("is-current");
        }

        (targetHighlight || target)?.scrollIntoView({
            behavior: "smooth",
            block: "center"
        });
    });
}


// =========================================
// SEARCH
// =========================================

function setupLawsSearch() {
    const searchInput =
        document.querySelector("#lawsSearch");

    const resultsBox =
        document.querySelector("#lawsSearchResults");

    const clearButton =
        document.querySelector("#lawsSearchClear");

    if (!searchInput || !resultsBox || !clearButton) return;

    const updateClearButton = () => {
        clearButton.hidden =
            searchInput.value.length === 0;
    };

    const resetSearch = () => {
        lawsSearchState.query = "";
        lawsSearchState.variants = [];
        lawsSearchState.results = [];
        lawsSearchState.currentIndex = -1;

        resultsBox.innerHTML = "";
        resultsBox.style.display = "none";

        removeLawsSearchHighlights();
    };

    const clearSearch = () => {
        searchInput.value = "";

        resetSearch();
        updateClearButton();
        renderLawOverview();
    };

    searchInput.addEventListener("input", () => {
        updateClearButton();

        const query = searchInput.value
            .trim()
            .toLowerCase();

        const searchVariants =
            getSearchVariants(query);

        if (query.length < 2) {
            resetSearch();
            return;
        }

        const results = buildLawsSearchResults(
            query,
            searchVariants
        );

        lawsSearchState.query = query;
        lawsSearchState.variants = searchVariants;
        lawsSearchState.results = results;
        lawsSearchState.currentIndex = -1;

        renderLawsSearchResults(
            results,
            searchVariants
        );
    });

    clearButton.addEventListener("click", () => {
        clearSearch();
        searchInput.focus();
    });

    searchInput.addEventListener("keydown", event => {
        if (
            event.key === "Enter" &&
            lawsSearchState.results.length > 0
        ) {
            event.preventDefault();

            resultsBox.style.display = "none";
            openLawsSearchResult(0);
        }

        if (event.key === "Escape") {
            event.preventDefault();

            clearSearch();
            searchInput.focus();
        }
    });

    updateClearButton();
}


// =========================================
// SEARCH RESULTS
// =========================================

function renderLawsSearchResults(results, variants) {
    const resultsBox =
        document.querySelector("#lawsSearchResults");

    if (!resultsBox) return;

    if (results.length === 0) {
        resultsBox.innerHTML = `
            <div class="laws-search-empty">
                Engar niðurstöður
            </div>
        `;

        resultsBox.style.display = "block";
        return;
    }

    const resultLabel = results.length === 1
        ? "1 niðurstaða"
        : `${results.length} niðurstöður`;

    resultsBox.innerHTML = `
        <div class="laws-search-results-header">
            ${resultLabel}
        </div>

        <div class="laws-search-results-list">
            ${results.map((result, index) => `
            <button
                class="laws-search-result"
                type="button"
                data-result-index="${index}"
            >
                <span class="laws-search-result-type">
                    ${escapeLawHtml(result.type)}
                </span>

                <div class="laws-search-result-main">

                    <span class="laws-search-result-title">
                        ${renderHighlightedSearchText(
                            result.title,
                            variants
                        )}
                    </span>

                    ${result.matchText ? `
                        <span class="laws-search-result-snippet">
                            ${renderHighlightedSearchText(
                                result.matchText,
                                variants
                            )}
                        </span>
                    ` : ""}

                </div>

                <span class="laws-search-result-arrow">
                    →
                </span>
            </button>
            `).join("")}
        </div>
    `;

    resultsBox.style.display = "block";

    resultsBox
        .querySelectorAll(".laws-search-result")
        .forEach(button => {

            button.addEventListener("click", () => {
                const resultIndex = Number(
                    button.dataset.resultIndex
                );

                openLawsSearchResult(resultIndex);
                resultsBox.style.display = "none";
            });
        });
}


// =========================================
// START
// =========================================

loadLaws().then(() => {
    setupLawsSearch();
});