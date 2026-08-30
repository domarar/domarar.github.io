// =========================================
// DÓMARAR — KNATTSPYRNULÖGIN
// CLEAN REBUILD V3
// SEARCH + DIRECT JUMP
// =========================================


let lawsData = null;
let currentLawNumber = null;

const lawsContent =
    document.getElementById("lawsContent");

const lawsSearch =
    document.getElementById("lawsSearch");

const lawsSearchClear =
    document.getElementById("lawsSearchClear");

const lawsSearchResults =
    document.getElementById("lawsSearchResults");


// =========================================
// LOAD DATA
// =========================================

async function loadLaws() {

    if (!lawsContent) return;

    try {

        const response = await fetch(
            "data/laws/laws-2026-27-is-structured.json"
        );

        if (!response.ok) {
            throw new Error(
                `Could not load laws: ${response.status}`
            );
        }

        lawsData = await response.json();

        renderLawsHome();

    } catch (error) {

        console.error(
            "DÓMARAR laws error:",
            error
        );

        lawsContent.innerHTML = `
            <div class="laws-error">
                <h3>Ekki tókst að hlaða lögunum</h3>
                <p>Reyndu að endurhlaða síðuna.</p>
            </div>
        `;
    }
}


// =========================================
// BASIC HELPERS
// =========================================

function escapeHtml(value) {

    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");
}


function normalizeSearchText(value) {

    return String(value ?? "")
        .toLocaleLowerCase("is")
        .replace(/\s+/g, " ")
        .trim();
}


function getLaw(lawNumber) {

    if (!lawsData?.laws) return null;

    return lawsData.laws.find(
        law =>
            Number(law.number) ===
            Number(lawNumber)
    ) || null;
}


// =========================================
// LAW 17 FILTER
// =========================================

function getVisibleLawSections(law) {

    const sections =
        Array.isArray(law?.sections)
            ? law.sections
            : [];

    if (Number(law.number) !== 17) {
        return sections;
    }

    const cutoffIndex =
        sections.findIndex(section => {

            const text = `
                ${section.title || ""}
                ${section.raw_text || ""}
            `.toLowerCase();

            return text.includes(
                "fifa gæðastaðall"
            );
        });

    if (cutoffIndex === -1) {
        return sections;
    }

    return sections.slice(
        0,
        cutoffIndex
    );
}


// =========================================
// HOME
// =========================================

function renderLawsHome() {

    if (!lawsData?.laws) return;

    currentLawNumber = null;

    document.body.classList.remove(
        "is-reading-law"
    );

    clearSearchResults();
    removeSearchHighlights();

    const cards =
        lawsData.laws
            .map(law => `
                <button
                    class="law-overview-card"
                    type="button"
                    data-law-number="${law.number}"
                >

                    <div class="law-card-number">
                        ${escapeHtml(law.number)}
                    </div>

                    <div class="law-card-title">
                        ${escapeHtml(law.title)}
                    </div>

                    <span
                        class="law-card-arrow"
                        aria-hidden="true"
                    >
                        →
                    </span>

                </button>
            `)
            .join("");

    lawsContent.innerHTML = `
        <div class="laws-overview">
            ${cards}
        </div>
    `;

    document
        .querySelectorAll(
            ".law-overview-card"
        )
        .forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    const lawNumber =
                        Number(
                            button.dataset
                                .lawNumber
                        );

                    renderSingleLaw(
                        lawNumber
                    );
                }
            );

        });

    window.scrollTo({
        top: 0,
        behavior: "auto"
    });
}


// =========================================
// SINGLE LAW
// =========================================

