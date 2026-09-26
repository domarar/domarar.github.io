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


const matchBackLink =
    document.getElementById(
        "matchBackLink"
    );


const matchBackText =
    document.getElementById(
        "matchBackText"
    );


const matchEditButton =
    document.getElementById(
        "matchEditButton"
    );


const matchNavUpcoming =
    document.getElementById(
        "matchNavUpcoming"
    );


const matchNavPlayed =
    document.getElementById(
        "matchNavPlayed"
    );


const matchNotesToggle =
    document.getElementById(
        "matchNotesToggle"
    );


const matchNotesContent =
    document.getElementById(
        "matchNotesContent"
    );


const matchNotesInput =
    document.getElementById(
        "matchNotesInput"
    );


const matchNotesSave =
    document.getElementById(
        "matchNotesSave"
    );


const matchNotesStatus =
    document.getElementById(
        "matchNotesStatus"
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


const requestedSourceView =
    params.get(
        "from"
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

    if (isPlayedMatch(match)) {
    window.LeiktiminnNotifications.setUser(session.user.id);
    window.LeiktiminnNotifications.markSeen(match.id);
}


    renderMatch(
        match
    );


    configureMatchNavigation(
        match
    );
}



// =========================================
// MATCH PAGE CONTEXT
// =========================================

function configureMatchNavigation(
    match
) {

    const played =
        isPlayedMatch(
            match
        );


    // =========================================
    // PAGE CONTEXT
    //
    // A completed match is ALWAYS treated as
    // played, regardless of the URL it came from.
    // =========================================

    const sourceView =
        played
            ? "played"
            : (
                requestedSourceView ===
                    "upcoming"
                ||
                requestedSourceView ===
                    "played"
                    ? requestedSourceView
                    : "upcoming"
            );


    const isUpcoming =
        sourceView ===
        "upcoming";


    // =========================================
    // BACK LINK
    // =========================================

    if (
        matchBackLink
    ) {

        matchBackLink.href =
            isUpcoming
                ? "leiktiminn.html?view=upcoming"
                : "leiktiminn.html?view=played";
    }


    if (
        matchBackText
    ) {

        matchBackText.textContent =
            isUpcoming
                ? "Til baka í leiki"
                : "Til baka í spilaða leiki";
    }


    // =========================================
    // MOBILE NAV
    // =========================================

    matchNavUpcoming
        ?.classList
        .toggle(
            "active",
            isUpcoming
        );


    matchNavPlayed
        ?.classList
        .toggle(
            "active",
            !isUpcoming
        );


    // =========================================
    // EDIT BUTTON
    // =========================================

    if (
        matchEditButton
    ) {

        if (
            played
        ) {

            matchEditButton.hidden =
                true;

            matchEditButton.onclick =
                null;


            return;
        }


        matchEditButton.hidden =
            false;


        matchEditButton.onclick =
            () => {

                window.location.href =
                    `leiktiminn.html?view=upcoming&edit=${encodeURIComponent(
                        match.id
                    )}`;
            };
    }
}



// =========================================
// PLAYED MATCH
// =========================================

function isPlayedMatch(
    match
) {

    if (
        match.status ===
            "COMPLETED"
        ||
        match.status ===
            "ACTIVITY_RECEIVED"
    ) {

        return true;
    }


    if (
        !match.date
        ||
        !match.time
    ) {

        return false;
    }


    const matchDate =
        new Date(
            `${match.date}T${match.time}`
        );


    if (
        Number.isNaN(
            matchDate.getTime()
        )
    ) {

        return false;
    }


    return (
        matchDate <
        new Date()
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

        matchNotes:
            row.match_notes || "",

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
        // HEART RATE ZONES
        // =========================================

        hrZoneSource:
            row.hr_zone_source || "",

        hrZone1Min:
            Number(
                row.hr_zone_1_min ?? 0
            ),

        hrZone1Max:
            Number(
                row.hr_zone_1_max ?? 0
            ),

        hrZone2Max:
            Number(
                row.hr_zone_2_max ?? 0
            ),

        hrZone3Max:
            Number(
                row.hr_zone_3_max ?? 0
            ),

        hrZone4Max:
            Number(
                row.hr_zone_4_max ?? 0
            ),

        hrZone5Max:
            Number(
                row.hr_zone_5_max ?? 0
            ),

        hrZone1Seconds:
            Number(
                row.hr_zone_1_seconds ?? 0
            ),

        hrZone2Seconds:
            Number(
                row.hr_zone_2_seconds ?? 0
            ),

        hrZone3Seconds:
            Number(
                row.hr_zone_3_seconds ?? 0
            ),

        hrZone4Seconds:
            Number(
                row.hr_zone_4_seconds ?? 0
            ),

        hrZone5Seconds:
            Number(
                row.hr_zone_5_seconds ?? 0
            ),


        // =========================================
        // DISTANCE / SPEED
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
            ),

        avgSpeedMps:
            Number(
                row.avg_speed_mps ?? 0
            ),

        maxSpeedMps:
            Number(
                row.max_speed_mps ?? 0
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


    initializeMatchNotes(
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
// MATCH NOTES
// =========================================

function initializeMatchNotes(
    match
) {

    if (
        !matchNotesToggle
        ||
        !matchNotesContent
        ||
        !matchNotesInput
        ||
        !matchNotesSave
    ) {

        return;
    }


    matchNotesInput.value =
        match.matchNotes || "";


    matchNotesContent.hidden =
        true;


    matchNotesToggle.setAttribute(
        "aria-expanded",
        "false"
    );


    matchNotesToggle.onclick =
        () => {

            const isOpen =
                !matchNotesContent.hidden;


            matchNotesContent.hidden =
                isOpen;


            matchNotesToggle.setAttribute(
                "aria-expanded",
                isOpen
                    ? "false"
                    : "true"
            );
        };


    matchNotesSave.onclick =
        async () => {

            const notes =
                matchNotesInput.value;


            matchNotesSave.disabled =
                true;


            if (
                matchNotesStatus
            ) {

                matchNotesStatus.textContent =
                    "Vista...";
            }


            const {
                error
            } =
                await supabaseClient
                    .from(
                        "matches"
                    )
                    .update({
                        match_notes:
                            notes
                    })
                    .eq(
                        "id",
                        match.id
                    );


            matchNotesSave.disabled =
                false;


            if (
                error
            ) {

                console.error(
                    "Villa við að vista punkta:",
                    error
                );


                if (
                    matchNotesStatus
                ) {

                    matchNotesStatus.textContent =
                        "Ekki tókst að vista";
                }


                return;
            }


            match.matchNotes =
                notes;


            if (
                matchNotesStatus
            ) {

                matchNotesStatus.textContent =
                    "Vistað";


                window.setTimeout(
                    () => {

                        matchNotesStatus.textContent =
                            "";

                    },
                    1800
                );
            }
        };
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


    const hasZoneData =
        match.hrZoneSource ===
            "GARMIN"
        &&
        match.hrZone1Min > 0
        &&
        match.hrZone5Max > 0;


    const hasFitnessData =
        match.distanceTotalM > 0
        ||
        match.hrAvgTotal > 0
        ||
        match.hrMaxTotal > 0
        ||
        hasZoneData;


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


    const avgPace =
        formatAveragePaceFromSpeed(
            match.avgSpeedMps
        );


    const maxSpeed =
        formatSpeedKmh(
            match.maxSpeedMps
        );


    const distanceProgress =
        getDistanceProgress(
            match.distanceTotalM
        );


    const zonePercentBase =
        Math.max(
            0,
            Number(
                match.totalElapsedSeconds ?? 0
            )
        );


    const zonesHtml =
        hasZoneData
            ? createHeartRateZonesHtml(
                match,
                zonePercentBase
            )
            : `
                <div class="match-zone-empty">

                    <strong>
                        Engin svæðagreining tiltæk
                    </strong>

                    <span>
                        Garmin púlssvæði þurfa að vera tiltæk til að sýna þessa greiningu.
                    </span>

                </div>
            `;


    matchFitness.innerHTML = `

        <!-- =========================================
             HLAUPATÖLUR
        ========================================== -->

        <section
            class="match-performance-section"
            data-performance-section
        >

            <button
                class="match-performance-heading"
                type="button"
                aria-expanded="true"
            >

                <span class="match-performance-heading-left">

                    <span
                        class="match-km-icon"
                        aria-hidden="true"
                    >
                        KM
                    </span>

                    <strong>
                        HLAUPATÖLUR
                    </strong>

                </span>

                <span
                    class="match-performance-toggle"
                    aria-hidden="true"
                >
                    <span class="match-performance-toggle-knob"></span>
                </span>

            </button>


            <div class="match-performance-content">

                <div class="match-running-hero">

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

                </div>


                <div class="match-running-splits">

                    ${createRunningDoubleStatHtml(
                        "1H",
                        firstHalfKm,
                        "km",
                        "2H",
                        secondHalfKm,
                        "km"
                    )}

                    ${createRunningDoubleStatHtml(
                        "AVG PACE",
                        avgPace,
                        "min/km",
                        "MAX SPEED",
                        maxSpeed,
                        "km/h"
                    )}

                </div>

            </div>

        </section>



        <!-- =========================================
             HJARTSLÁTTUR
        ========================================== -->

        <section
            class="match-performance-section"
            data-performance-section
        >

            <button
                class="match-performance-heading"
                type="button"
                aria-expanded="true"
            >

                <span class="match-performance-heading-left">

                    <span
                        class="match-heart-icon"
                        aria-hidden="true"
                    >
                        ♥
                    </span>

                    <strong>
                        HJARTSLÁTTUR
                    </strong>

                </span>

                <span
                    class="match-performance-toggle"
                    aria-hidden="true"
                >
                    <span class="match-performance-toggle-knob"></span>
                </span>

            </button>


            <div class="match-performance-content">

                <div class="match-heart-hero">

                    <div class="match-heart-main">

                        <strong>
                            ${displayStat(
                                match.hrAvgTotal
                            )}
                        </strong>

                        <span>
                            bpm
                        </span>

                        <small>
                            Meðalhjartsláttur
                        </small>

                    </div>


                    <div class="match-heart-max">

                        <span>
                            Hámark
                        </span>

                        <strong>
                            ${displayStat(
                                match.hrMaxTotal
                            )}

                            <small>
                                bpm
                            </small>
                        </strong>

                    </div>

                </div>


                <div class="match-heart-splits">

                    ${createHeartRateSplitHtml(
                        "1H",
                        match.hrAvgFirstHalf,
                        match.hrMaxFirstHalf
                    )}

                    ${createHeartRateSplitHtml(
                        "2H",
                        match.hrAvgSecondHalf,
                        match.hrMaxSecondHalf
                    )}

                </div>

            </div>

        </section>



        <!-- =========================================
             HJARTSLÁTTUR - ZONE
        ========================================== -->

        <section
            class="match-performance-section"
            data-performance-section
        >

            <button
                class="match-performance-heading"
                type="button"
                aria-expanded="true"
            >

                <span class="match-performance-heading-left">

                    <span
                        class="match-zone-icon"
                        aria-hidden="true"
                    >
                        Z
                    </span>

                    <strong>
                        HJARTSLÁTTUR - ZONE
                    </strong>

                </span>

                <span
                    class="match-performance-toggle"
                    aria-hidden="true"
                >
                    <span class="match-performance-toggle-knob"></span>
                </span>

            </button>


            <div class="match-performance-content">

                <div class="match-zone-list">

                    ${zonesHtml}

                </div>

            </div>

        </section>

    `;


    initializePerformanceSections();
}



// =========================================
// PERFORMANCE SECTIONS
// =========================================

function initializePerformanceSections() {

    document
        .querySelectorAll(
            "[data-performance-section]"
        )
        .forEach(
            section => {

                const button =
                    section.querySelector(
                        ".match-performance-heading"
                    );


                if (
                    !button
                ) {

                    return;
                }


                button.addEventListener(
                    "click",
                    () => {

                        const collapsed =
                            section.classList
                                .toggle(
                                    "is-collapsed"
                                );


                        button.setAttribute(
                            "aria-expanded",
                            collapsed
                                ? "false"
                                : "true"
                        );
                    }
                );
            }
        );
}



// =========================================
// RUNNING DOUBLE STAT
// =========================================

function createRunningDoubleStatHtml(
    labelOne,
    valueOne,
    unitOne,
    labelTwo,
    valueTwo,
    unitTwo
) {

    return `
        <div class="match-running-split match-running-double">

            <div class="match-running-double-stat">

                <span>
                    ${labelOne}
                </span>

                <strong>
                    ${valueOne}
                </strong>

                <small>
                    ${unitOne}
                </small>

            </div>


            <div class="match-running-double-stat">

                <span>
                    ${labelTwo}
                </span>

                <strong>
                    ${valueTwo}
                </strong>

                <small>
                    ${unitTwo}
                </small>

            </div>

        </div>
    `;
}



// =========================================
// HEART RATE SPLIT
// =========================================

function createHeartRateSplitHtml(
    label,
    avgHeartRate,
    maxHeartRate
) {

    return `
        <div class="match-heart-split">

            <span>
                ${label}
            </span>

            <div class="match-heart-split-stats">

                <div class="match-heart-split-stat">

                    <strong>
                        ${displayStat(
                            avgHeartRate
                        )}

                        <small>
                            bpm
                        </small>
                    </strong>

                    <em>
                        Meðaltal
                    </em>

                </div>

                <div class="match-heart-split-stat">

                    <strong>
                        ${displayStat(
                            maxHeartRate
                        )}

                        <small>
                            bpm
                        </small>
                    </strong>

                    <em>
                        Hámark
                    </em>

                </div>

            </div>

        </div>
    `;
}



// =========================================
// HEART RATE ZONES
// =========================================

function createHeartRateZonesHtml(
    match,
    percentBase
) {

    const zones = [

        {
            label:
                "Z1",

            min:
                match.hrZone1Min,

            max:
                match.hrZone1Max,

            seconds:
                match.hrZone1Seconds
        },

        {
            label:
                "Z2",

            min:
                match.hrZone1Max + 1,

            max:
                match.hrZone2Max,

            seconds:
                match.hrZone2Seconds
        },

        {
            label:
                "Z3",

            min:
                match.hrZone2Max + 1,

            max:
                match.hrZone3Max,

            seconds:
                match.hrZone3Seconds
        },

        {
            label:
                "Z4",

            min:
                match.hrZone3Max + 1,

            max:
                match.hrZone4Max,

            seconds:
                match.hrZone4Seconds
        },

        {
            label:
                "Z5",

            min:
                match.hrZone4Max + 1,

            max:
                match.hrZone5Max,

            seconds:
                match.hrZone5Seconds
        }

    ];


    return zones
        .map(
            zone => {

                const seconds =
                    Math.max(
                        0,
                        Number(
                            zone.seconds ?? 0
                        )
                    );


                const percent =
                    percentBase > 0
                        ? Math.min(
                            100,
                            Math.round(
                                (
                                    seconds
                                    /
                                    percentBase
                                )
                                *
                                100
                            )
                        )
                        : 0;


                return `
                    <div class="match-zone-row">

                        <div class="match-zone-label">
                            ${zone.label}
                        </div>


                        <div class="match-zone-info">

                            <div class="match-zone-topline">

                                <span>
                                    ${zone.min}–${zone.max} bpm
                                </span>

                                <strong>
                                    ${formatZoneTime(
                                        seconds
                                    )}
                                </strong>

                                <em>
                                    ${percent}%
                                </em>

                            </div>


                            <div class="match-zone-track">

                                <span
                                    style="width: ${percent}%"
                                ></span>

                            </div>

                        </div>

                    </div>
                `;
            }
        )
        .join("");
}



// =========================================
// ZONE TIME
// =========================================

function formatZoneTime(
    totalSeconds
) {

    const seconds =
        Math.max(
            0,
            Math.round(
                Number(
                    totalSeconds ?? 0
                )
            )
        );


    const minutes =
        Math.floor(
            seconds / 60
        );


    const remainder =
        seconds % 60;


    return (
        minutes
        +
        ":"
        +
        String(
            remainder
        ).padStart(
            2,
            "0"
        )
    );
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
// AVERAGE PACE
// Garmin speed m/s -> min/km
// =========================================

function formatAveragePaceFromSpeed(
    speedMps
) {

    const speed =
        Number(
            speedMps ?? 0
        );


    if (
        !Number.isFinite(
            speed
        )
        ||
        speed <= 0
    ) {

        return "–";
    }


    const secondsPerKm =
        1000
        /
        speed;


    const minutes =
        Math.floor(
            secondsPerKm / 60
        );


    const seconds =
        Math.round(
            secondsPerKm % 60
        );


    const safeSeconds =
        seconds === 60
            ? 0
            : seconds;


    const safeMinutes =
        seconds === 60
            ? minutes + 1
            : minutes;


    return (
        safeMinutes
        +
        ":"
        +
        String(
            safeSeconds
        ).padStart(
            2,
            "0"
        )
    );
}



// =========================================
// MAX SPEED
// Garmin m/s -> km/h
// =========================================

function formatSpeedKmh(
    speedMps
) {

    const speed =
        Number(
            speedMps ?? 0
        );


    if (
        !Number.isFinite(
            speed
        )
        ||
        speed <= 0
    ) {

        return "–";
    }


    return (
        speed
        *
        3.6
    ).toFixed(
        1
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