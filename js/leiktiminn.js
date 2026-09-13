/* =========================================
   LEIKTÍMINN
   SUPABASE MATCH DATA
========================================= */


const form =
    document.getElementById(
        "create-match-form"
    );


const matchesList =
    document.getElementById(
        "matches-list"
    );


const playedMatchesList =
    document.getElementById(
        "played-matches-list"
    );


const upcomingCount =
    document.getElementById(
        "upcoming-count"
    );


const totalCount =
    document.getElementById(
        "total-count"
    );


const createMatchModal =
    document.getElementById(
        "createMatchModal"
    );


const createMatchTitle =
    document.getElementById(
        "createMatchTitle"
    );


const saveMatchButton =
    document.getElementById(
        "saveMatchButton"
    );


const openCreateMatchDesktop =
    document.getElementById(
        "openCreateMatchDesktop"
    );


const openCreateMatchMobile =
    document.getElementById(
        "openCreateMatchMobile"
    );


const mobileCreateMenu =
    document.getElementById(
        "mobileCreateMenu"
    );


const mobileCreateMatchAction =
    document.getElementById(
        "mobileCreateMatchAction"
    );



let matches = [];

let editingMatchId = null;

let loadingMatches = false;

let hasLoadedMatches = false;

let lastMatchesRefreshAt = 0;

const MATCH_REFRESH_COOLDOWN_MS = 10000;
const PULL_REFRESH_THRESHOLD = 70;

let pullRefreshStartY = null;
let pullRefreshDistance = 0;
let pullRefreshActive = false;
let pullRefreshRunning = false;
let pullRefreshIndicator = null;



/* =========================================
   INITIALISE
========================================= */

async function initializeLeiktiminn() {

    const session =
        await getCurrentSession();


    if (!session) {

        matches = [];

        renderAll();

        return;
    }


    await loadMatchesFromSupabase({
        showLoading: true,
        force: true
    });
}


initializeLeiktiminn();



/* =========================================
   AUTH SESSION
========================================= */

async function getCurrentSession() {

    try {

        const {
            data,
            error
        } =
            await supabaseClient
                .auth
                .getSession();


        if (error) {

            console.error(
                "Villa við innskráningu:",
                error
            );

            return null;
        }


        return data.session;

    } catch (error) {

        console.error(
            "Villa við að sækja session:",
            error
        );

        return null;
    }
}



/* =========================================
   LOAD MATCHES FROM SUPABASE
========================================= */

async function loadMatchesFromSupabase(
    options = {}
) {

    const showLoading =
        options.showLoading === true;

    const force =
        options.force === true;


    if (loadingMatches) {

        return false;
    }


    if (
        !force
        &&
        hasLoadedMatches
        &&
        Date.now() - lastMatchesRefreshAt <
            MATCH_REFRESH_COOLDOWN_MS
    ) {

        return false;
    }


    loadingMatches = true;


    try {

        const session =
            await getCurrentSession();


        if (!session) {

            matches = [];

            hasLoadedMatches =
                false;

            renderAll();

            return false;
        }


        if (
            showLoading
            &&
            !hasLoadedMatches
        ) {

            showMatchesLoading();
        }


        const {
            data,
            error
        } =
            await supabaseClient
                .from("matches")
                .select("*")
                .order(
                    "match_date",
                    {
                        ascending: true
                    }
                )
                .order(
                    "kickoff_time",
                    {
                        ascending: true
                    }
                );


        if (error) {

            console.error(
                "Villa við að sækja leiki:",
                error
            );


            if (!hasLoadedMatches) {

                showMatchesLoadError();
            }


            return false;
        }


        matches =
            (data || [])
                .map(
                    mapDatabaseMatch
                );


        hasLoadedMatches =
            true;


        lastMatchesRefreshAt =
            Date.now();


        renderAll();


        return true;

    } catch (error) {

        console.error(
            "Villa við að sækja leiki:",
            error
        );


        if (!hasLoadedMatches) {

            showMatchesLoadError();
        }


        return false;

    } finally {

        loadingMatches =
            false;
    }
}


/* =========================================
   DATABASE -> UI MATCH
========================================= */

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
            row.garmin_sync_status ||
            "NOT_SENT",

        garminSyncedAt:
            row.garmin_synced_at ||
            null,

        garminActivityId:
            row.garmin_activity_id ||
            null,

        completedAt:
            row.completed_at ||
            null,

        totalElapsedSeconds:
            Number(
                row.total_elapsed_seconds ?? 0
            ),

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

        createdAt:
            row.created_at ||
            null,

        updatedAt:
            row.updated_at ||
            null
    };
}



/* =========================================
   UI DATA -> DATABASE
========================================= */

function createDatabasePayload(
    data
) {

    return {

        competition:
            data.competition,

        home_team:
            data.homeTeam,

        away_team:
            data.awayTeam,

        match_date:
            data.date,

        kickoff_time:
            data.time,

        venue:
            data.venue ||
            null,

        user_role:
            data.userRole ||
            null,

        referee_name:
            data.refereeName ||
            null,

        ad1_name:
            data.ad1Name ||
            null,

        ad2_name:
            data.ad2Name ||
            null,

        fourth_name:
            data.fourthName ||
            null,

        match_length:
            data.matchLength,

        extra_time:
            data.extraTime
    };
}



/* =========================================
   CREATE MODAL
========================================= */

function openCreateModal() {

    editingMatchId = null;


    resetCreateForm();


    if (createMatchTitle) {

        createMatchTitle.textContent =
            "Búa til leik";
    }


    if (saveMatchButton) {

        saveMatchButton.textContent =
            "Vista leik";
    }


    showMatchModal();
}



/* =========================================
   EDIT MODAL
========================================= */

function openEditModal(
    matchId
) {

    const match =
        matches.find(
            item =>
                item.id ===
                matchId
        );


    if (!match) {
        return;
    }


    editingMatchId =
        matchId;


    setValue(
        "competition",
        match.competition
    );


    setValue(
        "home-team",
        match.homeTeam
    );


    setValue(
        "away-team",
        match.awayTeam
    );


    setValue(
        "match-date",
        match.date
    );


    setValue(
        "match-time",
        match.time
    );


    setValue(
        "venue",
        match.venue
    );


    setValue(
        "user-role",
        match.userRole
    );


    setValue(
        "referee-name",
        match.officials
            ?.referee
    );


    setValue(
        "ad1-name",
        match.officials
            ?.ad1
    );


    setValue(
        "ad2-name",
        match.officials
            ?.ad2
    );


    setValue(
        "fourth-name",
        match.officials
            ?.fourth
    );


    setValue(
        "match-length",
        match.matchLength ??
        90
    );


    setValue(
        "extra-time",
        match.extraTime ??
        0
    );


    if (createMatchTitle) {

        createMatchTitle.textContent =
            "Breyta leik";
    }


    if (saveMatchButton) {

        saveMatchButton.textContent =
            "Vista breytingar";
    }


    showMatchModal();
}



