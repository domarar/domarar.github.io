// VS CARD
// =========================================

document.addEventListener("click", async (event) => {
    const vsButton = event.target.closest(".vs-button");

    if (vsButton) {
        const homeTeam = vsButton.dataset.home;
        const awayTeam = vsButton.dataset.away;
        const homeLogo = vsButton.dataset.homeLogo;
        const awayLogo = vsButton.dataset.awayLogo;
        const gender = vsButton.dataset.gender;
        const competition = vsButton.dataset.competition;

        if (typeof loadArchives === "function") {
            try {
                await loadArchives();
            } catch (error) {
                console.warn(
                    "Could not load archive before opening VS card:",
                    error
                );
            }
        }

        openVsCard(
            homeTeam,
            awayTeam,
            homeLogo,
            awayLogo,
            gender,
            competition
        );
    }

    if (
        event.target.closest(".vs-card-close") ||
        event.target.classList.contains("vs-card-overlay")
    ) {
        closeVsCard();
    }
});

function getCompetitionFamily(competition = "") {
    const value = competition
        .trim()
        .toLowerCase();

    if (value.includes("besta deild karla")) {
        return "besta-deild-karla";
    }

    if (value.includes("besta deild kvenna")) {
        return "besta-deild-kvenna";
    }

    return value;
}

