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

            return `
                <div class="standings-row ${isHighlighted ? "standings-row-highlight" : ""}">
                    <div class="standings-position">
                        ${team.position}
                    </div>

                    <div class="standings-team">
                        ${team.team}
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