function renderSingleLaw(
    lawNumber,
    options = {}
) {

    const law = getLaw(lawNumber);

    if (!law) return;

    currentLawNumber =
        Number(law.number);

    document.body.classList.add(
        "is-reading-law"
    );

    clearSearchResults();
    removeSearchHighlights();

    const sectionsHtml =
        getVisibleLawSections(law)
            .map(section =>
                renderLawSection(
                    law,
                    section
                )
            )
            .join("");

    const introHtml =
        law.intro
            ? `
                <div
                    class="law-intro"
                    id="law-intro-${law.number}"
                >
                    ${renderContent(
                        law.intro,
                        law.intro_blocks
                    )}
                </div>
            `
            : "";

    const previousLaw =
        getLaw(
            currentLawNumber - 1
        );

    const nextLaw =
        getLaw(
            currentLawNumber + 1
        );

    lawsContent.innerHTML = `

        ${renderTopNavigation(
            previousLaw,
            nextLaw
        )}

        <article class="single-law">

            <header class="single-law-header">

                <h2>
                    <span class="single-law-title-number">
                        ${escapeHtml(law.number)}.
                    </span>

                    ${escapeHtml(law.title)}
                </h2>

            </header>

            ${introHtml}

            <div class="law-sections">
                ${sectionsHtml}
            </div>

            ${renderBottomNavigation(
                previousLaw,
                nextLaw
            )}

        </article>
    `;

    setupLawNavigation();

    if (
        options.targetId ||
        options.query
    ) {

        requestAnimationFrame(() => {

            jumpToSearchResult(
                options.targetId,
                options.query
            );

        });

        return;
    }

    window.scrollTo({
        top: 0,
        behavior: "auto"
    });
}


// =========================================
// TOP NAVIGATION
// =========================================

function renderTopNavigation(
    previousLaw,
    nextLaw
) {

    return `
        <nav
            class="law-top-nav"
            aria-label="Flakka milli laga"
        >

            <button
                class="law-top-prev"
                type="button"
                data-law-number="${
                    previousLaw
                        ? previousLaw.number
                        : ""
                }"
                ${
                    previousLaw
                        ? ""
                        : "disabled"
                }
            >
                ← Fyrri grein
            </button>


            <button
                class="law-top-home"
                type="button"
                data-laws-home
            >
                Lögin 26/27
            </button>


            <button
                class="law-top-next"
                type="button"
                data-law-number="${
                    nextLaw
                        ? nextLaw.number
                        : ""
                }"
                ${
                    nextLaw
                        ? ""
                        : "disabled"
                }
            >
                Næsta grein →
            </button>

        </nav>
    `;
}


// =========================================
// BOTTOM NAVIGATION
// =========================================

function renderBottomNavigation(
    previousLaw,
    nextLaw
) {

    return `
        <nav
            class="law-bottom-nav"
            aria-label="Flakka milli laga"
        >

            <button
                class="law-bottom-prev"
                type="button"
                data-law-number="${
                    previousLaw
                        ? previousLaw.number
                        : ""
                }"
                ${
                    previousLaw
                        ? ""
                        : "disabled"
                }
            >
                ${
                    previousLaw
                        ? `← ${previousLaw.number}. ${escapeHtml(previousLaw.title)}`
                        : ""
                }
            </button>


            <button
                class="law-bottom-home"
                type="button"
                data-laws-home
            >
                Lögin 26/27
            </button>


            <button
                class="law-bottom-next"
                type="button"
                data-law-number="${
                    nextLaw
                        ? nextLaw.number
                        : ""
                }"
                ${
                    nextLaw
                        ? ""
                        : "disabled"
                }
            >
                ${
                    nextLaw
                        ? `${nextLaw.number}. ${escapeHtml(nextLaw.title)} →`
                        : ""
                }
            </button>

        </nav>
    `;
}


// =========================================
// NAVIGATION EVENTS
// =========================================

function setupLawNavigation() {

    document
        .querySelectorAll(
            "[data-laws-home]"
        )
        .forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    clearSearch();

                    renderLawsHome();
                }
            );

        });


    document
        .querySelectorAll(
            ".law-top-prev[data-law-number], " +
            ".law-top-next[data-law-number], " +
            ".law-bottom-prev[data-law-number], " +
            ".law-bottom-next[data-law-number]"
        )
        .forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    if (button.disabled) {
                        return;
                    }

                    const number =
                        Number(
                            button.dataset
                                .lawNumber
                        );

                    if (
                        Number.isFinite(number)
                    ) {

                        clearSearch();

                        renderSingleLaw(
                            number
                        );
                    }
                }
            );

        });
}


// =========================================
// LAW SECTION
// =========================================