/* =========================================
   SHOW MODAL
========================================= */

function showMatchModal() {

    if (!createMatchModal) {
        return;
    }


    closeMobileCreateMenu();


    createMatchModal.classList.add(
        "open"
    );


    createMatchModal.setAttribute(
        "aria-hidden",
        "false"
    );


    document.body.classList.add(
        "modal-open"
    );
}



/* =========================================
   CLOSE MODAL
========================================= */

function closeCreateModal(
    resetForm = false
) {

    if (!createMatchModal) {
        return;
    }


    createMatchModal.classList.remove(
        "open"
    );


    createMatchModal.setAttribute(
        "aria-hidden",
        "true"
    );


    document.body.classList.remove(
        "modal-open"
    );


    editingMatchId = null;


    if (resetForm) {

        resetCreateForm();
    }
}



/* =========================================
   DESKTOP CREATE
========================================= */

openCreateMatchDesktop
    ?.addEventListener(
        "click",
        openCreateModal
    );



/* =========================================
   MOBILE PLUS
========================================= */

openCreateMatchMobile
    ?.addEventListener(
        "click",
        event => {

            event.stopPropagation();

            toggleMobileCreateMenu();
        }
    );



/* =========================================
   MOBILE CREATE ACTION
========================================= */

mobileCreateMatchAction
    ?.addEventListener(
        "click",
        event => {

            event.stopPropagation();

            openCreateModal();
        }
    );



/* =========================================
   CLOSE MODAL BUTTONS
========================================= */

document
    .querySelectorAll(
        "[data-close-create-modal]"
    )
    .forEach(
        button => {

            button.addEventListener(
                "click",
                () => {

                    closeCreateModal(
                        true
                    );
                }
            );
        }
    );



/* =========================================
   ESCAPE
========================================= */

document.addEventListener(
    "keydown",
    event => {

        if (
            event.key !==
            "Escape"
        ) {

            return;
        }


        closeMobileCreateMenu();


        if (
            createMatchModal
                ?.classList
                .contains(
                    "open"
                )
        ) {

            closeCreateModal(
                false
            );
        }
    }
);



/* =========================================
   MOBILE CREATE MENU
========================================= */

function toggleMobileCreateMenu() {

    if (!mobileCreateMenu) {
        return;
    }


    if (
        mobileCreateMenu.hidden
    ) {

        openMobileCreateMenu();

    } else {

        closeMobileCreateMenu();
    }
}


function openMobileCreateMenu() {

    if (!mobileCreateMenu) {
        return;
    }


    mobileCreateMenu.hidden =
        false;


    mobileCreateMenu.classList.add(
        "open"
    );


    openCreateMatchMobile
        ?.setAttribute(
            "aria-expanded",
            "true"
        );
}


function closeMobileCreateMenu() {

    if (!mobileCreateMenu) {
        return;
    }


    mobileCreateMenu.classList.remove(
        "open"
    );


    mobileCreateMenu.hidden =
        true;


    openCreateMatchMobile
        ?.setAttribute(
            "aria-expanded",
            "false"
        );
}


document.addEventListener(
    "click",
    event => {

        if (
            !event.target.closest(
                ".mobile-create-menu"
            )
            &&
            !event.target.closest(
                "#openCreateMatchMobile"
            )
        ) {

            closeMobileCreateMenu();
        }
    }
);



/* =========================================
   FORM SUBMIT
========================================= */

if (form) {

    form.addEventListener(
        "submit",
        async event => {

            event.preventDefault();


            const competition =
                getValue(
                    "competition"
                );


            const homeTeam =
                getValue(
                    "home-team"
                );


            const awayTeam =
                getValue(
                    "away-team"
                );


            const date =
                getValue(
                    "match-date"
                );


            const time =
                getValue(
                    "match-time"
                );


            const venue =
                getValue(
                    "venue"
                );


            const userRole =
                getValue(
                    "user-role"
                );


            const refereeName =
                getValue(
                    "referee-name"
                );


            const ad1Name =
                getValue(
                    "ad1-name"
                );


            const ad2Name =
                getValue(
                    "ad2-name"
                );


            const fourthName =
                getValue(
                    "fourth-name"
                );


            const matchLength =
                Number(
                    getValue(
                        "match-length"
                    )
                    ||
                    90
                );


            const extraTime =
                Number(
                    getValue(
                        "extra-time"
                    )
                    ||
                    0
                );


            if (
                !competition ||
                !homeTeam ||
                !awayTeam ||
                !date ||
                !time
            ) {

                return;
            }


            const data = {

                competition,
                homeTeam,
                awayTeam,
                date,
                time,
                venue,
                userRole,
                refereeName,
                ad1Name,
                ad2Name,
                fourthName,
                matchLength,
                extraTime
            };


            setSaveButtonBusy(
                true
            );


            try {

                if (
                    editingMatchId
                ) {

                    await updateExistingMatch(
                        data
                    );

                } else {

                    await createNewMatch(
                        data
                    );
                }

            } finally {

                setSaveButtonBusy(
                    false
                );
            }
        }
    );
}



/* =========================================
   CREATE NEW MATCH
========================================= */

async function createNewMatch(
    data
) {

    const session =
        await getCurrentSession();


    if (!session) {

        window.alert(
            "Þú þarft að vera innskráður til að vista leik."
        );

        return;
    }


    const payload = {

        user_id:
            session.user.id,

        ...createDatabasePayload(
            data
        ),

        status:
            "UPCOMING",

        garmin_sync_status:
            "NOT_SENT"
    };


    const {
        data: insertedRows,
        error
    } =
        await supabaseClient
            .from("matches")
            .insert(
                payload
            )
            .select();


    if (error) {

        console.error(
            "Villa við að vista leik:",
            error
        );

        window.alert(
            "Ekki tókst að vista leikinn."
        );

        return;
    }


    const row =
        insertedRows?.[0];


    if (!row) {

        window.alert(
            "Leikurinn vistaðist ekki rétt."
        );

        return;
    }


    const match =
        mapDatabaseMatch(
            row
        );


    matches.push(
        match
    );


    finishMatchSave(
        match
    );
}



