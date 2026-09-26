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

let pendingEditMatchId = null;

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
   CREATE FORM HELPERS
========================================= */

let currentMatchFormUserName = "";

let lastAutoFilledRole = "";


/* =========================================
   INITIALISE
========================================= */

async function initializeLeiktiminn() {



    const session =
        await getCurrentSession();


    if (!session) {

        matches = [];

        currentMatchFormUserName = "";

        renderAll();

        setupCompetitionField();

        return;
    }


    await loadCurrentMatchFormUserName(
        session
    );


    setupCompetitionField();


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
   CURRENT USER NAME FOR ROLE AUTOFILL
========================================= */

async function loadCurrentMatchFormUserName(
    session
) {

    currentMatchFormUserName = "";


    if (
        !session
        || !session.user
    ) {

        return;
    }


    const fallbackName =
        String(
            session.user.user_metadata
                ?.name
            ||
            ""
        ).trim();


    try {

        const {
            data,
            error
        } =
            await supabaseClient
                .from(
                    "profiles"
                )
                .select(
                    "name"
                )
                .eq(
                    "id",
                    session.user.id
                )
                .maybeSingle();


        if (error) {

            console.warn(
                "Profile name load warning:",
                error
            );

            currentMatchFormUserName =
                fallbackName;

            return;
        }


        currentMatchFormUserName =
            String(
                data?.name
                ||
                fallbackName
                ||
                ""
            ).trim();

    } catch (error) {

        console.warn(
            "Profile name load warning:",
            error
        );


        currentMatchFormUserName =
            fallbackName;
    }
}


/* =========================================
   USER COMPETITIONS
========================================= */

let userCompetitions = [];


function normalizeCompetitionName(
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
        .trim();
}



async function setupCompetitionField() {

    setupCompetitionControls();

    await loadUserCompetitions();
}



function setupCompetitionControls() {

    const competitionSelect =
        document.getElementById(
            "competition"
        );

    const addButton =
        document.getElementById(
            "addCompetitionButton"
        );

    const deleteButton =
        document.getElementById(
            "deleteCompetitionButton"
        );

    const createRow =
        document.getElementById(
            "newCompetitionRow"
        );

    const nameInput =
        document.getElementById(
            "newCompetitionName"
        );

    const saveButton =
        document.getElementById(
            "saveCompetitionButton"
        );


    if (
        !competitionSelect
        ||
        competitionSelect.dataset
            .competitionReady === "true"
    ) {

        return;
    }


    competitionSelect.dataset
        .competitionReady =
            "true";


    competitionSelect.addEventListener(
        "change",
        updateCompetitionDeleteButton
    );


    addButton
        ?.addEventListener(
            "click",
            () => {

                createRow.hidden =
                    !createRow.hidden;


                if (!createRow.hidden) {

                    nameInput?.focus();
                }
            }
        );


    saveButton
        ?.addEventListener(
            "click",
            async () => {

                await createCompetition();
            }
        );


    nameInput
        ?.addEventListener(
            "keydown",
            async event => {

                if (
                    event.key !== "Enter"
                ) {

                    return;
                }


                event.preventDefault();

                await createCompetition();
            }
        );


    deleteButton
        ?.addEventListener(
            "click",
            async () => {

                await deleteSelectedCompetition();
            }
        );


    updateCompetitionDeleteButton();
}



async function loadUserCompetitions() {

    const select =
        document.getElementById(
            "competition"
        );


    if (!select) {

        return;
    }


    const session =
        await getCurrentSession();


    if (!session) {

        userCompetitions = [];

        renderCompetitionOptions();

        return;
    }


    try {

        const {
            data,
            error
        } =
            await supabaseClient
                .from(
                    "user_competitions"
                )
                .select(
                    "id, name"
                )
                .eq(
                    "user_id",
                    session.user.id
                )
                .order(
                    "name",
                    {
                        ascending: true
                    }
                );


        if (error) {

            console.error(
                "Villa við að sækja mótalista:",
                error
            );

            return;
        }


        userCompetitions =
            data || [];


        renderCompetitionOptions();

    } catch (error) {

        console.error(
            "Villa við að sækja mótalista:",
            error
        );
    }
}



function renderCompetitionOptions(
    selectedValue = null
) {

    const select =
        document.getElementById(
            "competition"
        );


    if (!select) {

        return;
    }


    const currentValue =
        selectedValue !== null
            ? selectedValue
            : select.value;


    select.innerHTML = `
        <option value="">
            Veldu keppni
        </option>

        ${
            userCompetitions
                .map(
                    competition => `
                        <option
                            value="${escapeHtml(
                                competition.name
                            )}"
                        >
                            ${escapeHtml(
                                competition.name
                            )}
                        </option>
                    `
                )
                .join("")
        }
    `;


    if (
        currentValue
        &&
        !userCompetitions.some(
            item =>
                item.name ===
                currentValue
        )
    ) {

        const legacyOption =
            document.createElement(
                "option"
            );


        legacyOption.value =
            currentValue;

        legacyOption.textContent =
            currentValue;


        select.appendChild(
            legacyOption
        );
    }


    if (currentValue) {

        select.value =
            currentValue;
    }


    updateCompetitionDeleteButton();
}



