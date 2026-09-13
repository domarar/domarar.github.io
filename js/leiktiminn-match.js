const matchTitle =
    document.getElementById(
        "match-title"
    );


const matchSubtitle =
    document.getElementById(
        "match-subtitle"
    );


const matchDetails =
    document.getElementById(
        "match-details"
    );


const matchFitness =
    document.getElementById(
        "match-fitness"
    );


const matchGarminEmpty =
    document.getElementById(
        "match-garmin-empty"
    );


// =========================================
// GET MATCH ID
// =========================================

const params =
    new URLSearchParams(
        window.location.search
    );


const matchId =
    params.get("id");


// =========================================
// START
// =========================================

initializeMatchPage();


// =========================================
// INITIALIZE
// =========================================

async function initializeMatchPage() {

    if (!matchId) {

        showMatchNotFound();

        return;
    }


    const {
        data: { session },
        error: sessionError
    } =
        await supabaseClient.auth.getSession();


    if (sessionError) {

        console.error(
            "Villa við innskráningu:",
            sessionError
        );

        showMatchNotFound();

        return;
    }


    if (!session) {

        window.location.href =
            "leiktiminn.html";

        return;
    }


    const {
        data,
        error
    } =
        await supabaseClient
            .from("matches")
            .select("*")
            .eq(
                "id",
                matchId
            )
            .maybeSingle();


    if (error) {

        console.error(
            "Villa við að sækja leik:",
            error
        );

        showMatchNotFound();

        return;
    }


    if (!data) {

        showMatchNotFound();

        return;
    }


    const match =
        mapDatabaseMatch(
            data
        );


    renderMatch(
        match
    );
}


// =========================================
// MAP DATABASE MATCH
// =========================================

function mapDatabaseMatch(
    row
) {

    return {

        id:
            row.id,

        competition:
            row.competition || "",

        homeTeam:
            row.home_team || "",

        awayTeam:
            row.away_team || "",

        date:
            row.match_date || "",

        time:
            String(
                row.kickoff_time || ""
            ).slice(
                0,
                5
            ),

        venue:
            row.venue || "",

        userRole:
            row.user_role || "",

        officials: {

            referee:
                row.referee_name || "",

            ad1:
                row.ad1_name || "",

            ad2:
                row.ad2_name || "",

            fourth:
                row.fourth_name || ""

        },

        matchLength:
            Number(
                row.match_length ?? 90
            ),

        extraTime:
            Number(
                row.extra_time ?? 0
            ),

        status:
            row.status || "UPCOMING",

        garminSyncStatus:
            row.garmin_sync_status || "NOT_SENT",

        garminSyncedAt:
            row.garmin_synced_at || null,

        garminActivityId:
            row.garmin_activity_id || null,

        completedAt:
            row.completed_at || null,

        totalElapsedSeconds:
            Number(
                row.total_elapsed_seconds ?? 0
            ),


        // =========================================
        // HEART RATE
        // =========================================

        hrAvgTotal:
            Number(
                row.hr_avg_total ?? 0
            ),

        hrMaxTotal:
            Number(
                row.hr_max_total ?? 0
            ),

        hrAvgFirstHalf:
            Number(
                row.hr_avg_first_half ?? 0
            ),

        hrMaxFirstHalf:
            Number(
                row.hr_max_first_half ?? 0
            ),

        hrAvgSecondHalf:
            Number(
                row.hr_avg_second_half ?? 0
            ),

        hrMaxSecondHalf:
            Number(
                row.hr_max_second_half ?? 0
            ),


        // =========================================
        // DISTANCE
        // =========================================

        distanceTotalM:
            Number(
                row.distance_total_m ?? 0
            ),

        distanceFirstHalfM:
            Number(
                row.distance_first_half_m ?? 0
            ),

        distanceSecondHalfM:
            Number(
                row.distance_second_half_m ?? 0
            )

    };
}


// =========================================
// NOT FOUND
// =========================================