function renderLawSection(
    law,
    section
) {

    if (
        section.type === "table" &&
        section.table
    ) {
        return renderLawTable(
            section
        );
    }

    let mainText =
        section.raw_text || "";

    if (
        Array.isArray(
            section.topics
        ) &&
        section.topics.length > 0
    ) {

        const firstTopicTitle =
            section.topics[0]?.title;

        if (firstTopicTitle) {

            const topicPosition =
                mainText.indexOf(
                    firstTopicTitle
                );

            if (
                topicPosition !== -1
            ) {

                mainText =
                    mainText
                        .slice(
                            0,
                            topicPosition
                        )
                        .trim();
            }
        }
    }


    if (
        Number(law.number) === 17
    ) {

        const fifaPosition =
            mainText.indexOf(
                "Gæðastaðall FIFA"
            );

        if (
            fifaPosition !== -1
        ) {

            mainText =
                mainText
                    .slice(
                        0,
                        fifaPosition
                    )
                    .trim();
        }
    }


    const sectionId =
        section.id ||
        `law-${law.number}-section-${section.number}`;


    return `
        <section
            class="law-section"
            id="${escapeHtml(sectionId)}"
        >

            <h3>
                <span>
                    ${escapeHtml(section.number)}.
                </span>

                ${escapeHtml(section.title)}
            </h3>

            <div class="law-section-body">

                ${renderContent(
                    mainText,
                    section.blocks
                )}

                ${renderTopics(
                    law,
                    section
                )}

            </div>

        </section>
    `;
}


// =========================================
// TOPICS
// =========================================

function renderTopics(
    law,
    section
) {

    const topics =
        section.topics;

    if (
        !Array.isArray(topics) ||
        topics.length === 0
    ) {
        return "";
    }


    return topics
        .map(
            (topic, index) => {

                const topicId =
                    topic.id ||
                    `law-${law.number}-section-${section.number}-topic-${index}`;

                return `
                    <section
                        class="law-topic"
                        id="${escapeHtml(topicId)}"
                    >

                        <h4 class="law-topic-title">
                            ${escapeHtml(topic.title)}
                        </h4>

                        <div class="law-topic-content">

                            ${renderContent(
                                topic.raw_text,
                                topic.blocks
                            )}

                        </div>

                    </section>
                `;
            }
        )
        .join("");
}


// =========================================
// CONTENT RENDERER
// =========================================

function renderContent(
    rawText,
    structuredBlocks
) {

    if (
        Array.isArray(
            structuredBlocks
        )
    ) {

        return structuredBlocks
            .map(renderBlock)
            .join("");
    }


    if (!rawText) {
        return "";
    }


    const paragraphs =
        String(rawText)
            .split(/\n\s*\n/)
            .map(text =>
                text
                    .replace(
                        /\s+/g,
                        " "
                    )
                    .trim()
            )
            .filter(Boolean);


    return paragraphs
        .map(paragraph => `
            <p>
                ${escapeHtml(paragraph)}
            </p>
        `)
        .join("");
}


// =========================================
// STRUCTURED BLOCK
// =========================================

function renderBlock(block) {

    if (!block) return "";


    switch (block.type) {


        case "heading":

            return `
                <h4
                    class="law-inline-heading"
                >
                    ${escapeHtml(
                        block.text
                    )}
                </h4>
            `;


        case "secondary-heading":

            return `
                <h5
                    class="law-inline-subheading"
                >
                    ${escapeHtml(
                        block.text
                    )}
                </h5>
            `;


        case "note":

            return `
                <p class="law-note">
                    ${escapeHtml(
                        block.text
                    )}
                </p>
            `;


        case "list":

            return renderListBlock(
                block
            );


        case "dimension-table":

            return renderDimensionTable(
                block
            );


        case "paragraph":

            return `
                <p>
                    ${escapeHtml(
                        block.text
                    )}
                </p>
            `;


        default:

            if (block.text) {

                return `
                    <p>
                        ${escapeHtml(
                            block.text
                        )}
                    </p>
                `;
            }

            return "";
    }
}


// =========================================
// LISTS
// =========================================

function renderListBlock(block) {

    const items =
        Array.isArray(block.items)
            ? block.items
            : [];


    return `
        <ul class="law-bullet-list">

            ${items
                .map(renderListItem)
                .join("")}

        </ul>
    `;
}


