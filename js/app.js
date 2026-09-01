"use strict";

// =====================================
// DOM ELEMENTS
// =====================================

const gamesContainer = document.querySelector("#games-container");
const dateTabs = document.querySelectorAll(".date-tab");
const searchInput = document.querySelector("#search-input");
const searchSuggestions =
    document.getElementById("search-suggestions");
const searchBackdrop =
    document.getElementById("search-backdrop");
const searchClear = document.querySelector("#search-clear");
const genderDropdown = document.getElementById("gender-dropdown");
const genderDropdownButton =
    document.getElementById("gender-dropdown-button");
const genderDropdownMenu =
    document.getElementById("gender-dropdown-menu");
const genderDropdownLabel =
    document.getElementById("gender-dropdown-label");
const genderDropdownOptions =
    document.querySelectorAll(".gender-dropdown-option");

// =====================================
// APP STATE
// =====================================

let upcomingGames = [];
let archiveGames = [];
let allGames = [];
let selectedDayOffset = 0;
let activeDayBeforeSearch = null;
let selectedGender = "all";



function getRefereeSuggestions(value) {
    const searchText = value
        .toLowerCase()
        .trim();

    if (searchText.length < 1) {
        return [];
    }

    const refereeNames = new Set();
    const teams = new Set();
    const competitions = new Set();

    allGames.forEach(game => {

        // REFEREES
        (game.officials || []).forEach(official => {
            const fullName = (official.name || "").trim();

            if (!fullName) {
                return;
            }

            const normalizedFullName = fullName.toLowerCase();

            const firstName = normalizedFullName
                .split(/\s+/)[0];

            const hasMultipleWords =
                searchText.includes(" ");

            const matches = hasMultipleWords
                ? normalizedFullName.startsWith(searchText)
                : firstName.startsWith(searchText);

            if (matches) {
                refereeNames.add(fullName);
            }
        });


        // TEAMS
        const home = (game.home || "").trim();
        const away = (game.away || "").trim();

        [home, away].forEach(team => {
            if (!team) {
                return;
            }

            const normalizedTeam = team.toLowerCase();

            if (normalizedTeam.startsWith(searchText)) {
                teams.add(team);
            }
        });


        // COMPETITIONS
        const competition = (game.competition || "").trim();

        if (competition) {
            const normalizedCompetition =
                competition.toLowerCase();

            if (normalizedCompetition.includes(searchText)) {
    competitions.add(competition);
}
        }
    });


    const refereeResults = Array.from(refereeNames)
        .sort((a, b) => a.localeCompare(b, "is"));

    const teamResults = Array.from(teams)
        .sort((a, b) => a.localeCompare(b, "is"));

    const competitionResults = Array.from(competitions)
    .sort((a, b) => {
        const yearA = a.match(/\b20\d{2}\b/);
        const yearB = b.match(/\b20\d{2}\b/);

        const numericYearA = yearA ? Number(yearA[0]) : 9999;
        const numericYearB = yearB ? Number(yearB[0]) : 9999;

        // Current/no-year competition first,
        // then newest seasons first
        if (numericYearA !== numericYearB) {
            return numericYearB - numericYearA;
        }

        return a.localeCompare(b, "is");
    });


    // Keep very short searches mainly referee-focused
    if (searchText.length === 1) {
        return refereeResults.slice(0, 5);
    }


    const exactTeams = teamResults.filter(
    team => team.toLowerCase() === searchText
);

const exactCompetitions = competitionResults.filter(
    competition => competition.toLowerCase() === searchText
);

const otherTeams = teamResults.filter(
    team => team.toLowerCase() !== searchText
);

const otherCompetitions = competitionResults.filter(
    competition => competition.toLowerCase() !== searchText
);

return [
    ...exactTeams,
    ...exactCompetitions,
    ...refereeResults,
    ...otherTeams,
    ...otherCompetitions
].slice(0, 8);
}

function isSmartSearchQuestion(value) {
    const searchText = (value || "")
        .toLowerCase()
        .trim();

    return (
        searchText.startsWith("hvenær ") ||
        searchText.startsWith("hvenar ")
    );
}

function parseSmartSearchQuestion(value) {
    const text = (value || "").trim();

    const match = text.match(
        /^hven[æa]r\s+dæmdi\s+(.+?)\s+síðast(?:\s+leik)?\s+hjá\s+(.+?)\??$/i
    );

    if (!match) {
        return null;
    }

    return {
        referee: match[1].trim(),
        team: match[2].trim()
    };
}

function findLatestRefereeTeamGame(refereeName, teamName) {
    const refereeSearch = refereeName.toLowerCase().trim();
    const teamSearch = teamName.toLowerCase().trim();
    const now = new Date();

    const matches = allGames
        .map(game => {
            const gameDate = new Date(game.date);

        if (gameDate > now) {
        return null;
        }
            const matchingOfficial = (game.officials || []).find(official => {
                const name = (official.name || "").toLowerCase().trim();
                const firstName = name.split(/\s+/)[0];

                if (refereeSearch.includes(" ")) {
                    return name.startsWith(refereeSearch);
                }

                return firstName === refereeSearch;
            });

            if (!matchingOfficial) {
                return null;
            }

            const home = (game.home || "").toLowerCase();
            const away = (game.away || "").toLowerCase();

            const teamMatches =
                home === teamSearch ||
                away === teamSearch;

            if (!teamMatches) {
                return null;
            }

            return {
                ...game,
                smartSearchOfficial: matchingOfficial
            };
        })
        .filter(Boolean);

    matches.sort((a, b) =>
        new Date(b.date) - new Date(a.date)
    );

    return matches[0] || null;
}
// =====================================
// ICELANDIC DATE NAMES
// =====================================

const icelandicWeekdaysShort = [
  "Sun",
  "Mán",
  "Þri",
  "Mið",
  "Fim",
  "Fös",
  "Lau"
];

const icelandicMonthsShort = [
  "jan",
  "feb",
  "mar",
  "apr",
  "maí",
  "jún",
  "júl",
  "ágú",
  "sep",
  "okt",
  "nóv",
  "des"
];


// =====================================
// DATE HELPERS
// =====================================

function getReykjavikDateParts(date) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Atlantic/Reykjavik",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).formatToParts(date);

  return {
    year: Number(
      parts.find(part => part.type === "year").value
    ),

    month: Number(
      parts.find(part => part.type === "month").value
    ),

    day: Number(
      parts.find(part => part.type === "day").value
    )
  };
}

function getDateForOffset(dayOffset) {
  const todayParts = getReykjavikDateParts(new Date());

  return new Date(
    Date.UTC(
      todayParts.year,
      todayParts.month - 1,
      todayParts.day + dayOffset
    )
  );
}

function getDateKey(date) {
  const parts = getReykjavikDateParts(date);

  return [
    parts.year,
    String(parts.month).padStart(2, "0"),
    String(parts.day).padStart(2, "0")
  ].join("-");
}