async function createCompetition() {

    const nameInput =
        document.getElementById(
            "newCompetitionName"
        );

    const createRow =
        document.getElementById(
            "newCompetitionRow"
        );


    const name =
        normalizeCompetitionName(
            nameInput?.value
        );


    if (!name) {

        return;
    }


    const session =
        await getCurrentSession();


    if (!session) {

        return;
    }


    const existing =
        userCompetitions.find(
            competition =>
                competition.name
                    .toLocaleLowerCase(
                        "is-IS"
                    )
                ===
                name.toLocaleLowerCase(
                    "is-IS"
                )
        );


    if (existing) {

        renderCompetitionOptions(
            existing.name
        );


        if (nameInput) {

            nameInput.value = "";
        }


        if (createRow) {

            createRow.hidden = true;
        }


        return;
    }


    try {

        const {
            data,
            error
        } =
            await supabaseClient
                .from(
                    "user_competitions"
                )
                .insert({
                    user_id:
                        session.user.id,

                    name:
                        name
                })
                .select(
                    "id, name"
                )
                .single();


        if (error) {

            console.error(
                "Villa við að bæta við mótarheiti:",
                error
            );

            return;
        }


        userCompetitions.push(
            data
        );


        userCompetitions.sort(
            (
                a,
                b
            ) =>
                a.name.localeCompare(
                    b.name,
                    "is"
                )
        );


        renderCompetitionOptions(
            data.name
        );


        if (nameInput) {

            nameInput.value = "";
        }


        if (createRow) {

            createRow.hidden = true;
        }

    } catch (error) {

        console.error(
            "Villa við að bæta við mótarheiti:",
            error
        );
    }
}



async function deleteSelectedCompetition() {

    const select =
        document.getElementById(
            "competition"
        );


    if (!select?.value) {

        return;
    }


    const competition =
        userCompetitions.find(
            item =>
                item.name ===
                select.value
        );


    if (!competition) {

        return;
    }


    const confirmed =
        window.confirm(
            `Eyða „${competition.name}“ úr mótalistanum?\n\nEldri leikir og tölfræði breytast ekki.`
        );


    if (!confirmed) {

        return;
    }


    try {

        const {
            error
        } =
            await supabaseClient
                .from(
                    "user_competitions"
                )
                .delete()
                .eq(
                    "id",
                    competition.id
                );


        if (error) {

            console.error(
                "Villa við að eyða mótarheiti:",
                error
            );

            return;
        }


        userCompetitions =
            userCompetitions.filter(
                item =>
                    item.id !==
                    competition.id
            );


        renderCompetitionOptions(
            ""
        );

    } catch (error) {

        console.error(
            "Villa við að eyða mótarheiti:",
            error
        );
    }
}



function updateCompetitionDeleteButton() {

    const select =
        document.getElementById(
            "competition"
        );

    const deleteButton =
        document.getElementById(
            "deleteCompetitionButton"
        );


    if (
        !select
        ||
        !deleteButton
    ) {

        return;
    }


    const isManagedCompetition =
        userCompetitions.some(
            item =>
                item.name ===
                select.value
        );


    deleteButton.disabled =
        !isManagedCompetition;
}


/* =========================================
   USER ROLE -> OFFICIAL NAME AUTOFILL
========================================= */