function renderListItem(item) {

    const children =
        Array.isArray(
            item.children
        )
            ? item.children
            : [];


    const childHtml =
        children.length
            ? `
                <ul class="law-sub-bullet-list">

                    ${children
                        .map(child => `
                            <li>
                                ${escapeHtml(
                                    child.text
                                )}
                            </li>
                        `)
                        .join("")}

                </ul>
            `
            : "";


    return `
        <li>

            ${escapeHtml(
                item.text
            )}

            ${childHtml}

        </li>
    `;
}


// =========================================
// TABLES
// =========================================

function renderLawTable(section) {

    const table =
        section.table;

    const headers =
        Array.isArray(table.headers)
            ? table.headers
            : [];

    const rows =
        Array.isArray(table.rows)
            ? table.rows
            : [];


    return `
        <section
            class="law-section"
            id="${escapeHtml(
                section.id ||
                `section-${section.number}`
            )}"
        >

            <h3>

                <span>
                    ${escapeHtml(
                        section.number
                    )}.
                </span>

                ${escapeHtml(
                    section.title
                )}

            </h3>


            <div class="law-table-wrap">

                <table class="law-table">

                    ${
                        headers.length
                            ? `
                                <thead>
                                    <tr>

                                        ${headers
                                            .map(header => `
                                                <th>
                                                    ${escapeHtml(
                                                        header
                                                    )}
                                                </th>
                                            `)
                                            .join("")}

                                    </tr>
                                </thead>
                            `
                            : ""
                    }


                    <tbody>

                        ${rows
                            .map(row => `
                                <tr>

                                    <td>
                                        ${escapeHtml(
                                            row.label
                                        )}
                                    </td>

                                    <td>
                                        ${escapeHtml(
                                            row.goal
                                        ).replace(
                                            /\n/g,
                                            "<br>"
                                        )}
                                    </td>

                                    <td>
                                        ${escapeHtml(
                                            row.no_goal
                                        ).replace(
                                            /\n/g,
                                            "<br>"
                                        )}
                                    </td>

                                </tr>
                            `)
                            .join("")}

                    </tbody>

                </table>

            </div>

        </section>
    `;
}


// =========================================
// DIMENSION TABLE
// =========================================

function renderDimensionTable(block) {

    const rows =
        Array.isArray(block.rows)
            ? block.rows
            : [];


    if (!rows.length) {
        return "";
    }


    return `
        <div class="law-table-wrap">

            <table class="law-table">

                <tbody>

                    ${rows
                        .map(row => `
                            <tr>

                                <th>
                                    ${escapeHtml(
                                        row.label
                                    )}
                                </th>

                                <td>
                                    ${escapeHtml(
                                        row.minimum
                                    )}
                                </td>

                                <td>
                                    ${escapeHtml(
                                        row.maximum
                                    )}
                                </td>

                            </tr>
                        `)
                        .join("")}

                </tbody>

            </table>

        </div>
    `;
}


// =========================================
// SEARCH — TEXT FROM BLOCKS
// =========================================

function getBlockSearchText(block) {

    if (!block) return "";


    if (
        block.type === "list" &&
        Array.isArray(block.items)
    ) {

        return block.items
            .map(item => {

                const children =
                    Array.isArray(
                        item.children
                    )
                        ? item.children
                            .map(child =>
                                child.text || ""
                            )
                            .join(" ")
                        : "";

                return `
                    ${item.text || ""}
                    ${children}
                `;
            })
            .join(" ");
    }


    if (
        block.type === "dimension-table" &&
        Array.isArray(block.rows)
    ) {

        return block.rows
            .map(row => `
                ${row.label || ""}
                ${row.minimum || ""}
                ${row.maximum || ""}
            `)
            .join(" ");
    }


    return block.text || "";
}


function getStructuredText(
    rawText,
    blocks
) {

    if (
        Array.isArray(blocks) &&
        blocks.length
    ) {

        return blocks
            .map(
                getBlockSearchText
            )
            .join(" ");
    }


    return rawText || "";
}


// =========================================
// SEARCH INDEX
// =========================================