/* =========================================
   UPDATE EXISTING MATCH
========================================= */

async function updateExistingMatch(
    data
) {

    if (!editingMatchId) {
        return;
    }


    const payload = {

        ...createDatabasePayload(
            data
        ),

        garmin_sync_status:
            "NOT_SENT",

        garmin_synced_at:
            null,

        updated_at:
            new Date()
                .toISOString()
    };


    const {
        data: updatedRows,
        error
    } =
        await supabaseClient
            .from("matches")
            .update(
                payload
            )
            .eq(
                "id",
                editingMatchId
            )
            .select();


    if (error) {

        console.error(
            "Villa við að breyta leik:",
            error
        );

        window.alert(
            "Ekki tókst að vista breytingarnar."
        );

        return;
    }


    const row =
        updatedRows?.[0];


    if (!row) {

        window.alert(
            "Ekki tókst að finna leikinn."
        );

        return;
    }


    const updatedMatch =
        mapDatabaseMatch(
            row
        );


    const index =
        matches.findIndex(
            item =>
                item.id ===
                updatedMatch.id
        );


    if (
        index !==
        -1
    ) {

        matches[index] =
            updatedMatch;

    } else {

        matches.push(
            updatedMatch
        );
    }


    finishMatchSave(
        updatedMatch
    );
}



/* =========================================
   FINISH SAVE
========================================= */

function finishMatchSave(
    match
) {

    sortMatches();


    renderAll();


    resetCreateForm();


    closeCreateModal(
        false
    );


    if (
        isPlayedMatch(
            match
        )
    ) {

        switchView(
            "played"
        );

    } else {

        switchView(
            "upcoming"
        );
    }
}



/* =========================================
   SAVE BUTTON STATE
========================================= */

function setSaveButtonBusy(
    busy
) {

    if (!saveMatchButton) {
        return;
    }


    saveMatchButton.disabled =
        busy;


    if (busy) {

        saveMatchButton.textContent =
            "Vista...";

        return;
    }


    saveMatchButton.textContent =
        editingMatchId
            ? "Vista breytingar"
            : "Vista leik";
}



/* =========================================
   DELETE MATCH
========================================= */

async function deleteMatch(
    matchId
) {

    const {
        error
    } =
        await supabaseClient
            .from("matches")
            .delete()
            .eq(
                "id",
                matchId
            );


    if (error) {

        console.error(
            "Villa við að eyða leik:",
            error
        );

        window.alert(
            "Ekki tókst að eyða leiknum."
        );

        return false;
    }


    matches =
        matches.filter(
            item =>
                item.id !==
                matchId
        );


    renderAll();


    return true;
}



/* =========================================
   RESET FORM
========================================= */

function resetCreateForm() {

    if (!form) {
        return;
    }


    form.reset();


    setValue(
        "match-length",
        90
    );


    setValue(
        "extra-time",
        0
    );
}



/* =========================================
   GET VALUE
========================================= */

function getValue(
    id
) {

    const element =
        document.getElementById(
            id
        );


    if (!element) {
        return "";
    }


    return String(
        element.value ??
        ""
    ).trim();
}



/* =========================================
   SET VALUE
========================================= */

function setValue(
    id,
    value
) {

    const element =
        document.getElementById(
            id
        );


    if (!element) {
        return;
    }


    element.value =
        value ?? "";
}



/* =========================================
   DATE
========================================= */

function getMatchDate(
    match
) {

    return new Date(
        `${match.date}T${match.time}`
    );
}



/* =========================================
   SORT
========================================= */

function sortMatches() {

    matches.sort(
        (
            a,
            b
        ) =>
            getMatchDate(a)
            -
            getMatchDate(b)
    );
}



/* =========================================
   PLAYED
========================================= */

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


    return (
        getMatchDate(
            match
        )
        <
        new Date()
    );
}



/* =========================================
   VIEW BUTTONS
========================================= */

document
    .querySelectorAll(
        "[data-view-target]"
    )
    .forEach(
        button => {

            button.addEventListener(
                "click",
                () => {

                    const target =
                        button.dataset
                            .viewTarget;


                    if (!target) {
                        return;
                    }


                    switchView(
                        target
                    );
                }
            );
        }
    );



/* =========================================
   SWITCH VIEW
========================================= */

function switchView(
    viewName
) {

    closeMobileCreateMenu();


    document
        .querySelectorAll(
            ".leiktiminn-view"
        )
        .forEach(
            view => {

                const active =
                    view.dataset.view ===
                    viewName;


                view.hidden =
                    !active;


                view.classList.toggle(
                    "active",
                    active
                );
            }
        );


    document
        .querySelectorAll(
            ".desktop-view-tab"
        )
        .forEach(
            button => {

                button.classList.toggle(
                    "active",
                    button.dataset
                        .viewTarget ===
                        viewName
                );
            }
        );


    document
        .querySelectorAll(
            ".mobile-nav-item"
        )
        .forEach(
            button => {

                button.classList.toggle(
                    "active",
                    button.dataset
                        .viewTarget ===
                        viewName
                );
            }
        );
}



/* =========================================
   RENDER
========================================= */

function renderAll() {

    sortMatches();


    renderUpcomingMatches();


    renderPlayedMatches();


    updateCounts();


    updateStats();
}



/* =========================================
   UPCOMING
========================================= */

function renderUpcomingMatches() {

    if (!matchesList) {
        return;
    }


    const upcoming =
        matches.filter(
            match =>
                !isPlayedMatch(
                    match
                )
        );


    renderMatchCollection(
        matchesList,
        upcoming,
        "Engir væntanlegir leikir",
        "Búðu til leik með + hnappnum."
    );
}



/* =========================================
   PLAYED
========================================= */

function renderPlayedMatches() {

    if (!playedMatchesList) {
        return;
    }


    const played =
        matches
            .filter(
                match =>
                    isPlayedMatch(
                        match
                    )
            )
            .sort(
                (
                    a,
                    b
                ) =>
                    getMatchDate(b)
                    -
                    getMatchDate(a)
            );


    renderMatchCollection(
        playedMatchesList,
        played,
        "Engir spilaðir leikir enn",
        "Leikir birtast hér þegar leikdagur er liðinn."
    );
}



