
// VS CARD
// =========================================

document.addEventListener("click", (event) => {
    const vsButton = event.target.closest(".vs-button");

    if (vsButton) {
const homeTeam = vsButton.dataset.home;
const awayTeam = vsButton.dataset.away;
const homeLogo = vsButton.dataset.homeLogo;
const awayLogo = vsButton.dataset.awayLogo;
const gender = vsButton.dataset.gender;

openVsCard(homeTeam, awayTeam, homeLogo, awayLogo, gender);
    }

    if (
        event.target.closest(".vs-card-close") ||
        event.target.classList.contains("vs-card-overlay")
    ) {
        closeVsCard();
    }
});

function getTeamForm(teamName, gender) {
    const games =
        typeof allGames !== "undefined" && Array.isArray(allGames)
            ? allGames
            : [];

    const playedGames = games
        .filter(game => {
            const involvesTeam =
                game.home === teamName ||
                game.away === teamName;

            const hasScore =
                game.homeScore !== null &&
                game.homeScore !== undefined &&
                game.awayScore !== null &&
                game.awayScore !== undefined;

            const sameGender =
                !gender ||
                game.gender === gender;

            return involvesTeam && hasScore && sameGender;
        })
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .slice(0, 5)
        .reverse();

    return playedGames.map(game => {
    const isHome = game.home === teamName;

    const teamScore = Number(
        isHome ? game.homeScore : game.awayScore
    );

    const opponentScore = Number(
        isHome ? game.awayScore : game.homeScore
    );

    let result;

    if (teamScore > opponentScore) {
        result = "win";
    } else if (teamScore < opponentScore) {
        result = "loss";
    } else {
        result = "draw";
    }

    return {
    result,
    date: game.date,

    opponent: isHome ? game.away : game.home,

    home: game.home,
    away: game.away,

    homeScore: game.homeScore,
    awayScore: game.awayScore,

    matchId: game.id ?? game.matchId ?? null
};
});
}

function createFormDots(form) {
    let level = 0;

    let previousResult = null;

const points = form.map(item => {

    let change = 0;

    if (previousResult === null) {
        if (item.result === "win") change = 0.8;
        if (item.result === "draw") change = 0;
        if (item.result === "loss") change = -0.8;
    }

    else if (previousResult === "win" && item.result === "win") {
        change = 0.3;
    }

    else if (previousResult === "win" && item.result === "draw") {
        change = -0.6;
    }

    else if (previousResult === "win" && item.result === "loss") {
        change = -1.2;
    }

    else if (previousResult === "draw" && item.result === "win") {
        change = 0.8;
    }

    else if (previousResult === "draw" && item.result === "draw") {
        change = 0;
    }

    else if (previousResult === "draw" && item.result === "loss") {
        change = -0.8;
    }

    else if (previousResult === "loss" && item.result === "win") {
        change = 1.2;
    }

    else if (previousResult === "loss" && item.result === "draw") {
        change = 0.6;
    }

    else if (previousResult === "loss" && item.result === "loss") {
        change = -0.3;
    }

    level += change;

    level = Math.max(-2, Math.min(2, level));

    previousResult = item.result;

    return {
        ...item,
        level
    };
});

    return points
        .map((item, index) => {

            const nextItem = points[index + 1];

            let line = "";

            if (nextItem) {
                const levelDifference =
                    nextItem.level - item.level;

                line = `
    <span
        class="vs-form-line"
        style="
            --level-diff: ${levelDifference};
            --form-level: ${item.level};
        "
    ></span>
`;
            }

            const date = new Date(item.date);

const dateLabel =
    `${date.getDate()}.${date.getMonth() + 1}`;

const fullDateLabel =
    date.toLocaleDateString("is-IS");

const scoreLabel =
    `${item.home} ${item.homeScore} – ${item.awayScore} ${item.away}`;

return `
    <span
        class="vs-form-point"
        data-tooltip="${scoreLabel}"
    >
        ${line}

        <span
            class="vs-form-dot ${item.result}"
            style="--form-level: ${item.level};"
            data-match-id="${item.matchId ?? ""}"
            role="button"
            tabindex="0"
        ></span>

        <span class="vs-form-date">
            ${dateLabel}
        </span>
    </span>
`;
        })
        .join("");
}
function getHeadToHead(homeTeam, awayTeam, gender) {
    const games =
        typeof allGames !== "undefined" && Array.isArray(allGames)
            ? allGames
            : [];


    return games
        .filter(game => {
            const hasScore =
                game.homeScore !== null &&
                game.homeScore !== undefined &&
                game.awayScore !== null &&
                game.awayScore !== undefined;

            const sameTeams =
                (game.home === homeTeam && game.away === awayTeam) ||
                (game.home === awayTeam && game.away === homeTeam);

            const sameGender =
              !gender ||
              game.gender === gender;


            return sameTeams && hasScore && sameGender;
        })
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .slice(0, 3);
}