function getGameDateKey(dateString) {
  return getDateKey(new Date(dateString));
}

function formatTime(dateString) {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: "Atlantic/Reykjavik",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  }).format(new Date(dateString));
}
function formatIcelandicDate(dateString) {
    const date = new Date(dateString);

    const parts = new Intl.DateTimeFormat("en-CA", {
        timeZone: "Atlantic/Reykjavik",
        year: "numeric",
        month: "2-digit",
        day: "2-digit"
    }).formatToParts(date);

    const year = Number(
        parts.find(part => part.type === "year").value
    );

    const month = Number(
        parts.find(part => part.type === "month").value
    );

    const day = Number(
        parts.find(part => part.type === "day").value
    );

    const localDate = new Date(
        Date.UTC(year, month - 1, day)
    );

    const weekdays = [
        "sun.",
        "mán.",
        "þri.",
        "mið.",
        "fim.",
        "fös.",
        "lau."
    ];

    const months = [
        "jan.",
        "feb.",
        "mar.",
        "apr.",
        "maí",
        "jún.",
        "júl.",
        "ágú.",
        "sep.",
        "okt.",
        "nóv.",
        "des."
    ];

    return `${weekdays[localDate.getUTCDay()]} ${day}. ${months[month - 1]}`;
}


// =====================================
// GENERAL HELPERS
// =====================================

function cleanCompetitionName(name = "") {
  return name
    .replace("Íslandsmót KSÍ - ", "")
    .replace(/\s2026$/, "");
}

function getTeamInitial(teamName) {
  return teamName?.trim().charAt(0).toUpperCase() || "?";
}

function createTeamLogo(logoUrl, teamName) {
  if (logoUrl) {
    return `
      <img
        src="${logoUrl}"
        alt="${teamName} merki"
        loading="lazy"
      >
    `;
  }

  return getTeamInitial(teamName);
}


// =====================================
// DATE TAB LABELS
// =====================================

function updateDateTabs() {
  dateTabs.forEach((tab, index) => {
    const dayOffset = index - 2;
    const tabDate = getDateForOffset(dayOffset);

    const day = tabDate.getUTCDate();
    const month = tabDate.getUTCMonth();
    const weekday = tabDate.getUTCDay();

    const titleElement = tab.querySelector("strong");
    const dateElement = tab.querySelector("span");

    if (dayOffset === -1) {
    titleElement.textContent = "Í gær";
} else if (dayOffset === 0) {
    titleElement.textContent = "Í dag";
} else if (dayOffset === 1) {
    titleElement.textContent = "Á morgun";
} else {
    titleElement.textContent =
        icelandicWeekdaysShort[weekday];
}

    dateElement.textContent =
      `${day}. ${icelandicMonthsShort[month]}`;
  });
}


// =====================================
// OFFICIAL ROWS
// =====================================

function createOfficialRows(officials = []) {
  if (officials.length === 0) {
    return `
      <div class="official-row">
        <div class="official-name">
          Nöfn dómara eru birt af KSÍ um 24 klukkustundum fyrir leik.
        </div>
      </div>
    `;
  }

  return officials
    .map(
      official => `
        <div class="official-row">

          <div class="official-role">
            ${official.role || ""}
          </div>

          <div class="official-name">
            ${official.name || ""}
          </div>

        </div>
      `
    )
    .join("");
}
async function updateGameCardResultsFromReports() {
    const buttons = document.querySelectorAll(".match-report-button");


    await Promise.all(
        [...buttons].map(async button => {
            const card = button.closest(".fixture-card");
            const versus = card?.querySelector(".versus");
            const resultText = card?.querySelector(".fixture-result-text");


            if (!card || !versus || !resultText) return;

            const currentText = resultText.textContent.trim();

            const scoreMatch = currentText.match(
                /^(\d+)\s*-\s*(\d+)$/
            );

            const scoreMissing = currentText === "VS";

            const scoreTied =
                scoreMatch &&
                Number(scoreMatch[1]) === Number(scoreMatch[2]);

            // We only need the report if:
            // 1. the normal score is missing
            // 2. OR the game is tied and might have gone to penalties
            if (!scoreMissing && !scoreTied) {
                return;
            }

            const matchId = button.dataset.matchId;


            try {
                const response = await fetch(
                    `data/match-reports/${matchId}.json`
                );

                if (!response.ok) return;

                const report = await response.json();
                

                const homeScore =
                    report.homeTeamResult?.current;

                const awayScore =
                    report.awayTeamResult?.current;

                if (
                    homeScore === null ||
                    homeScore === undefined ||
                    awayScore === null ||
                    awayScore === undefined
                ) {
                    return;
                }

                const events = report.events || [];

                const penaltyEvents = events.filter(
                    event =>
                        event.matchPhase?.fcdName === "PEN"
                );

                const homePenaltyScore =
                    penaltyEvents.filter(
                        event =>
                            event.homeTeam &&
                            event.eventType?.fcdName ===
                                "PENALTY_GOAL"
                    ).length;

                const awayPenaltyScore =
                    penaltyEvents.filter(
                        event =>
                            !event.homeTeam &&
                            event.eventType?.fcdName ===
                                "PENALTY_GOAL"
                    ).length;

                const hasPenaltyShootout =
                    penaltyEvents.length > 0;

                versus.classList.add("score");

                resultText.innerHTML = `
                    <div>${homeScore} - ${awayScore}</div>

                    ${
                        hasPenaltyShootout
                            ? `
                                <div class="match-card-penalty-score">
                                    ${homePenaltyScore} - ${awayPenaltyScore} í vítum
                                </div>
                            `
                            : ""
                    }
                `;

            } catch (error) {
                console.warn(
                    `Could not update result for ${matchId}`,
                    error
                );
            }
        })
    );
}


// =====================================
// CREATE GAME CARD
// =====================================

