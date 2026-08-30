const state = { data: null, year: null, league: null, role: "referees", openName: null };
const V1_YEARS = ["2026", "2025", "2024"];
const els = {
  years: document.getElementById("statsYearSelect"),
  league: document.getElementById("statsLeagueSelect"),
  roles: document.getElementById("statsRoleTabs"),
  title: document.getElementById("statsRankingTitle"),
  coverage: document.getElementById("statsCoverage"),
  ranking: document.getElementById("statsRanking"),
};

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>'"]/g, char => ({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;",'"':"&quot;"}[char]));
}

function initials(name) {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map(part => part[0]).join("").toUpperCase();
}

function refereePhoto(name) {
  if (typeof refereeProfiles === "undefined") return "";

  const matchedName = Object.keys(refereeProfiles).find(
    profileName =>
      profileName.toLowerCase() === name.toLowerCase()
  );

  return matchedName
    ? refereeProfiles[matchedName]?.image || ""
    : "";
}

function refereeAvatar(person) {
  const image = refereePhoto(person.name);

  if (!image) {
    return `
      <span class="stats-avatar">
        ${escapeHtml(initials(person.name))}
      </span>
    `;
  }

  return `
    <span class="stats-avatar stats-avatar-has-photo">
      <img
        class="stats-avatar-image"
        src="${escapeHtml(image)}"
        alt="${escapeHtml(person.name)}"
        loading="lazy"
      >
    </span>
  `;
}

function currentLeague() {
  return (state.data?.seasons?.[state.year] || []).find(item => item.name === state.league);
}

function buildTopTen(league) {
  const combined = new Map();

  ["referees", "assistants", "fourthOfficials"]
    .forEach(role => {
      (league[role] || []).forEach(person => {
        const key = person.personId
          ? `id:${person.personId}`
          : `name:${person.name.toLowerCase()}`;

        const existing = combined.get(key) || {
  name: person.name,
  personId: person.personId || null,
  appearances: 0,
  roleCounts: {
    referees: 0,
    assistants: 0,
    fourthOfficials: 0
  }
};

const appearances = Number(person.appearances || 0);

existing.appearances += appearances;
existing.roleCounts[role] += appearances;

combined.set(key, existing);
      });
    });

  return [...combined.values()]
    .sort((a, b) =>
      b.appearances - a.appearances ||
      a.name.localeCompare(b.name, "is")
    )
    .slice(0, 10);
}

function formatNumber(value) {
  return Number(value).toLocaleString("is-IS", { minimumFractionDigits: value < 1 ? 2 : 1, maximumFractionDigits: 2 });
}

function metricLabel(metric) {
  return { yellow: "Gul spjöld / leik", red: "Rauð spjöld / leik", penalty: "Víti / leik" }[metric];
}

function differenceText(value, average) {
  const difference = Number((value - average).toFixed(2));
  if (difference === 0) return "sama og meðaltal";
  return `${formatNumber(Math.abs(difference))} ${difference < 0 ? "undir" : "yfir"} meðaltali`;
}

function detailHtml(person, league) {
  if (!person.reportedGames) return "";
  const metrics = ["yellow", "red", "penalty"];
  return `
    <div class="stats-detail">
      <div class="stats-detail-head">
        <h4>TÖLFRÆÐI SEM DÓMARI</h4>
        <div class="stats-legend"><span><i></i>Dómari</span><span><i></i>Meðaltal deildar</span></div>
      </div>
      ${metrics.map(metric => {
        const value = person.averages[metric];
        const average = league.leagueAverages[metric];
        const scale = Math.max(value || 0, average || 0, 0.01);
        return `<div class="stats-metric">
          <div class="stats-metric-title">${metricLabel(metric)}</div>
          <div class="stats-metric-values">
            <div class="stats-metric-value"><strong>${formatNumber(value)}</strong><div class="stats-mini-bar"><i style="width:${(value / scale) * 100}%"></i></div></div>
            <div class="stats-metric-value is-league"><strong>${formatNumber(average)}</strong><div class="stats-mini-bar"><i style="width:${(average / scale) * 100}%"></i></div></div>
            <div class="stats-difference">${differenceText(value, average)}</div>
          </div>
        </div>`;
      }).join("")}
    </div>`;
}

function renderYears() {
    const years = V1_YEARS.filter(
        year => state.data.seasons[year]
    );

    els.years.innerHTML = years
        .map(year => `
            <option
                value="${year}"
                ${year === state.year ? "selected" : ""}
            >
                ${year}
            </option>
        `)
        .join("");
}

function renderLeagues() {
  const leagues = state.data.seasons[state.year] || [];
  els.league.innerHTML = leagues.map(item => `<option value="${escapeHtml(item.name)}" ${item.name === state.league ? "selected" : ""}>${escapeHtml(item.name)}</option>`).join("");
}

