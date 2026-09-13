const matchTitle =
    document.getElementById(
        "match-title"
    );


const matchMeta =
    document.getElementById(
        "match-meta"
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


const matchHeaderProfile =
    document.getElementById(
        "matchHeaderProfile"
    );



// =========================================
// DISTANCE TARGET
// =========================================

const MATCH_DISTANCE_TARGET_METERS =
    13000;



// =========================================
// GET MATCH ID
// =========================================

const params =
    new URLSearchParams(
        window.location.search
    );


const matchId =
    params.get(
        "id"
    );



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
        await supabaseClient
            .auth
            .getSession();


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


    // =========================================
    // PROFILE HEADER
    // =========================================

    await loadMatchPageProfile(
        session.user
    );


    // =========================================
    // MATCH
    // =========================================

    const {
        data,
        error
    } =
        await supabaseClient
            .from(
                "matches"
            )
            .select(
                "*"
            )
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
// PROFILE IMAGE
// =========================================

async function loadMatchPageProfile(
    user
) {

    if (
        !user
        ||
        !matchHeaderProfile
    ) {

        return;
    }


    let displayName =
        user.user_metadata
        &&
        user.user_metadata.name
            ? String(
                user.user_metadata.name
            ).trim()
            : "";


    let avatarUrl =
        "";


    const {
        data,
        error
    } =
        await supabaseClient
            .from(
                "profiles"
            )
            .select(
                "name, avatar_url"
            )
            .eq(
                "id",
                user.id
            )
            .maybeSingle();


    if (
        !error
        &&
        data
    ) {

        if (
            data.name
        ) {

            displayName =
                String(
                    data.name
                ).trim();
        }


        if (
            data.avatar_url
        ) {

            avatarUrl =
                String(
                    data.avatar_url
                );
        }

    } else if (
        error
    ) {

        console.error(
            "Profile load error on match page:",
            error
        );
    }


    const initials =
        getInitials(
            displayName
            ||
            user.email
            ||
            "LT"
        );


    matchHeaderProfile.textContent =
        initials;


    if (
        avatarUrl
    ) {

        matchHeaderProfile.textContent =
            "";


        matchHeaderProfile.style.backgroundImage =
            `url("${addAvatarCacheBust(
                avatarUrl
            )}")`;


        matchHeaderProfile.style.backgroundSize =
            "cover";


        matchHeaderProfile.style.backgroundPosition =
            "center";


        matchHeaderProfile.classList.add(
            "has-profile-image"
        );

    } else {

        matchHeaderProfile.style.backgroundImage =
            "";


        matchHeaderProfile.classList.remove(
            "has-profile-image"
        );
    }
}



// =========================================
// AVATAR CACHE BUST
// =========================================

function addAvatarCacheBust(
    url
) {

    if (!url) {

        return "";
    }


    const separator =
        url.includes(
            "?"
        )
            ? "&"
            : "?";


    return (
        url
        +
        separator
        +
        "v="
        +
        Date.now()
    );
}



// =========================================
// INITIALS
// =========================================

function getInitials(
    value
) {

    const text =
        String(
            value ?? ""
        )
            .trim();


    if (!text) {

        return "LT";
    }


    const parts =
        text
            .split(
                /\s+/
            )
            .filter(
                Boolean
            );


    if (
        parts.length ===
        1
    ) {

        return parts[0]
            .slice(
                0,
                2
            )
            .toUpperCase();
    }


    return (
        parts[0][0]
        +
        parts[
            parts.length - 1
        ][0]
    ).toUpperCase();
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

    if (
        matchTitle
    ) {

        matchTitle.textContent =
            "Leikur fannst ekki";
    }


    if (
        matchMeta
    ) {

        matchMeta.innerHTML = `
            <span>
                Ekki tókst að finna þennan leik.
            </span>
        `;
    }


    if (
        matchDetails
    ) {

        matchDetails.innerHTML = `
            <div class="match-officials-empty">
                Engar upplýsingar fundust.
            </div>
        `;
    }


    if (
        matchFitness
    ) {

        matchFitness.innerHTML =
            "";
    }


    if (
        matchGarminEmpty
    ) {

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

    if (
        matchTitle
    ) {

        matchTitle.textContent =
            `${match.homeTeam} – ${match.awayTeam}`;
    }


    if (
        !matchMeta
    ) {

        return;
    }


    const items =
        [];


    if (
        match.competition
    ) {

        items.push(
            createMetaItem(
                "competition",
                match.competition
            )
        );
    }


    if (
        match.date
    ) {

        items.push(
            createMetaItem(
                "date",
                formatDate(
                    match.date
                )
            )
        );
    }


    if (
        match.time
    ) {

        items.push(
            createMetaItem(
                "time",
                match.time
            )
        );
    }


    if (
        match.venue
    ) {

        items.push(
            createMetaItem(
                "venue",
                match.venue
            )
        );
    }


    if (
        match.totalElapsedSeconds > 0
    ) {

        items.push(
            createMetaItem(
                "playing-time",
                `Leiktími ${formatPlayingTime(
                    match.totalElapsedSeconds
                )}`
            )
        );
    }


    matchMeta.innerHTML =
        items.join("");
}



// =========================================
// MATCH META ITEM
// =========================================

function createMetaItem(
    type,
    text
) {

    return `
        <span class="match-meta-item">

            <span class="match-meta-icon">
                ${getMetaIcon(
                    type
                )}
            </span>

            <span>
                ${escapeHtml(
                    text
                )}
            </span>

        </span>
    `;
}



// =========================================
// MATCH META ICON
// =========================================

function getMetaIcon(
    type
) {

    if (
        type ===
        "date"
    ) {

        return `
            <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
            >
                <rect
                    x="3"
                    y="5"
                    width="18"
                    height="16"
                    rx="2"
                ></rect>

                <path
                    d="M16 3v4M8 3v4M3 10h18"
                ></path>
            </svg>
        `;
    }


    if (
        type ===
        "venue"
    ) {

        return `
            <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
            >
                <path
                    d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z"
                ></path>

                <circle
                    cx="12"
                    cy="10"
                    r="2.5"
                ></circle>
            </svg>
        `;
    }


    if (
        type ===
        "time"
        ||
        type ===
        "playing-time"
    ) {

        return `
            <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
            >
                <circle
                    cx="12"
                    cy="12"
                    r="9"
                ></circle>

                <path
                    d="M12 7v5l3 2"
                ></path>
            </svg>
        `;
    }


    return `
        <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
        >
            <path
                d="M8 4h8v4a4 4 0 0 1-8 0V4Z"
            ></path>

            <path
                d="M6 5H3v2a5 5 0 0 0 5 5M18 5h3v2a5 5 0 0 1-5 5M12 12v5M8 21h8M9 17h6"
            ></path>
        </svg>
    `;
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
        <div
            class="match-official-row ${
                isUser
                    ? "is-user"
                    : ""
            }"
        >

            <div class="match-official-name">

                ${escapeHtml(
                    name
                )}

                ${
                    isUser
                        ? `
                            <em>
                                ÞÚ
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


    const distanceProgress =
        getDistanceProgress(
            match.distanceTotalM
        );


    matchFitness.innerHTML = `

        <div class="match-fitness-hero">


            <div class="match-distance-gauge">


                <div
                    class="match-distance-gauge-arc"
                    style="--distance-progress: ${distanceProgress}deg;"
                ></div>


                <div class="match-distance-gauge-content">


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


                </div>


            </div>


            <div class="match-distance-scale">

                <span>
                    0 km
                </span>

                <span>
                    HERO
                </span>

            </div>


            <div class="match-fitness-overall-hr">


                ${createOverallStat(
                    displayStat(
                        match.hrAvgTotal
                    ),
                    "Meðalpúls"
                )}


                ${createOverallStat(
                    displayStat(
                        match.hrMaxTotal
                    ),
                    "Hámarkspúls"
                )}


            </div>


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
// DISTANCE PROGRESS
// =========================================

function getDistanceProgress(
    meters
) {

    const value =
        Math.max(
            0,
            Number(
                meters ?? 0
            )
        );


    const ratio =
        Math.min(
            1,
            value
            /
            MATCH_DISTANCE_TARGET_METERS
        );


    return (
        ratio
        *
        180
    ).toFixed(
        2
    );
}



// =========================================
// OVERALL STAT
// =========================================

function createOverallStat(
    value,
    label
) {

    return `
        <div class="match-overall-stat">

            <strong>
                ${value}
            </strong>

            <span>
                ${label}
            </span>

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


            <div class="match-fitness-half-heading">

                <span class="match-fitness-half-label">
                    ${label}
                </span>


                <div class="match-fitness-half-distance">

                    <strong>
                        ${km}
                    </strong>

                    <span>
                        km
                    </span>

                </div>


            </div>


            <div class="match-fitness-half-divider"></div>


            <div class="match-fitness-half-stats">


                ${createHalfStat(
                    "Meðalpúls",
                    displayStat(
                        avgHr
                    )
                )}


                ${createHalfStat(
                    "Hámark",
                    displayStat(
                        maxHr
                    )
                )}


            </div>


        </div>
    `;
}



// =========================================
// HALF STAT
// =========================================

function createHalfStat(
    label,
    value
) {

    return `
        <div class="match-fitness-half-stat">

            <strong>
                ${value}
            </strong>

            <span>
                ${label}
            </span>

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