// =========================================
// LAWS OF THE GAME
// =========================================

let lawsData = null;

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
// LAW OVERVIEW
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
                ${String(law.number).padStart(2, "0")}
            </div>

            <div class="law-overview-title">
                ${law.title}
            </div>

            <div class="law-overview-arrow">
                →
            </div>
        `;

        button.addEventListener("click", () => {
            renderSingleLaw(law.number);
        });

        overview.appendChild(button);
    });

    lawsContent.appendChild(overview);
}
function getVisibleLawSections(law) {
    const sections = Array.isArray(law.sections)
        ? law.sections
        : [];

    // Only Law 17 contains material after the Laws
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

    // If we don't find it, leave Law 17 untouched
    if (cutoffIndex === -1) {
        return sections;
    }

    // Stop BEFORE the FIFA quality-standard material
    return sections.slice(0, cutoffIndex);
}

// =========================================
// SINGLE LAW
// =========================================

function renderSingleLaw(lawNumber) {
    const lawsContent = document.querySelector(".laws-content");

    if (!lawsContent || !lawsData) return;

    const law = lawsData.laws.find(
        item => item.number === lawNumber
    );

    if (!law) return;

    const sectionsHtml = getVisibleLawSections(law).map(section => {

        let sectionMainText = section.raw_text;
        // Stop Law 17 before FIFA appendix / glossary material
if (Number(law.number) === 17) {
    const fifaCutoff = sectionMainText.indexOf(
        "Gæðastaðall FIFA"
    );

    if (fifaCutoff !== -1) {
        sectionMainText = sectionMainText
            .slice(0, fifaCutoff)
            .trim();
    }
}

// If this section has topics,
// keep only the text BEFORE the first topic.
if (
    Array.isArray(section.topics) &&
    section.topics.length > 0
) {
    const firstTopicTitle = section.topics[0].title;

    const topicPosition = sectionMainText.indexOf(
        firstTopicTitle
    );

    if (topicPosition !== -1) {
        sectionMainText = sectionMainText
            .slice(0, topicPosition)
            .trim();
    }
}

const lines = sectionMainText
    .split("\n")
    .map(line => line.trim());

let contentHtml = "";
let bulletItems = [];
let paragraphBuffer = "";

function flushParagraph() {
    if (!paragraphBuffer) return;

    contentHtml += `
        <p>${paragraphBuffer}</p>
    `;

    paragraphBuffer = "";
}

function flushBullets() {
    if (bulletItems.length === 0) return;

    contentHtml += `
        <ul class="law-bullet-list">
            ${bulletItems
                .map(item => `<li>${item}</li>`)
                .join("")}
        </ul>
    `;

    bulletItems = [];
}

let currentBullet = "";

lines.forEach(line => {

    // Blank extracted PDF line
if (!line) {

    // If we're inside a bullet, ignore the blank line.
    // PDF extraction can insert these inside one bullet.
    if (currentBullet) {
        return;
    }

    flushParagraph();
    flushBullets();
    return;
}

    // New bullet
    if (line.startsWith("•")) {

        flushParagraph();

        if (currentBullet) {
            bulletItems.push(currentBullet);
        }

        currentBullet = line.replace(/^•\s*/, "");
        return;
    }

    // Continue bullet, or return to normal prose
    if (currentBullet) {

        const bulletEndsSentence =
            /[.!?]["”’)]?$/.test(currentBullet);

        const nextLooksLikeNewParagraph =
            /^[A-ZÁÉÍÓÚÝÞÆÖ]/.test(line);

        if (
            bulletEndsSentence &&
            nextLooksLikeNewParagraph
        ) {
            bulletItems.push(currentBullet);
            currentBullet = "";

            flushBullets();

            paragraphBuffer = line;
        } else {
            currentBullet += " " + line;
        }

        return;
    }

    // Normal paragraph text
    flushBullets();

    if (!paragraphBuffer) {
        paragraphBuffer = line;
        return;
    }

    const previousEndsSentence =
        /[.!?]["”’)]?$/.test(paragraphBuffer);

    const nextLooksLikeNewSentence =
        /^[A-ZÁÉÍÓÚÝÞÆÖ]/.test(line);

    if (
        previousEndsSentence &&
        nextLooksLikeNewSentence
    ) {
        flushParagraph();
        paragraphBuffer = line;
    } else {
        paragraphBuffer += " " + line;
    }
});

if (currentBullet) {
    bulletItems.push(currentBullet);
}

flushParagraph();
flushBullets();
function renderTopic(topic) {
    const topicLines = topic.raw_text
        .split("\n")
        .map(line => line.trim())
        .filter(Boolean);

    const cleanedTopicLines = [];
let topicParagraphBuffer = "";
let topicCurrentBullet = "";

topicLines.forEach(line => {

    // New bullet
    if (line.startsWith("•")) {

        if (topicParagraphBuffer) {
            cleanedTopicLines.push(topicParagraphBuffer);
            topicParagraphBuffer = "";
        }

        if (topicCurrentBullet) {
            cleanedTopicLines.push("• " + topicCurrentBullet);
        }

        topicCurrentBullet = line.replace(/^•\s*/, "");
        return;
    }

    // Continue current bullet
    if (topicCurrentBullet) {
        topicCurrentBullet += " " + line;
        return;
    }

    // Normal prose
    if (topicParagraphBuffer) {
        topicParagraphBuffer += " " + line;
    } else {
        topicParagraphBuffer = line;
    }
});

if (topicCurrentBullet) {
    cleanedTopicLines.push("• " + topicCurrentBullet);
}

if (topicParagraphBuffer) {
    cleanedTopicLines.push(topicParagraphBuffer);
}

    let topicHtml = "";
    let topicBullets = [];

    function flushTopicBullets() {
        if (topicBullets.length === 0) return;

        topicHtml += `
            <ul class="law-bullet-list">
                ${topicBullets
                    .map(item => `<li>${item}</li>`)
                    .join("")}
            </ul>
        `;

        topicBullets = [];
    }

    cleanedTopicLines.forEach(line => {
        if (line.startsWith("•")) {
            topicBullets.push(
                line.replace(/^•\s*/, "")
            );
        } else {
            flushTopicBullets();

            topicHtml += `
                <p>${line}</p>
            `;
        }
    });

    flushTopicBullets();
    return `
        <div
            class="law-topic"
            id="${topic.id}"
        >
            <h4 class="law-topic-title">
                ${topic.title}
            </h4>

            <div class="law-topic-content">
                ${topicHtml}
            </div>
        </div>
    `;
}
        const topicsHtml = Array.isArray(section.topics)
    ? section.topics
        .map(topic => renderTopic(topic))
        .join("")
    : "";
if (
    section.type === "table" &&
    section.table
) {
    const tableHeaders = section.table.headers
        .map(header => `<th>${header}</th>`)
        .join("");

    const tableRows = section.table.rows
        .map(row => `
            <tr>
                <td>${row.label}</td>
                <td>${row.goal.replace(/\n/g, "<br>")}</td>
                <td>${row.no_goal.replace(/\n/g, "<br>")}</td>
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
                ${section.title}
            </h3>

            <div class="law-table-wrap">
                <table class="law-table">
                    <thead>
                        <tr>
                            ${tableHeaders}
                        </tr>
                    </thead>

                    <tbody>
                        ${tableRows}
                    </tbody>
                </table>
            </div>
        </section>
    `;
}
return `
    <section
        class="law-section"
        id="${section.id}"
    >
        <h3>
            <span>${section.number}.</span>
            ${section.title}
        </h3>

        ${contentHtml}

        ${topicsHtml}
    </section>
