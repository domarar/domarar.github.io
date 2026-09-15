/* =========================================
   LEIKTÍMINN · ÍSLANDSFERÐ V2
   No stats calculation is changed.
   Enhances the existing HEILDARVEGALENGD hero.
========================================= */

(() => {
    "use strict";

    const RING_ROAD_KM = 1322;
    const STORAGE_KEY = "leiktiminn_iceland_journey_enabled";
    const DASHBOARD_ID = "statsDashboard";

    let observer = null;
    let scheduled = false;

    function parseKm(text) {
        const value = String(text || "")
            .trim()
            .replace(/\s/g, "")
            .replace(",", ".");

        const number = Number(value);
        return Number.isFinite(number) ? Math.max(0, number) : 0;
    }

    function formatKm(value) {
        return Number(value || 0).toLocaleString("is-IS", {
            minimumFractionDigits: value < 10 ? 2 : 0,
            maximumFractionDigits: value < 10 ? 2 : 1
        });
    }

    function isEnabled() {
        return localStorage.getItem(STORAGE_KEY) !== "0";
    }

    function setEnabled(card, button, enabled) {
        card.classList.toggle("is-iceland-off", !enabled);
        button.setAttribute("aria-pressed", enabled ? "true" : "false");
        localStorage.setItem(STORAGE_KEY, enabled ? "1" : "0");
    }

    function buildMap(totalKm) {
        const lapKm = totalKm % RING_ROAD_KM;
        const completedLaps = Math.floor(totalKm / RING_ROAD_KM);

        // Exactly 1322 km should show a completed first ring, not 0 km of ring two.
        const progressKm =
            totalKm > 0 && lapKm === 0
                ? RING_ROAD_KM
                : lapKm;

        const percent = Math.min(100, (progressKm / RING_ROAD_KM) * 100);

        const lapText =
            completedLaps > 0
                ? (
                    progressKm === RING_ROAD_KM
                        ? `Hringur ${completedLaps} lokið · 100%`
                        : `Hringur ${completedLaps + 1} · ${percent.toFixed(2)}%`
                )
                : `${percent.toFixed(2)}% af Hringveginum`;

        return {
            progressKm,
            lapText,
            html: `
                <div class="iceland-total-visual" aria-hidden="true">
                    <svg
                        class="iceland-total-map"
                        viewBox="0 0 1295 914"
                        preserveAspectRatio="xMidYMid meet"
                    >
                        <use
                            class="iceland-track"
                            href="assets/iceland-progress.svg#iceland-outline"
                        ></use>

                        <use
                            class="iceland-progress"
                            href="assets/iceland-progress.svg#iceland-outline"
                            style="stroke-dasharray:${progressKm} ${RING_ROAD_KM};"
                        ></use>
                    </svg>
                </div>
            `
        };
    }

    function enhanceHero() {
        scheduled = false;

        const dashboard = document.getElementById(DASHBOARD_ID);
        if (!dashboard) return;

        // Remove the old standalone version if it is still in the HTML.
        const oldStandalone = document.getElementById("icelandJourney");
        if (oldStandalone) {
            oldStandalone.remove();
        }

        const hero = dashboard.querySelector(".stats-dashboard-hero");
        if (!hero || hero.dataset.icelandEnhanced === "1") {
            return;
        }

        const total = hero.querySelector(".stats-dashboard-total");
        const label = hero.querySelector(".stats-dashboard-total-label");
        const strong = total ? total.querySelector("strong") : null;

        if (!total || !label || !strong) {
            return;
        }

        const totalKm = parseKm(strong.textContent);
        const map = buildMap(totalKm);

        hero.dataset.icelandEnhanced = "1";
        hero.classList.add("iceland-total-card");

        const center = document.createElement("div");
        center.className = "iceland-total-center";

        // Move the EXISTING total number + label, don't recreate them.
        center.appendChild(total);
        center.appendChild(label);

        const progressCopy = document.createElement("div");
        progressCopy.className = "iceland-total-progress-copy";
        progressCopy.textContent =
            `${formatKm(map.progressKm)} / ${RING_ROAD_KM.toLocaleString("is-IS")} km · ${map.lapText}`;

        center.appendChild(progressCopy);

        hero.insertAdjacentHTML("afterbegin", map.html);
        hero.appendChild(center);

        const toggleWrap = document.createElement("div");
        toggleWrap.className = "iceland-total-top";
        toggleWrap.innerHTML = `
            <button
                class="iceland-total-toggle"
                type="button"
                aria-pressed="true"
                aria-label="Birta eða fela Íslandsferð"
            >
                <span>Birta</span>
                <span class="iceland-total-toggle-track" aria-hidden="true"></span>
            </button>
        `;

        hero.appendChild(toggleWrap);

        const button = toggleWrap.querySelector(".iceland-total-toggle");
        setEnabled(hero, button, isEnabled());

        button.addEventListener("click", () => {
            const next =
                button.getAttribute("aria-pressed") !== "true";

            setEnabled(hero, button, next);
        });
    }

    function scheduleEnhance() {
        if (scheduled) return;
        scheduled = true;
        requestAnimationFrame(enhanceHero);
    }

    function init() {
        const dashboard = document.getElementById(DASHBOARD_ID);
        if (!dashboard) return;

        scheduleEnhance();

        observer = new MutationObserver(() => {
            scheduleEnhance();
        });

        observer.observe(dashboard, {
            childList: true,
            subtree: true
        });
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", init);
    } else {
        init();
    }
})();