/* =========================================
   MATCH COLLECTION
========================================= */

function renderMatchCollection(
    container,
    collection,
    emptyTitle,
    emptyText
) {

    if (
        collection.length ===
        0
    ) {

        container.innerHTML = `
            <div class="empty-state">

                <strong>
                    ${emptyTitle}
                </strong>

                <span>
                    ${emptyText}
                </span>

            </div>
        `;


        return;
    }


    container.innerHTML =
        collection
            .map(
                match =>
                    createMatchRow(
                        match
                    )
            )
            .join("");
}



/* =========================================
   MATCH ROW
========================================= */

function createMatchRow(
    match
) {

    const date =
        getMatchDate(
            match
        );


    const day =
        String(
            date.getDate()
        ).padStart(
            2,
            "0"
        );


    const months = [
        "JAN",
        "FEB",
        "MAR",
        "APR",
        "MAÍ",
        "JÚN",
        "JÚL",
        "ÁGÚ",
        "SEP",
        "OKT",
        "NÓV",
        "DES"
    ];


    const month =
        months[
            date.getMonth()
        ];


    const venueText =
        match.venue
            ? ` · ${escapeHtml(match.venue)}`
            : "";


    const played =
        isPlayedMatch(
            match
        );


    const statusText =
        played
            ? "Spilaður"
            : "Væntanlegur";


    // =========================================
    // GARMIN SYNC STATUS
    // =========================================

    let garminStatusText =
        "";

    let garminStatusClass =
        "";


    // =========================================
    // UPCOMING MATCH
    // =========================================

    if (
        !played
    ) {

        garminStatusText =
            "Ekki sent";

        garminStatusClass =
            "not-sent";


        if (
            match.garminSyncStatus ===
            "SENT"
        ) {

            garminStatusText =
                "Sent á Garmin";

            garminStatusClass =
                "sent";
        }


        if (
            match.garminSyncStatus ===
            "SYNCED"
        ) {

            garminStatusText =
                "Vistað á úri";

            garminStatusClass =
                "synced";
        }
    }


    // =========================================
    // PLAYED MATCH
    // =========================================

    if (
        played
        &&
        match.garminSyncStatus ===
        "ACTIVITY_RECEIVED"
    ) {

        garminStatusText =
            "Garmin virkni vistuð";

        garminStatusClass =
            "activity-received";
    }


    return `
        <article
            class="match-item"
            data-match-id="${escapeHtml(match.id)}"
            tabindex="0"
            role="button"
        >

            <div class="match-date-box">

                <strong>
                    ${day}
                </strong>

                <span>
                    ${month}
                </span>

            </div>


            <div class="match-info">

                <strong>
                    ${escapeHtml(match.homeTeam)}
                    –
                    ${escapeHtml(match.awayTeam)}
                </strong>

                <span>
                    ${escapeHtml(match.competition)}
                    · ${escapeHtml(match.time)}
                    ${venueText}
                </span>

            </div>


            <div class="match-actions">

                <div class="match-status-stack">

                    <span class="match-badge">
                        ${statusText}
                    </span>

                    ${garminStatusText
                        ? `
                            <span
                                class="match-garmin-status ${garminStatusClass}"
                            >
                                <span class="match-garmin-dot"></span>
                                ${garminStatusText}
                            </span>
                        `
                        : ""
                    }

                </div>


                <button
                    class="match-more-button"
                    type="button"
                    aria-label="Fleiri valkostir"
                    data-match-menu-button="${escapeHtml(match.id)}"
                >
                    ⋮
                </button>


                <div
                    class="match-action-menu"
                    data-match-menu="${escapeHtml(match.id)}"
                    hidden
                >

                    <button
                        type="button"
                        class="match-menu-action"
                        data-open-match="${escapeHtml(match.id)}"
                    >
                        Opna leik
                    </button>


                    <button
                        type="button"
                        class="match-menu-action"
                        data-edit-match="${escapeHtml(match.id)}"
                    >
                        Breyta leik
                    </button>


                    <button
                        type="button"
                        class="match-menu-action"
                        data-calendar-match="${escapeHtml(match.id)}"
                    >
                        Bæta í dagatal
                    </button>


                    <button
                        type="button"
                        class="match-menu-action delete-match-button"
                        data-delete-match="${escapeHtml(match.id)}"
                    >
                        Eyða leik
                    </button>

                </div>

            </div>

        </article>
    `;
}


/* =========================================
   LISTENERS
========================================= */

[
    matchesList,
    playedMatchesList
]
    .filter(
        Boolean
    )
    .forEach(
        container => {

            container.addEventListener(
                "click",
                handleMatchListClick
            );


            container.addEventListener(
                "keydown",
                handleMatchListKeydown
            );
        }
    );



/* =========================================
   MATCH CLICK
========================================= */

async function handleMatchListClick(
    event
) {

    const container =
        event.currentTarget;



    /* MORE MENU */

    const menuButton =
        event.target.closest(
            "[data-match-menu-button]"
        );


    if (menuButton) {

        event.stopPropagation();


        const matchId =
            menuButton.dataset
                .matchMenuButton;


        closeAllMatchMenus(
            matchId
        );


        const menu =
            container.querySelector(
                `[data-match-menu="${matchId}"]`
            );


        if (menu) {

            menu.hidden =
                !menu.hidden;
        }


        return;
    }



    /* OPEN */

    const openButton =
        event.target.closest(
            "[data-open-match]"
        );


    if (openButton) {

        event.stopPropagation();


        openMatch(
            openButton.dataset
                .openMatch
        );


        return;
    }



    /* EDIT */

    const editButton =
        event.target.closest(
            "[data-edit-match]"
        );


    if (editButton) {

        event.stopPropagation();


        closeAllMatchMenus();


        openEditModal(
            editButton.dataset
                .editMatch
        );


        return;
    }



    /* CALENDAR */

    const calendarButton =
        event.target.closest(
            "[data-calendar-match]"
        );


    if (calendarButton) {

        event.stopPropagation();


        const match =
            matches.find(
                item =>
                    item.id ===
                    calendarButton.dataset
                        .calendarMatch
            );


        if (match) {

            addMatchToCalendar(
                match
            );
        }


        closeAllMatchMenus();


        return;
    }



    /* DELETE */

    const deleteButton =
        event.target.closest(
            "[data-delete-match]"
        );


    if (deleteButton) {

        event.stopPropagation();


        const matchId =
            deleteButton.dataset
                .deleteMatch;


        const match =
            matches.find(
                item =>
                    item.id ===
                    matchId
            );


        if (!match) {
            return;
        }


        const confirmed =
            window.confirm(
                `Eyða leiknum ${match.homeTeam} – ${match.awayTeam}?`
            );


        if (!confirmed) {
            return;
        }


        await deleteMatch(
            matchId
        );


        closeAllMatchMenus();


        return;
    }



    /* ROW */

    const matchRow =
        event.target.closest(
            ".match-item"
        );


    if (matchRow) {

        openMatch(
            matchRow.dataset
                .matchId
        );
    }
}



