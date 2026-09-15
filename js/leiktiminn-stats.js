/* =========================================
   LEIKTÍMINN
   TÖLFRÆÐI
========================================= */


/*
    Dedicated Tölfræði module.

    Responsibilities:

    - Tímabil filter
    - Keppni filter
    - GPS filter
    - Custom date range
    - Filtered match count
    - Garmin statistics calculations
    - Tölfræði dashboard rendering

    Main Leiktíminn code remains responsible
    for loading and saving matches.
*/


const LeiktiminnStats = {

    periodFilter: null,
    competitionFilter: null,
    gpsFilter: null,

    customDateRange: null,
    dateFrom: null,
    dateTo: null,

    dashboard: null,


    /* =========================================
       INITIALISE
    ========================================= */

    initialize() {

        this.periodFilter =
            document.getElementById(
                "statsPeriodFilter"
            );


        this.competitionFilter =
            document.getElementById(
                "statsCompetitionFilter"
            );


        this.gpsFilter =
            document.getElementById(
                "statsGpsFilter"
            );


        this.customDateRange =
            document.getElementById(
                "statsCustomDateRange"
            );


        this.dateFrom =
            document.getElementById(
                "statsDateFrom"
            );


        this.dateTo =
            document.getElementById(
                "statsDateTo"
            );


        this.dashboard =
            document.getElementById(
                "statsDashboard"
            );


        this.bindEvents();


        console.log(
            "Leiktíminn Tölfræði loaded"
        );
    },



    /* =========================================
       EVENTS
    ========================================= */

    bindEvents() {

        this.periodFilter
            ?.addEventListener(
                "change",
                () => {

                    this.handlePeriodChange();
                }
            );


        this.competitionFilter
            ?.addEventListener(
                "change",
                () => {

                    this.render();
                }
            );


        this.gpsFilter
            ?.addEventListener(
                "change",
                () => {

                    this.render();
                }
            );


        this.dateFrom
            ?.addEventListener(
                "change",
                () => {

                    this.render();
                }
            );


        this.dateTo
            ?.addEventListener(
                "change",
                () => {

                    this.render();
                }
            );
    },



    /* =========================================
       PERIOD CHANGE
    ========================================= */

    handlePeriodChange() {

        const custom =
            this.periodFilter
                ?.value ===
                "custom";


        if (
            this.customDateRange
        ) {

            this.customDateRange.hidden =
                !custom;
        }


        this.render();
    },



    /* =========================================
       COMPETITION NORMALISATION
    ========================================= */

    normalizeCompetition(
        value
    ) {

        return String(
            value
            ||
            ""
        )
            .replace(
                /\s+/g,
                " "
            )
            .trim()
            .toLocaleUpperCase(
                "is-IS"
            );
    },



    /* =========================================
       COMPETITION OPTIONS
    ========================================= */

    refreshCompetitionOptions() {

        if (
            !this.competitionFilter
        ) {

            return;
        }


        const currentValue =
            this.competitionFilter.value
            ||
            "all";


        const competitionNames =
            [
                ...new Set(
                    matches
                        .filter(
                            match =>
                                isPlayedMatch(
                                    match
                                )
                        )
                        .map(
                            match =>
                                this.normalizeCompetition(
                                    match.competition
                                )
                        )
                        .filter(
                            Boolean
                        )
                )
            ]
                .sort(
                    (
                        a,
                        b
                    ) =>
                        a.localeCompare(
                            b,
                            "is"
                        )
                );


        this.competitionFilter.innerHTML =
            `
                <option value="all">
                    Allar keppnir
                </option>
            `
            +
            competitionNames
                .map(
                    competition => {

                        return `
                            <option
                                value="${this.escapeHtml(competition)}"
                            >
                                ${this.escapeHtml(competition)}
                            </option>
                        `;
                    }
                )
                .join("");


        if (
            currentValue ===
                "all"
            ||
            competitionNames.includes(
                currentValue
            )
        ) {

            this.competitionFilter.value =
                currentValue;

        } else {

            this.competitionFilter.value =
                "all";
        }
    },



    /* =========================================
       FILTERED MATCHES
    ========================================= */

    getFilteredMatches() {

        let filtered =
            matches.filter(
                match =>
                    isPlayedMatch(
                        match
                    )
            );


        filtered =
            this.applyDateFilter(
                filtered
            );


        filtered =
            this.applyCompetitionFilter(
                filtered
            );


        filtered =
            this.applyGpsFilter(
                filtered
            );


        return filtered;
    },



    /* =========================================
       DATE FILTER
    ========================================= */

    applyDateFilter(
        collection
    ) {

        const period =
            this.periodFilter
                ?.value
            ||
            "all";


        if (
            period ===
            "all"
        ) {

            return collection;
        }


        const now =
            new Date();


        let from =
            null;


        let to =
            new Date(
                now.getFullYear(),
                now.getMonth(),
                now.getDate(),
                23,
                59,
                59,
                999
            );


        /* THIS YEAR */

        if (
            period ===
            "year"
        ) {

            from =
                new Date(
                    now.getFullYear(),
                    0,
                    1,
                    0,
                    0,
                    0,
                    0
                );
        }


        /* LAST 6 MONTHS */

        if (
            period ===
            "6months"
        ) {

            from =
                new Date(
                    now
                );


            from.setMonth(
                from.getMonth() - 6
            );


            from.setHours(
                0,
                0,
                0,
                0
            );
        }


        /* LAST 30 DAYS */

        if (
            period ===
            "30days"
        ) {

            from =
                new Date(
                    now
                );


            from.setDate(
                from.getDate() - 30
            );


            from.setHours(
                0,
                0,
                0,
                0
            );
        }


        /* CUSTOM */

        if (
            period ===
            "custom"
        ) {

            const fromValue =
                this.dateFrom
                    ?.value
                ||
                "";


            const toValue =
                this.dateTo
                    ?.value
                ||
                "";


            from =
                fromValue
                    ? new Date(
                        `${fromValue}T00:00:00`
                    )
                    : null;


            to =
                toValue
                    ? new Date(
                        `${toValue}T23:59:59`
                    )
                    : null;
        }


        return collection.filter(
            match => {

                const matchDate =
                    getMatchDate(
                        match
                    );


                if (
                    from
                    &&
                    matchDate <
                        from
                ) {

                    return false;
                }


                if (
                    to
                    &&
                    matchDate >
                        to
                ) {

                    return false;
                }


                return true;
            }
        );
    },



    /* =========================================
       COMPETITION FILTER
    ========================================= */

    applyCompetitionFilter(
        collection
    ) {

        const selected =
            this.competitionFilter
                ?.value
            ||
            "all";


        if (
            selected ===
            "all"
        ) {

            return collection;
        }


        return collection.filter(
            match => {

                return (
                    this.normalizeCompetition(
                        match.competition
                    )
                    ===
                    selected
                );
            }
        );
    },



    /* =========================================
       GPS FILTER
    ========================================= */

    applyGpsFilter(
        collection
    ) {

        const selected =
            this.gpsFilter
                ?.value
            ||
            "all";


        if (
            selected ===
            "all"
        ) {

            return collection;
        }


        if (
            selected ===
            "with"
        ) {

            return collection.filter(
                match =>
                    this.hasGpsData(
                        match
                    )
            );
        }


        if (
            selected ===
            "without"
        ) {

            return collection.filter(
                match =>
                    !this.hasGpsData(
                        match
                    )
            );
        }


        return collection;
    },



    /* =========================================
       GPS CHECK
    ========================================= */

    hasGpsData(
        match
    ) {

        return (
            Number(
                match.distanceTotalM
                ??
                0
            )
            >
            0
        );
    },



    /* =========================================
       FITNESS DATA CHECK
    ========================================= */

    hasFitnessData(
        match
    ) {

        return (
            Number(
                match.distanceTotalM
                ??
                0
            )
            >
            0
            ||
            Number(
                match.hrAvgTotal
                ??
                0
            )
            >
            0
        );
    },



    /* =========================================
       RENDER
    ========================================= */

    render() {

        if (
            !this.dashboard
        ) {

            this.dashboard =
                document.getElementById(
                    "statsDashboard"
                );
        }


        if (
            !this.dashboard
        ) {

            return;
        }


        this.refreshCompetitionOptions();


        const played =
            this.getFilteredMatches();


        const fitnessMatches =
            played.filter(
                match =>
                    this.hasFitnessData(
                        match
                    )
            );


        /* =========================================
           NO MATCHES AT ALL
        ========================================= */

        if (
            played.length ===
            0
        ) {

            this.dashboard.innerHTML = `

                <div class="stats-dashboard-header">

                    <div>

                        <p class="panel-eyebrow">
                            GARMIN
                        </p>

                        <h3>
                            Frammistaða
                        </h3>

                    </div>


                    <span class="stats-garmin-count">
                        0 leikir
                    </span>

                </div>


                <div class="stats-dashboard-empty">

                    <strong>
                        Engir leikir fundust
                    </strong>

                    <span>
                        Engir spilaðir leikir passa við valdar síur.
                    </span>

                </div>
            `;


            return;
        }



        /* =========================================
           MATCHES BUT NO GARMIN DATA
        ========================================= */

        if (
            fitnessMatches.length ===
            0
        ) {

            this.dashboard.innerHTML = `

                <div class="stats-dashboard-header">

                    <div>

                        <p class="panel-eyebrow">
                            GARMIN
                        </p>

                        <h3>
                            Frammistaða
                        </h3>

                    </div>


                    <span class="stats-garmin-count">
                        ${this.formatMatchCount(played.length)}
                    </span>

                </div>


                <div class="stats-dashboard-empty">

                    <strong>
                        Engin Garmin gögn
                    </strong>

                    <span>
                        ${played.length === 1
                            ? "Leikurinn sem þú valdir hefur engin GPS- eða púls gögn."
                            : "Leikirnir sem þú valdir hafa engin GPS- eða púls gögn."
                        }
                    </span>

                </div>
            `;


            return;
        }



        /* =========================================
           DISTANCE
        ========================================= */

        const distanceMatches =
            fitnessMatches.filter(
                match =>
                    Number(
                        match.distanceTotalM
                        ??
                        0
                    )
                    >
                    0
            );


        const totalDistanceMeters =
            distanceMatches.reduce(
                (
                    total,
                    match
                ) => {

                    return (
                        total
                        +
                        Number(
                            match.distanceTotalM
                            ??
                            0
                        )
                    );
                },
                0
            );


        const averageDistanceMeters =
            distanceMatches.length >
                0
                ? (
                    totalDistanceMeters
                    /
                    distanceMatches.length
                )
                : 0;



        /* =========================================
           LONGEST MATCH
        ========================================= */

        const longestMatch =
            distanceMatches.length >
                0
                ? distanceMatches.reduce(
                    (
                        longest,
                        match
                    ) => {

                        return (
                            Number(
                                match.distanceTotalM
                                ??
                                0
                            )
                            >
                            Number(
                                longest.distanceTotalM
                                ??
                                0
                            )
                                ? match
                                : longest
                        );
                    }
                )
                : null;



        /* =========================================
           HEART RATE
        ========================================= */

        const hrMatches =
            fitnessMatches.filter(
                match =>
                    Number(
                        match.hrAvgTotal
                        ??
                        0
                    )
                    >
                    0
            );


        const averageHeartRate =
            hrMatches.length >
                0
                ? Math.round(
                    hrMatches.reduce(
                        (
                            total,
                            match
                        ) => {

                            return (
                                total
                                +
                                Number(
                                    match.hrAvgTotal
                                    ??
                                    0
                                )
                            );
                        },
                        0
                    )
                    /
                    hrMatches.length
                )
                : 0;



        const highestAverageHrMatch =
            hrMatches.length >
                0
                ? hrMatches.reduce(
                    (
                        highest,
                        match
                    ) => {

                        return (
                            Number(
                                match.hrAvgTotal
                                ??
                                0
                            )
                            >
                            Number(
                                highest.hrAvgTotal
                                ??
                                0
                            )
                                ? match
                                : highest
                        );
                    }
                )
                : null;



        /* =========================================
           FIRST / SECOND HALF DISTANCE
        ========================================= */

        const firstHalfDistanceTotal =
            distanceMatches.reduce(
                (
                    total,
                    match
                ) => {

                    return (
                        total
                        +
                        Number(
                            match.distanceFirstHalfM
                            ??
                            0
                        )
                    );
                },
                0
            );


        const secondHalfDistanceTotal =
            distanceMatches.reduce(
                (
                    total,
                    match
                ) => {

                    return (
                        total
                        +
                        Number(
                            match.distanceSecondHalfM
                            ??
                            0
                        )
                    );
                },
                0
            );


        const averageFirstHalfDistance =
            distanceMatches.length >
                0
                ? (
                    firstHalfDistanceTotal
                    /
                    distanceMatches.length
                )
                : 0;


        const averageSecondHalfDistance =
            distanceMatches.length >
                0
                ? (
                    secondHalfDistanceTotal
                    /
                    distanceMatches.length
                )
                : 0;


        const halfDistanceTotal =
            averageFirstHalfDistance
            +
            averageSecondHalfDistance;


        const firstHalfPercent =
            halfDistanceTotal >
                0
                ? Math.round(
                    (
                        averageFirstHalfDistance
                        /
                        halfDistanceTotal
                    )
                    *
                    100
                )
                : 50;


        const secondHalfPercent =
            halfDistanceTotal >
                0
                ? (
                    100
                    -
                    firstHalfPercent
                )
                : 50;



        /* =========================================
           TOP DISTANCE MATCHES
        ========================================= */

        const topDistanceMatches =
            [
                ...distanceMatches
            ]
                .sort(
                    (
                        a,
                        b
                    ) => {

                        return (
                            Number(
                                b.distanceTotalM
                                ??
                                0
                            )
                            -
                            Number(
                                a.distanceTotalM
                                ??
                                0
                            )
                        );
                    }
                )
                .slice(
                    0,
                    3
                );



        const topMatchesHtml =
            topDistanceMatches
                .map(
                    (
                        match,
                        index
                    ) => {

                        const title =
                            `${match.homeTeam} – ${match.awayTeam}`;


                        const metaParts =
                            [];


                        if (
                            match.competition
                        ) {

                            metaParts.push(
                                match.competition
                            );
                        }


                        if (
                            match.date
                        ) {

                            metaParts.push(
                                this.formatDate(
                                    match.date
                                )
                            );
                        }


                        return `

                            <a
                                class="stats-leaderboard-row"
                                href="leiktiminn-match.html?id=${encodeURIComponent(match.id)}&from=played"
                            >

                                <span class="stats-leaderboard-rank">
                                    ${index + 1}
                                </span>


                                <span class="stats-leaderboard-match">

                                    <strong>
                                        ${this.escapeHtml(title)}
                                    </strong>

                                    <small>
                                        ${this.escapeHtml(metaParts.join(" · "))}
                                    </small>

                                </span>


                                <span class="stats-leaderboard-distance">

                                    <strong>
                                        ${this.formatKm(match.distanceTotalM)}
                                    </strong>

                                    <small>
                                        km
                                    </small>

                                </span>

                            </a>
                        `;
                    }
                )
                .join("");



        /* =========================================
           RECORD TITLES
        ========================================= */

        const longestMatchTitle =
            longestMatch
                ? (
                    `${longestMatch.homeTeam} – ${longestMatch.awayTeam}`
                )
                : "–";


        const highestHrMatchTitle =
            highestAverageHrMatch
                ? (
                    `${highestAverageHrMatch.homeTeam} – ${highestAverageHrMatch.awayTeam}`
                )
                : "–";



        /* =========================================
           DASHBOARD HTML
        ========================================= */

        this.dashboard.innerHTML = `

            <div class="stats-dashboard-header">

                <div>

                    <p class="panel-eyebrow">
                        GARMIN
                    </p>

                    <h3>
                        Frammistaða
                    </h3>

                </div>


                <span class="stats-garmin-count">
                    ${this.formatMatchCount(played.length)}
                </span>

            </div>



            <div class="stats-dashboard-hero">

                <div class="stats-dashboard-total">

                    <strong>
                        ${this.formatKm(totalDistanceMeters)}
                    </strong>

                    <span>
                        km
                    </span>

                </div>


                <div class="stats-dashboard-total-label">
                    HEILDARVEGALENGD
                </div>

            </div>



            <div class="stats-record-grid">


                <article class="stats-record-card">

                    <span class="stats-record-icon">
                        ◎
                    </span>


                    <div>

                        <span class="stats-record-label">
                            Lengsti leikur
                        </span>


                        <div class="stats-record-value">

                            <strong>
                                ${
                                    longestMatch
                                        ? this.formatKm(
                                            longestMatch.distanceTotalM
                                        )
                                        : "–"
                                }
                            </strong>

                            <span>
                                km
                            </span>

                        </div>


                        <small>
                            ${this.escapeHtml(longestMatchTitle)}
                        </small>

                    </div>

                </article>



                <article class="stats-record-card">

                    <span class="stats-record-icon">
                        ♡
                    </span>


                    <div>

                        <span class="stats-record-label">
                            Hæsti meðalpúls
                        </span>


                        <div class="stats-record-value">

                            <strong>
                                ${
                                    highestAverageHrMatch
                                        ? Math.round(
                                            highestAverageHrMatch.hrAvgTotal
                                        )
                                        : "–"
                                }
                            </strong>

                            <span>
                                bpm
                            </span>

                        </div>


                        <small>
                            ${this.escapeHtml(highestHrMatchTitle)}
                        </small>

                    </div>

                </article>


            </div>



            <section class="stats-average-card">

                <h4>
                    MEÐALTAL
                </h4>


                <div class="stats-average-grid">


                    <div class="stats-average-item">

                        <strong>
                            ${this.formatKm(averageDistanceMeters)}
                        </strong>

                        <span class="stats-average-unit">
                            km/leik
                        </span>

                        <small>
                            Meðalvegalengd
                        </small>

                    </div>



                    <div class="stats-average-item">

                        <strong>
                            ${
                                averageHeartRate >
                                    0
                                    ? averageHeartRate
                                    : "–"
                            }
                        </strong>

                        <span class="stats-average-unit">
                            bpm
                        </span>

                        <small>
                            Meðalpúls
                        </small>

                    </div>



                    <div class="stats-average-item">

                        <strong>
                            ${distanceMatches.length}
                        </strong>

                        <small>
                            Garmin leikir
                        </small>

                    </div>


                </div>

            </section>



            <section class="stats-half-dashboard">


                <div class="stats-half-dashboard-item">

                    <div class="stats-half-dashboard-heading">

                        <span>
                            1H
                        </span>

                        <strong>
                            ${this.formatKm(averageFirstHalfDistance)}
                            <small>
                                km
                            </small>
                        </strong>

                    </div>


                    <div class="stats-half-progress">

                        <span
                            style="width:${firstHalfPercent}%"
                        ></span>

                    </div>


                    <small>
                        ${firstHalfPercent}%
                    </small>

                </div>



                <div class="stats-half-dashboard-item">

                    <div class="stats-half-dashboard-heading">

                        <span>
                            2H
                        </span>

                        <strong>
                            ${this.formatKm(averageSecondHalfDistance)}
                            <small>
                                km
                            </small>
                        </strong>

                    </div>


                    <div class="stats-half-progress">

                        <span
                            style="width:${secondHalfPercent}%"
                        ></span>

                    </div>


                    <small>
                        ${secondHalfPercent}%
                    </small>

                </div>


            </section>



            <section class="stats-leaderboard">

                <div class="stats-leaderboard-heading">

                    <span>
                        ◇
                    </span>


                    <div>

                        <strong>
                            TOPP LEIKIR
                        </strong>

                        <small>
                            eftir vegalengd
                        </small>

                    </div>

                </div>


                <div class="stats-leaderboard-list">
                    ${topMatchesHtml}
                </div>

            </section>
        `;
    },



    /* =========================================
       FORMAT MATCH COUNT
    ========================================= */

    formatMatchCount(
        count
    ) {

        return (
            count ===
            1
                ? "1 leikur"
                : `${count} leikir`
        );
    },



    /* =========================================
       FORMAT KM
    ========================================= */

    formatKm(
        meters
    ) {

        const value =
            Number(
                meters
                ??
                0
            );


        if (
            !Number.isFinite(
                value
            )
        ) {

            return "0.00";
        }


        return (
            value
            /
            1000
        ).toFixed(
            2
        );
    },



    /* =========================================
       FORMAT DATE
    ========================================= */

    formatDate(
        value
    ) {

        if (
            !value
        ) {

            return "";
        }


        const date =
            new Date(
                `${value}T00:00:00`
            );


        if (
            Number.isNaN(
                date.getTime()
            )
        ) {

            return "";
        }


        return date.toLocaleDateString(
            "is-IS",
            {
                day:
                    "numeric",

                month:
                    "short",

                year:
                    "numeric"
            }
        );
    },



    /* =========================================
       ESCAPE HTML
    ========================================= */

    escapeHtml(
        value
    ) {

        return String(
            value
            ??
            ""
        )
            .replace(
                /&/g,
                "&amp;"
            )
            .replace(
                /</g,
                "&lt;"
            )
            .replace(
                />/g,
                "&gt;"
            )
            .replace(
                /"/g,
                "&quot;"
            )
            .replace(
                /'/g,
                "&#039;"
            );
    }

};



/* =========================================
   INITIALISE
========================================= */

LeiktiminnStats.initialize();



/* =========================================
   TAKE OVER MAIN STATS RENDERER
========================================= */

/*
    leiktiminn.js already calls updateStats()
    whenever match data changes.

    We replace that renderer here so the main
    file does not need more Tölfræði code.
*/

updateStats =
    function () {

        LeiktiminnStats.render();
    };



/* =========================================
   INITIAL RENDER
========================================= */

/*
    If match data has already arrived before
    this module initialises, render it now.

    Otherwise leiktiminn.js will call
    updateStats() when loading finishes.
*/

if (
    typeof matches !==
        "undefined"
) {

    LeiktiminnStats.render();
}