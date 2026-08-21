// =========================================
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
        .slice(0, 3)
        .reverse();

    return playedGames.map(game => {
        const isHome = game.home === teamName;

        const teamScore = Number(
            isHome ? game.homeScore : game.awayScore
        );

        const opponentScore = Number(
            isHome ? game.awayScore : game.homeScore
        );

        if (teamScore > opponentScore) return "win";
        if (teamScore < opponentScore) return "loss";

        return "draw";
    });
}

function createFormDots(form) {
    return form
        .map(result => `<span class="vs-form-dot ${result}"></span>`)
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
    document.body.classList.add("no-scroll");

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
            <div class="vs-card-h2h-match">
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
            </div>
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
}

function closeVsCard() {
    document.querySelector(".vs-card-overlay")?.remove();
    document.body.classList.add("no-scroll");
}