/* =========================================
   KEYBOARD
========================================= */

function handleMatchListKeydown(
    event
) {

    if (
        event.key !==
            "Enter"
        &&
        event.key !==
            " "
    ) {

        return;
    }


    const row =
        event.target.closest(
            ".match-item"
        );


    if (!row) {
        return;
    }


    event.preventDefault();


    openMatch(
        row.dataset.matchId
    );
}



/* =========================================
   OPEN MATCH
========================================= */

function openMatch(
    matchId
) {

    window.location.href =
        `leiktiminn-match.html?id=${encodeURIComponent(matchId)}`;
}



/* =========================================
   CALENDAR
========================================= */

function addMatchToCalendar(
    match
) {

    const start =
        getMatchDate(
            match
        );


    const durationMinutes =
        Number(
            match.matchLength ??
            90
        );


    const end =
        new Date(
            start.getTime()
            +
            durationMinutes
            *
            60
            *
            1000
        );


    const title =
        `${match.homeTeam} – ${match.awayTeam}`;


    const descriptionParts = [];


    if (match.competition) {

        descriptionParts.push(
            match.competition
        );
    }


    if (match.userRole) {

        descriptionParts.push(
            `Hlutverk: ${match.userRole}`
        );
    }


    descriptionParts.push(
        "Leiktíminn – Dómarar"
    );


    const ics = [

        "BEGIN:VCALENDAR",

        "VERSION:2.0",

        "PRODID:-//Domarar//Leiktiminn//IS",

        "CALSCALE:GREGORIAN",

        "BEGIN:VEVENT",

        `UID:${escapeIcs(match.id)}@domarar.is`,

        `DTSTAMP:${formatIcsUtc(new Date())}`,

        `DTSTART:${formatIcsLocal(start)}`,

        `DTEND:${formatIcsLocal(end)}`,

        `SUMMARY:${escapeIcs(title)}`,

        `DESCRIPTION:${escapeIcs(descriptionParts.join("\\n"))}`,

        `LOCATION:${escapeIcs(match.venue || "")}`,

        "END:VEVENT",

        "END:VCALENDAR"

    ].join(
        "\r\n"
    );


    const blob =
        new Blob(
            [ics],
            {
                type:
                    "text/calendar;charset=utf-8"
            }
        );


    const url =
        URL.createObjectURL(
            blob
        );


    const link =
        document.createElement(
            "a"
        );


    link.href =
        url;


    link.download =
        `${safeFilename(title)}.ics`;


    document.body.appendChild(
        link
    );


    link.click();


    link.remove();


    window.setTimeout(
        () => {

            URL.revokeObjectURL(
                url
            );
        },
        1000
    );
}



/* =========================================
   ICS LOCAL TIME
========================================= */

function formatIcsLocal(
    date
) {

    return (
        date.getFullYear()
        +
        pad2(
            date.getMonth() + 1
        )
        +
        pad2(
            date.getDate()
        )
        +
        "T"
        +
        pad2(
            date.getHours()
        )
        +
        pad2(
            date.getMinutes()
        )
        +
        "00"
    );
}



/* =========================================
   ICS UTC TIME
========================================= */

function formatIcsUtc(
    date
) {

    return (
        date.getUTCFullYear()
        +
        pad2(
            date.getUTCMonth() + 1
        )
        +
        pad2(
            date.getUTCDate()
        )
        +
        "T"
        +
        pad2(
            date.getUTCHours()
        )
        +
        pad2(
            date.getUTCMinutes()
        )
        +
        pad2(
            date.getUTCSeconds()
        )
        +
        "Z"
    );
}



function pad2(
    value
) {

    return String(
        value
    ).padStart(
        2,
        "0"
    );
}



/* =========================================
   ESCAPE ICS
========================================= */

function escapeIcs(
    value
) {

    return String(
        value ??
        ""
    )
        .replace(
            /\\/g,
            "\\\\"
        )
        .replace(
            /\n/g,
            "\\n"
        )
        .replace(
            /,/g,
            "\\,"
        )
        .replace(
            /;/g,
            "\\;"
        );
}



/* =========================================
   SAFE FILE NAME
========================================= */

