const standingsRules = {
    "Besta deild karla": {
    markers: [
        { positions: [1], type: "europe-blue" },
        { positions: [2, 3], type: "europe-green" },
        { positions: [11, 12], type: "relegation" }
    ],
    legend: [
        { type: "europe-blue", label: "Meistaradeild" },
        { type: "europe-green", label: "Sambandsdeild" },
        { type: "relegation", label: "Lengjudeild" }
    ]
},

    "Besta deild kvenna": {
    markers: [
        { positions: [9, 10], type: "relegation" }
    ],
    legend: [
        { type: "relegation", label: "Lengjudeild" }
    ]
},

    "Lengjudeild karla": {
    markers: [
        { positions: [1], type: "promotion" },
        { positions: [2, 3, 4, 5], type: "playoff" },
        { positions: [11, 12], type: "relegation" }
    ],
    legend: [
        { type: "promotion", label: "Besta deild" },
        { type: "playoff", label: "Umspil" },
        { type: "relegation", label: "2. deild" }
    ]
},

    "Lengjudeild kvenna": {
    markers: [
        { positions: [1, 2], type: "promotion" },
        { positions: [9, 10], type: "relegation" }
    ],
    legend: [
        { type: "promotion", label: "Besta deild" },
        { type: "relegation", label: "2. deild" }
    ]
},

    "2. deild karla": {
    markers: [
        { positions: [1, 2], type: "promotion" },
        { positions: [11, 12], type: "relegation" }
    ],
    legend: [
        { type: "promotion", label: "Lengjudeild" },
        { type: "relegation", label: "3. deild" }
    ]
},

    "3. deild karla": {
    markers: [
        { positions: [1, 2], type: "promotion" },
        { positions: [11, 12], type: "relegation" }
    ],
    legend: [
        { type: "promotion", label: "2. deild" },
        { type: "relegation", label: "4. deild" }
    ]
},

    "4. deild karla": {
    markers: [
        { positions: [1, 2], type: "promotion" }
    ],
    legend: [
        { type: "promotion", label: "3. deild" }
    ]
}
};

let standingsData = null;

async function loadStandingsData() {
    if (standingsData) {
        return standingsData;
    }

    const response = await fetch("data/standings.json");

    if (!response.ok) {
        throw new Error("Could not load standings data");
    }

    standingsData = await response.json();

    return standingsData;
}

function closeStandings() {
    const overlay = document.querySelector(".standings-overlay");

    if (!overlay) return;

    overlay.classList.add("is-closing");

    setTimeout(() => {
        overlay.remove();
        document.body.classList.remove("standings-open");
    }, 280);
}

async function openStandings(competition, homeTeam, awayTeam) {
    try {
        const data = await loadStandingsData();
        const table = data[competition];

        if (!table) {
            console.warn("No standings found for:", competition);
            return;
        }

        closeStandings();

        const rowsHTML = table.map(team => {
    const isHighlighted =
        team.team === homeTeam ||
        team.team === awayTeam;

    const rule = standingsRules[competition];

    const marker = rule?.markers.find(item =>
        item.positions.includes(team.position)
    );

    const markerClass = marker
        ? `standings-position-${marker.type}`
        : "";

    return `
                <div class="standings-row ${isHighlighted ? "standings-row-highlight" : ""} ${markerClass}">
                    <div class="standings-position">
                        ${team.position}
                    </div>

                    <div class="standings-team">
    <span>${team.team}</span>

    ${team.isLive ? `
        <span class="standings-live">
            <span class="standings-live-dot"></span>
            Í GANGI
        </span>
    ` : ""}
</div>

                    <div class="standings-played">
                        ${team.played}
                    </div>

                    <div class="standings-goal-difference">
                        ${team.goalDifference > 0 ? "+" : ""}${team.goalDifference}
                    </div>

                    <div class="standings-points">
                        ${team.points}
                    </div>
                </div>
            `;
        }).join("");

        const rule = standingsRules[competition];

const legendHTML = rule?.legend
    ? `
        <div class="standings-legend">
            ${rule.legend.map(item => `
                <div class="standings-legend-item">
                    <span class="standings-legend-color standings-legend-${item.type}"></span>
                    <span>${item.label}</span>
                </div>
            `).join("")}
        </div>
    `
    : "";

        const overlay = document.createElement("div");
        overlay.className = "standings-overlay";

        overlay.innerHTML = `
            <section class="standings-card">

                <div class="standings-header">
                    <div>
                        <div class="standings-label">
                            STAÐAN
                        </div>

                        <h2 class="standings-title">
                            ${competition}
                        </h2>
                    </div>

                    <button
                        class="standings-close"
                        type="button"
                        aria-label="Loka stöðutöflu"
                    >
                        ×
                    </button>
                </div>

                <div class="standings-table">

                    <div class="standings-row standings-table-header">
                        <div>#</div>
                        <div>Lið</div>
                        <div>L</div>
                        <div>+/-</div>
                        <div>Stig</div>
                    </div>

                        ${rowsHTML}

                    </div>

                  ${legendHTML}

            </section>
        `;

        document.body.appendChild(overlay);
        document.body.classList.add("standings-open");

        overlay
            .querySelector(".standings-close")
            .addEventListener("click", closeStandings);

        overlay.addEventListener("click", event => {
            if (event.target === overlay) {
                closeStandings();
            }
        });

    } catch (error) {
        console.error("Standings error:", error);
    }
}
let standingsTouchStartY = 0;
let standingsTouchCurrentY = 0;
let standingsIsSwiping = false;