function showMatchNotFound() {

    if (matchTitle) {

        matchTitle.textContent =
            "Leikur fannst ekki";
    }


    if (matchSubtitle) {

        matchSubtitle.textContent =
            "Ekki tókst að finna þennan leik.";
    }


    if (matchDetails) {

        matchDetails.innerHTML = `
            <div class="match-officials-empty">
                Engar upplýsingar fundust.
            </div>
        `;
    }


    if (matchFitness) {

        matchFitness.innerHTML =
            "";
    }


    if (matchGarminEmpty) {

        matchGarminEmpty.hidden =
            false;
    }
}


// =========================================
// RENDER
// =========================================

function renderMatch(
    match
) {

    renderMatchIntro(
        match
    );

    renderOfficials(
        match
    );

    renderFitness(
        match
    );
}


// =========================================
// MATCH INTRO
// =========================================

function renderMatchIntro(
    match
) {

    if (matchTitle) {

        matchTitle.textContent =
            `${match.homeTeam} – ${match.awayTeam}`;
    }


    const subtitleParts = [
        match.competition,
        formatDate(
            match.date
        ),
        match.time
    ]
        .filter(
            Boolean
        );


    if (
        match.venue
    ) {

        subtitleParts.push(
            match.venue
        );
    }


    // =========================================
    // ACTUAL PLAYING TIME
    // =========================================

    if (
        match.totalElapsedSeconds > 0
    ) {

        subtitleParts.push(
            `Leiktími ${formatPlayingTime(
                match.totalElapsedSeconds
            )}`
        );
    }


    if (
        matchSubtitle
    ) {

        matchSubtitle.textContent =
            subtitleParts.join(
                " · "
            );
    }
}


// =========================================
// OFFICIALS
// =========================================

function renderOfficials(
    match
) {

    if (
        !matchDetails
    ) {

        return;
    }


    const officials =
        match.officials || {};


    const officialsHtml = [

        createOfficialRow(
            officials.referee,
            "Dómari",
            match.userRole ===
                "Dómari"
        ),

        createOfficialRow(
            officials.ad1,
            "AD1",
            match.userRole ===
                "AD1"
        ),

        createOfficialRow(
            officials.ad2,
            "AD2",
            match.userRole ===
                "AD2"
        ),

        createOfficialRow(
            officials.fourth,
            "Fjórði",
            match.userRole ===
                "Fjórði"
        )

    ]
        .filter(
            Boolean
        )
        .join("");


    if (
        !officialsHtml
    ) {

        matchDetails.innerHTML = `
            <div class="match-officials-empty">
                Ekkert dómarateymi skráð.
            </div>
        `;

        return;
    }


    matchDetails.innerHTML = `
        <div class="match-officials-list">

            ${officialsHtml}

        </div>
    `;
}


// =========================================
// FITNESS
// =========================================

function renderFitness(
    match
) {

    if (
        !matchFitness
        ||
        !matchGarminEmpty
    ) {

        return;
    }


    const hasFitnessData =
        match.distanceTotalM > 0
        ||
        match.hrAvgTotal > 0
        ||
        match.hrMaxTotal > 0;


    if (
        !hasFitnessData
    ) {

        matchFitness.innerHTML =
            "";

        matchGarminEmpty.hidden =
            false;

        return;
    }


    matchGarminEmpty.hidden =
        true;


    const totalKm =
        formatKm(
            match.distanceTotalM
        );


    const firstHalfKm =
        formatKm(
            match.distanceFirstHalfM
        );


    const secondHalfKm =
        formatKm(
            match.distanceSecondHalfM
        );


    matchFitness.innerHTML = `

        <div class="match-fitness-hero">

            <div class="match-fitness-total">

                <span class="match-fitness-total-number">
                    ${totalKm}
                </span>

                <span class="match-fitness-total-unit">
                    km
                </span>

            </div>


            <div class="match-fitness-total-label">
                Heildarvegalengd
            </div>


            ${
                match.hrAvgTotal > 0
                ||
                match.hrMaxTotal > 0
                    ? `
                        <div class="match-fitness-overall-hr">

                            <span>

                                <strong>
                                    ${displayStat(
                                        match.hrAvgTotal
                                    )}
                                </strong>

                                <small>
                                    meðalpúls
                                </small>

                            </span>


                            <span class="match-fitness-overall-divider">
                                ·
                            </span>


                            <span>

                                <strong>
                                    ${displayStat(
                                        match.hrMaxTotal
                                    )}
                                </strong>

                                <small>
                                    hámark
                                </small>

                            </span>

                        </div>
                    `
                    : ""
            }

        </div>


        <div class="match-fitness-splits">

            ${createHalfFitnessHtml(
                "1H",
                firstHalfKm,
                match.hrAvgFirstHalf,
                match.hrMaxFirstHalf
            )}


            ${createHalfFitnessHtml(
                "2H",
                secondHalfKm,
                match.hrAvgSecondHalf,
                match.hrMaxSecondHalf
            )}

        </div>

    `;
}