function createGameCard(game) {
const time = formatTime(game.date);
const date = formatIcelandicDate(game.date);
const hasScore =
    game.homeScore !== null &&
    game.homeScore !== undefined &&
    game.awayScore !== null &&
    game.awayScore !== undefined;

const centerText = hasScore
    ? `${game.homeScore} - ${game.awayScore}`
    : `
        <button
            class="vs-button"
            type="button"
            data-home="${game.home}"
            data-away="${game.away}"
            data-home-logo="${game.homeLogo || ""}"
            data-away-logo="${game.awayLogo || ""}"
            data-gender="${game.gender || ""}"
        >
            VS
        </button>
      `;
  return `
    <article class="fixture-card">

      <div class="fixture-main">

        <div class="fixture-meta">

  <div class="fixture-meta-top">

   <div class="fixture-time">
    ${time}
</div>

<div class="fixture-date">
    ${date}
</div>

<div class="fixture-venue">
    ${game.facility || "Völlur óskráður"}
</div>

  </div>

  <div class="fixture-competition-row">
    <span class="fixture-competition-line"></span>

    <button
    class="fixture-competition standings-trigger"
    type="button"
    onclick="openStandings(
        '${cleanCompetitionName(game.competition).replace(/'/g, "\\'")}',
        '${game.home.replace(/'/g, "\\'")}',
        '${game.away.replace(/'/g, "\\'")}'
    )"
>
    <span class="standings-trigger-dot"></span>
    <span class="standings-trigger-text">
        ${cleanCompetitionName(game.competition)}
    </span>
    <span class="standings-trigger-chevron">›</span>
</button>

    <span class="fixture-competition-line"></span>
  </div>

        <div class="teams">

          <div class="team">

            <div class="team-logo">
              ${createTeamLogo(game.homeLogo, game.home)}
            </div>

            <div class="team-name">
              ${game.home}
            </div>

          </div>

         <div class="versus ${hasScore ? "score" : ""} ${game.status === "PLAYED" ? "has-report" : ""}">
            <span class="fixture-result-text">${centerText}</span>

  ${
  (
    game.date?.startsWith("2026") ||
    game.date?.startsWith("2025") ||
    game.date?.startsWith("2024")
) &&
(
    game.status === "PLAYED" ||
    (game.homeScore != null && game.awayScore != null)
)
    ? `<button
    class="match-report-button"
    type="button"
    data-match-id="${game.id}"
>
    Leikskýrsla <span class="match-report-arrow">→</span>
</button>`
: ""
}
</div>
          <div class="team">

            <div class="team-logo">
              ${createTeamLogo(game.awayLogo, game.away)}
            </div>

            <div class="team-name">
              ${game.away}
            </div>

          </div>

        </div>

      </div>
      <div
      

      <div class="officials">
        ${createOfficialRows(game.officials)}
      </div>

    </article>
  `;
}


