"use strict";

// =====================================
// DOM ELEMENTS
// =====================================

const gamesContainer = document.querySelector("#games-container");


// =====================================
// HELPERS
// =====================================

function formatTime(dateString) {
  const date = new Date(dateString);

  return date.toLocaleTimeString("is-IS", {
    timeZone: "Atlantic/Reykjavik",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  });
}

function cleanCompetitionName(name) {
  return name
    .replace("Íslandsmót KSÍ - ", "")
    .replace(/\s2026$/, "");
}

function getTeamInitial(teamName) {
  return teamName?.trim().charAt(0).toUpperCase() || "?";
}


// =====================================
// CREATE MATCH CARD
// =====================================

function createOfficialRows(officials = []) {
  return officials
    .map(
      official => `
        <div class="official-row">
          <div class="official-role">
            ${official.role}
          </div>

          <div class="official-name">
            ${official.name}
          </div>
        </div>
      `
    )
    .join("");
}

function createGameCard(game) {
  const time = formatTime(game.date);
  const competition = cleanCompetitionName(game.competition);

  return `
    <section class="competition-group">

      <h2 class="league-title">
        ${competition}
      </h2>

      <article class="fixture-card">

        <div class="fixture-main">

          <div>
            <div class="fixture-time">
              ${time}
            </div>

            <div class="fixture-venue">
              ${game.facility || "Völlur óskráður"}
            </div>
          </div>

          <div class="teams">

            <div>
              <div class="team-logo">
                ${
                  game.homeLogo
                    ? `<img src="${game.homeLogo}" alt="${game.home} merki">`
                    : getTeamInitial(game.home)
                }
              </div>

              <div class="team-name">
                ${game.home}
              </div>
            </div>

            <div class="versus">
              VS
            </div>

            <div>
              <div class="team-logo">
                ${
                  game.awayLogo
                    ? `<img src="${game.awayLogo}" alt="${game.away} merki">`
                    : getTeamInitial(game.away)
                }
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

    </section>
  `;
}


// =====================================
// LOAD DATA
// =====================================

async function loadGames() {
  try {
    const response = await fetch("data/games.json?v=3");

    if (!response.ok) {
      throw new Error(`HTTP error: ${response.status}`);
    }

    const data = await response.json();

    if (!Array.isArray(data.games) || data.games.length === 0) {
      gamesContainer.innerHTML = `
        <p class="loading-message">
          Engir leikir fundust.
        </p>
      `;
      return;
    }

    gamesContainer.innerHTML = data.games
      .map(createGameCard)
      .join("");

  } catch (error) {
    console.error("Villa við að sækja leiki:", error);

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

loadGames();