`;
    }).join("");

    lawsContent.innerHTML = `
        <div class="single-law">

            <button
                class="laws-back-button"
                type="button"
            >
                ← Knattspyrnulögin
            </button>

            <header class="single-law-header">

                <div class="single-law-number">
                    ${String(law.number).padStart(2, "0")}
                </div>

                <div class="single-law-label">
                    GREIN
                </div>

                <h2>
                    ${law.title}
                </h2>

            </header>

            <div class="law-sections">
                ${sectionsHtml}
            </div>

        </div>
    `;

    const backButton = document.querySelector(
        ".laws-back-button"
    );

    if (backButton) {
        backButton.addEventListener("click", () => {
            renderLawOverview();

            window.scrollTo({
                top: 0,
                behavior: "smooth"
            });
        });
    }

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });
}
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

    Object.entries(numberWords).forEach(([number, word]) => {
        if (query.includes(number)) {
            variants.push(
                query.replace(number, word)
            );
        }
    });

    return [...new Set(variants)];
}
// =========================================
// LAWS SEARCH
// =========================================

function setupLawsSearch() {
    const searchInput = document.querySelector("#lawsSearch");
    const resultsBox = document.querySelector("#lawsSearchResults");

    if (!searchInput || !resultsBox) return;

    searchInput.addEventListener("input", () => {
        const query = searchInput.value
            .trim()
            .toLowerCase();
            const searchVariants = getSearchVariants(query);

        if (query.length < 2) {
            resultsBox.innerHTML = "";
            resultsBox.style.display = "none";
            return;
        }

        const results = [];

        lawsData.laws.forEach(law => {

            // LAW TITLE
            if (law.title.toLowerCase().includes(query)) {
                results.push({
                    lawNumber: law.number,
                    targetId: null,
                    type: "Grein",
                    title: law.title
                });
            }

            getVisibleLawSections(law).forEach(section => {

                // SECTION TITLE
                if (section.title.toLowerCase().includes(query)) {
                    results.push({
                        lawNumber: law.number,
                        targetId: section.id,
                        type: `Grein ${law.number}`,
                        title: section.title
                    });
                }

                // TOPICS
                if (Array.isArray(section.topics)) {
                    section.topics.forEach(topic => {

                        if (
                            topic.title
                                .toLowerCase()
                                .includes(query)
                        ) {
                            results.push({
                                lawNumber: law.number,
                                targetId: topic.id,
                                type: `Grein ${law.number}`,
                                title: topic.title
                            });
                        }

                    });
                }
                // FULL TEXT
const sectionText =
    section.raw_text?.toLowerCase() || "";

const matchingQuery = searchVariants.find(
    variant => sectionText.includes(variant)
);

if (matchingQuery) {

    const alreadyFound = results.some(result =>
        result.lawNumber === law.number &&
        result.targetId === section.id
    );

    if (!alreadyFound) {
        results.push({
            lawNumber: law.number,
            targetId: section.id,
            type: `Grein ${law.number}`,
            title: section.title,
            matchText: getSearchSnippet(
                section.raw_text,
                matchingQuery
            )
        });
    }
}

            });
        });

        renderLawsSearchResults(results);
    });
}


function renderLawsSearchResults(results) {
    const resultsBox = document.querySelector(
        "#lawsSearchResults"
    );

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

    resultsBox.innerHTML = results
        .slice(0, 8)
        .map(result => `
            <button
                class="laws-search-result"
                type="button"
                data-law="${result.lawNumber}"
                data-target="${result.targetId || ""}"
            >
                <span class="laws-search-result-type">
                    ${result.type}
                </span>

                <div class="laws-search-result-main">

    <span class="laws-search-result-title">
        ${result.title}
    </span>

    ${result.matchText ? `
        <span class="laws-search-result-snippet">
            ${result.matchText}
        </span>
    ` : ""}

</div>

                <span class="laws-search-result-arrow">
                    →
                </span>
            </button>
        `)
        .join("");

    resultsBox.style.display = "block";

    resultsBox
        .querySelectorAll(".laws-search-result")
        .forEach(button => {

            button.addEventListener("click", () => {
                const lawNumber = Number(
                    button.dataset.law
                );

                const targetId =
                    button.dataset.target;

                renderSingleLaw(lawNumber);

                if (targetId) {
                    setTimeout(() => {
                        const target =
                            document.getElementById(
                                targetId
                            );

                        if (target) {
                            target.scrollIntoView({
                                behavior: "smooth",
                                block: "start"
                            });
                        }
                    }, 50);
                }

                resultsBox.style.display = "none";
            });

        });
}
loadLaws().then(() => {
    setupLawsSearch();
});