// =====================================
// GROUP AND DISPLAY GAMES
// =====================================
function renderGamesForSelectedDay(forcedGame = null) {
    const selectedDate = getDateForOffset(selectedDayOffset);
    const selectedDateKey = getDateKey(selectedDate);
const search = searchInput.value
    .toLowerCase()
    .trim();

const gamesForDay = forcedGame
    ? [forcedGame]
    : allGames
    .filter(game => {

        if (search) {
            return true;
        }

        return getGameDateKey(game.date) === selectedDateKey;
    })

    .filter(game => {

        if (!search) {
            return true;
        }

        const officials = (game.officials || [])
            .map(official =>
                (official.name || "").toLowerCase()
            )
            .join(" ");

        const home = (game.home || "").toLowerCase();
const away = (game.away || "").toLowerCase();

if (search.length < 3) {
    return (
        home === search ||
        away === search ||
        officials
            .split(" ")
            .some(namePart => namePart === search)
    );
}

return (
    home.includes(search) ||
    away.includes(search) ||
    (game.competition || "").toLowerCase().includes(search) ||
    (game.facility || "").toLowerCase().includes(search) ||
    officials.includes(search)
);
    })
.filter(game => {
    if (selectedGender === "all") {
        return true;
    }

    return game.gender === selectedGender;
})
    .sort((firstGame, secondGame) => {
    const firstDate = new Date(firstGame.date);
    const secondDate = new Date(secondGame.date);

    if (!search) {
        return firstDate - secondDate;
    }

    const now = new Date();

    const firstIsUpcoming = firstDate >= now;
    const secondIsUpcoming = secondDate >= now;

    if (firstIsUpcoming && !secondIsUpcoming) {
        return -1;
    }

    if (!firstIsUpcoming && secondIsUpcoming) {
        return 1;
    }

    if (firstIsUpcoming && secondIsUpcoming) {
        return firstDate - secondDate;
    }

    return secondDate - firstDate;
});

 if (gamesForDay.length === 0) {
    gamesContainer.innerHTML = `
        <p class="loading-message">
            ${
                search
                    ? "Engar niðurstöður fundust."
                    : "Engir leikir eru skráðir þennan dag."
            }
        </p>
    `;

    return;
}
if (search) {
    const now = new Date();
    const upcomingSearchGames = gamesForDay
    .filter(game => new Date(game.date) >= now)
    .sort((firstGame, secondGame) => {
        return new Date(firstGame.date) - new Date(secondGame.date);
    });

    const olderSearchGames = gamesForDay
    .filter(game => {
        const gameDate = new Date(game.date);

        return (
            gameDate < now &&
            gameDate.getFullYear() === 2026
        );
    })
    .sort((firstGame, secondGame) => {
        return new Date(secondGame.date) - new Date(firstGame.date);
    });

    const archive2025SearchGames = gamesForDay
    .filter(game => {
        const gameDate = new Date(game.date);

        return gameDate.getFullYear() === 2025;
    })
    .sort((firstGame, secondGame) => {
        return new Date(secondGame.date) - new Date(firstGame.date);
    });

    const archive2024SearchGames = gamesForDay
    .filter(game => {
        const gameDate = new Date(game.date);

        return gameDate.getFullYear() === 2024;
    })
    .sort((firstGame, secondGame) => {
        return new Date(secondGame.date) - new Date(firstGame.date);
    });
    console.log("2024 search games:", archive2024SearchGames.length);
    
    const matchedProfileName =
    Object.keys(refereeProfiles).find(name =>
        name.toLowerCase() === search.toLowerCase()
    );

const matchedProfile = matchedProfileName
    ? refereeProfiles[matchedProfileName]
    : null;

const profileSection = matchedProfile
    ? `
        <section class="referee-profile-entry">
            <button
    type="button"
    class="referee-profile-button"
    data-referee-profile="${matchedProfileName}"
>
    <img
    class="referee-profile-button-image"
    src="${matchedProfile.image || 'images/referees/photo-missing.jpg'}"
    alt="${matchedProfileName}"
>

    <span class="referee-profile-button-text">
        <span class="referee-profile-button-name">
            ${matchedProfileName}
        </span>

        <span class="referee-profile-button-subtitle">
            Leikir og tölfræði
        </span>
    </span>
    <span class="referee-profile-button-chevron">›</span>
</button>
        </section>
    `
    : "";
    const upcomingSection = upcomingSearchGames.length
        ? `
            <section class="search-timeline-section">

                <h2 class="search-section-title">
                    Næstu leikir
                </h2>

                ${upcomingSearchGames
                    .slice(0, 2)
                    .map(createGameCard)
                    .join("")}

                ${
    upcomingSearchGames.length > 2
        ? `
            <button class="show-more-search-games">
               Fleiri leikir framundan ↓
            </button>

            <div class="more-search-games" style="display: none;">
                ${upcomingSearchGames
                    .slice(2)
                    .map(createGameCard)
                    .join("")}
            </div>
        `
        : ""
}

            </section>
        `
        : "";

    const olderSection = olderSearchGames.length
    ? `
        <section class="search-timeline-section search-collapsible-section">

            <button
                class="search-year-toggle is-open"
                type="button"
                data-search-year-toggle="2026"
                aria-expanded="true"
            >
                <span class="search-year-label">
                    2026
                    <span class="search-year-count">
                        ${olderSearchGames.length}
                    </span>
                </span>

                <span class="search-year-chevron">⌃</span>
            </button>

            <div
                class="search-year-games"
                data-search-year="2026"
            >
                ${olderSearchGames
                    .map(createGameCard)
                    .join("")}
            </div>

        </section>
    `
    : "";

const archive2025Section = archive2025SearchGames.length
    ? `
        <section class="search-timeline-section">

            <button
                class="search-year-toggle"
                type="button"
                data-search-year-toggle="2025"
                aria-expanded="false"
            >
                <span class="search-year-label">
                    2025
                    <span class="search-year-count">
                        ${archive2025SearchGames.length}
                    </span>
                </span>

                <span class="search-year-chevron">⌄</span>
            </button>

            <div
                class="search-year-games"
                data-search-year="2025"
                style="display: none;"
            >
                ${archive2025SearchGames
                    .map(createGameCard)
                    .join("")}
            </div>

        </section>
    `
    : "";

const archive2024Section = archive2024SearchGames.length
    ? `
        <section class="search-timeline-section">

            <button
                class="search-year-toggle"
                type="button"
                data-search-year-toggle="2024"
                aria-expanded="false"
            >
                <span class="search-year-label">
                    2024
                    <span class="search-year-count">
                        ${archive2024SearchGames.length}
                    </span>
                </span>

                <span class="search-year-chevron">⌄</span>
            </button>

            <div
                class="search-year-games"
                data-search-year="2024"
                style="display: none;"
            >
                ${archive2024SearchGames
                    .map(createGameCard)
                    .join("")}
            </div>

        </section>
    `
    : "";

    gamesContainer.innerHTML =
    profileSection +
    upcomingSection +
    olderSection +
    archive2025Section +
    archive2024Section;
    
    updateGameCardResultsFromReports();

    const showMoreButton =
    gamesContainer.querySelector(".show-more-search-games");

    const moreSearchGames =
    gamesContainer.querySelector(".more-search-games");

    if (showMoreButton && moreSearchGames) {
        showMoreButton.addEventListener("click", () => {
            const isHidden =
            moreSearchGames.style.display === "none";

        moreSearchGames.style.display =
            isHidden ? "block" : "none";

        showMoreButton.textContent =
            isHidden
                ? "Fela leiki ↑"
                : "Sýna fleiri leiki framundan ↓";
    });
}
    const searchYearToggles =
    gamesContainer.querySelectorAll("[data-search-year-toggle]");

searchYearToggles.forEach(toggle => {
    toggle.addEventListener("click", () => {
        const year = toggle.dataset.searchYearToggle;

        const games =
            gamesContainer.querySelector(
                `[data-search-year="${year}"]`
            );

        if (!games) return;

        const isOpen =
            toggle.getAttribute("aria-expanded") === "true";

        games.style.display =
            isOpen ? "none" : "block";

        toggle.setAttribute(
            "aria-expanded",
            isOpen ? "false" : "true"
        );

        toggle.classList.toggle("is-open", !isOpen);

        const chevron =
            toggle.querySelector(".search-year-chevron");

        if (chevron) {
            chevron.textContent =
                isOpen ? "⌄" : "⌃";
        }
    });
});


const profileButton =
    gamesContainer.querySelector(".referee-profile-button");

if (profileButton) {
    profileButton.addEventListener("click", () => {
        const refereeName =
            profileButton.dataset.refereeProfile;

        renderRefereeProfileV2(refereeName);
    });
}

return;

}
  const competitionGroups = {};

  gamesForDay.forEach(game => {
    const competition =
      cleanCompetitionName(game.competition);

    if (!competitionGroups[competition]) {
      competitionGroups[competition] = [];
    }

    competitionGroups[competition].push(game);
  });
const competitionOrder = [
    "Besta deild karla",
    "Lengjudeild karla",
    "Besta deild kvenna",
    "2. deild karla",
    "3. deild karla",
    "4. deild karla",
    "Gatorade bikarinn 2026 - Bikarkeppni neðri deilda",
    "Lengjudeild kvenna"
];

const sortedCompetitionEntries = Object.entries(
    competitionGroups
).sort(([firstCompetition], [secondCompetition]) => {
    const firstIndex = competitionOrder.indexOf(
        firstCompetition
    );

    const secondIndex = competitionOrder.indexOf(
        secondCompetition
    );

    const firstPriority =
        firstIndex === -1
            ? competitionOrder.length
            : firstIndex;

    const secondPriority =
        secondIndex === -1
            ? competitionOrder.length
            : secondIndex;

    if (firstPriority !== secondPriority) {
        return firstPriority - secondPriority;
    }

    return firstCompetition.localeCompare(
        secondCompetition,
        "is"
    );
});
  gamesContainer.innerHTML = sortedCompetitionEntries
  
    .map(
      ([competition, games]) => `
        <section class="competition-group">

          <h2 class="league-title">
            ${competition}
          </h2>

          ${games.map(createGameCard).join("")}

        </section>
      `
    )
    .join("");
updateGameCardResultsFromReports();
}


// =====================================
// DATE TAB CLICKS
// =====================================

dateTabs.forEach((tab, index) => {
  tab.addEventListener("click", () => {
    searchInput.value = "";
    selectedDayOffset = index - 2;

    dateTabs.forEach(button => {
      button.classList.remove("active");
    });

    tab.classList.add("active");

    moveActiveDayIndicator();

    renderGamesForSelectedDay();
  });
});

// =====================================
// ANIMATED ACTIVE DAY HIGHLIGHT
// =====================================

const dateTabsContainer = dateTabs[0]?.parentElement;

let activeDayIndicator = null;

if (dateTabsContainer) {
    activeDayIndicator = document.createElement("div");
    activeDayIndicator.className = "date-tab-active-indicator";

    dateTabsContainer.style.position = "relative";

    dateTabsContainer.prepend(activeDayIndicator);
}

function moveActiveDayIndicator() {
    if (!activeDayIndicator) return;

    const activeTab = [...dateTabs].find(tab =>
        tab.classList.contains("active")
    );

    if (!activeTab) return;

    activeDayIndicator.style.width =
        `${activeTab.offsetWidth}px`;

    activeDayIndicator.style.height =
        `${activeTab.offsetHeight}px`;

    activeDayIndicator.style.transform =
        `translateX(${activeTab.offsetLeft}px)`;
}
async function initializeActiveDayIndicator() {
    if (document.fonts?.ready) {
        await document.fonts.ready;
    }

    requestAnimationFrame(() => {
        moveActiveDayIndicator();

        requestAnimationFrame(() => {
            activeDayIndicator?.classList.add("ready");
        });
    });
}

initializeActiveDayIndicator();