function getOfficialFieldIdForRole(
    role
) {

    const roleMap = {

        "Dómari":
            "referee-name",

        "AD1":
            "ad1-name",

        "AD2":
            "ad2-name",

        "Fjórði":
            "fourth-name"
    };


    return roleMap[
        role
    ] || "";
}


function clearPreviousAutoFilledRole() {

    if (
        !lastAutoFilledRole
        ||
        !currentMatchFormUserName
    ) {

        lastAutoFilledRole = "";

        return;
    }


    const previousFieldId =
        getOfficialFieldIdForRole(
            lastAutoFilledRole
        );


    if (!previousFieldId) {

        lastAutoFilledRole = "";

        return;
    }


    const previousField =
        document.getElementById(
            previousFieldId
        );


    if (
        previousField
        &&
        String(
            previousField.value
            ||
            ""
        ).trim()
        ===
        currentMatchFormUserName
    ) {

        previousField.value =
            "";
    }


    lastAutoFilledRole = "";
}


function applyUserNameToSelectedRole() {

    const role =
        getValue(
            "user-role"
        );


    clearPreviousAutoFilledRole();


    if (
        !role
        ||
        !currentMatchFormUserName
    ) {

        return;
    }


    const fieldId =
        getOfficialFieldIdForRole(
            role
        );


    if (!fieldId) {

        return;
    }


    setValue(
        fieldId,
        currentMatchFormUserName
    );


    lastAutoFilledRole =
        role;
}


function rememberExistingAutoFilledRole(
    match
) {

    lastAutoFilledRole = "";


    if (
        !match
        ||
        !currentMatchFormUserName
        ||
        !match.userRole
    ) {

        return;
    }


    const fieldId =
        getOfficialFieldIdForRole(
            match.userRole
        );


    if (!fieldId) {

        return;
    }


    const officialValue =
        String(
            document
                .getElementById(
                    fieldId
                )
                ?.value
            ||
            ""
        ).trim();


    if (
        officialValue
        ===
        currentMatchFormUserName
    ) {

        lastAutoFilledRole =
            match.userRole;
    }
}


const userRoleSelect =
    document.getElementById(
        "user-role"
    );