function buildSearchEntries() {

    if (!lawsData?.laws) {
        return [];
    }


    const entries = [];


    lawsData.laws.forEach(law => {


        /*
           LAW TITLE
        */

        entries.push({

            lawNumber:
                Number(law.number),

            lawTitle:
                law.title,

            locationTitle:
                law.title,

            targetId:
                null,

            text:
                `${law.number} ${law.title}`

        });


        /*
           INTRO
        */

        if (law.intro) {

            entries.push({

                lawNumber:
                    Number(law.number),

                lawTitle:
                    law.title,

                locationTitle:
                    "Inngangur",

                targetId:
                    `law-intro-${law.number}`,

                text:
                    getStructuredText(
                        law.intro,
                        law.intro_blocks
                    )

            });
        }


        /*
           SECTIONS
        */

        getVisibleLawSections(law)
            .forEach(section => {


                const sectionId =
                    section.id ||
                    `law-${law.number}-section-${section.number}`;


                entries.push({

                    lawNumber:
                        Number(law.number),

                    lawTitle:
                        law.title,

                    locationTitle:
                        `${section.number}. ${section.title}`,

                    targetId:
                        sectionId,

                    text:
                        `
                            ${section.title || ""}
                            ${getStructuredText(
                                section.raw_text,
                                section.blocks
                            )}
                        `

                });


                /*
                   TOPICS
                */

                if (
                    Array.isArray(
                        section.topics
                    )
                ) {

                    section.topics.forEach(
                        (topic, index) => {


                            const topicId =
                                topic.id ||
                                `law-${law.number}-section-${section.number}-topic-${index}`;


                            entries.push({

                                lawNumber:
                                    Number(
                                        law.number
                                    ),

                                lawTitle:
                                    law.title,

                                locationTitle:
                                    topic.title,

                                targetId:
                                    topicId,

                                text:
                                    `
                                        ${topic.title || ""}
                                        ${getStructuredText(
                                            topic.raw_text,
                                            topic.blocks
                                        )}
                                    `

                            });

                        }
                    );
                }

            });

    });


    return entries;
}


// =========================================
// SEARCH
// =========================================

function runSearch(query) {

    if (!lawsData?.laws) return;


    const cleanQuery =
        normalizeSearchText(
            query
        );


    lawsSearchClear.hidden =
        cleanQuery.length === 0;


    if (
        cleanQuery.length < 2
    ) {

        clearSearchResults();

        return;
    }


    const entries =
        buildSearchEntries();


    const matches =
        entries
            .filter(entry => {

                const searchable =
                    normalizeSearchText(
                        `
                            ${entry.locationTitle}
                            ${entry.text}
                        `
                    );

                return searchable.includes(
                    cleanQuery
                );

            })
            .map(entry => ({

                ...entry,

                snippet:
                    getSearchSnippet(
                        entry.text,
                        cleanQuery
                    )

            }))
            .slice(
                0,
                12
            );


    renderSearchResults(
        matches,
        cleanQuery
    );
}


// =========================================
// SEARCH SNIPPET
// =========================================

function getSearchSnippet(
    text,
    query
) {

    const cleanText =
        String(text ?? "")
            .replace(/\s+/g, " ")
            .trim();


    const normalizedText =
        normalizeSearchText(
            cleanText
        );


    const index =
        normalizedText.indexOf(
            query
        );


    if (index === -1) {

        return cleanText
            .slice(
                0,
                120
            );
    }


    const start =
        Math.max(
            0,
            index - 48
        );


    const end =
        Math.min(
            cleanText.length,
            index +
            query.length +
            80
        );


    let snippet =
        cleanText
            .slice(
                start,
                end
            )
            .trim();


    if (start > 0) {
        snippet =
            `…${snippet}`;
    }


    if (
        end <
        cleanText.length
    ) {
        snippet =
            `${snippet}…`;
    }


    return snippet;
}


// =========================================
// SEARCH RESULTS
// =========================================