// =========================================
// HALF FITNESS
// =========================================

function createHalfFitnessHtml(
    label,
    km,
    avgHr,
    maxHr
) {

    return `
        <div class="match-fitness-half">

            <div class="match-fitness-half-label">
                ${label}
            </div>


            <div class="match-fitness-half-distance">

                <strong>
                    ${km}
                </strong>

                <span>
                    km
                </span>

            </div>


            <div class="match-fitness-half-stats">

                <div class="match-fitness-half-stat">

                    <span>
                        Meðalpúls
                    </span>

                    <strong>
                        ${displayStat(
                            avgHr
                        )}
                    </strong>

                </div>


                <div class="match-fitness-half-stat">

                    <span>
                        Hámark
                    </span>

                    <strong>
                        ${displayStat(
                            maxHr
                        )}
                    </strong>

                </div>

            </div>

        </div>
    `;
}


// =========================================
// DISPLAY STAT
// =========================================

function displayStat(
    value
) {

    const number =
        Number(
            value ?? 0
        );


    if (
        !Number.isFinite(
            number
        )
        ||
        number <= 0
    ) {

        return "–";
    }


    return String(
        Math.round(
            number
        )
    );
}


// =========================================
// KM
// =========================================

function formatKm(
    meters
) {

    const value =
        Number(
            meters ?? 0
        );


    if (
        !Number.isFinite(
            value
        )
        ||
        value < 0
    ) {

        return "0.00";
    }


    return (
        value / 1000
    )
        .toFixed(
            2
        );
}


// =========================================
// PLAYING TIME
// =========================================

function formatPlayingTime(
    totalSeconds
) {

    const value =
        Math.max(
            0,
            Math.floor(
                Number(
                    totalSeconds ?? 0
                )
            )
        );


    const minutes =
        Math.floor(
            value / 60
        );


    const seconds =
        value % 60;


    const secondsText =
        seconds < 10
            ? `0${seconds}`
            : String(
                seconds
            );


    return `${minutes}:${secondsText}`;
}


// =========================================
// OFFICIAL ROW
// =========================================

function createOfficialRow(
    name,
    role,
    isUser
) {

    if (
        !name
    ) {

        return "";
    }


    return `
        <div class="match-official-row">

            <div class="match-official-name">

                ${escapeHtml(
                    name
                )}

                ${
                    isUser
                        ? `
                            <em>
                                Þú
                            </em>
                        `
                        : ""
                }

            </div>


            <div class="match-official-role">

                ${escapeHtml(
                    role
                )}

            </div>

        </div>
    `;
}


// =========================================
// DATE
// =========================================

function formatDate(
    value
) {

    if (
        !value
    ) {

        return "";
    }


    const parts =
        value.split(
            "-"
        );


    if (
        parts.length !== 3
    ) {

        return value;
    }


    return (
        parts[2]
        +
        "."
        +
        parts[1]
        +
        "."
        +
        parts[0]
    );
}


// =========================================
// HTML SAFETY
// =========================================

function escapeHtml(
    value
) {

    return String(
        value ?? ""
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