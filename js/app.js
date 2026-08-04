"use strict";

// =====================================
// DOM ELEMENTS
// =====================================

const gamesContainer = document.querySelector("#games-container");
const dateTabs = document.querySelectorAll(".date-tab");
const searchInput = document.querySelector("#search-input");


// =====================================
// APP STATE
// =====================================

let upcomingGames = [];
let archiveGames = [];
let allGames = [];
let selectedDayOffset = 0;


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
    const tabDate = getDateForOffset(index);

    const day = tabDate.getUTCDate();
    const month = tabDate.getUTCMonth();
    const weekday = tabDate.getUTCDay();

    const titleElement = tab.querySelector("strong");
    const dateElement = tab.querySelector("span");

    if (index === 0) {
      titleElement.textContent = "Í dag";
    } else if (index === 1) {
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
          Dómarar hafa ekki verið skráðir.
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


// =====================================
// CREATE GAME CARD
// =====================================

function createGameCard(game) {
const time = formatTime(game.date);
const date = formatIcelandicDate(game.date);

  return `
    <article class="fixture-card">

      <div class="fixture-main">

        <div class="fixture-meta">

    <div class="fixture-date">
        ${date}
    </div>

    <div class="fixture-time">
        ${time}
    </div>

    <div class="fixture-venue">
        ${game.facility || "Völlur óskráður"}
    </div>

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

          <div class="versus">
            VS
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

      <div class="officials">
        ${createOfficialRows(game.officials)}
      </div>

    </article>
  `;
}


// =====================================
// GROUP AND DISPLAY GAMES
// =====================================
function renderGamesForSelectedDay() {
    const selectedDate = getDateForOffset(selectedDayOffset);
    const selectedDateKey = getDateKey(selectedDate);
const search = searchInput.value
    .toLowerCase()
    .trim();

const gamesForDay = allGames
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

        return (
            (game.home || "").toLowerCase().includes(search) ||
            (game.away || "").toLowerCase().includes(search) ||
            (game.competition || "").toLowerCase().includes(search) ||
            (game.facility || "").toLowerCase().includes(search) ||
            officials.includes(search)
        );
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

  const competitionGroups = {};

  gamesForDay.forEach(game => {
    const competition =
      cleanCompetitionName(game.competition);

    if (!competitionGroups[competition]) {
      competitionGroups[competition] = [];
    }

    competitionGroups[competition].push(game);
  });

  gamesContainer.innerHTML = Object.entries(
    competitionGroups
  )
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
}


// =====================================
// DATE TAB CLICKS
// =====================================

dateTabs.forEach((tab, index) => {
  tab.addEventListener("click", () => {
    searchInput.value = "";
    selectedDayOffset = index;

    dateTabs.forEach(button => {
      button.classList.remove("active");
    });

    tab.classList.add("active");

    renderGamesForSelectedDay();
  });
});


// =====================================
// LOAD REAL GAME DATA
// =====================================
async function loadGames() {
    try {
        const [
            upcomingResponse,
            archiveResponse
        ] = await Promise.all([
            fetch("data/games.json", {
                cache: "no-store"
            }),

            fetch("data/archive.json", {
                cache: "no-store"
            })
        ]);

        if (!upcomingResponse.ok) {
            throw new Error(
                `Upcoming games HTTP error: ${upcomingResponse.status}`
            );
        }

        if (!archiveResponse.ok) {
            throw new Error(
                `Archive HTTP error: ${archiveResponse.status}`
            );
        }

        const upcomingData = await upcomingResponse.json();
        const archiveData = await archiveResponse.json();

        upcomingGames = Array.isArray(upcomingData.games)
            ? upcomingData.games
            : [];

        archiveGames = Array.isArray(archiveData.games)
            ? archiveData.games
            : [];

        const gamesById = new Map();

        archiveGames.forEach(game => {
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

        renderGamesForSelectedDay();

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
searchInput.addEventListener("input", () => {
    const search = searchInput.value.trim();

    if (search) {
        dateTabs.forEach(tab => {
            tab.classList.remove("active");
        });
    } else {
        dateTabs.forEach(tab => {
            tab.classList.remove("active");
        });

        dateTabs[selectedDayOffset].classList.add("active");
    }

    renderGamesForSelectedDay();
});
updateDateTabs();
loadGames();