function renderRanking() {
  const league = currentLeague();
  if (!league) return;
 const isReferee = state.role === "referees";
const people = state.role === "topTen"
  ? buildTopTen(league)
  : league[state.role] || [];
const maximum = people[0]?.appearances || 1;

const roleLabel = {
  referees: "Dómari",
  assistants: "AD",
  fourthOfficials: "Fjórði",
  topTen: "TOPP 10"
}[state.role];

els.title.innerHTML =
  `${escapeHtml(league.name)} <span>· ${roleLabel}</span>`;

const coverage = league.reportCoverage;

els.coverage.textContent = isReferee && coverage.available
  ? `Leikskýrslur: ${coverage.available} af ${coverage.total}${coverage.complete ? "" : " · Meðaltöl byggja aðeins á tiltækum skýrslum"}`
  : isReferee
    ? "Spjalda- og vítatölfræði er ekki tiltæk fyrir þetta tímabil."
    : state.role === "assistants"
      ? "Aðstoðardómari 1 og 2 teljast saman."
      : state.role === "fourthOfficials"
        ? "Fjórða dómarahlutverkið er talið sérstaklega."
        : "Öll hlutverk lögð saman · 10 leikjahæstu dómararnir.";
  if (!people.length) {
    els.ranking.innerHTML = '<p class="stats-empty">Engar upplýsingar fundust.</p>';
    return;
  }
  els.ranking.innerHTML = people.map((person, index) => {
    const canOpen = isReferee && person.reportedGames > 0;
    const isOpen = canOpen && state.openName === person.name;
    const tag = canOpen ? "button" : "div";
    return `<article class="stats-row ${isOpen ? "is-open" : ""}">
      <${tag} class="stats-row-button" ${canOpen ? `type="button" data-name="${escapeHtml(person.name)}" aria-expanded="${isOpen}"` : ""}>
        <span class="stats-rank">${index + 1}</span>
       ${refereeAvatar(person)}
        <span class="stats-name-block">
  <span class="stats-name">
    ${escapeHtml(person.name)}
  </span>

  ${state.role === "topTen" ? `
    <span class="stats-role-breakdown">
      Dómari ${person.roleCounts.referees}
      · AD ${person.roleCounts.assistants}
      · Fjórði ${person.roleCounts.fourthOfficials}
    </span>
  ` : ""}
</span>
        <span class="stats-appearance-bar"><i style="width:${(person.appearances / maximum) * 100}%"></i></span>
        <span class="stats-games"><strong>${person.appearances}</strong> leikir</span>
        ${canOpen ? '<span class="stats-chevron">⌄</span>' : '<span></span>'}
      </${tag}>
      ${isOpen ? detailHtml(person, league) : ""}
    </article>`;
  }).join("");
}

function selectYear(year) {
  state.year = year;
  state.league = state.data.seasons[year]?.[0]?.name || null;
  state.openName = null;
  renderYears(); renderLeagues(); renderRanking();
}

function setupMenu() {
  const button = document.getElementById("menuButton");
  const overlay = document.getElementById("menuOverlay");
  const close = document.getElementById("menuClose");
  const setOpen = open => { overlay.classList.toggle("open", open); button.setAttribute("aria-expanded", String(open)); document.body.classList.toggle("modal-open", open); };
  button.addEventListener("click", () => setOpen(true));
  close.addEventListener("click", () => setOpen(false));
  overlay.addEventListener("click", event => { if (event.target === overlay) setOpen(false); });
  document.addEventListener("keydown", event => { if (event.key === "Escape") setOpen(false); });
}

async function start() {
  setupMenu();
  try {
    const response = await fetch("data/referee-stats.json", { cache: "no-store" });
    if (!response.ok) throw new Error("Could not load statistics");
    state.data = await response.json();
    const years = V1_YEARS.filter(year => state.data.seasons[year]);
    selectYear(years.includes("2026") ? "2026" : years[0]);
  } catch (error) {
    console.error(error);
    els.ranking.innerHTML = '<p class="stats-empty">Ekki tókst að sækja tölfræði.</p>';
  }
}

els.years.addEventListener("change", () => {
    selectYear(els.years.value);
});
els.league.addEventListener("change", () => { state.league = els.league.value; state.openName = null; renderRanking(); });
els.roles.addEventListener("click", event => {
  const button = event.target.closest("[data-role]"); if (!button) return;
  state.role = button.dataset.role; state.openName = null;
  els.roles.querySelectorAll("button").forEach(item => item.classList.toggle("is-active", item === button));
  renderRanking();
});
els.ranking.addEventListener("click", event => {
  const button = event.target.closest("button[data-name]"); if (!button) return;
  state.openName = state.openName === button.dataset.name ? null : button.dataset.name;
  renderRanking();
});

start();
(() => {
    const isStandalone =
        window.matchMedia("(display-mode: standalone)").matches ||
        window.navigator.standalone === true;

    if (!isStandalone) return;

    document.addEventListener("click", event => {
        const link = event.target.closest("a[href]");

        if (
            !link ||
            link.hasAttribute("download") ||
            (link.target && link.target !== "_self")
        ) {
            return;
        }

        const url = new URL(
            link.getAttribute("href"),
            window.location.href
        );

        if (
            url.origin !== window.location.origin ||
            !["http:", "https:"].includes(url.protocol)
        ) {
            return;
        }

        event.preventDefault();
        window.location.assign(url.href);
    });
})();