window.addEventListener("resize", moveActiveDayIndicator);


// =====================================
// MOBILE SWIPE BETWEEN DAYS
// Swipe right = previous day
// Swipe left  = next day
// =====================================

let daySwipeStartX = 0;
let daySwipeStartY = 0;
let daySwipeActive = false;

gamesContainer.addEventListener("touchstart", event => {
    if (window.innerWidth > 600) return;
    if (document.body.classList.contains("modal-open")) return;

    daySwipeStartX = event.touches[0].clientX;
    daySwipeStartY = event.touches[0].clientY;
    daySwipeActive = true;

    gamesContainer.style.transition = "none";
}, { passive: true });


gamesContainer.addEventListener("touchmove", event => {
    if (!daySwipeActive) return;

    const currentX = event.touches[0].clientX;
    const currentY = event.touches[0].clientY;

    const deltaX = currentX - daySwipeStartX;
    const deltaY = currentY - daySwipeStartY;

    // Leave normal vertical scrolling alone.
    if (Math.abs(deltaX) <= Math.abs(deltaY) * 1.3) {
        return;
    }

    // Very subtle movement only.
    const dragX = deltaX * 0.18;

    gamesContainer.style.transform =
        `translateX(${dragX}px)`;
}, { passive: true });


gamesContainer.addEventListener("touchend", event => {
    if (!daySwipeActive) return;

    daySwipeActive = false;

    const endX = event.changedTouches[0].clientX;
    const endY = event.changedTouches[0].clientY;

    const deltaX = endX - daySwipeStartX;
    const deltaY = endY - daySwipeStartY;

    // Always settle smoothly back into place.
    gamesContainer.style.transition =
        "transform 220ms cubic-bezier(0.22, 1, 0.36, 1)";

    gamesContainer.style.transform = "translateX(0)";

    setTimeout(() => {
        gamesContainer.style.transition = "";
        gamesContainer.style.transform = "";
    }, 230);

    // Not a deliberate horizontal swipe.
    if (Math.abs(deltaX) < 70) return;
    if (Math.abs(deltaX) <= Math.abs(deltaY) * 1.3) return;

    let newOffset = selectedDayOffset;

    // RIGHT = previous
    if (deltaX > 0) {
        newOffset -= 1;
    }

    // LEFT = next
    if (deltaX < 0) {
        newOffset += 1;
    }

    // Stay within visible five-day range.
    if (newOffset < -2 || newOffset > 2) {
        return;
    }

    selectedDayOffset = newOffset;

    searchInput.value = "";
    searchClear.hidden = true;

    dateTabs.forEach((tab, index) => {
        const tabOffset = index - 2;

        tab.classList.toggle(
            "active",
            tabOffset === selectedDayOffset
        );
    });

    moveActiveDayIndicator();

    renderGamesForSelectedDay();
}, { passive: true });

// =====================================
// LOAD REAL GAME DATA
// =====================================
async function loadGames() {
    try {
        // 1. Load current/upcoming games FIRST
        const upcomingResponse = await fetch("data/games.json", {
            cache: "no-store"
        });

        if (!upcomingResponse.ok) {
            throw new Error(
                `Upcoming games HTTP error: ${upcomingResponse.status}`
            );
        }

        const upcomingData = await upcomingResponse.json();

        upcomingGames = Array.isArray(upcomingData.games)
            ? upcomingData.games
            : [];

        // Make current games available immediately
        allGames = [...upcomingGames];

        // Render the page NOW
        renderGamesForSelectedDay();


        // 2. Load archive data AFTER first render
        const [
            archiveResponse,
            archive2025Response,
            archive2024Response
        ] = await Promise.all([
            fetch("data/archive.json", {
                cache: "no-store"
            }),

            fetch("data/archive-2025.json", {
                cache: "no-store"
            }),

            fetch("data/archive-2024.json", {
                cache: "no-store"
            })
        ]);

        if (!archiveResponse.ok) {
            throw new Error(
                `Archive HTTP error: ${archiveResponse.status}`
            );
        }

        if (!archive2025Response.ok) {
            throw new Error(
                `Archive 2025 HTTP error: ${archive2025Response.status}`
            );
        }

        if (!archive2024Response.ok) {
            throw new Error(
                `Archive 2024 HTTP error: ${archive2024Response.status}`
            );
        }

        const archiveData = await archiveResponse.json();
        const archive2025Data = await archive2025Response.json();
        const archive2024Data = await archive2024Response.json();

        archiveGames = Array.isArray(archiveData.games)
            ? archiveData.games
            : [];

        const archive2025Games = Array.isArray(archive2025Data.games)
            ? archive2025Data.games
            : [];

        const archive2024Games = Array.isArray(archive2024Data.games)
            ? archive2024Data.games
            : [];

        // 3. Merge everything once archives are ready
        const gamesById = new Map();

        archiveGames.forEach(game => {
            if (game.id !== null && game.id !== undefined) {
                gamesById.set(game.id, game);
            }
        });

        archive2025Games.forEach(game => {
            if (game.id !== null && game.id !== undefined) {
                gamesById.set(game.id, game);
            }
        });

        archive2024Games.forEach(game => {
            if (game.id !== null && game.id !== undefined) {
                gamesById.set(game.id, game);
            }
        });

        upcomingGames.forEach(game => {
            if (game.id !== null && game.id !== undefined) {
                gamesById.set(game.id, game);
            }
        });

        allGames = Array.from(gamesById.values());

    } catch (error) {
        console.error(
            "Villa við að sækja leiki og skjalasafn:",
            error
        );

        gamesContainer.innerHTML = `
            <p class="loading-message">
                Ekki tókst að sækja leiki.
            </p>
        `;
    }
}



// =====================================
// START APP
// =====================================
genderDropdownButton.addEventListener("click", event => {
    event.stopPropagation();

    const isOpen = genderDropdown.classList.toggle("open");

    genderDropdownMenu.hidden = !isOpen;
    genderDropdownButton.setAttribute(
        "aria-expanded",
        String(isOpen)
    );
});

genderDropdownOptions.forEach(option => {
    option.addEventListener("click", () => {
        selectedGender = option.dataset.gender;

        genderDropdownLabel.textContent =
            option.textContent.trim();

        genderDropdownOptions.forEach(item => {
            item.classList.remove("active");
        });

        option.classList.add("active");

        genderDropdown.classList.remove("open");
        genderDropdownMenu.hidden = true;
        genderDropdownButton.setAttribute(
            "aria-expanded",
            "false"
        );

        renderGamesForSelectedDay();
    });
});