function safeFilename(
    value
) {

    return String(
        value
    )
        .replace(
            /[<>:"/\\|?*]/g,
            "-"
        )
        .trim();
}



/* =========================================
   CLOSE MATCH MENUS
========================================= */

document.addEventListener(
    "click",
    event => {

        if (
            !event.target.closest(
                ".match-actions"
            )
        ) {

            closeAllMatchMenus();
        }
    }
);



function closeAllMatchMenus(
    exceptMatchId = null
) {

    document
        .querySelectorAll(
            "[data-match-menu]"
        )
        .forEach(
            menu => {

                if (
                    exceptMatchId !==
                        null
                    &&
                    menu.dataset
                        .matchMenu ===
                        exceptMatchId
                ) {

                    return;
                }


                menu.hidden =
                    true;
            }
        );
}



/* =========================================
   COUNTS
========================================= */

function updateCounts() {

    if (totalCount) {

        totalCount.textContent =
            matches.length
                .toString();
    }


    const upcoming =
        matches.filter(
            match =>
                !isPlayedMatch(
                    match
                )
        );


    if (upcomingCount) {

        upcomingCount.textContent =
            upcoming.length
                .toString();
    }
}



/* =========================================
   STATS
========================================= */

function updateStats() {

    const played =
        matches.filter(
            match =>
                isPlayedMatch(
                    match
                )
        );


    const refereeCount =
        played.filter(
            match =>
                match.userRole ===
                "Dómari"
        ).length;


    const adCount =
        played.filter(
            match =>
                match.userRole ===
                    "AD1"
                ||
                match.userRole ===
                    "AD2"
        ).length;


    const fourthCount =
        played.filter(
            match =>
                match.userRole ===
                    "Fjórði"
        ).length;


    // =========================================
    // GARMIN FITNESS MATCHES
    // =========================================

    const fitnessMatches =
        played.filter(
            match =>
                Number(
                    match.distanceTotalM ?? 0
                ) > 0
                ||
                Number(
                    match.hrAvgTotal ?? 0
                ) > 0
        );


    // =========================================
    // COMPACT MATCH SUMMARY
    // =========================================

    const careerGrid =
        document.querySelector(
            ".career-stats-grid"
        );


    if (
        careerGrid
    ) {

        const summaryItems =
            [];


        summaryItems.push(`
            <article class="stats-summary-item">

                <span>
                    Leikir
                </span>

                <strong>
                    ${played.length}
                </strong>

            </article>
        `);


        if (
            refereeCount > 0
        ) {

            summaryItems.push(`
                <article class="stats-summary-item">

                    <span>
                        Dómari
                    </span>

                    <strong>
                        ${refereeCount}
                    </strong>

                </article>
            `);
        }


        if (
            adCount > 0
        ) {

            summaryItems.push(`
                <article class="stats-summary-item">

                    <span>
                        AD
                    </span>

                    <strong>
                        ${adCount}
                    </strong>

                </article>
            `);
        }


        if (
            fourthCount > 0
        ) {

            summaryItems.push(`
                <article class="stats-summary-item">

                    <span>
                        Fjórði
                    </span>

                    <strong>
                        ${fourthCount}
                    </strong>

                </article>
            `);
        }


        if (
            fitnessMatches.length > 0
        ) {

            summaryItems.push(`
                <article class="stats-summary-item stats-summary-garmin">

                    <span>
                        Garmin
                    </span>

                    <strong>
                        ${fitnessMatches.length}
                    </strong>

                </article>
            `);
        }


        careerGrid.innerHTML =
            summaryItems.join("");
    }


    // =========================================
    // GARMIN CONTAINER
    // =========================================

    const statsFuture =
        document.querySelector(
            ".stats-future"
        );


    if (
        !statsFuture
    ) {

        return;
    }


    // =========================================
    // NO GARMIN DATA
    // =========================================

    if (
        fitnessMatches.length ===
        0
    ) {

        statsFuture.innerHTML = `

            <div class="stats-garmin-heading">

                <div>

                    <p class="panel-eyebrow">
                        GARMIN
                    </p>

                    <h4>
                        Frammistaða
                    </h4>

                </div>

            </div>


            <div class="stats-garmin-empty">

                Engin Garmin gögn komin inn enn.

            </div>
        `;


        return;
    }


    // =========================================
    // DISTANCE MATCHES
    // =========================================

    const distanceMatches =
        fitnessMatches.filter(
            match =>
                Number(
                    match.distanceTotalM ?? 0
                ) > 0
        );


    // =========================================
    // TOTAL DISTANCE
    // =========================================

    const totalDistanceMeters =
        distanceMatches.reduce(
            (
                total,
                match
            ) =>
                total
                +
                Number(
                    match.distanceTotalM ?? 0
                ),
            0
        );


    // =========================================
    // AVERAGE DISTANCE
    // =========================================

    const averageDistanceMeters =
        distanceMatches.length > 0
            ? totalDistanceMeters
                /
                distanceMatches.length
            : 0;


    // =========================================
    // LONGEST MATCH
    // =========================================

    const longestDistanceMeters =
        distanceMatches.reduce(
            (
                longest,
                match
            ) =>
                Math.max(
                    longest,
                    Number(
                        match.distanceTotalM ?? 0
                    )
                ),
            0
        );


    // =========================================
    // HEART RATE MATCHES
    // =========================================

    const hrMatches =
        fitnessMatches.filter(
            match =>
                Number(
                    match.hrAvgTotal ?? 0
                ) > 0
        );


    // =========================================
    // AVERAGE HEART RATE
    // =========================================

    const averageHeartRate =
        hrMatches.length > 0
            ? Math.round(
                hrMatches.reduce(
                    (
                        total,
                        match
                    ) =>
                        total
                        +
                        Number(
                            match.hrAvgTotal ?? 0
                        ),
                    0
                )
                /
                hrMatches.length
            )
            : 0;


    // =========================================
    // HIGHEST HEART RATE
    // =========================================

    const highestHeartRate =
        fitnessMatches.reduce(
            (
                highest,
                match
            ) =>
                Math.max(
                    highest,
                    Number(
                        match.hrMaxTotal ?? 0
                    )
                ),
            0
        );


    // =========================================
    // FIRST HALF DISTANCE
    // =========================================

    const firstHalfDistanceTotal =
        distanceMatches.reduce(
            (
                total,
                match
            ) =>
                total
                +
                Number(
                    match.distanceFirstHalfM ?? 0
                ),
            0
        );


    // =========================================
    // SECOND HALF DISTANCE
    // =========================================

    const secondHalfDistanceTotal =
        distanceMatches.reduce(
            (
                total,
                match
            ) =>
                total
                +
                Number(
                    match.distanceSecondHalfM ?? 0
                ),
            0
        );


    // =========================================
    // HALF DISTANCE AVERAGES
    // =========================================

    const averageFirstHalfDistance =
        distanceMatches.length > 0
            ? firstHalfDistanceTotal
                /
                distanceMatches.length
            : 0;


    const averageSecondHalfDistance =
        distanceMatches.length > 0
            ? secondHalfDistanceTotal
                /
                distanceMatches.length
            : 0;


    // =========================================
    // FIRST HALF HR
    // =========================================

    const firstHalfHrMatches =
        fitnessMatches.filter(
            match =>
                Number(
                    match.hrAvgFirstHalf ?? 0
                ) > 0
        );


    const averageFirstHalfHr =
        firstHalfHrMatches.length > 0
            ? Math.round(
                firstHalfHrMatches.reduce(
                    (
                        total,
                        match
                    ) =>
                        total
                        +
                        Number(
                            match.hrAvgFirstHalf ?? 0
                        ),
                    0
                )
                /
                firstHalfHrMatches.length
            )
            : 0;


    // =========================================
    // SECOND HALF HR
    // =========================================

    const secondHalfHrMatches =
        fitnessMatches.filter(
            match =>
                Number(
                    match.hrAvgSecondHalf ?? 0
                ) > 0
        );


    const averageSecondHalfHr =
        secondHalfHrMatches.length > 0
            ? Math.round(
                secondHalfHrMatches.reduce(
                    (
                        total,
                        match
                    ) =>
                        total
                        +
                        Number(
                            match.hrAvgSecondHalf ?? 0
                        ),
                    0
                )
                /
                secondHalfHrMatches.length
            )
            : 0;


    // =========================================
    // RENDER GARMIN DASHBOARD
    // =========================================

    statsFuture.innerHTML = `

        <div class="stats-garmin-heading">

            <div>

                <p class="panel-eyebrow">
                    GARMIN
                </p>

                <h4>
                    Frammistaða
                </h4>

            </div>


            <span class="stats-garmin-count">

                ${fitnessMatches.length}

                ${
                    fitnessMatches.length === 1
                        ? "leikur"
                        : "leikir"
                }

            </span>

        </div>


        <div class="stats-distance-hero">

            <div class="stats-distance-value">

                <strong>
                    ${formatStatsKm(
                        totalDistanceMeters
                    )}
                </strong>

                <span>
                    km
                </span>

            </div>


            <div class="stats-distance-label">
                Heildarvegalengd
            </div>

        </div>


        <div class="stats-performance-grid">


            <article>

                <span>
                    Meðaltal í leik
                </span>

                <strong>

                    ${formatStatsKm(
                        averageDistanceMeters
                    )}

                    <small>
                        km
                    </small>

                </strong>

            </article>


            <article>

                <span>
                    Lengsti leikur
                </span>

                <strong>

                    ${formatStatsKm(
                        longestDistanceMeters
                    )}

                    <small>
                        km
                    </small>

                </strong>

            </article>


            <article>

                <span>
                    Meðalpúls
                </span>

                <strong>

                    ${
                        averageHeartRate > 0
                            ? averageHeartRate
                            : "–"
                    }

                    <small>
                        bpm
                    </small>

                </strong>

            </article>


            <article>

                <span>
                    Hæsti púls
                </span>

                <strong>

                    ${
                        highestHeartRate > 0
                            ? highestHeartRate
                            : "–"
                    }

                    <small>
                        bpm
                    </small>

                </strong>

            </article>


        </div>


        <div class="stats-half-comparison">


            <div class="stats-half-card">

                <span class="stats-half-label">
                    1H
                </span>


                <strong>

                    ${formatStatsKm(
                        averageFirstHalfDistance
                    )}

                    <small>
                        km
                    </small>

                </strong>


                <span class="stats-half-caption">
                    Meðal vegalengd
                </span>


                <div class="stats-half-hr">

                    <span>
                        Meðalpúls
                    </span>

                    <b>
                        ${
                            averageFirstHalfHr > 0
                                ? averageFirstHalfHr
                                : "–"
                        }
                    </b>

                </div>

            </div>


            <div class="stats-half-card">

                <span class="stats-half-label">
                    2H
                </span>


                <strong>

                    ${formatStatsKm(
                        averageSecondHalfDistance
                    )}

                    <small>
                        km
                    </small>

                </strong>


                <span class="stats-half-caption">
                    Meðal vegalengd
                </span>


                <div class="stats-half-hr">

                    <span>
                        Meðalpúls
                    </span>

                    <b>
                        ${
                            averageSecondHalfHr > 0
                                ? averageSecondHalfHr
                                : "–"
                        }
                    </b>

                </div>

            </div>


        </div>
    `;
}


// =========================================
// FORMAT DISTANCE
// =========================================

function formatStatsKm(
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
    ) {

        return "0.00";
    }


    return (
        value / 1000
    ).toFixed(
        2
    );
}