function openVsCard(homeTeam, awayTeam, homeLogo, awayLogo, gender) {
    closeVsCard();
    document.body.classList.add("vs-card-open");

    const homeForm = getTeamForm(homeTeam, gender);
    const awayForm = getTeamForm(awayTeam, gender); 

    const homeFormHTML = createFormDots(homeForm);
    const awayFormHTML = createFormDots(awayForm);

    const headToHeadGames = getHeadToHead(homeTeam, awayTeam, gender);

const headToHeadHTML = headToHeadGames
    .map(game => {
        const gameDate = new Date(game.date);

const day = String(gameDate.getDate()).padStart(2, "0");
const month = String(gameDate.getMonth() + 1).padStart(2, "0");
const year = gameDate.getFullYear();

const formattedDate = `${day}.${month}.${year}`;

const homeScore = Number(game.homeScore);
const awayScore = Number(game.awayScore);

const homeWinner = homeScore > awayScore;
const awayWinner = awayScore > homeScore;

        return `
    <button
        type="button"
        class="vs-card-h2h-match"
        data-match-id="${game.id}"
    >
                <div class="vs-card-h2h-date">
                    ${formattedDate}
                </div>

                <div class="vs-card-h2h-result">
                    <div class="vs-card-h2h-team">
                        <img src="${game.homeLogo || ""}" alt="${game.home}">
                        <span class="${homeWinner ? "winner" : ""}">${game.home}</span>
                    </div>

                    <strong class="vs-card-h2h-score">
                        ${game.homeScore} – ${game.awayScore}
                    </strong>

                    <div class="vs-card-h2h-team away">
                        <span class="${awayWinner ? "winner" : ""}">${game.away}</span>
                        <img src="${game.awayLogo || ""}" alt="${game.away}">
                    </div>
                </div>
            </button>
        `;
    })
    .join("");

const headToHeadNote =
    headToHeadGames.length === 0
        ? "Liðin hafa ekki mæst síðustu þrjú tímabil."
        : headToHeadGames.length < 3
            ? "Liðin hafa ekki mæst oftar síðustu þrjú tímabil."
            : "";

    const overlay = document.createElement("div");
    overlay.className = "vs-card-overlay";

    overlay.innerHTML = `
        <div class="vs-card">
            <button class="vs-card-close" type="button" aria-label="Loka">
                ×
            </button>

            <div class="vs-card-header">

    <div class="vs-card-team">
        <img
            class="vs-card-logo"
            src="${homeLogo}"
            alt="${homeTeam}"
        >
        <strong>${homeTeam}</strong>
    </div>

    <span class="vs-card-versus">VS</span>

    <div class="vs-card-team">
        <strong>${awayTeam}</strong>
        <img
            class="vs-card-logo"
            src="${awayLogo}"
            alt="${awayTeam}"
        >
    </div>

</div>
<div class="vs-card-form-section">

    <div class="vs-card-section-title">
        LIÐSFORM
    </div>

    <div class="vs-card-form-row">

        <div class="vs-card-form-team">
            <span class="vs-card-form-name">${homeTeam}</span>

            <div class="vs-card-form-dots">
                ${homeFormHTML}
            </div>
        </div>

        <div class="vs-card-form-team">
            <span class="vs-card-form-name">${awayTeam}</span>

            <div class="vs-card-form-dots">
                ${awayFormHTML}
            </div>
        </div>

    </div>

</div>

<div class="vs-card-h2h-section">

    <div class="vs-card-section-title">
        FYRRI LEIKIR LIÐANNA
    </div>

    <div class="vs-card-h2h-list">
        ${headToHeadHTML}
    </div>

    ${
        headToHeadNote
            ? `<div class="vs-card-h2h-note">${headToHeadNote}</div>`
            : ""
    }

</div>

</div>   <!-- closes vs-card -->
`;

    document.body.appendChild(overlay);

overlay.querySelectorAll(
    ".vs-card-h2h-match, .vs-form-dot[data-match-id]"
).forEach(button => {
    button.addEventListener("click", () => {
        const matchId = button.dataset.matchId;

        if (!matchId) {
            return;
        }

        openPreviousMatchCard(matchId);
    });
});
}
function closeVsCard() {
    document.querySelector(".vs-card-overlay")?.remove();
    document.body.classList.remove("vs-card-open");
}
async function openPreviousMatchCard(matchId) {
    const game = [
    ...(allGames || []),
    ...(archiveGames || [])
].find(
    game => String(game.id) === String(matchId)
);

    if (!game) {
        console.warn("Previous match not found:", matchId);
        return;
    }

    const gameDate = new Date(game.date);

    const formattedDate = gameDate.toLocaleDateString("is-IS", {
        day: "numeric",
        month: "long",
        year: "numeric"
    });

    const previousOverlay = document.createElement("div");
    previousOverlay.className = "previous-match-overlay";

    previousOverlay.innerHTML = `
        <div class="previous-match-card">

            <button
                type="button"
                class="previous-match-close"
                aria-label="Loka"
            >
                ×
            </button>

            <div class="previous-match-competition">
                ${game.competition || ""}
            </div>

            <div class="previous-match-date">
                ${formattedDate}
            </div>

            <div class="previous-match-teams">

                <div class="previous-match-team">
                    <img
                        src="${game.homeLogo || ""}"
                        alt="${game.home || ""}"
                    >
                    <strong>${game.home || ""}</strong>
                </div>

                <div class="previous-match-score">
                    ${game.homeScore ?? "–"} - ${game.awayScore ?? "–"}
                </div>

                <div class="previous-match-team">
                    <img
                        src="${game.awayLogo || ""}"
                        alt="${game.away || ""}"
                    >
                    <strong>${game.away || ""}</strong>
                </div>

            </div>

            <div class="previous-match-venue">
                ${game.facility || ""}
            </div>

            <div class="previous-match-officials">
                ${(game.officials || []).map(official => `
                    <div class="previous-match-official-row">
                        <span>${official.role || ""}</span>
                        <strong>${official.name || ""}</strong>
                    </div>
                `).join("")}
            </div>

            <div class="previous-match-events">
                <h3>ATVIK LEIKS</h3>

                <div class="previous-match-events-list">
                    Sæki atvik…
                </div>
            </div>

        </div>
    `;

    document.body.appendChild(previousOverlay);

    const eventsList =
    previousOverlay.querySelector(".previous-match-events-list");

try {
    const response = await fetch(
        `data/match-reports/${game.id}.json`
    );

    if (!response.ok) {
        throw new Error("Match report not found");
    }

    const report = await response.json();

    const supportedTypes = [
        "GOAL",
        "OWN_GOAL",
        "PENALTY",
        "PENALTY_FAILED",
        "YELLOW",
        "SECOND_YELLOW",
        "RED",
        "EXPULSION"
    ];

    const importantEvents = (report.events || []).filter(event =>
        supportedTypes.includes(
            event.eventType?.fcdName || ""
        )
    );

    if (!importantEvents.length) {
        eventsList.innerHTML = `
            <div class="previous-match-no-events">
                Engin skráð atvik
            </div>
        `;
    } else {
        eventsList.innerHTML = importantEvents.map(event => {
            const type =
                event.eventType?.fcdName || "";

            const minute =
                event.displayMinute || "";

            const player =
                event.player?.name || "";

            const team =
                event.homeTeam
                    ? game.home
                    : game.away;

            let icon = "";
            let text = player;

            if (type === "GOAL") {
                icon = "⚽";
            }

            if (type === "OWN_GOAL") {
                icon = "⚽";
                text = `${player} · sjálfsmark`;
            }

            if (type === "PENALTY") {
                icon = "⚽";
                text = `${player} · víti`;
            }

            if (type === "PENALTY_FAILED") {
                icon = "✕";
                text = `${player} · víti misnotað`;
            }

            if (type === "YELLOW") {
                icon = `
                    <span class="event-card-icon yellow-card"></span>
                `;
            }

            if (type === "SECOND_YELLOW") {
                icon = `
                    <span class="second-yellow-symbol">
                        <span class="event-card-icon yellow-card"></span>
                        <span class="event-card-icon red-card"></span>
                    </span>
                `;
            }

            if (
                type === "RED" ||
                type === "EXPULSION"
            ) {
                icon = `
                    <span class="event-card-icon red-card"></span>
                `;
            }

            return `
                <div class="previous-match-event-row ${event.homeTeam ? "home" : "away"}">

                    <div class="previous-match-event-side">
    <span class="previous-match-event-icon">
        ${icon}
    </span>

    <strong>${text || team}</strong>
</div>

<div class="previous-match-event-minute">
    ${minute}
</div>

<div class="previous-match-event-side">
    <span class="previous-match-event-icon">
        ${icon}
    </span>

    <strong>${text || team}</strong>
</div>

                </div>
            `;
        }).join("");
    }

} catch (error) {
    console.warn(
        "Could not load previous match events:",
        error
    );

    eventsList.innerHTML = `
        <div class="previous-match-no-events">
            Engin leikskýrsla tiltæk
        </div>
    `;
}

    const closeButton =
        previousOverlay.querySelector(".previous-match-close");

    closeButton?.addEventListener("click", () => {
        previousOverlay.remove();
    });
}