document.addEventListener("click", event => {
    if (!genderDropdown.contains(event.target)) {
        genderDropdown.classList.remove("open");
        genderDropdownMenu.hidden = true;
        genderDropdownButton.setAttribute(
            "aria-expanded",
            "false"
        );
    }
});
searchInput.addEventListener("input", () => {
    const search = searchInput.value.trim();
        if (isSmartSearchQuestion(search)) {
        const parsed = parseSmartSearchQuestion(search);

        if (parsed) {
            const game = findLatestRefereeTeamGame(
                parsed.referee,
                parsed.team
            );

            if (game) {
    renderGamesForSelectedDay(game);
    return;
}
        }
    }
  searchClear.hidden = search === "";
    const suggestions = getRefereeSuggestions(search);

if (suggestions.length === 0) {
    searchSuggestions.hidden = true;
    searchSuggestions.innerHTML = "";
    searchBackdrop.hidden = true;
} else {
    searchSuggestions.innerHTML = suggestions
        .map(name => `
            <button
                type="button"
                class="search-suggestion"
                data-name="${name}"
            >
                ${name}
            </button>
        `)
        .join("");

    searchSuggestions.hidden = false;
    searchBackdrop.hidden = false;
}

    if (search) {
    if (activeDayBeforeSearch === null) {
  activeDayBeforeSearch = [...dateTabs].findIndex(tab =>
    tab.classList.contains("active")
  );
}

        } else {

  dateTabs.forEach(tab => {
    tab.classList.remove("active");
  });

  if (activeDayBeforeSearch !== null && activeDayBeforeSearch >= 0) {
    dateTabs[activeDayBeforeSearch].classList.add("active");
  }

  activeDayBeforeSearch = null;
}

    renderGamesForSelectedDay();
});
searchSuggestions.addEventListener("click", event => {
    const button = event.target.closest(".search-suggestion");

    if (!button) {
        return;
    }

    const name = button.dataset.name;

    searchInput.value = name;
    searchClear.hidden = false;

    searchSuggestions.hidden = true;
    searchSuggestions.innerHTML = "";
    searchBackdrop.hidden = true;

    dateTabs.forEach(tab => {
        tab.classList.remove("active");
    });

    renderGamesForSelectedDay();
});
searchClear.addEventListener("click", () => {
    searchInput.value = "";
    searchClear.hidden = true;
    searchSuggestions.hidden = true;
    searchSuggestions.innerHTML = "";
    searchBackdrop.hidden = true;

    dateTabs.forEach(tab => {
  tab.classList.remove("active");
});

if (activeDayBeforeSearch !== null && activeDayBeforeSearch >= 0) {
  dateTabs[activeDayBeforeSearch].classList.add("active");
}

activeDayBeforeSearch = null;

    renderGamesForSelectedDay();

    searchInput.focus();
});
document.addEventListener("click", async event => {
  const closeButton = event.target.closest("#match-report-close");

if (closeButton) {
    event.preventDefault();

    const overlay = document.getElementById("match-report-overlay");

    if (overlay) {
    overlay.hidden = true;
    document.body.classList.remove("modal-open");
}

    return;
}
    const button = event.target.closest(".match-report-button");

    if (!button) {
        return;
    }

    event.preventDefault();
    event.stopPropagation();

    const matchId = button.dataset.matchId;

    console.log("Loading match report:", matchId);

    try {
        const response = await fetch(
            `data/match-reports/${matchId}.json`
        );

        if (!response.ok) {
            throw new Error("Match report not found");
        }

        const report = await response.json();

        console.log("Match report loaded:", report);
        const overlay = document.getElementById("match-report-overlay");
const content = document.getElementById("match-report-content");

if (!overlay || !content) {
    return;
}

const home = report.homeTeam?.name || "";
const away = report.awayTeam?.name || "";

const homePicture = report.homeTeam?.picture || "";
const awayPicture = report.awayTeam?.picture || "";

const homeLogo = homePicture
    ? `https://comet.ksi.is/file?id=${homePicture}`
    : "";

const awayLogo = awayPicture
    ? `https://comet.ksi.is/file?id=${awayPicture}`
    : "";
const homeScore = report.homeTeamResult?.current ?? "";
const awayScore = report.awayTeamResult?.current ?? "";
const events = report.events || [];
const matchEvents = events.filter(
    event => event.matchPhase?.fcdName !== "PEN"
);

const penaltyEvents = events.filter(
    event => event.matchPhase?.fcdName === "PEN"
);

let runningHomeScore = 0;
let runningAwayScore = 0;

const timelineHtml = matchEvents.map((matchEvent, index) => {
    const minute = matchEvent.displayMinute || "";
    const isAfterMatch =
  matchEvent.matchPhase?.fcdName === "AFTER_THE_MATCH" || !minute;
    const type = matchEvent.eventType?.fcdName || "";
    if (
    type === "END" &&
    matchEvent.matchPhase?.fcdName === "FIRST_HALF"
) {
    return `
        <div class="timeline-phase-row">
            <div class="timeline-phase-marker">HT</div>
        </div>
    `;
}

if (
    type === "START" ||
    type === "END" ||
    type === "FULL_TIME"
) {
    return "";
}

    const player = matchEvent.player?.name || "";
    const teamOfficial = matchEvent.teamOfficial?.name || "";
    const player2 = matchEvent.player2?.name || "";
    const side =
    type === "OWN_GOAL"
        ? (matchEvent.homeTeam ? "away" : "home")
        : (matchEvent.homeTeam ? "home" : "away");
    const phase = matchEvent.matchPhase?.fcdName || "";
    let scoreProgress = "";
    
    const previousPhase =
        index > 0
            ? matchEvents[index - 1].matchPhase?.fcdName || ""
            : "";

let phaseMarker = "";

if (
    phase === "SECOND_HALF" &&
    previousPhase === "FIRST_HALF"
) {
    phaseMarker = `
        <div class="timeline-phase-row">
            <div class="timeline-phase-marker">HT</div>
        </div>
    `;
}
if (
    phase === "FIRST_ET" &&
    previousPhase === "SECOND_HALF"
) {
    phaseMarker = `
        <div class="timeline-phase-row">
            <div class="timeline-phase-marker">ET</div>
        </div>
    `;
}
if (
  phase === "AFTER_THE_MATCH" &&
  previousPhase !== "AFTER_THE_MATCH"
) {
  phaseMarker = `
    <div class="timeline-phase-row">
      <div class="timeline-phase-marker">LEIK LOKIÐ</div>
    </div>
  `;
}

    let symbol = "";
    let text = player || teamOfficial;

    if (type === "GOAL") {
    symbol = `<span class="goal-ball">⚽</span>`;

    if (matchEvent.homeTeam) {
        runningHomeScore += 1;
    } else {
        runningAwayScore += 1;
    }

    scoreProgress = `${runningHomeScore} - ${runningAwayScore}`;

    } else if (type === "OWN_GOAL") {
    symbol = `
        <span class="own-goal-symbol">
            <span class="own-goal-ball">⚽</span>
            <span class="own-goal-label">S.M</span>
        </span>
    `;

    if (matchEvent.homeTeam) {
        runningAwayScore += 1;
    } else {
        runningHomeScore += 1;
    }

    scoreProgress = `${runningHomeScore} - ${runningAwayScore}`;

} else if (type === "PENALTY") {
    symbol = "⚽";
    text = `${player} (víti)`;

    if (matchEvent.homeTeam) {
        runningHomeScore += 1;
    } else {
        runningAwayScore += 1;
    }

    scoreProgress = `${runningHomeScore} - ${runningAwayScore}`;
    } else if (type === "PENALTY_FAILED") {
    symbol = '<span class="penalty-failed-icon">×</span>';
    text = `${player} (víti)`;
    } else if (type === "YELLOW") {
    symbol = `<span class="event-card-icon yellow-card"></span>`;

    if (!player && teamOfficial) {
        text = `${teamOfficial}<span class="match-report-official-label">Liðsstjórn</span>`;
    }
    } else if (type === "SECOND_YELLOW") {
    symbol = `
        <span class="second-yellow-symbol">
            <span class="event-card-icon yellow-card"></span>
            <span class="event-card-icon red-card"></span>
        </span>
    `;

} else if (type === "RED" || type === "EXPULSION") {
    symbol = `<span class="event-card-icon red-card"></span>`;

    if (!player && teamOfficial) {
        text = `${teamOfficial}<span class="match-report-official-label">Liðsstjórn</span>`;
    }
    } else if (type === "SUBSTITUTION") {

      const supportedTypes = [
        "GOAL",
        "OWN_GOAL",
        "PENALTY",
        "PENALTY_FAILED",
        "YELLOW",
        "SECOND_YELLOW",
        "RED",
        "EXPULSION",
        "SUBSTITUTION",
    ];

    if (!supportedTypes.includes(type)) {
    return phaseMarker || "";
    }  
    
    return `
    ${phaseMarker}

    <div class="timeline-row ${side}">

        <div class="timeline-event-card substitution-event">

            <div class="substitution-details">

                <div class="substitution-in">
                    <span class="sub-arrow">↑</span>
                    <span>${player}</span>
                </div>

                <div class="substitution-out">
                    <span class="sub-arrow">↓</span>
                    <span>${player2}</span>
                </div>

            </div>

        </div>

        <div class="timeline-minute">
    ${isAfterMatch ? "LEIK LOKIÐ" : minute}
</div>

    </div>
`;
}
    return `
    ${phaseMarker}

    <div class="timeline-row ${side}">

        <div class="timeline-event-card">

    <div class="match-report-event-main">
        <span class="match-report-event-text">${text}</span>
        <span class="match-report-symbol">${symbol}</span>
    </div>

    ${
        scoreProgress
            ? `<div class="match-report-score-progress">${scoreProgress}</div>`
            : ""
    }

</div>

        <div class="timeline-minute">
            ${minute}
        </div>

    </div>
`;
}).join("");
const homePenaltyScore = penaltyEvents.filter(
    event =>
        event.homeTeam &&
        event.eventType?.fcdName === "PENALTY_GOAL"
).length;

const awayPenaltyScore = penaltyEvents.filter(
    event =>
        !event.homeTeam &&
        event.eventType?.fcdName === "PENALTY_GOAL"
).length;

const penaltyResultHtml =
    penaltyEvents.length > 0
        ? `
            <div class="penalty-result">
                <div class="penalty-result-label">VÍTI</div>
                <div class="penalty-result-score">
                    ${homePenaltyScore} - ${awayPenaltyScore}
                </div>
            </div>
        `
        : "";

content.innerHTML = `
    <div class="match-report-header">

    <div class="match-report-team">
        <div class="match-report-team-logo">
            ${createTeamLogo(homeLogo, home)}
        </div>

        <div class="match-report-team-name">
            ${home}
        </div>
    </div>

    <div class="match-report-score-wrap">
    <div class="match-report-score">
        ${homeScore} - ${awayScore}
    </div>
</div>

    <div class="match-report-team">
        <div class="match-report-team-logo">
            ${createTeamLogo(awayLogo, away)}
        </div>

        <div class="match-report-team-name">
            ${away}
        </div>
    </div>

</div>
    <div class="match-report-timeline">
    ${timelineHtml}
</div>

${penaltyResultHtml}
`;

overlay.hidden = false;
document.body.classList.add("modal-open");
        
        

    } catch (error) {
        console.log("Could not load match report:", error);
    }
});