function renderSearchResults(
    results,
    query
) {

    if (!lawsSearchResults) {
        return;
    }


    if (!results.length) {

        lawsSearchResults.innerHTML = `
            <div class="laws-search-empty">
                Engar niðurstöður fundust.
            </div>
        `;

        lawsSearchResults.hidden =
            false;

        return;
    }


    lawsSearchResults.innerHTML = `

        <div class="laws-search-results-list">

            ${results
                .map(
                    (result, index) => `
                        <button
                            class="laws-search-result"
                            type="button"
                            data-search-index="${index}"
                        >

                            <div
                                class="laws-search-result-number"
                            >
                                ${escapeHtml(
                                    result.lawNumber
                                )}
                            </div>


                            <div
                                class="laws-search-result-copy"
                            >

                                <div
                                    class="laws-search-result-title"
                                >
                                    ${escapeHtml(
                                        result.locationTitle
                                    )}
                                </div>


                                <div
                                    class="laws-search-result-snippet"
                                >
                                    ${escapeHtml(
                                        result.snippet
                                    )}
                                </div>

                            </div>


                            <div
                                class="laws-search-result-arrow"
                            >
                                →
                            </div>

                        </button>
                    `
                )
                .join("")}

        </div>
    `;


    lawsSearchResults.hidden =
        false;


    lawsSearchResults
        .querySelectorAll(
            "[data-search-index]"
        )
        .forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    const index =
                        Number(
                            button.dataset
                                .searchIndex
                        );


                    const result =
                        results[index];


                    if (!result) {
                        return;
                    }


                    const originalQuery =
                        lawsSearch.value.trim();


                    /*
                       Close result list,
                       but keep query available
                       for highlight.
                    */

                    clearSearchResults();


                    renderSingleLaw(
                        result.lawNumber,
                        {
                            targetId:
                                result.targetId,

                            query:
                                originalQuery
                        }
                    );

                }
            );

        });
}


// =========================================
// JUMP TO RESULT
// =========================================

function jumpToSearchResult(
    targetId,
    query
) {

    removeSearchHighlights();


    let target = null;


    if (targetId) {
        target =
            document.getElementById(
                targetId
            );
    }


    if (!target) {

        target =
            document.querySelector(
                ".single-law"
            );
    }


    if (!target) {
        return;
    }


    if (query) {

        highlightSearchText(
            target,
            query
        );
    }


    const searchHeight =
        document
            .querySelector(
                ".laws-search-area"
            )
            ?.offsetHeight || 0;


    const navHeight =
        document
            .querySelector(
                ".law-top-nav"
            )
            ?.offsetHeight || 0;


    const offset =
        searchHeight +
        navHeight +
        22;


    const targetTop =
        target
            .getBoundingClientRect()
            .top +
        window.scrollY -
        offset;


    window.scrollTo({
        top: Math.max(
            0,
            targetTop
        ),
        behavior: "smooth"
    });
}


// =========================================
// SEARCH HIGHLIGHT
// =========================================

function highlightSearchText(
    container,
    query
) {

    if (
        !container ||
        !query
    ) {
        return;
    }


    const cleanQuery =
        String(query)
            .trim();


    if (!cleanQuery) {
        return;
    }


    const walker =
        document.createTreeWalker(
            container,
            NodeFilter.SHOW_TEXT,
            {
                acceptNode(node) {

                    const parent =
                        node.parentElement;


                    if (!parent) {
                        return NodeFilter
                            .FILTER_REJECT;
                    }


                    if (
                        parent.closest(
                            "button, script, style, mark"
                        )
                    ) {
                        return NodeFilter
                            .FILTER_REJECT;
                    }


                    const text =
                        normalizeSearchText(
                            node.nodeValue
                        );


                    if (
                        !text.includes(
                            normalizeSearchText(
                                cleanQuery
                            )
                        )
                    ) {
                        return NodeFilter
                            .FILTER_REJECT;
                    }


                    return NodeFilter
                        .FILTER_ACCEPT;
                }
            }
        );


    const textNodes = [];

    let node;


    while (
        (node = walker.nextNode())
    ) {

        textNodes.push(node);

        /*
           We don't need hundreds
           of highlights.
        */

        if (
            textNodes.length >= 20
        ) {
            break;
        }
    }


    textNodes.forEach(textNode => {

        wrapTextMatches(
            textNode,
            cleanQuery
        );

    });


    const firstHighlight =
        container.querySelector(
            ".law-search-highlight"
        );


    if (firstHighlight) {

        firstHighlight.classList.add(
            "is-current"
        );
    }
}