document.addEventListener("touchstart", event => {
    if (window.innerWidth > 600) return;

    const card = event.target.closest(".standings-card");
    if (!card) return;

    standingsTouchStartY = event.touches[0].clientY;
    standingsTouchCurrentY = standingsTouchStartY;
    standingsIsSwiping = true;

    card.style.transition = "none";
}, { passive: true });

document.addEventListener("touchmove", event => {
    if (!standingsIsSwiping) return;

    const card = document.querySelector(".standings-card");
    if (!card) return;

    standingsTouchCurrentY = event.touches[0].clientY;

    const deltaY =
        standingsTouchCurrentY - standingsTouchStartY;

    // Only let the card move upward
    if (deltaY < 0) {
        card.style.transform = `translateY(${deltaY}px)`;
        card.style.opacity =
            Math.max(0.45, 1 + deltaY / 500);
    }
}, { passive: true });

document.addEventListener("touchend", () => {
    if (!standingsIsSwiping) return;

    const card = document.querySelector(".standings-card");
    if (!card) return;

    const swipeDistance =
        standingsTouchStartY - standingsTouchCurrentY;

    standingsIsSwiping = false;

    card.style.transition =
        "transform 0.28s ease, opacity 0.28s ease";

    if (swipeDistance > 90) {
        card.style.transform = "translateY(-120vh)";
        card.style.opacity = "0";

        setTimeout(() => {
            closeStandings();
        }, 280);

    } else {
        card.style.transform = "translateY(0)";
        card.style.opacity = "1";
    }
});

function closeStandingsMenu() {
    const menu = document.querySelector(".standings-menu-overlay");

    if (!menu) return;

    menu.remove();
    document.body.classList.remove("standings-menu-open");
}

function openStandingsMenu() {
    closeStandingsMenu();

    const competitions = [
        "Besta deild karla",
        "Besta deild kvenna",
        "Lengjudeild karla",
        "Lengjudeild kvenna",
        "2. deild karla",
        "3. deild karla",
        "4. deild karla"
    ];

    const overlay = document.createElement("div");
    overlay.className = "standings-menu-overlay";

    overlay.innerHTML = `
        <section class="standings-menu-card">

            <div class="standings-menu-header">
                <div>
                    <div class="standings-label">
                        STÖÐUTÖFLUR
                    </div>

                    <h2>
                        Veldu deild
                    </h2>
                </div>

                <button
                    class="standings-menu-close"
                    type="button"
                    aria-label="Loka"
                >
                    ×
                </button>
            </div>

            <div class="standings-menu-list">
                ${competitions.map(competition => `
                    <button
                        class="standings-menu-item"
                        type="button"
                        data-competition="${competition}"
                    >
                        <span>${competition}</span>
                        <span aria-hidden="true">›</span>
                    </button>
                `).join("")}
            </div>

        </section>
    `;

    document.body.appendChild(overlay);
    document.body.classList.add("standings-menu-open");

    overlay
        .querySelector(".standings-menu-close")
        .addEventListener("click", closeStandingsMenu);

    overlay.addEventListener("click", event => {
        if (event.target === overlay) {
            closeStandingsMenu();
        }
    });

    overlay
        .querySelectorAll(".standings-menu-item")
        .forEach(button => {
            button.addEventListener("click", () => {
                const competition =
                    button.dataset.competition;

                closeStandingsMenu();

                openStandings(competition);
            });
        });
}
document.addEventListener("click", event => {
    const standingsButton =
        event.target.closest("#standings-main-button");

    if (!standingsButton) return;

    openStandingsMenu();
});