// ============================================================
// MOBILE EDGE SWIPE TO CLOSE
// Top edge    -> swipe DOWN
// Bottom edge -> swipe UP
// ============================================================


// -----------------------------
// MATCH REPORT
// -----------------------------
let matchReportTouchStartY = 0;
let matchReportSwipeY = 0;
let matchReportIsSwiping = false;
let matchReportSwipeDirection = null;

document.addEventListener("touchstart", event => {
    if (window.innerWidth > 600) return;

    const overlay = document.getElementById("match-report-overlay");
    const modal = event.target.closest(".match-report-modal");

    if (!overlay || overlay.hidden || !modal) return;

    const rect = modal.getBoundingClientRect();
    const touchY = event.touches[0].clientY;

    const distanceFromTop = touchY - rect.top;
    const distanceFromBottom = rect.bottom - touchY;

    const inTopSwipeArea = distanceFromTop <= 160;
    const inBottomSwipeArea = distanceFromBottom <= 140;

    if (!inTopSwipeArea && !inBottomSwipeArea) return;

    matchReportTouchStartY = touchY;
    matchReportSwipeY = 0;
    matchReportIsSwiping = true;

    if (inTopSwipeArea) {
        matchReportSwipeDirection = "down";
    } else {
        matchReportSwipeDirection = "up";
    }

    modal.classList.add("swiping");
}, { passive: true });


document.addEventListener("touchmove", event => {
    if (!matchReportIsSwiping) return;

    const modal = document.querySelector(".match-report-modal");
    if (!modal) return;

    const currentY = event.touches[0].clientY;
    const deltaY = currentY - matchReportTouchStartY;

    // TOP: only allow downward movement
    if (
        matchReportSwipeDirection === "down" &&
        deltaY < 0
    ) {
        return;
    }

    // BOTTOM: only allow upward movement
    if (
        matchReportSwipeDirection === "up" &&
        deltaY > 0
    ) {
        return;
    }

    matchReportSwipeY = deltaY;

    const progress = Math.min(
        Math.abs(deltaY) / 220,
        1
    );

    modal.style.transform =
        `translateY(${deltaY}px) scale(${1 - progress * 0.018})`;

    modal.style.opacity =
        `${1 - progress * 0.12}`;

    event.preventDefault();
}, { passive: false });