userRoleSelect
    ?.addEventListener(
        "change",
        applyUserNameToSelectedRole
    );


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

        window.LeiktiminnNotifications.setUser(session.user.id);


       


        hasLoadedMatches =
            true;


        lastMatchesRefreshAt =
            Date.now();


        renderAll();


        openPendingEditIfReady();


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

        favorite:
            row.favorite === true,

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
            normalizeCompetitionName(
                data.competition
            ),

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


    lastAutoFilledRole = "";


    resetCreateForm();


    setupCompetitionField();


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
        normalizeCompetitionName(
            match.competition
        )
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
    "match-datetime",
    match.date && match.time
        ? `${match.date}T${match.time}`
        : ""
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


    setupCompetitionField();


    rememberExistingAutoFilledRole(
        match
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
   OPEN PENDING EDIT REQUEST
========================================= */

function openPendingEditIfReady() {

    if (
        !pendingEditMatchId
    ) {

        return;
    }


    const match =
        matches.find(
            item =>
                item.id ===
                pendingEditMatchId
        );


    if (
        !match
    ) {

        return;
    }


    const matchId =
        pendingEditMatchId;


    pendingEditMatchId =
        null;


    switchView(
        "upcoming"
    );


    openEditModal(
        matchId
    );


    window.history.replaceState(
        {},
        "",
        window.location.pathname
    );
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
                normalizeCompetitionName(
                    getValue(
                        "competition"
                    )
                );


            setValue(
                "competition",
                competition
            );


            const homeTeam =
                getValue(
                    "home-team"
                );


            const awayTeam =
                getValue(
                    "away-team"
                );


            const matchDateTime =
    getValue(
        "match-datetime"
    );


const [
    date = "",
    rawTime = ""
] =
    matchDateTime.split("T");


const time =
    rawTime
        ? rawTime.slice(0, 5)
        : "";


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


    lastAutoFilledRole = "";


    form.reset();

    setValue(
    "match-datetime",
    ""
);


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
   VIEW HISTORY
========================================= */

let currentViewName =
    "upcoming";

let previousContentViewName =
    "upcoming";


const profileBackButton =
    document.getElementById(
        "profileBackButton"
    );

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
if (
    profileBackButton
) {

    profileBackButton.addEventListener(
        "click",
        () => {

            const returnView =
                (
                    previousContentViewName === "played"
                    || previousContentViewName === "stats"
                    || previousContentViewName === "upcoming"
                )
                    ? previousContentViewName
                    : "upcoming";


            switchView(
                returnView
            );
        }
    );
}


/* =========================================
   SWITCH VIEW
========================================= */

function switchView(
    viewName
) {

    if (
        viewName !==
            currentViewName
    ) {

        if (
            viewName ===
                "profile"
            &&
            currentViewName !==
                "profile"
        ) {

            previousContentViewName =
                currentViewName;
        }


        currentViewName =
            viewName;
    }


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

    if (hasLoadedMatches) {
        window.LeiktiminnNotifications.sync(
            matches.filter(match =>
                match.status === "COMPLETED" ||
                match.status === "ACTIVITY_RECEIVED"
            )
        );
    }

    updatePlayedUnreadCount();


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


    let played =
        matches
            .filter(
                match =>
                    isPlayedMatch(
                        match
                    )
            );


    if (
        window.LeiktiminnFavorites
        ?.preparePlayedMatches
    ) {

        played =
            window.LeiktiminnFavorites
                .preparePlayedMatches(
                    played
                );

    } else {

        played.sort(
            (
                a,
                b
            ) =>
                getMatchDate(b)
                -
                getMatchDate(a)
        );
    }


    const favoritesOnly =
        window.LeiktiminnFavorites
            ?.isFavoritesOnly?.()
        === true;


    renderMatchCollection(
        playedMatchesList,
        played,

        favoritesOnly
            ? "Engir uppáhaldsleikir enn"
            : "Engir spilaðir leikir enn",

        favoritesOnly
            ? "Merktu leik með stjörnu til að bæta honum í uppáhald."
            : "Leikir birtast hér þegar leikdagur er liðinn."
    );
}

function updatePlayedUnreadCount() {
    const count = matches.filter(match =>
        isPlayedMatch(match) &&
        window.LeiktiminnNotifications.isUnread(match.id)
    ).length;

    document.querySelectorAll("[data-played-unread-count]").forEach(badge => {
        badge.hidden = count === 0;
        badge.textContent = count > 99 ? "99+" : String(count);
    });

    const notificationButton =
    document.getElementById("playedNotificationButton");

const notificationNumber =
    document.getElementById("playedNotificationNumber");

if (notificationButton && notificationNumber) {
    notificationButton.hidden = count === 0;
    notificationNumber.textContent =
        count > 99 ? "99+" : String(count);

    notificationButton.setAttribute(
        "aria-label",
        `${count} nýir spilaðir leikir. Opna nýjasta leikinn.`
    );
}
}

document.getElementById("playedNotificationButton")?.addEventListener("click", () => {
    const panel = document.getElementById("playedNotificationPanel");
    const list = document.getElementById("playedNotificationList");
    if (!panel || !list) return;

    list.replaceChildren();

    matches
        .filter(match =>
            isPlayedMatch(match) &&
            window.LeiktiminnNotifications.isUnread(match.id)
        )
        .sort((a, b) => getMatchDate(b) - getMatchDate(a))
        .forEach(match => {
            const item = document.createElement("button");
            item.type = "button";
            item.className = "played-notification-item";
            const title = document.createElement("strong");
title.textContent = `${match.homeTeam} – ${match.awayTeam}`;

const when = document.createElement("small");
when.textContent =
    `${new Intl.DateTimeFormat("is-IS", {
        day: "numeric",
        month: "short",
        year: "numeric"
    }).format(getMatchDate(match))} · kl. ${match.time}`;

const label = document.createElement("span");
label.className = "played-notification-label";
label.textContent = "Nýr leikur í Spilaðir";

item.append(label, title, when);
            item.addEventListener("click", () => {
                panel.hidden = true;
                openMatch(match.id);
            });
            list.appendChild(item);
        });

    panel.hidden = !panel.hidden;
});

document.addEventListener("click", event => {
    const button = document.getElementById("playedNotificationButton");
    const panel = document.getElementById("playedNotificationPanel");

    if (
        panel &&
        !panel.hidden &&
        !panel.contains(event.target) &&
        !button?.contains(event.target)
    ) {
        panel.hidden = true;
    }
});

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

    const unread = played &&
    window.LeiktiminnNotifications.isUnread(match.id);

    const favoriteClass =
    played && match.favorite
        ? " match-favorite"
        : "";


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
            class="match-item${favoriteClass}${unread ? " match-unread" : ""}"
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
                    ${unread ? '<span class="match-new-badge">NÝR</span>' : ""}
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

                ${played
    ? `
        <button
            class="match-favorite-button ${match.favorite ? "active" : ""}"
            type="button"
            data-favorite-match="${escapeHtml(match.id)}"
            aria-label="${match.favorite
                ? "Fjarlægja leik úr uppáhaldi"
                : "Setja leik í uppáhald"
            }"
            aria-pressed="${match.favorite ? "true" : "false"}"
        >
            <span aria-hidden="true">
                ${match.favorite ? "★" : "☆"}
            </span>
        </button>
    `
    : ""
}


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

    const favoriteButton =
    event.target.closest(
        "[data-favorite-match]"
    );


if (favoriteButton) {

    event.preventDefault();
    event.stopPropagation();


    const matchId =
        favoriteButton.dataset
            .favoriteMatch;


    await window.LeiktiminnFavorites
        ?.toggleMatchFavorite(
            matchId
        );


    return;
}



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

    const willOpen =
        menu.hidden;

    if (!willOpen) {

        menu.hidden = true;

        menu.classList.remove(
            "open-up"
        );

        return;
    }


    menu.classList.remove(
        "open-up"
    );

    menu.hidden = false;


    const buttonRect =
        menuButton.getBoundingClientRect();

    const menuRect =
        menu.getBoundingClientRect();


    let bottomBoundary =
        window.innerHeight - 12;


    const mobileNav =
        document.querySelector(
            ".mobile-bottom-nav"
        );


    if (mobileNav) {

        const navStyle =
            window.getComputedStyle(
                mobileNav
            );

        const navRect =
            mobileNav.getBoundingClientRect();


        if (
            navStyle.display !== "none"
            &&
            navRect.top >
                buttonRect.bottom
        ) {

            bottomBoundary =
                Math.min(
                    bottomBoundary,
                    navRect.top - 8
                );
        }
    }


    const footer =
        document.querySelector(
            ".leiktiminn-footer"
        );


    if (footer) {

        const footerRect =
            footer.getBoundingClientRect();


        if (
            footerRect.top >
                buttonRect.bottom
            &&
            footerRect.top <
                bottomBoundary
        ) {

            bottomBoundary =
                footerRect.top - 8;
        }
    }


    const spaceBelow =
        bottomBoundary -
        buttonRect.bottom;


    const spaceAbove =
        buttonRect.top;


    if (
        spaceBelow <
            menuRect.height + 12
        &&
        spaceAbove >
            spaceBelow
    ) {

        menu.classList.add(
            "open-up"
        );
    }
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

    const match =
        matches.find(
            item =>
                item.id ===
                matchId
        );


    const sourceView =
        match
        &&
        isPlayedMatch(
            match
        )
            ? "played"
            : "upcoming";

    if (sourceView === "played") {
    window.LeiktiminnNotifications.markSeen(matchId);
}


    window.location.href =
        `leiktiminn-match.html?id=${encodeURIComponent(matchId)}&from=${sourceView}`;
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
        `Keppni: ${match.competition}`
    );
}