/* =========================================
   SET TEXT
========================================= */

function setText(
    id,
    value
) {

    const element =
        document.getElementById(
            id
        );


    if (element) {

        element.textContent =
            String(value);
    }
}



/* =========================================
   LOADING STATE
========================================= */

function showMatchesLoading() {

    if (matchesList) {

        matchesList.innerHTML = `
            <div class="empty-state">

                <strong>
                    Sæki leiki...
                </strong>

                <span>
                    Hleð leikjum úr Leiktímanum.
                </span>

            </div>
        `;
    }


    if (playedMatchesList) {

        playedMatchesList.innerHTML = `
            <div class="empty-state">

                <strong>
                    Sæki leiki...
                </strong>

            </div>
        `;
    }
}



/* =========================================
   LOAD ERROR
========================================= */

function showMatchesLoadError() {

    const html = `
        <div class="empty-state">

            <strong>
                Ekki tókst að sækja leiki
            </strong>

            <span>
                Reyndu að endurhlaða síðuna.
            </span>

        </div>
    `;


    if (matchesList) {

        matchesList.innerHTML =
            html;
    }


    if (playedMatchesList) {

        playedMatchesList.innerHTML =
            html;
    }
}



/* =========================================
   SILENT REFRESH WHEN RETURNING TO PAGE
========================================= */

document.addEventListener(
    "visibilitychange",
    () => {

        if (
            document.visibilityState ===
            "visible"
        ) {

            loadMatchesFromSupabase({
                showLoading: false,
                force: false
            });
        }
    }
);


window.addEventListener(
    "focus",
    () => {

        loadMatchesFromSupabase({
            showLoading: false,
            force: false
        });
    }
);



/* =========================================
   PULL TO REFRESH
========================================= */

function ensurePullRefreshIndicator() {

    if (pullRefreshIndicator) {

        return;
    }


    const style =
        document.createElement(
            "style"
        );


    style.textContent = `
        @keyframes leiktiminn-refresh-spin {

            from {
                transform: rotate(0deg);
            }

            to {
                transform: rotate(360deg);
            }
        }

        .leiktiminn-pull-refresh-spinner {

            width: 16px;
            height: 16px;

            border: 2px solid rgba(255,255,255,0.28);

            border-top-color:
                rgba(255,255,255,0.95);

            border-radius: 50%;
        }

        .leiktiminn-pull-refresh-spinner.spinning {

            animation:
                leiktiminn-refresh-spin
                700ms
                linear
                infinite;
        }
    `;


    document.head.appendChild(
        style
    );


    pullRefreshIndicator =
        document.createElement(
            "div"
        );


    pullRefreshIndicator.setAttribute(
        "aria-hidden",
        "true"
    );


    Object.assign(
        pullRefreshIndicator.style,
        {
            position:
                "fixed",

            top:
                "calc(env(safe-area-inset-top, 0px) + 10px)",

            left:
                "50%",

            width:
                "34px",

            height:
                "34px",

            display:
                "flex",

            alignItems:
                "center",

            justifyContent:
                "center",

            borderRadius:
                "50%",

            background:
                "rgba(13, 31, 25, 0.94)",

            border:
                "1px solid rgba(255, 255, 255, 0.14)",

            boxShadow:
                "0 8px 24px rgba(0, 0, 0, 0.28)",

            opacity:
                "0",

            pointerEvents:
                "none",

            zIndex:
                "9999",

            transform:
                "translate(-50%, -54px)",

            transition:
                "opacity 140ms ease, transform 140ms ease"
        }
    );


    const spinner =
        document.createElement(
            "span"
        );


    spinner.className =
        "leiktiminn-pull-refresh-spinner";


    pullRefreshIndicator.appendChild(
        spinner
    );


    document.body.appendChild(
        pullRefreshIndicator
    );
}