// =========================================
// WRAP TEXT MATCHES
// =========================================

function wrapTextMatches(
    textNode,
    query
) {

    const text =
        textNode.nodeValue;


    if (!text) {
        return;
    }


    const lowerText =
        text.toLocaleLowerCase(
            "is"
        );


    const lowerQuery =
        query.toLocaleLowerCase(
            "is"
        );


    let position = 0;

    let index =
        lowerText.indexOf(
            lowerQuery,
            position
        );


    if (index === -1) {
        return;
    }


    const fragment =
        document
            .createDocumentFragment();


    while (
        index !== -1
    ) {


        if (
            index > position
        ) {

            fragment.appendChild(
                document.createTextNode(
                    text.slice(
                        position,
                        index
                    )
                )
            );
        }


        const mark =
            document.createElement(
                "mark"
            );


        mark.className =
            "law-search-highlight";


        mark.textContent =
            text.slice(
                index,
                index +
                query.length
            );


        fragment.appendChild(
            mark
        );


        position =
            index +
            query.length;


        index =
            lowerText.indexOf(
                lowerQuery,
                position
            );
    }


    if (
        position <
        text.length
    ) {

        fragment.appendChild(
            document.createTextNode(
                text.slice(
                    position
                )
            )
        );
    }


    textNode.parentNode
        .replaceChild(
            fragment,
            textNode
        );
}


// =========================================
// REMOVE HIGHLIGHTS
// =========================================

function removeSearchHighlights() {

    document
        .querySelectorAll(
            ".law-search-highlight"
        )
        .forEach(mark => {

            const parent =
                mark.parentNode;


            parent.replaceChild(
                document.createTextNode(
                    mark.textContent
                ),
                mark
            );


            parent.normalize();

        });
}


// =========================================
// CLEAR SEARCH
// =========================================

function clearSearchResults() {

    if (!lawsSearchResults) {
        return;
    }


    lawsSearchResults.innerHTML =
        "";


    lawsSearchResults.hidden =
        true;
}


function clearSearch() {

    if (lawsSearch) {
        lawsSearch.value = "";
    }


    if (lawsSearchClear) {
        lawsSearchClear.hidden =
            true;
    }


    clearSearchResults();
    removeSearchHighlights();
}


// =========================================
// SEARCH EVENTS
// =========================================

if (lawsSearch) {

    lawsSearch.addEventListener(
        "input",
        event => {

            runSearch(
                event.target.value
            );

        }
    );


    lawsSearch.addEventListener(
        "keydown",
        event => {

            if (
                event.key ===
                "Escape"
            ) {

                clearSearch();

                lawsSearch.blur();
            }

        }
    );
}


if (lawsSearchClear) {

    lawsSearchClear.addEventListener(
        "click",
        () => {

            clearSearch();

            lawsSearch.focus();

        }
    );
}


document.addEventListener(
    "click",
    event => {

        if (
            !event.target.closest(
                ".laws-search-area"
            )
        ) {

            clearSearchResults();
        }

    }
);


// =========================================
// MENU
// =========================================

const menuButton =
    document.getElementById(
        "menuButton"
    );

const menuOverlay =
    document.getElementById(
        "menuOverlay"
    );

const menuClose =
    document.getElementById(
        "menuClose"
    );


function openMenu() {

    if (!menuOverlay) return;


    menuOverlay.classList.add(
        "open"
    );


    document.body.style.overflow =
        "hidden";
}


function closeMenu() {

    if (!menuOverlay) return;


    menuOverlay.classList.remove(
        "open"
    );


    document.body.style.overflow =
        "";
}


menuButton?.addEventListener(
    "click",
    openMenu
);


menuClose?.addEventListener(
    "click",
    closeMenu
);


menuOverlay?.addEventListener(
    "click",
    event => {

        if (
            event.target ===
            menuOverlay
        ) {

            closeMenu();
        }

    }
);


document.addEventListener(
    "keydown",
    event => {

        if (
            event.key ===
            "Escape"
        ) {

            closeMenu();
            clearSearchResults();
        }

    }
);


// =========================================
// START
// =========================================

loadLaws();