document.addEventListener("touchend", () => {
    if (!matchReportIsSwiping) return;

    const overlay = document.getElementById("match-report-overlay");
    const modal = document.querySelector(".match-report-modal");

    matchReportIsSwiping = false;

    if (!modal || !overlay) return;

    modal.classList.remove("swiping");

    const shouldCloseDown =
        matchReportSwipeDirection === "down" &&
        matchReportSwipeY > 90;

    const shouldCloseUp =
        matchReportSwipeDirection === "up" &&
        matchReportSwipeY < -90;

    if (shouldCloseDown || shouldCloseUp) {

        modal.style.transition =
            "transform 260ms cubic-bezier(0.22, 1, 0.36, 1), opacity 220ms ease";

        modal.style.transform = shouldCloseDown
            ? "translateY(110vh) scale(0.98)"
            : "translateY(-110vh) scale(0.98)";

        modal.style.opacity = "0";

        setTimeout(() => {
            overlay.hidden = true;

            modal.style.transition = "";
            modal.style.transform = "";
            modal.style.opacity = "";

            document.body.classList.remove("modal-open");
        }, 260);

    } else {

        modal.style.transition =
            "transform 280ms cubic-bezier(0.34, 1.35, 0.64, 1), opacity 220ms ease";

        modal.style.transform = "translateY(0) scale(1)";
        modal.style.opacity = "1";

        setTimeout(() => {
            modal.style.transition = "";
            modal.style.transform = "";
            modal.style.opacity = "";
        }, 280);
    }

    matchReportSwipeY = 0;
    matchReportSwipeDirection = null;
});



// -----------------------------
// REFEREE PROFILE
// -----------------------------
let refereeProfileTouchStartY = 0;
let refereeProfileSwipeY = 0;
let refereeProfileIsSwiping = false;
let refereeProfileSwipeDirection = null;

document.addEventListener("touchstart", event => {
    if (window.innerWidth > 600) return;

    const overlay = event.target.closest(
    ".referee-profile-overlay, .referee-profile-overlay-v2"
);

const card = event.target.closest(
    ".referee-profile-card, .referee-profile-card-v2"
);

    if (!overlay || !card) return;

    const rect = card.getBoundingClientRect();
    const touchY = event.touches[0].clientY;

    const distanceFromTop = touchY - rect.top;
    const distanceFromBottom = rect.bottom - touchY;

    const inTopSwipeArea = distanceFromTop <= 160;
    const inBottomSwipeArea = distanceFromBottom <= 140;

    if (!inTopSwipeArea && !inBottomSwipeArea) return;

    refereeProfileTouchStartY = touchY;
    refereeProfileSwipeY = 0;
    refereeProfileIsSwiping = true;

    if (inTopSwipeArea) {
        refereeProfileSwipeDirection = "down";
    } else {
        refereeProfileSwipeDirection = "up";
    }

    card.classList.add("swiping");
}, { passive: true });


document.addEventListener("touchmove", event => {
    if (!refereeProfileIsSwiping) return;

    const card = document.querySelector(
    ".referee-profile-card, .referee-profile-card-v2"
);
    if (!card) return;

    const currentY = event.touches[0].clientY;
    const deltaY = currentY - refereeProfileTouchStartY;

    // TOP: only allow downward movement
    if (
        refereeProfileSwipeDirection === "down" &&
        deltaY < 0
    ) {
        return;
    }

    // BOTTOM: only allow upward movement
    if (
        refereeProfileSwipeDirection === "up" &&
        deltaY > 0
    ) {
        return;
    }

    refereeProfileSwipeY = deltaY;

    const progress = Math.min(
        Math.abs(deltaY) / 220,
        1
    );

    card.style.transform =
        `translateY(${deltaY}px) scale(${1 - progress * 0.018})`;

    card.style.opacity =
        `${1 - progress * 0.12}`;

    event.preventDefault();
}, { passive: false });


document.addEventListener("touchend", () => {
    if (!refereeProfileIsSwiping) return;

    const card = document.querySelector(
    ".referee-profile-card, .referee-profile-card-v2"
);

    refereeProfileIsSwiping = false;

    if (!card) return;

    card.classList.remove("swiping");

    const shouldCloseDown =
        refereeProfileSwipeDirection === "down" &&
        refereeProfileSwipeY > 90;

    const shouldCloseUp =
        refereeProfileSwipeDirection === "up" &&
        refereeProfileSwipeY < -90;

    if (shouldCloseDown || shouldCloseUp) {

        card.style.transition =
            "transform 260ms cubic-bezier(0.22, 1, 0.36, 1), opacity 220ms ease";

        card.style.transform = shouldCloseDown
            ? "translateY(110vh) scale(0.98)"
            : "translateY(-110vh) scale(0.98)";

        card.style.opacity = "0";

        setTimeout(() => {
            document.body.classList.remove("modal-open");
            renderGamesForSelectedDay();
        }, 260);

    } else {

        card.style.transition =
            "transform 280ms cubic-bezier(0.34, 1.35, 0.64, 1), opacity 220ms ease";

        card.style.transform = "translateY(0) scale(1)";
        card.style.opacity = "1";

        setTimeout(() => {
            card.style.transition = "";
            card.style.transform = "";
            card.style.opacity = "";
        }, 280);
    }

    refereeProfileSwipeY = 0;
    refereeProfileSwipeDirection = null;
});

updateDateTabs();
loadGames();

updateDateTabs();
loadGames();
document.addEventListener("click", async event => {
    const shareButton =
        event.target.closest(".referee-share-button");

    if (!shareButton) return;

    console.log("SHARE BUTTON CLICKED");

    const shareCard =
        document.getElementById("referee-share-card");

    if (!shareCard) {
        console.error("Share card not found");
        return;
    }

    const refereeName =
        shareButton.dataset.refereeName || "domari";

    try {
        shareButton.disabled = true;
        shareButton.textContent = "Bý til mynd...";

        const canvas = await html2canvas(shareCard, {
            scale: 2,
            backgroundColor: null,
            useCORS: true
        });

        const blob = await new Promise(resolve =>
            canvas.toBlob(resolve, "image/png")
        );

        if (!blob) {
            throw new Error("Could not create PNG");
        }

        const file = new File(
            [blob],
            `${refereeName}-domarar.png`,
            { type: "image/png" }
        );

        if (
            navigator.canShare &&
            navigator.canShare({ files: [file] })
        ) {
            await navigator.share({
                files: [file],
                title: refereeName
            });
        } else {
            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");

            link.href = url;
            link.download = `${refereeName}-domarar.png`;

            document.body.appendChild(link);
            link.click();
            link.remove();

            URL.revokeObjectURL(url);
        }

    } catch (error) {
        console.error("Could not create share card:", error);
    } finally {
        shareButton.disabled = false;
        shareButton.textContent = "Deila";
    }
});

document.addEventListener("click", (event) => {
    const toggle = event.target.closest(".search-section-toggle");

    if (!toggle) return;

    const section = toggle.closest(".search-collapsible-section");
    const content = section.querySelector(".search-section-content");

    const isOpen = toggle.getAttribute("aria-expanded") === "true";

    toggle.setAttribute("aria-expanded", String(!isOpen));
    content.hidden = isOpen;
});