function showPullRefreshIndicator(
    progress = 1,
    spinning = false
) {

    ensurePullRefreshIndicator();


    const clampedProgress =
        Math.max(
            0,
            Math.min(
                1,
                progress
            )
        );


    pullRefreshIndicator.style.opacity =
        String(
            Math.max(
                0.25,
                clampedProgress
            )
        );


    const translateY =
        -42
        +
        (
            42
            *
            clampedProgress
        );


    pullRefreshIndicator.style.transform =
        `translate(-50%, ${translateY}px)`;


    const spinner =
        pullRefreshIndicator.querySelector(
            ".leiktiminn-pull-refresh-spinner"
        );


    spinner?.classList.toggle(
        "spinning",
        spinning
    );
}



function hidePullRefreshIndicator() {

    if (!pullRefreshIndicator) {

        return;
    }


    pullRefreshIndicator.style.opacity =
        "0";


    pullRefreshIndicator.style.transform =
        "translate(-50%, -54px)";


    const spinner =
        pullRefreshIndicator.querySelector(
            ".leiktiminn-pull-refresh-spinner"
        );


    spinner?.classList.remove(
        "spinning"
    );
}



function resetPullRefreshGesture() {

    pullRefreshStartY =
        null;

    pullRefreshDistance =
        0;

    pullRefreshActive =
        false;
}



document.addEventListener(
    "touchstart",
    event => {

        if (
            pullRefreshRunning
            ||
            event.touches.length !== 1
            ||
            window.scrollY > 0
            ||
            document.body.classList.contains(
                "modal-open"
            )
        ) {

            resetPullRefreshGesture();

            return;
        }


        pullRefreshStartY =
            event.touches[0]
                .clientY;


        pullRefreshDistance =
            0;


        pullRefreshActive =
            false;
    },
    {
        passive: true
    }
);



document.addEventListener(
    "touchmove",
    event => {

        if (
            pullRefreshStartY ===
                null
            ||
            pullRefreshRunning
            ||
            event.touches.length !==
                1
        ) {

            return;
        }


        const currentY =
            event.touches[0]
                .clientY;


        const distance =
            currentY
            -
            pullRefreshStartY;


        if (
            distance <= 0
            ||
            window.scrollY > 0
        ) {

            resetPullRefreshGesture();

            hidePullRefreshIndicator();

            return;
        }


        pullRefreshActive =
            true;


        pullRefreshDistance =
            Math.min(
                distance,
                110
            );


        const progress =
            pullRefreshDistance
            /
            PULL_REFRESH_THRESHOLD;


        showPullRefreshIndicator(
            progress,
            false
        );


        if (
            event.cancelable
        ) {

            event.preventDefault();
        }
    },
    {
        passive: false
    }
);



document.addEventListener(
    "touchend",
    async () => {

        if (
            !pullRefreshActive
            ||
            pullRefreshRunning
        ) {

            resetPullRefreshGesture();

            return;
        }


        const shouldRefresh =
            pullRefreshDistance >=
            PULL_REFRESH_THRESHOLD;


        resetPullRefreshGesture();


        if (!shouldRefresh) {

            hidePullRefreshIndicator();

            return;
        }


        pullRefreshRunning =
            true;


        showPullRefreshIndicator(
            1,
            true
        );


        try {

            await loadMatchesFromSupabase({
                showLoading: false,
                force: true
            });

        } finally {

            pullRefreshRunning =
                false;


            window.setTimeout(
                hidePullRefreshIndicator,
                180
            );
        }
    }
);



document.addEventListener(
    "touchcancel",
    () => {

        resetPullRefreshGesture();

        hidePullRefreshIndicator();
    }
);



/* =========================================
   AUTH CHANGE
========================================= */

supabaseClient
    .auth
    .onAuthStateChange(
        async (
            event,
            session
        ) => {

            if (!session) {

                matches = [];

                renderAll();

                return;
            }


            window.setTimeout(
                () => {

                    loadMatchesFromSupabase({
                        showLoading: !hasLoadedMatches,
                        force: true
                    });

                },
                0
            );
        }
    );

/* =========================================
   URL VIEW / ACTION ROUTING
========================================= */

function handleLeiktiminnUrlState() {

    const params =
        new URLSearchParams(
            window.location.search
        );


    const requestedView =
        params.get(
            "view"
        );


    const createRequested =
        params.get(
            "create"
        );


    // =========================================
    // OPEN REQUESTED VIEW
    // =========================================

    if (
        requestedView ===
            "upcoming"
        ||
        requestedView ===
            "played"
        ||
        requestedView ===
            "stats"
        ||
        requestedView ===
            "profile"
    ) {

        switchView(
            requestedView
        );
    }


    // =========================================
    // OPEN CREATE MATCH
    // =========================================

    if (
        createRequested ===
        "1"
    ) {

        window.setTimeout(
            () => {

                openCreateModal();

            },
            0
        );
    }


    // =========================================
    // CLEAN URL AFTER HANDLING
    // =========================================

    if (
        requestedView
        ||
        createRequested
    ) {

        const cleanUrl =
            window.location.pathname;


        window.history.replaceState(
            {},
            "",
            cleanUrl
        );
    }
}


/* =========================================
   RUN URL ROUTING AFTER INITIAL LOAD
========================================= */

window.addEventListener(
    "load",
    () => {

        handleLeiktiminnUrlState();

    }
);

/* =========================================
   HTML SAFETY
========================================= */

function escapeHtml(
    value
) {

    return String(
        value ??
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