if (
    match.homeTeam ||
    match.awayTeam
) {

    descriptionParts.push(
        `Leikur: ${match.homeTeam} – ${match.awayTeam}`
    );
}


if (match.userRole) {

    descriptionParts.push(
        `Hlutverk: ${match.userRole}`
    );
}


descriptionParts.push(
    ""
);


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

        `DESCRIPTION:${escapeIcs(descriptionParts.join("\n"))}`,

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

    const statsDashboard =
        document.getElementById(
            "statsDashboard"
        );


    if (!statsDashboard) {
        return;
    }


    const played =
        matches.filter(
            match =>
                isPlayedMatch(
                    match
                )
        );


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


    if (
        fitnessMatches.length === 0
    ) {

        statsDashboard.innerHTML = `

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
                    Engin Garmin gögn enn
                </strong>

                <span>
                    Þegar leikur berst frá Garmin birtist frammistaðan hér.
                </span>

            </div>
        `;

        return;
    }


    const distanceMatches =
        fitnessMatches.filter(
            match =>
                Number(
                    match.distanceTotalM ?? 0
                ) > 0
        );


    const totalDistanceMeters =
        distanceMatches.reduce(
            (total, match) =>
                total + Number(match.distanceTotalM ?? 0),
            0
        );


    const averageDistanceMeters =
        distanceMatches.length > 0
            ? totalDistanceMeters / distanceMatches.length
            : 0;


    const longestMatch =
        distanceMatches.length > 0
            ? distanceMatches.reduce(
                (longest, match) =>
                    Number(match.distanceTotalM ?? 0) >
                    Number(longest.distanceTotalM ?? 0)
                        ? match
                        : longest
            )
            : null;


    const hrMatches =
        fitnessMatches.filter(
            match =>
                Number(
                    match.hrAvgTotal ?? 0
                ) > 0
        );


    const averageHeartRate =
        hrMatches.length > 0
            ? Math.round(
                hrMatches.reduce(
                    (total, match) =>
                        total + Number(match.hrAvgTotal ?? 0),
                    0
                ) / hrMatches.length
            )
            : 0;


    const highestAverageHrMatch =
        hrMatches.length > 0
            ? hrMatches.reduce(
                (highest, match) =>
                    Number(match.hrAvgTotal ?? 0) >
                    Number(highest.hrAvgTotal ?? 0)
                        ? match
                        : highest
            )
            : null;


    const firstHalfDistanceTotal =
        distanceMatches.reduce(
            (total, match) =>
                total + Number(match.distanceFirstHalfM ?? 0),
            0
        );


    const secondHalfDistanceTotal =
        distanceMatches.reduce(
            (total, match) =>
                total + Number(match.distanceSecondHalfM ?? 0),
            0
        );


    const averageFirstHalfDistance =
        distanceMatches.length > 0
            ? firstHalfDistanceTotal / distanceMatches.length
            : 0;


    const averageSecondHalfDistance =
        distanceMatches.length > 0
            ? secondHalfDistanceTotal / distanceMatches.length
            : 0;


    const halfDistanceTotal =
        averageFirstHalfDistance + averageSecondHalfDistance;


    const firstHalfPercent =
        halfDistanceTotal > 0
            ? Math.round(
                (averageFirstHalfDistance / halfDistanceTotal) * 100
            )
            : 50;


    const secondHalfPercent =
        halfDistanceTotal > 0
            ? 100 - firstHalfPercent
            : 50;


    const topDistanceMatches =
        [...distanceMatches]
            .sort(
                (a, b) =>
                    Number(b.distanceTotalM ?? 0) -
                    Number(a.distanceTotalM ?? 0)
            )
            .slice(0, 3);


    const topMatchesHtml =
        topDistanceMatches
            .map(
                (match, index) => {

                    const title =
                        `${match.homeTeam} – ${match.awayTeam}`;

                    const metaParts = [];

                    if (match.competition) {
                        metaParts.push(match.competition);
                    }

                    if (match.date) {
                        metaParts.push(formatStatsDate(match.date));
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
                                    ${escapeHtml(title)}
                                </strong>

                                <small>
                                    ${escapeHtml(metaParts.join(" · "))}
                                </small>
                            </span>

                            <span class="stats-leaderboard-distance">
                                <strong>
                                    ${formatStatsKm(match.distanceTotalM)}
                                </strong>
                                <small>km</small>
                            </span>
                        </a>
                    `;
                }
            )
            .join("");


    const longestMatchTitle =
        longestMatch
            ? `${longestMatch.homeTeam} – ${longestMatch.awayTeam}`
            : "–";


    const highestHrMatchTitle =
        highestAverageHrMatch
            ? `${highestAverageHrMatch.homeTeam} – ${highestAverageHrMatch.awayTeam}`
            : "–";


    statsDashboard.innerHTML = `

        <div class="stats-dashboard-header">

            <div>
                <p class="panel-eyebrow">GARMIN</p>
                <h3>Frammistaða</h3>
            </div>

            <span class="stats-garmin-count">
                ${fitnessMatches.length}
                ${fitnessMatches.length === 1 ? "leikur" : "leikir"}
            </span>
        </div>


        <div class="stats-dashboard-hero">
            <div class="stats-dashboard-total">
                <strong>${formatStatsKm(totalDistanceMeters)}</strong>
                <span>km</span>
            </div>
            <div class="stats-dashboard-total-label">
                HEILDARVEGALENGD
            </div>
        </div>


        <div class="stats-record-grid">

            <article class="stats-record-card">
                <span class="stats-record-icon">◎</span>
                <div>
                    <span class="stats-record-label">Lengsti leikur</span>
                    <div class="stats-record-value">
                        <strong>${longestMatch ? formatStatsKm(longestMatch.distanceTotalM) : "–"}</strong>
                        <span>km</span>
                    </div>
                    <small>${escapeHtml(longestMatchTitle)}</small>
                </div>
            </article>

            <article class="stats-record-card">
                <span class="stats-record-icon">♡</span>
                <div>
                    <span class="stats-record-label">Hæsti meðalpúls</span>
                    <div class="stats-record-value">
                        <strong>${highestAverageHrMatch ? Math.round(highestAverageHrMatch.hrAvgTotal) : "–"}</strong>
                        <span>bpm</span>
                    </div>
                    <small>${escapeHtml(highestHrMatchTitle)}</small>
                </div>
            </article>

        </div>


        <section class="stats-average-card">
            <h4>MEÐALTAL</h4>
            <div class="stats-average-grid">

                <div class="stats-average-item">
                    <strong>${formatStatsKm(averageDistanceMeters)}</strong>
                    <span class="stats-average-unit">km/leik</span>
                    <small>Meðalvegalengd</small>
                </div>

                <div class="stats-average-item">
                    <strong>${averageHeartRate > 0 ? averageHeartRate : "–"}</strong>
                    <span class="stats-average-unit">bpm</span>
                    <small>Meðalpúls</small>
                </div>

                <div class="stats-average-item">
                    <strong>${fitnessMatches.length}</strong>
                    <small>Garmin leikir</small>
                </div>

            </div>
        </section>


        <section class="stats-half-dashboard">

            <div class="stats-half-dashboard-item">
                <div class="stats-half-dashboard-heading">
                    <span>1H</span>
                    <strong>${formatStatsKm(averageFirstHalfDistance)} <small>km</small></strong>
                </div>
                <div class="stats-half-progress">
                    <span style="width:${firstHalfPercent}%"></span>
                </div>
                <small>${firstHalfPercent}%</small>
            </div>

            <div class="stats-half-dashboard-item">
                <div class="stats-half-dashboard-heading">
                    <span>2H</span>
                    <strong>${formatStatsKm(averageSecondHalfDistance)} <small>km</small></strong>
                </div>
                <div class="stats-half-progress">
                    <span style="width:${secondHalfPercent}%"></span>
                </div>
                <small>${secondHalfPercent}%</small>
            </div>

        </section>


        <section class="stats-leaderboard">
            <div class="stats-leaderboard-heading">
                <span>◇</span>
                <div>
                    <strong>TOPP LEIKIR</strong>
                    <small>eftir vegalengd</small>
                </div>
            </div>

            <div class="stats-leaderboard-list">
                ${topMatchesHtml}
            </div>
        </section>
    `;
}


function formatStatsDate(
    value
) {

    if (!value) {
        return "";
    }

    const parts =
        String(value).split("-");

    if (parts.length !== 3) {
        return value;
    }

    return `${parts[2]}.${parts[1]}.${parts[0]}`;
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

window.setInterval(() => {
    if (document.visibilityState === "visible" && hasLoadedMatches) {
        loadMatchesFromSupabase({
            showLoading: false,
            force: false
        });
    }
}, 60000);

window.addEventListener("pageshow", event => {
    if (event.persisted && hasLoadedMatches) {
        renderAll();
    }
});



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

                currentMatchFormUserName = "";
                lastAutoFilledRole = "";

                renderAll();

                return;
            }


            window.setTimeout(
                async () => {

                    await loadCurrentMatchFormUserName(
                        session
                    );

                    await loadMatchesFromSupabase({
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


    const editRequested =
        params.get(
            "edit"
        );


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


    if (
        editRequested
    ) {

        pendingEditMatchId =
            editRequested;


        switchView(
            "upcoming"
        );


        openPendingEditIfReady();
    }


    if (
        !editRequested
        &&
        (
            requestedView
            ||
            createRequested
        )
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