function getTeamForm(teamName, gender, competition) {
    const games = [
        ...(
            typeof allGames !== "undefined" &&
            Array.isArray(allGames)
                ? allGames
                : []
        ),

        ...(
            typeof archiveGames !== "undefined" &&
            Array.isArray(archiveGames)
                ? archiveGames
                : []
        )
    ];

    const competitionFamily =
        getCompetitionFamily(competition);

    // Remove duplicate matches that may exist
    // in both allGames and archiveGames.
    const gamesById = new Map();

    games.forEach(game => {
        const id =
            game.id ??
            game.matchId ??
            null;

        if (id !== null && id !== undefined) {
            gamesById.set(String(id), game);
        }
    });

    const uniqueGames =
        gamesById.size > 0
            ? Array.from(gamesById.values())
            : games;

    const playedGames = uniqueGames
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

            const sameCompetition =
                !competition ||
                getCompetitionFamily(
                    game.competition
                ) === competitionFamily;

            return (
                involvesTeam &&
                hasScore &&
                sameGender &&
                sameCompetition
            );
        })
        .sort(
            (a, b) =>
                new Date(b.date) -
                new Date(a.date)
        )
        .slice(0, 5)
        .reverse();

    return playedGames.map(game => {
        const isHome =
            game.home === teamName;

        const teamScore = Number(
            isHome
                ? game.homeScore
                : game.awayScore
        );

        const opponentScore = Number(
            isHome
                ? game.awayScore
                : game.homeScore
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

            opponent:
                isHome
                    ? game.away
                    : game.home,

            home: game.home,
            away: game.away,

            homeScore: game.homeScore,
            awayScore: game.awayScore,

            matchId:
                game.id ??
                game.matchId ??
                null
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
        } else if (
            previousResult === "win" &&
            item.result === "win"
        ) {
            change = 0.3;
        } else if (
            previousResult === "win" &&
            item.result === "draw"
        ) {
            change = -0.6;
        } else if (
            previousResult === "win" &&
            item.result === "loss"
        ) {
            change = -1.2;
        } else if (
            previousResult === "draw" &&
            item.result === "win"
        ) {
            change = 0.8;
        } else if (
            previousResult === "draw" &&
            item.result === "draw"
        ) {
            change = 0;
        } else if (
            previousResult === "draw" &&
            item.result === "loss"
        ) {
            change = -0.8;
        } else if (
            previousResult === "loss" &&
            item.result === "win"
        ) {
            change = 1.2;
        } else if (
            previousResult === "loss" &&
            item.result === "draw"
        ) {
            change = 0.6;
        } else if (
            previousResult === "loss" &&
            item.result === "loss"
        ) {
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

            const scoreLabel =
                `${item.home} ${item.homeScore} \u2013 ${item.awayScore} ${item.away}`;

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
    const games = [
        ...(
            typeof allGames !== "undefined" &&
            Array.isArray(allGames)
                ? allGames
                : []
        ),

        ...(
            typeof archiveGames !== "undefined" &&
            Array.isArray(archiveGames)
                ? archiveGames
                : []
        )
    ];

    const gamesById = new Map();

    games.forEach(game => {
        const id = game.id ?? game.matchId ?? null;

        if (id !== null && id !== undefined) {
            gamesById.set(String(id), game);
        }
    });

    const uniqueGames =
        gamesById.size > 0
            ? Array.from(gamesById.values())
            : games;

    return uniqueGames
        .filter(game => {
            const hasScore =
                game.homeScore !== null &&
                game.homeScore !== undefined &&
                game.awayScore !== null &&
                game.awayScore !== undefined;

            const sameTeams =
                (
                    game.home === homeTeam &&
                    game.away === awayTeam
                ) ||
                (
                    game.home === awayTeam &&
                    game.away === homeTeam
                );

            const sameGender =
                !gender ||
                game.gender === gender;

            return (
                sameTeams &&
                hasScore &&
                sameGender
            );
        })
        .sort((a, b) =>
            new Date(b.date) - new Date(a.date)
        )
        .slice(0, 3);
}

function openVsCard(
    homeTeam,
    awayTeam,
    homeLogo,
    awayLogo,
    gender,
    competition
) {
    closeVsCard();
    document.body.classList.add("vs-card-open");

    const homeForm = getTeamForm(
        homeTeam,
        gender,
        competition
    );

    const awayForm = getTeamForm(
        awayTeam,
        gender,
        competition
    );

    const homeFormHTML = createFormDots(homeForm);
    const awayFormHTML = createFormDots(awayForm);

    const headToHeadGames =
        getHeadToHead(homeTeam, awayTeam, gender);

    const headToHeadHTML = headToHeadGames
        .map(game => {
            const gameDate = new Date(game.date);

            const day = String(
                gameDate.getDate()
            ).padStart(2, "0");

            const month = String(
                gameDate.getMonth() + 1
            ).padStart(2, "0");

            const year =
                gameDate.getFullYear();

            const formattedDate =
                `${day}.${month}.${year}`;

            const homeScore =
                Number(game.homeScore);

            const awayScore =
                Number(game.awayScore);

            const homeWinner =
                homeScore > awayScore;

            const awayWinner =
                awayScore > homeScore;

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
                            <img
                                src="${game.homeLogo || ""}"
                                alt="${game.home}"
                            >

                            <span class="${homeWinner ? "winner" : ""}">
                                ${game.home}
                            </span>
                        </div>

                        <strong class="vs-card-h2h-score">
                            ${game.homeScore} \u2013 ${game.awayScore}
                        </strong>

                        <div class="vs-card-h2h-team away">
                            <span class="${awayWinner ? "winner" : ""}">
                                ${game.away}
                            </span>

                            <img
                                src="${game.awayLogo || ""}"
                                alt="${game.away}"
                            >
                        </div>
                    </div>
                </button>
            `;
        })
        .join("");

    const headToHeadNote =
        headToHeadGames.length === 0
            ? "Li\u00F0in hafa ekki m\u00E6st s\u00ED\u00F0ustu \u00FErj\u00FA t\u00EDmabil."
            : headToHeadGames.length < 3
                ? "Li\u00F0in hafa ekki m\u00E6st oftar s\u00ED\u00F0ustu \u00FErj\u00FA t\u00EDmabil."
                : "";

    const overlay =
        document.createElement("div");

    overlay.className =
        "vs-card-overlay";

    overlay.innerHTML = `
        <div class="vs-card">
            <button
                class="vs-card-close"
                type="button"
                aria-label="Loka"
            >
                \u00D7
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

                <span class="vs-card-versus">
                    VS
                </span>

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
                    LI\u00D0SFORM
                </div>

                <div class="vs-card-form-row">

                    <div class="vs-card-form-team">
                        <span class="vs-card-form-name">
                            ${homeTeam}
                        </span>

                        <div class="vs-card-form-dots">
                            ${homeFormHTML}
                        </div>
                    </div>

                    <div class="vs-card-form-team">
                        <span class="vs-card-form-name">
                            ${awayTeam}
                        </span>

                        <div class="vs-card-form-dots">
                            ${awayFormHTML}
                        </div>
                    </div>

                </div>

            </div>

            <div class="vs-card-h2h-section">

                <div class="vs-card-section-title">
                    FYRRI LEIKIR LI\u00D0ANNA
                </div>

                <div class="vs-card-h2h-list">
                    ${headToHeadHTML}
                </div>

                ${
                    headToHeadNote
                        ? `
                            <div class="vs-card-h2h-note">
                                ${headToHeadNote}
                            </div>
                        `
                        : ""
                }

            </div>

        </div>
    `;

    document.body.appendChild(overlay);

    overlay
        .querySelectorAll(
            ".vs-card-h2h-match, .vs-form-dot[data-match-id]"
        )
        .forEach(button => {
            button.addEventListener("click", () => {
                const matchId =
                    button.dataset.matchId;

                if (!matchId) {
                    return;
                }

                openPreviousMatchCard(matchId);
            });
        });
}

function closeVsCard() {
    document
        .querySelector(".vs-card-overlay")
        ?.remove();

    document.body.classList.remove(
        "vs-card-open"
    );
}

async function openPreviousMatchCard(matchId) {
    const currentGames =
        typeof allGames !== "undefined" &&
        Array.isArray(allGames)
            ? allGames
            : [];

    const archivedGames =
        typeof archiveGames !== "undefined" &&
        Array.isArray(archiveGames)
            ? archiveGames
            : [];

    const game = [
        ...currentGames,
        ...archivedGames
    ].find(
        game =>
            String(game.id) === String(matchId)
    );

    if (!game) {
        console.warn(
            "Previous match not found:",
            matchId
        );

        return;
    }

    const gameDate =
        new Date(game.date);

    const formattedDate =
        gameDate.toLocaleDateString("is-IS", {
            day: "numeric",
            month: "long",
            year: "numeric"
        });

    const previousOverlay =
        document.createElement("div");

    previousOverlay.className =
        "previous-match-overlay";

    previousOverlay.innerHTML = `
        <div class="previous-match-card">

            <button
                type="button"
                class="previous-match-close"
                aria-label="Loka"
            >
                \u00D7
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

                    <strong>
                        ${game.home || ""}
                    </strong>
                </div>

                <div class="previous-match-score">
                    ${game.homeScore ?? "\u2013"} \u2013
                    ${game.awayScore ?? "\u2013"}
                </div>

                <div class="previous-match-team">
                    <img
                        src="${game.awayLogo || ""}"
                        alt="${game.away || ""}"
                    >

                    <strong>
                        ${game.away || ""}
                    </strong>
                </div>

            </div>

            <div class="previous-match-venue">
                ${game.facility || ""}
            </div>

            <div class="previous-match-officials">
                ${(game.officials || [])
                    .map(official => `
                        <div class="previous-match-official-row">
                            <span>
                                ${official.role || ""}
                            </span>

                            <strong>
                                ${official.name || ""}
                            </strong>
                        </div>
                    `)
                    .join("")}
            </div>

            <div class="previous-match-events">
                <h3>ATVIK LEIKS</h3>

                <div class="previous-match-events-list">
                    S\u00E6ki atvik\u2026
                </div>
            </div>

        </div>
    `;

    document.body.appendChild(
        previousOverlay
    );

    const eventsList =
        previousOverlay.querySelector(
            ".previous-match-events-list"
        );

    try {
        const response = await fetch(
            `data/match-reports/${game.id}.json`
        );

        if (!response.ok) {
            throw new Error(
                "Match report not found"
            );
        }

        const report =
            await response.json();

        const supportedTypes = new Set([
            "GOAL",
            "OWN_GOAL",
            "PENALTY",
            "PENALTY_FAILED",
            "YELLOW",
            "SECOND_YELLOW",
            "RED",
            "EXPULSION",
            "SUBSTITUTION",
            "SUBSTITUTION_IN",
            "SUBSTITUTION_OUT",
            "PLAYER_IN",
            "PLAYER_OUT",
            "SUB_IN",
            "SUB_OUT"
        ]);

        const getEventType = event =>
            String(
                event.eventType?.fcdName || ""
            ).toUpperCase();

        const isSubstitution = type =>
            type.includes("SUBSTIT") ||
            type === "PLAYER_IN" ||
            type === "PLAYER_OUT" ||
            type === "SUB_IN" ||
            type === "SUB_OUT";

        const getMinuteValue = event => {
            const minute = String(
                event.displayMinute ||
                event.minute ||
                ""
            );

            const parts =
                minute.match(/\d+/g);

            if (!parts) {
                return Number.MAX_SAFE_INTEGER;
            }

            return parts.reduce(
                (total, part) =>
                    total + Number(part),
                0
            );
        };

        const getPlayerName = value => {
            if (typeof value === "string") {
                return value;
            }

            return (
                value?.name ||
                value?.fullName ||
                ""
            );
        };

        const firstPlayerName =
            (...values) => {
                for (const value of values) {
                    const name =
                        getPlayerName(value);

                    if (name) {
                        return name;
                    }
                }

                return "";
            };

        const importantEvents =
            (report.events || [])
                .filter(event => {
                    const type =
                        getEventType(event);

                    return (
                        supportedTypes.has(type) ||
                        isSubstitution(type)
                    );
                })
                .map((event, index) => ({
                    event,
                    index
                }))
                .sort((a, b) =>
                    getMinuteValue(a.event) -
                    getMinuteValue(b.event) ||
                    a.index - b.index
                )
                .map(({ event }) => event);

        if (!importantEvents.length) {
            eventsList.innerHTML = `
                <div class="previous-match-no-events">
                    Engin skr\u00E1\u00F0 atvik
                </div>
            `;

            return;
        }

        eventsList.innerHTML =
            importantEvents
                .map(event => {
                    const type =
                        getEventType(event);

                    const minute =
                        event.displayMinute ||
                        event.minute ||
                        "";

                    const player =
                        getPlayerName(
                            event.player
                        );

                    const team =
                        event.homeTeam
                            ? game.home
                            : game.away;

                    let icon = "";
                    let text = player;

                    if (type === "GOAL") {
                        icon = "\u26BD";
                    }

                    if (type === "OWN_GOAL") {
                        icon = "\u26BD";
                        text =
                            `${player} \u00B7 sj\u00E1lfsmark`;
                    }

                    if (type === "PENALTY") {
                        icon = "\u26BD";
                        text =
                            `${player} \u00B7 v\u00EDti`;
                    }

                    if (
                        type === "PENALTY_FAILED"
                    ) {
                        icon = "\u2715";
                        text =
                            `${player} \u00B7 v\u00EDti misnota\u00F0`;
                    }

                    if (type === "YELLOW") {
                        icon = `
                            <span
                                class="event-card-icon yellow-card"
                            ></span>
                        `;
                    }

                    if (
                        type === "SECOND_YELLOW"
                    ) {
                        icon = `
                            <span class="second-yellow-symbol">
                                <span
                                    class="event-card-icon yellow-card"
                                ></span>

                                <span
                                    class="event-card-icon red-card"
                                ></span>
                            </span>
                        `;
                    }

                    if (
                        type === "RED" ||
                        type === "EXPULSION"
                    ) {
                        icon = `
                            <span
                                class="event-card-icon red-card"
                            ></span>
                        `;
                    }

                    if (isSubstitution(type)) {
                        const substitution =
                            event.substitution || {};

                        let playerIn =
                            firstPlayerName(
                                event.playerIn,
                                event.inPlayer,
                                event.incomingPlayer,
                                event.substitutePlayer,
                                substitution.playerIn,
                                substitution.inPlayer,
                                substitution.incomingPlayer
                            );

                        let playerOut =
                            firstPlayerName(
                                event.playerOut,
                                event.outPlayer,
                                event.outgoingPlayer,
                                event.replacedPlayer,
                                event.relatedPlayer,
                                event.player2,
                                substitution.playerOut,
                                substitution.outPlayer,
                                substitution.outgoingPlayer
                            );

                        if (
                            !playerIn &&
                            player &&
                            player !== playerOut
                        ) {
                            if (
                                type === "PLAYER_OUT" ||
                                type === "SUB_OUT"
                            ) {
                                playerOut =
                                    playerOut || player;
                            } else {
                                playerIn = player;
                            }
                        }

                        if (
    playerIn &&
    playerOut
) {
    text = `
        <span class="previous-match-substitution">

            <span class="previous-match-sub-player sub-in">
                <span class="previous-match-sub-arrow">
                    \u2191
                </span>

                <span>
                    ${playerIn}
                </span>
            </span>

            <span class="previous-match-sub-player sub-out">
                <span class="previous-match-sub-arrow">
                    \u2193
                </span>

                <span>
                    ${playerOut}
                </span>
            </span>

        </span>
    `;
} else if (playerIn) {
    text = `
        <span class="previous-match-substitution">

            <span class="previous-match-sub-player sub-in">
                <span class="previous-match-sub-arrow">
                    \u2191
                </span>

                <span>
                    ${playerIn}
                </span>
            </span>

        </span>
    `;
} else if (playerOut) {
    text = `
        <span class="previous-match-substitution">

            <span class="previous-match-sub-player sub-out">
                <span class="previous-match-sub-arrow">
                    \u2193
                </span>

                <span>
                    ${playerOut}
                </span>
            </span>

        </span>
    `;
} else {
    text =
        player || team;
}
                    }

                    const eventContent = `
                        <span class="previous-match-event-icon">
                            ${icon}
                        </span>

                        <strong>
                            ${text || team}
                        </strong>
                    `;

                    const isHomeEvent =
                        Boolean(event.homeTeam);

                    return `
                        <div class="previous-match-event-row ${isHomeEvent ? "home" : "away"}">

                            <div class="previous-match-event-side home-side">
                                ${
                                    isHomeEvent
                                        ? eventContent
                                        : ""
                                }
                            </div>

                            <div class="previous-match-event-minute">
                                ${minute}
                            </div>

                            <div class="previous-match-event-side away-side">
                                ${
                                    isHomeEvent
                                        ? ""
                                        : eventContent
                                }
                            </div>

                        </div>
                    `;
                })
                .join("");

    } catch (error) {
        console.warn(
            "Could not load previous match events:",
            error
        );

        eventsList.innerHTML = `
            <div class="previous-match-no-events">
                Engin leiksk\u00FDrsla tilt\u00E6k
            </div>
        `;
    }

    const closeButton =
        previousOverlay.querySelector(
            ".previous-match-close"
        );

    closeButton?.addEventListener(
        "click",
        () => {
            previousOverlay.remove();
        }
    );
}