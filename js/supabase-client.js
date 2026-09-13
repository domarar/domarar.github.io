const supabaseClient =
    window.supabase.createClient(
        SUPABASE_URL,
        SUPABASE_PUBLISHABLE_KEY
    );

// =========================================
// AUTH ELEMENTS
// =========================================

const authGate =
    document.getElementById(
        "authGate"
    );

const authForm =
    document.getElementById(
        "authForm"
    );

const authName =
    document.getElementById(
        "authName"
    );

const authNameField =
    document.getElementById(
        "authNameField"
    );

const authEmail =
    document.getElementById(
        "authEmail"
    );

const authPassword =
    document.getElementById(
        "authPassword"
    );

const authConfirmPassword =
    document.getElementById(
        "authConfirmPassword"
    );

const authConfirmPasswordField =
    document.getElementById(
        "authConfirmPasswordField"
    );

const authMessage =
    document.getElementById(
        "authMessage"
    );

const authTitle =
    document.getElementById(
        "authTitle"
    );

const authText =
    document.getElementById(
        "authText"
    );

const authSubmitButton =
    document.getElementById(
        "authSubmitButton"
    );

const forgotPasswordButton =
    document.getElementById(
        "forgotPasswordButton"
    );

const showLoginButton =
    document.getElementById(
        "showLoginButton"
    );

const showSignupButton =
    document.getElementById(
        "showSignupButton"
    );

const leiktiminnApp =
    document.getElementById(
        "leiktiminnApp"
    );

// =========================================
// PROFILE ELEMENTS
// =========================================

const headerProfileInitials =
    document.getElementById(
        "headerProfileInitials"
    );

const profileAvatarImage =
    document.getElementById(
        "profileAvatarImage"
    );

const profileAvatarInitials =
    document.getElementById(
        "profileAvatarInitials"
    );

const profileDisplayName =
    document.getElementById(
        "profileDisplayName"
    );

const profileDisplayEmail =
    document.getElementById(
        "profileDisplayEmail"
    );

const profileAccountName =
    document.getElementById(
        "profileAccountName"
    );

const profileAccountEmail =
    document.getElementById(
        "profileAccountEmail"
    );

const editProfileButton =
    document.getElementById(
        "editProfileButton"
    );

const profileEditPanel =
    document.getElementById(
        "profileEditPanel"
    );

const cancelProfileEditButton =
    document.getElementById(
        "cancelProfileEditButton"
    );

const profileForm =
    document.getElementById(
        "profileForm"
    );

const profileName =
    document.getElementById(
        "profileName"
    );

const profileEmail =
    document.getElementById(
        "profileEmail"
    );

const profileMessage =
    document.getElementById(
        "profileMessage"
    );

const saveProfileButton =
    document.getElementById(
        "saveProfileButton"
    );

const profileAvatarInput =
    document.getElementById(
        "profileAvatarInput"
    );

const chooseProfileAvatarButton =
    document.getElementById(
        "chooseProfileAvatarButton"
    );

const removeProfileAvatarButton =
    document.getElementById(
        "removeProfileAvatarButton"
    );

const avatarMessage =
    document.getElementById(
        "avatarMessage"
    );

const profileShowPasswordButton =
    document.getElementById(
        "showPasswordButton"
    );

const profilePasswordPanel =
    document.getElementById(
        "passwordPanel"
    );

const profileCancelPasswordButton =
    document.getElementById(
        "cancelPasswordButton"
    );

const profileChangePasswordForm =
    document.getElementById(
        "changePasswordForm"
    );

const newPassword =
    document.getElementById(
        "newPassword"
    );

const confirmNewPassword =
    document.getElementById(
        "confirmNewPassword"
    );

const passwordMessage =
    document.getElementById(
        "passwordMessage"
    );

const changePasswordButton =
    document.getElementById(
        "changePasswordButton"
    );

const logoutButton =
    document.getElementById(
        "logoutButton"
    );

// =========================================
// GARMIN ELEMENTS
// =========================================

const garminConnectionStatus =
    document.getElementById(
        "garminConnectionStatus"
    );

const connectGarminButton =
    document.getElementById(
        "connectGarminButton"
    );

const garminPairingBox =
    document.getElementById(
        "garminPairingBox"
    );

const garminPairingCode =
    document.getElementById(
        "garminPairingCode"
    );

const cancelGarminPairingButton =
    document.getElementById(
        "cancelGarminPairingButton"
    );


let forgetGarminButton =
    document.getElementById(
        "forgetGarminButton"
    );


let garminDeviceActions =
    document.getElementById(
        "garminDeviceActions"
    );


function ensureGarminDeviceActions() {

    if (!connectGarminButton) {

        return;
    }


    if (!garminDeviceActions) {

        garminDeviceActions =
            document.createElement(
                "div"
            );

        garminDeviceActions.id =
            "garminDeviceActions";

        garminDeviceActions.style.display =
            "flex";

        garminDeviceActions.style.alignItems =
            "center";

        garminDeviceActions.style.gap =
            "8px";

        garminDeviceActions.style.flexWrap =
            "wrap";

        garminDeviceActions.style.marginTop =
            "2px";


        connectGarminButton.parentNode.insertBefore(
            garminDeviceActions,
            connectGarminButton
        );


        garminDeviceActions.appendChild(
            connectGarminButton
        );
    }


    if (!forgetGarminButton) {

        forgetGarminButton =
            document.createElement(
                "button"
            );

        forgetGarminButton.id =
            "forgetGarminButton";

        forgetGarminButton.type =
            "button";

        forgetGarminButton.className =
            "profile-button-secondary";

        forgetGarminButton.textContent =
            "Aftengja úr";

        forgetGarminButton.hidden =
            true;


        garminDeviceActions.appendChild(
            forgetGarminButton
        );
    }
}


ensureGarminDeviceActions();

// =========================================
// STATE
// =========================================

let authMode =
    (
        window.location.hash.includes("type=recovery")
        || window.location.search.includes("type=recovery")
    )
        ? "recovery"
        : "login";

let currentUser =
    null;

let currentProfile =
    null;

let currentPairingCodeId =
    null;


let currentGarminDevice =
    null;

// =========================================
// AUTH VIEW
// =========================================

function showLoggedOut() {

    document.body.classList.add(
        "auth-locked"
    );

    if (authGate) {

        authGate.style.display =
            "flex";
    }

    if (leiktiminnApp) {

        leiktiminnApp.style.display =
            "none";
    }
}

function showLoggedIn() {

    document.body.classList.remove(
        "auth-locked"
    );

    if (authGate) {

        authGate.style.display =
            "none";
    }

    if (leiktiminnApp) {

        leiktiminnApp.style.display =
            "";
    }
}

// =========================================
// LOGIN / SIGNUP / RECOVERY MODE
// =========================================

function setAuthMode(
    mode
) {

    authMode =
        mode === "signup"
            ? "signup"
            : mode === "recovery"
                ? "recovery"
                : "login";

    const signupMode =
        authMode === "signup";

    const recoveryMode =
        authMode === "recovery";

    if (authNameField) {

        authNameField.hidden =
            !signupMode;
    }

    if (authConfirmPasswordField) {

        authConfirmPasswordField.hidden =
            !(signupMode || recoveryMode);
    }

    if (authName) {

        authName.required =
            signupMode;
    }

    if (authConfirmPassword) {

        authConfirmPassword.required =
            signupMode || recoveryMode;
    }

    if (authPassword) {

        authPassword.autocomplete =
            signupMode || recoveryMode
                ? "new-password"
                : "current-password";

        authPassword.placeholder =
            recoveryMode
                ? "Nýtt lykilorð"
                : "Lykilorð";
    }

    if (authTitle) {

        authTitle.textContent =
            signupMode
                ? "Búa til aðgang"
                : recoveryMode
                    ? "Veldu nýtt lykilorð"
                    : "Innskráning";
    }

    if (authText) {

        authText.textContent =
            signupMode
                ? "Búðu til Leiktíminn aðgang með nafni, netfangi og lykilorði."
                : recoveryMode
                    ? "Sláðu inn nýtt lykilorð fyrir aðganginn þinn."
                    : "Skráðu inn netfang og lykilorð til að skrá þig inn.";
    }

    if (authSubmitButton) {

        authSubmitButton.textContent =
            signupMode
                ? "Búa til aðgang"
                : recoveryMode
                    ? "Vista nýtt lykilorð"
                    : "Skrá inn";
    }

    if (showLoginButton) {

        showLoginButton.hidden =
            recoveryMode;
    }

    if (showSignupButton) {

        showSignupButton.hidden =
            recoveryMode;
    }

    if (forgotPasswordButton) {

        forgotPasswordButton.hidden =
            recoveryMode;
    }

    setModeButtonStyles(
        signupMode
    );

    if (authMessage) {

        authMessage.textContent =
            "";
    }
}

function setModeButtonStyles(
    signupMode
) {

    if (
        !showLoginButton
        || !showSignupButton
    ) {

        return;
    }

    if (signupMode) {

        showLoginButton.style.borderColor =
            "rgba(255,255,255,.14)";

        showLoginButton.style.background =
            "rgba(255,255,255,.04)";

        showSignupButton.style.borderColor =
            "rgba(88,199,91,.55)";

        showSignupButton.style.background =
            "rgba(88,199,91,.14)";

    } else {

        showLoginButton.style.borderColor =
            "rgba(88,199,91,.55)";

        showLoginButton.style.background =
            "rgba(88,199,91,.14)";

        showSignupButton.style.borderColor =
            "rgba(255,255,255,.14)";

        showSignupButton.style.background =
            "rgba(255,255,255,.04)";
    }
}

// =========================================
// LOGIN / SIGNUP BUTTONS
// =========================================

if (showLoginButton) {

    showLoginButton.addEventListener(
        "click",
        function () {

            setAuthMode(
                "login"
            );
        }
    );
}

if (showSignupButton) {

    showSignupButton.addEventListener(
        "click",
        function () {

            setAuthMode(
                "signup"
            );
        }
    );
}

// =========================================
// FORGOT PASSWORD
// =========================================

if (forgotPasswordButton) {

    forgotPasswordButton.addEventListener(
        "click",
        async function () {

            const email =
                authEmail
                    ? authEmail.value.trim()
                    : "";

            if (!email) {

                if (authMessage) {

                    authMessage.textContent =
                        "Sláðu fyrst inn netfangið þitt.";
                }

                return;
            }

            if (authMessage) {

                authMessage.textContent =
                    "Sendi endurstillingarpóst...";
            }

            const {
                error
            } =
                await supabaseClient.auth
                    .resetPasswordForEmail(
                        email,
                        {
                            redirectTo:
                                window.location.origin
                                + "/leiktiminn.html"
                        }
                    );

            if (error) {

                console.error(
                    "Password reset error:",
                    error
                );

                if (authMessage) {

                    authMessage.textContent =
                        error.message
                        || "Ekki tókst að senda endurstillingarpóst.";
                }

                return;
            }

            if (authMessage) {

                authMessage.textContent =
                    "Endurstillingarpóstur hefur verið sendur.";
            }
        }
    );
}

// =========================================
// SESSION
// =========================================

async function checkAuthSession() {

    const {
        data: {
            session
        },
        error
    } =
        await supabaseClient.auth
            .getSession();

    if (error) {

        console.error(
            "Auth session error:",
            error
        );

        currentUser =
            null;

        currentProfile =
            null;

        showLoggedOut();

        return;
    }

    if (
        session
        && session.user
    ) {

        currentUser =
            session.user;

        if (
            authMode === "recovery"
        ) {

            showLoggedOut();

            return;
        }

        showLoggedIn();

        await loadUserProfile();

        await loadGarminStatus();

    } else {

        currentUser =
            null;

        currentProfile =
            null;

        showLoggedOut();

        setAuthMode(
            "login"
        );
    }
}

// =========================================
// LOGIN FORM
// =========================================

if (authForm) {

    authForm.addEventListener(
        "submit",
        async function (event) {

            event.preventDefault();

            const email =
                authEmail
                    ? authEmail.value.trim()
                    : "";

            const password =
                authPassword
                    ? authPassword.value
                    : "";

            const confirmPassword =
                authConfirmPassword
                    ? authConfirmPassword.value
                    : "";

            // =========================================
            // PASSWORD RECOVERY
            // =========================================

            if (
                authMode === "recovery"
            ) {

                if (
                    password.length < 6
                ) {

                    if (authMessage) {

                        authMessage.textContent =
                            "Lykilorð þarf að vera að minnsta kosti 6 stafir.";
                    }

                    return;
                }

                if (
                    password
                    !== confirmPassword
                ) {

                    if (authMessage) {

                        authMessage.textContent =
                            "Lykilorðin passa ekki saman.";
                    }

                    return;
                }

                if (authMessage) {

                    authMessage.textContent =
                        "Vista nýtt lykilorð...";
                }

                const {
                    error
                } =
                    await supabaseClient.auth
                        .updateUser({
                            password
                        });

                if (error) {

                    console.error(
                        "Password recovery update error:",
                        error
                    );

                    if (authMessage) {

                        authMessage.textContent =
                            error.message
                            || "Ekki tókst að vista nýtt lykilorð.";
                    }

                    return;
                }

                if (authMessage) {

                    authMessage.textContent =
                        "Lykilorði hefur verið breytt.";
                }

                authForm.reset();

                showLoggedOut();

                await supabaseClient.auth
                    .signOut();

                setAuthMode(
                    "login"
                );

                return;
            }

            // =========================================
            // NORMAL LOGIN / SIGNUP
            // =========================================

            if (
                !email
                || !password
            ) {

                if (authMessage) {

                    authMessage.textContent =
                        "Sláðu inn netfang og lykilorð.";
                }

                return;
            }

            if (
                authMode === "signup"
            ) {

                await createAccount(
                    email,
                    password
                );

                return;
            }

            await signIn(
                email,
                password
            );
        }
    );
}

// =========================================
// SIGN IN
// =========================================

async function signIn(
    email,
    password
) {

    if (authMessage) {

        authMessage.textContent =
            "Skrái inn...";
    }

    if (authSubmitButton) {

        authSubmitButton.disabled =
            true;
    }

    const {
        data,
        error
    } =
        await supabaseClient.auth
            .signInWithPassword({
                email,
                password
            });

    if (authSubmitButton) {

        authSubmitButton.disabled =
            false;
    }

    if (error) {

        console.error(
            "Login error:",
            error
        );

        if (authMessage) {

            authMessage.textContent =
                error.message
                || "Ekki tókst að skrá inn.";
        }

        return;
    }

    if (
        data
        && data.session
        && data.session.user
    ) {

        currentUser =
            data.session.user;

        if (authMessage) {

            authMessage.textContent =
                "";
        }

        showLoggedIn();

        await loadUserProfile();

        await loadGarminStatus();
    }
}

// =========================================
// CREATE ACCOUNT
// =========================================

async function createAccount(
    email,
    password
) {

    const name =
        authName
            ? authName.value.trim()
            : "";

    const confirmPassword =
        authConfirmPassword
            ? authConfirmPassword.value
            : "";

    if (!name) {

        if (authMessage) {

            authMessage.textContent =
                "Sláðu inn nafnið þitt.";
        }

        return;
    }

    if (
        password.length < 6
    ) {

        if (authMessage) {

            authMessage.textContent =
                "Lykilorð þarf að vera að minnsta kosti 6 stafir.";
        }

        return;
    }

    if (
        password
        !== confirmPassword
    ) {

        if (authMessage) {

            authMessage.textContent =
                "Lykilorðin passa ekki saman.";
        }

        return;
    }

    if (authMessage) {

        authMessage.textContent =
            "Bý til aðgang...";
    }

    if (authSubmitButton) {

        authSubmitButton.disabled =
            true;
    }

    const {
        data,
        error
    } =
        await supabaseClient.auth
            .signUp({
                email,
                password,
                options: {

                    data: {
                        name
                    },

                    emailRedirectTo:
                        window.location.origin
                        + "/leiktiminn.html"
                }
            });

    if (authSubmitButton) {

        authSubmitButton.disabled =
            false;
    }

    if (error) {

        console.error(
            "Signup error:",
            error
        );

        if (authMessage) {

            authMessage.textContent =
                error.message
                || "Ekki tókst að búa til aðgang.";
        }

        return;
    }

    if (
        data
        && data.session
        && data.session.user
    ) {

        currentUser =
            data.session.user;

        if (authMessage) {

            authMessage.textContent =
                "";
        }

        showLoggedIn();

        await loadUserProfile();

        await loadGarminStatus();

        return;
    }

    if (authMessage) {

        authMessage.textContent =
            "Aðgangur búinn til. Athugaðu tölvupóstinn þinn og staðfestu netfangið.";
    }
}

// =========================================
// LOAD PROFILE
// =========================================

async function loadUserProfile() {

    if (!currentUser) {

        return;
    }

    const {
        data,
        error
    } =
        await supabaseClient
            .from(
                "profiles"
            )
            .select(
                "id, name, avatar_url"
            )
            .eq(
                "id",
                currentUser.id
            )
            .maybeSingle();

    if (error) {

        console.error(
            "Profile load error:",
            error
        );

        renderUserProfile(
            null
        );

        return;
    }

    let profile =
        data;

    if (!profile) {

        const fallbackName =
            currentUser.user_metadata
            && currentUser.user_metadata.name
                ? currentUser.user_metadata.name
                : "";

        const {
            data: insertedProfile,
            error: insertError
        } =
            await supabaseClient
                .from(
                    "profiles"
                )
                .upsert({
                    id:
                        currentUser.id,

                    name:
                        fallbackName
                })
                .select(
                    "id, name, avatar_url"
                )
                .single();

        if (insertError) {

            console.error(
                "Profile create error:",
                insertError
            );

            renderUserProfile(
                null
            );

            return;
        }

        profile =
            insertedProfile;
    }

    currentProfile =
        profile;

    renderUserProfile(
        profile
    );
}

// =========================================
// RENDER PROFILE
// =========================================

function renderUserProfile(
    profile
) {

    if (!currentUser) {

        return;
    }

    const metadataName =
        currentUser.user_metadata
        && currentUser.user_metadata.name
            ? currentUser.user_metadata.name.trim()
            : "";

    const profileNameValue =
        profile
        && profile.name
            ? profile.name.trim()
            : "";

    const name =
        profileNameValue
        || metadataName;

    const email =
        currentUser.email
        || "";

    const displayName =
        name
        || email
        || "Leiktíminn notandi";

    const initials =
        getInitials(
            displayName
        );

    if (profileDisplayName) {

        profileDisplayName.textContent =
            displayName;
    }

    if (profileDisplayEmail) {

        profileDisplayEmail.textContent =
            email;
    }

    if (profileAccountName) {

        profileAccountName.textContent =
            displayName;
    }

    if (profileAccountEmail) {

        profileAccountEmail.textContent =
            email;
    }

    if (profileName) {

        profileName.value =
            name;
    }

    if (profileEmail) {

        profileEmail.value =
            email;
    }

    if (profileAvatarInitials) {

        profileAvatarInitials.textContent =
            initials;
    }

    const avatarUrl =
        profile
        && profile.avatar_url
            ? profile.avatar_url
            : "";

    renderHeaderAvatar(
        avatarUrl,
        initials
    );

    if (
        avatarUrl
        && profileAvatarImage
    ) {

        profileAvatarImage.src =
            addCacheBust(
                avatarUrl
            );

        profileAvatarImage.hidden =
            false;

        if (profileAvatarInitials) {

            profileAvatarInitials.hidden =
                true;
        }

        if (removeProfileAvatarButton) {

            removeProfileAvatarButton.hidden =
                false;
        }

    } else {

        if (profileAvatarImage) {

            profileAvatarImage.hidden =
                true;

            profileAvatarImage.removeAttribute(
                "src"
            );
        }

        if (profileAvatarInitials) {

            profileAvatarInitials.hidden =
                false;
        }

        if (removeProfileAvatarButton) {

            removeProfileAvatarButton.hidden =
                true;
        }
    }

    resetAvatarButton();
}

// =========================================
// HEADER AVATAR
// =========================================

function renderHeaderAvatar(
    avatarUrl,
    initials
) {

    if (!headerProfileInitials) {

        return;
    }

    if (avatarUrl) {

        headerProfileInitials.textContent =
            "";

        headerProfileInitials.style.backgroundImage =
            `url("${addCacheBust(avatarUrl)}")`;

        headerProfileInitials.style.backgroundSize =
            "cover";

        headerProfileInitials.style.backgroundPosition =
            "center";

        headerProfileInitials.style.backgroundRepeat =
            "no-repeat";

        headerProfileInitials.classList.add(
            "has-profile-image"
        );

        return;
    }

    headerProfileInitials.style.backgroundImage =
        "";

    headerProfileInitials.style.backgroundSize =
        "";

    headerProfileInitials.style.backgroundPosition =
        "";

    headerProfileInitials.style.backgroundRepeat =
        "";

    headerProfileInitials.classList.remove(
        "has-profile-image"
    );

    headerProfileInitials.textContent =
        initials;
}

// =========================================
// INITIALS
// =========================================

function getInitials(
    value
) {

    const parts =
        String(
            value || ""
        )
            .trim()
            .split(
                /\s+/
            )
            .filter(
                Boolean
            );

    if (
        parts.length === 0
    ) {

        return "--";
    }

    if (
        parts.length === 1
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
    )
        .toUpperCase();
}

// =========================================
// CACHE BUST
// =========================================

function addCacheBust(
    url
) {

    if (!url) {

        return "";
    }

    const separator =
        url.includes("?")
            ? "&"
            : "?";

    return (
        url
        + separator
        + "v="
        + Date.now()
    );
}

// =========================================
// PROFILE EDIT PANEL
// =========================================

function openProfileEditor() {

    if (!profileEditPanel) {

        return;
    }

    if (
        currentProfile
        && profileName
    ) {

        profileName.value =
            currentProfile.name
            || "";
    }

    if (
        currentUser
        && profileEmail
    ) {

        profileEmail.value =
            currentUser.email
            || "";
    }

    if (profileMessage) {

        profileMessage.textContent =
            "";
    }

    if (avatarMessage) {

        avatarMessage.textContent =
            "";
    }

    profileEditPanel.hidden =
        false;

    if (editProfileButton) {

        editProfileButton.hidden =
            true;
    }

    if (profileName) {

        profileName.focus();
    }
}

function closeProfileEditor() {

    if (profileEditPanel) {

        profileEditPanel.hidden =
            true;
    }

    if (editProfileButton) {

        editProfileButton.hidden =
            false;
    }

    if (profileMessage) {

        profileMessage.textContent =
            "";
    }

    if (avatarMessage) {

        avatarMessage.textContent =
            "";
    }

    if (
        currentProfile
        && profileName
    ) {

        profileName.value =
            currentProfile.name
            || "";
    }

    if (profileAvatarInput) {

        profileAvatarInput.value =
            "";
    }
}

if (editProfileButton) {

    editProfileButton.addEventListener(
        "click",
        openProfileEditor
    );
}

if (cancelProfileEditButton) {

    cancelProfileEditButton.addEventListener(
        "click",
        closeProfileEditor
    );
}

// =========================================
// AVATAR PICKER
// =========================================

if (
    chooseProfileAvatarButton
    && profileAvatarInput
) {

    chooseProfileAvatarButton.addEventListener(
        "click",
        function () {

            profileAvatarInput.click();
        }
    );
}

if (profileAvatarInput) {

    profileAvatarInput.addEventListener(
        "change",
        async function () {

            const file =
                profileAvatarInput.files
                && profileAvatarInput.files[0]
                    ? profileAvatarInput.files[0]
                    : null;

            if (!file) {

                return;
            }

            await uploadProfileAvatar(
                file
            );
        }
    );
}

// =========================================
// UPLOAD AVATAR
// =========================================

async function uploadProfileAvatar(
    file
) {

    if (!currentUser) {

        return;
    }

    if (
        !file.type.startsWith(
            "image/"
        )
    ) {

        if (avatarMessage) {

            avatarMessage.textContent =
                "Veldu myndaskrá.";
        }

        return;
    }

    const allowedTypes = [
        "image/jpeg",
        "image/png",
        "image/webp"
    ];

    if (
        !allowedTypes.includes(
            file.type
        )
    ) {

        if (avatarMessage) {

            avatarMessage.textContent =
                "Aðeins JPG, PNG eða WebP myndir.";
        }

        return;
    }

    const maxFileSize =
        5
        * 1024
        * 1024;

    if (
        file.size
        > maxFileSize
    ) {

        if (avatarMessage) {

            avatarMessage.textContent =
                "Myndin má að hámarki vera 5 MB.";
        }

        return;
    }

    const extension =
        getFileExtension(
            file
        );

    const filePath =
        currentUser.id
        + "/avatar."
        + extension;

    if (avatarMessage) {

        avatarMessage.textContent =
            "Hleð upp mynd...";
    }

    if (chooseProfileAvatarButton) {

        chooseProfileAvatarButton.disabled =
            true;

        chooseProfileAvatarButton.textContent =
            "Hleð upp...";
    }

    const {
        error: uploadError
    } =
        await supabaseClient.storage
            .from(
                "avatars"
            )
            .upload(
                filePath,
                file,
                {
                    cacheControl:
                        "3600",

                    upsert:
                        true,

                    contentType:
                        file.type
                }
            );

    if (uploadError) {

        console.error(
            "Avatar upload error:",
            uploadError
        );

        if (avatarMessage) {

            avatarMessage.textContent =
                uploadError.message
                || "Ekki tókst að hlaða upp mynd.";
        }

        resetAvatarButton();

        return;
    }

    const {
        data: publicUrlData
    } =
        supabaseClient.storage
            .from(
                "avatars"
            )
            .getPublicUrl(
                filePath
            );

    const avatarUrl =
        publicUrlData
        && publicUrlData.publicUrl
            ? publicUrlData.publicUrl
            : "";

    if (!avatarUrl) {

        if (avatarMessage) {

            avatarMessage.textContent =
                "Ekki tókst að sækja slóð á mynd.";
        }

        resetAvatarButton();

        return;
    }

    const {
        error: profileError
    } =
        await supabaseClient
            .from(
                "profiles"
            )
            .update({
                avatar_url:
                    avatarUrl,

                updated_at:
                    new Date()
                        .toISOString()
            })
            .eq(
                "id",
                currentUser.id
            );

    if (profileError) {

        console.error(
            "Avatar profile update error:",
            profileError
        );

        if (avatarMessage) {

            avatarMessage.textContent =
                "Mynd hlaðist upp en ekki tókst að vista hana á prófíl.";
        }

        resetAvatarButton();

        return;
    }

    if (!currentProfile) {

        currentProfile = {
            id:
                currentUser.id,

            name:
                currentUser.user_metadata
                && currentUser.user_metadata.name
                    ? currentUser.user_metadata.name
                    : "",

            avatar_url:
                avatarUrl
        };

    } else {

        currentProfile.avatar_url =
            avatarUrl;
    }

    renderUserProfile(
        currentProfile
    );

    if (avatarMessage) {

        avatarMessage.textContent =
            "Prófílmynd vistuð.";
    }

    if (profileAvatarInput) {

        profileAvatarInput.value =
            "";
    }

    resetAvatarButton();
}

// =========================================
// AVATAR FILE EXTENSION
// =========================================

function getFileExtension(
    file
) {

    if (
        file.type
        === "image/png"
    ) {

        return "png";
    }

    if (
        file.type
        === "image/webp"
    ) {

        return "webp";
    }

    return "jpg";
}

// =========================================
// RESET AVATAR BUTTON
// =========================================

function resetAvatarButton() {

    if (!chooseProfileAvatarButton) {

        return;
    }

    chooseProfileAvatarButton.disabled =
        false;

    chooseProfileAvatarButton.textContent =
        currentProfile
        && currentProfile.avatar_url
            ? "Breyta mynd"
            : "Velja mynd";
}

// =========================================
// REMOVE AVATAR
// =========================================

if (removeProfileAvatarButton) {

    removeProfileAvatarButton.addEventListener(
        "click",
        async function () {

            await removeProfileAvatar();
        }
    );
}

async function removeProfileAvatar() {

    if (
        !currentUser
        || !currentProfile
        || !currentProfile.avatar_url
    ) {

        return;
    }

    if (avatarMessage) {

        avatarMessage.textContent =
            "Fjarlægi mynd...";
    }

    if (removeProfileAvatarButton) {

        removeProfileAvatarButton.disabled =
            true;
    }

    const possiblePaths = [
        currentUser.id + "/avatar.jpg",
        currentUser.id + "/avatar.png",
        currentUser.id + "/avatar.webp"
    ];

    const {
        error: removeError
    } =
        await supabaseClient.storage
            .from(
                "avatars"
            )
            .remove(
                possiblePaths
            );

    if (removeError) {

        console.error(
            "Avatar delete error:",
            removeError
        );
    }

    const {
        error: profileError
    } =
        await supabaseClient
            .from(
                "profiles"
            )
            .update({
                avatar_url:
                    null,

                updated_at:
                    new Date()
                        .toISOString()
            })
            .eq(
                "id",
                currentUser.id
            );

    if (profileError) {

        console.error(
            "Avatar profile remove error:",
            profileError
        );

        if (avatarMessage) {

            avatarMessage.textContent =
                "Ekki tókst að fjarlægja mynd.";
        }

        if (removeProfileAvatarButton) {

            removeProfileAvatarButton.disabled =
                false;
        }

        return;
    }

    currentProfile.avatar_url =
        null;

    renderUserProfile(
        currentProfile
    );

    if (avatarMessage) {

        avatarMessage.textContent =
            "Prófílmynd fjarlægð.";
    }

    if (removeProfileAvatarButton) {

        removeProfileAvatarButton.disabled =
            false;
    }

    resetAvatarButton();
}

// =========================================
// SAVE PROFILE
// =========================================

if (profileForm) {

    profileForm.addEventListener(
        "submit",
        async function (
            event
        ) {

            event.preventDefault();

            if (!currentUser) {

                return;
            }

            const name =
                profileName
                    ? profileName.value.trim()
                    : "";

            if (!name) {

                if (profileMessage) {

                    profileMessage.textContent =
                        "Nafn má ekki vera autt.";
                }

                return;
            }

            if (saveProfileButton) {

                saveProfileButton.disabled =
                    true;

                saveProfileButton.textContent =
                    "Vista...";
            }

            if (profileMessage) {

                profileMessage.textContent =
                    "";
            }

            const avatarUrl =
                currentProfile
                && currentProfile.avatar_url
                    ? currentProfile.avatar_url
                    : null;

            const {
                error: profileError
            } =
                await supabaseClient
                    .from(
                        "profiles"
                    )
                    .upsert({
                        id:
                            currentUser.id,

                        name:
                            name,

                        avatar_url:
                            avatarUrl,

                        updated_at:
                            new Date()
                                .toISOString()
                    });

            if (profileError) {

                console.error(
                    "Profile save error:",
                    profileError
                );

                if (profileMessage) {

                    profileMessage.textContent =
                        "Ekki tókst að vista prófíl.";
                }

                resetProfileSaveButton();

                return;
            }

            const {
                data: userData,
                error: userError
            } =
                await supabaseClient.auth
                    .updateUser({
                        data: {
                            name
                        }
                    });

            if (userError) {

                console.error(
                    "User metadata update error:",
                    userError
                );

            } else if (
                userData
                && userData.user
            ) {

                currentUser =
                    userData.user;
            }

            currentProfile = {
                id:
                    currentUser.id,

                name:
                    name,

                avatar_url:
                    avatarUrl
            };

            renderUserProfile(
                currentProfile
            );

            if (profileMessage) {

                profileMessage.textContent =
                    "Prófíll vistaður.";
            }

            resetProfileSaveButton();

            window.setTimeout(
                function () {

                    closeProfileEditor();
                },
                650
            );
        }
    );
}

function resetProfileSaveButton() {

    if (!saveProfileButton) {

        return;
    }

    saveProfileButton.disabled =
        false;

    saveProfileButton.textContent =
        "Vista";
}

// =========================================
// GARMIN STATUS
// =========================================

async function loadGarminStatus() {

    if (!currentUser) {

        return;
    }


    const {
        data,
        error
    } =
        await supabaseClient
            .from(
                "garmin_devices"
            )
            .select(
                "id, device_name, device_model, paired_at, last_seen_at, is_active"
            )
            .eq(
                "user_id",
                currentUser.id
            )
            .eq(
                "is_active",
                true
            )
            .order(
                "paired_at",
                {
                    ascending:
                        false
                }
            )
            .limit(
                1
            );


    if (error) {

        console.error(
            "Garmin status error:",
            error
        );


        currentGarminDevice =
            null;


        if (garminConnectionStatus) {

            garminConnectionStatus.textContent =
                "Ekki tengt";
        }


        if (forgetGarminButton) {

            forgetGarminButton.hidden =
                true;
        }


        return;
    }


    const device =
        data
        && data.length
            ? data[0]
            : null;


    currentGarminDevice =
        device;


    if (device) {

        if (garminConnectionStatus) {

            garminConnectionStatus.textContent =
                device.device_name
                || device.device_model
                || "Garmin úr tengt";
        }


        if (connectGarminButton) {

            connectGarminButton.textContent =
                "Tengja annað úr";
        }


        if (forgetGarminButton) {

            forgetGarminButton.hidden =
                false;

            forgetGarminButton.disabled =
                false;

            forgetGarminButton.textContent =
                "Gleyma úri";
        }


        hideGarminPairingBox();

    } else {

        if (garminConnectionStatus) {

            garminConnectionStatus.textContent =
                "Ekki tengt";
        }


        if (connectGarminButton) {

            connectGarminButton.textContent =
                "Tengja Garmin úr";
        }


        if (forgetGarminButton) {

            forgetGarminButton.hidden =
                true;

            forgetGarminButton.disabled =
                false;

            forgetGarminButton.textContent =
                "Gleyma úri";
        }


        await restoreActivePairingCode();
    }
}


async function forgetGarminDevice() {

    if (
        !currentUser
        || !currentGarminDevice
    ) {

        return;
    }


    const deviceLabel =
        currentGarminDevice.device_name
        || currentGarminDevice.device_model
        || "Garmin úrið";


    const confirmed =
        window.confirm(
            `Gleyma ${deviceLabel}? Gamla úrið mun ekki lengur geta samstillt við Leiktímann.`
        );


    if (!confirmed) {

        return;
    }


    if (forgetGarminButton) {

        forgetGarminButton.disabled =
            true;

        forgetGarminButton.textContent =
            "Aftengi...";
    }


    if (connectGarminButton) {

        connectGarminButton.disabled =
            true;
    }


    const deviceId =
        currentGarminDevice.id;


    const {
        error
    } =
        await supabaseClient
            .from(
                "garmin_devices"
            )
            .update({
                is_active:
                    false
            })
            .eq(
                "id",
                deviceId
            )
            .eq(
                "user_id",
                currentUser.id
            );


    if (error) {

        console.error(
            "Forget Garmin device error:",
            error
        );


        if (garminConnectionStatus) {

            garminConnectionStatus.textContent =
                "Ekki tókst að gleyma úrinu";
        }


        if (forgetGarminButton) {

            forgetGarminButton.disabled =
                false;

            forgetGarminButton.textContent =
                "Gleyma úri";
        }


        if (connectGarminButton) {

            connectGarminButton.disabled =
                false;
        }


        return;
    }


    await deleteOldPairingCodes();


    currentGarminDevice =
        null;


    hideGarminPairingBox();


    if (garminConnectionStatus) {

        garminConnectionStatus.textContent =
            "Ekki tengt";
    }


    if (connectGarminButton) {

        connectGarminButton.disabled =
            false;

        connectGarminButton.textContent =
            "Tengja Garmin úr";
    }


    if (forgetGarminButton) {

        forgetGarminButton.disabled =
            false;

        forgetGarminButton.textContent =
            "Gleyma úri";

        forgetGarminButton.hidden =
            true;
    }
}


if (forgetGarminButton) {

    forgetGarminButton.addEventListener(
        "click",
        async function () {

            await forgetGarminDevice();
        }
    );
}


// =========================================
// GARMIN PAIRING
// =========================================

if (connectGarminButton) {

    connectGarminButton.addEventListener(
        "click",
        async function () {

            await createGarminPairingCode();
        }
    );
}

if (cancelGarminPairingButton) {

    cancelGarminPairingButton.addEventListener(
        "click",
        async function () {

            await cancelGarminPairing();
        }
    );
}

// =========================================
// CREATE GARMIN PAIRING CODE
// =========================================

async function createGarminPairingCode() {

    if (!currentUser) {

        return;
    }

    if (connectGarminButton) {

        connectGarminButton.disabled =
            true;

        connectGarminButton.textContent =
            "Bý til kóða...";
    }

    await deleteOldPairingCodes();

    let createdCode =
        null;

    let createdRow =
        null;

    for (
        let attempt = 0;
        attempt < 5;
        attempt++
    ) {

        const code =
            generateSecurePairingCode();

        const expiresAt =
            new Date(
                Date.now()
                + 10 * 60 * 1000
            )
                .toISOString();

        const {
            data,
            error
        } =
            await supabaseClient
                .from(
                    "garmin_pairing_codes"
                )
                .insert({
                    user_id:
                        currentUser.id,

                    code:
                        code,

                    expires_at:
                        expiresAt
                })
                .select(
                    "id, code, expires_at"
                )
                .single();

        if (!error) {

            createdCode =
                code;

            createdRow =
                data;

            break;
        }

        if (
            error.code
            !== "23505"
        ) {

            console.error(
                "Garmin pairing code error:",
                error
            );

            break;
        }
    }

    if (
        !createdCode
        || !createdRow
    ) {

        if (connectGarminButton) {

            connectGarminButton.disabled =
                false;

            connectGarminButton.textContent =
                "Tengja Garmin úr";
        }

        if (garminConnectionStatus) {

            garminConnectionStatus.textContent =
                "Ekki tókst að búa til kóða";
        }

        return;
    }

    currentPairingCodeId =
        createdRow.id;

    showGarminPairingCode(
        createdCode
    );

    if (garminConnectionStatus) {

        garminConnectionStatus.textContent =
            "Bíður eftir Garmin úri";
    }

    if (connectGarminButton) {

        connectGarminButton.disabled =
            false;

        connectGarminButton.textContent =
            "Búa til nýjan kóða";
    }
}

// =========================================
// SECURE 6-DIGIT CODE
// =========================================

function generateSecurePairingCode() {

    const values =
        new Uint32Array(
            1
        );

    window.crypto.getRandomValues(
        values
    );

    const number =
        100000
        + (
            values[0]
            % 900000
        );

    return String(
        number
    );
}

// =========================================
// DELETE OLD PAIRING CODES
// =========================================

async function deleteOldPairingCodes() {

    if (!currentUser) {

        return;
    }

    const {
        error
    } =
        await supabaseClient
            .from(
                "garmin_pairing_codes"
            )
            .delete()
            .eq(
                "user_id",
                currentUser.id
            )
            .is(
                "claimed_at",
                null
            );

    if (error) {

        console.error(
            "Delete old Garmin pairing codes error:",
            error
        );
    }

    currentPairingCodeId =
        null;
}

// =========================================
// RESTORE ACTIVE PAIRING CODE
// =========================================

async function restoreActivePairingCode() {

    if (!currentUser) {

        return;
    }

    const now =
        new Date()
            .toISOString();

    const {
        data,
        error
    } =
        await supabaseClient
            .from(
                "garmin_pairing_codes"
            )
            .select(
                "id, code, expires_at, claimed_at"
            )
            .eq(
                "user_id",
                currentUser.id
            )
            .is(
                "claimed_at",
                null
            )
            .gt(
                "expires_at",
                now
            )
            .order(
                "created_at",
                {
                    ascending:
                        false
                }
            )
            .limit(
                1
            );

    if (error) {

        console.error(
            "Restore Garmin pairing code error:",
            error
        );

        return;
    }

    const pairing =
        data
        && data.length
            ? data[0]
            : null;

    if (!pairing) {

        hideGarminPairingBox();

        return;
    }

    currentPairingCodeId =
        pairing.id;

    showGarminPairingCode(
        pairing.code
    );

    if (garminConnectionStatus) {

        garminConnectionStatus.textContent =
            "Bíður eftir Garmin úri";
    }

    if (connectGarminButton) {

        connectGarminButton.textContent =
            "Búa til nýjan kóða";
    }
}

// =========================================
// DISPLAY PAIRING CODE
// =========================================

function showGarminPairingCode(
    code
) {

    if (garminPairingCode) {

        garminPairingCode.textContent =
            code;
    }

    if (garminPairingBox) {

        garminPairingBox.hidden =
            false;
    }
}

function hideGarminPairingBox() {

    if (garminPairingBox) {

        garminPairingBox.hidden =
            true;
    }

    if (garminPairingCode) {

        garminPairingCode.textContent =
            "------";
    }

    currentPairingCodeId =
        null;
}

// =========================================
// CANCEL PAIRING
// =========================================

async function cancelGarminPairing() {

    if (!currentUser) {

        return;
    }

    if (cancelGarminPairingButton) {

        cancelGarminPairingButton.disabled =
            true;

        cancelGarminPairingButton.textContent =
            "Hætti við...";
    }

    let query =
        supabaseClient
            .from(
                "garmin_pairing_codes"
            )
            .delete()
            .eq(
                "user_id",
                currentUser.id
            )
            .is(
                "claimed_at",
                null
            );

    if (currentPairingCodeId) {

        query =
            query.eq(
                "id",
                currentPairingCodeId
            );
    }

    const {
        error
    } =
        await query;

    if (error) {

        console.error(
            "Cancel Garmin pairing error:",
            error
        );
    }

    hideGarminPairingBox();

    if (garminConnectionStatus) {

        garminConnectionStatus.textContent =
            "Ekki tengt";
    }

    if (connectGarminButton) {

        connectGarminButton.disabled =
            false;

        connectGarminButton.textContent =
            "Tengja Garmin úr";
    }

    if (cancelGarminPairingButton) {

        cancelGarminPairingButton.disabled =
            false;

        cancelGarminPairingButton.textContent =
            "Hætta við";
    }
}

// =========================================
// PASSWORD PANEL
// =========================================

function openPasswordPanel() {

    if (!profilePasswordPanel) {

        return;
    }

    profilePasswordPanel.hidden =
        false;

    if (profileShowPasswordButton) {

        profileShowPasswordButton.hidden =
            true;
    }

    if (passwordMessage) {

        passwordMessage.textContent =
            "";
    }

    if (newPassword) {

        newPassword.value =
            "";

        newPassword.focus();
    }

    if (confirmNewPassword) {

        confirmNewPassword.value =
            "";
    }
}

function closePasswordPanel() {

    if (profilePasswordPanel) {

        profilePasswordPanel.hidden =
            true;
    }

    if (profileShowPasswordButton) {

        profileShowPasswordButton.hidden =
            false;
    }

    if (newPassword) {

        newPassword.value =
            "";
    }

    if (confirmNewPassword) {

        confirmNewPassword.value =
            "";
    }

    if (passwordMessage) {

        passwordMessage.textContent =
            "";
    }
}

if (profileShowPasswordButton) {

    profileShowPasswordButton.addEventListener(
        "click",
        openPasswordPanel
    );
}

if (profileCancelPasswordButton) {

    profileCancelPasswordButton.addEventListener(
        "click",
        closePasswordPanel
    );
}

// =========================================
// CHANGE PASSWORD
// =========================================

if (profileChangePasswordForm) {

    profileChangePasswordForm.addEventListener(
        "submit",
        async function (
            event
        ) {

            event.preventDefault();

            const password =
                newPassword
                    ? newPassword.value
                    : "";

            const confirmPassword =
                confirmNewPassword
                    ? confirmNewPassword.value
                    : "";

            if (
                password.length < 6
            ) {

                if (passwordMessage) {

                    passwordMessage.textContent =
                        "Lykilorð þarf að vera að minnsta kosti 6 stafir.";
                }

                return;
            }

            if (
                password
                !== confirmPassword
            ) {

                if (passwordMessage) {

                    passwordMessage.textContent =
                        "Lykilorðin passa ekki saman.";
                }

                return;
            }

            if (changePasswordButton) {

                changePasswordButton.disabled =
                    true;

                changePasswordButton.textContent =
                    "Vista...";
            }

            if (passwordMessage) {

                passwordMessage.textContent =
                    "";
            }

            const {
                error
            } =
                await supabaseClient.auth
                    .updateUser({
                        password
                    });

            if (error) {

                console.error(
                    "Password update error:",
                    error
                );

                if (passwordMessage) {

                    passwordMessage.textContent =
                        error.message
                        || "Ekki tókst að breyta lykilorði.";
                }

                resetPasswordButton();

                return;
            }

            if (passwordMessage) {

                passwordMessage.textContent =
                    "Lykilorði breytt.";
            }

            resetPasswordButton();

            window.setTimeout(
                function () {

                    closePasswordPanel();
                },
                800
            );
        }
    );
}

function resetPasswordButton() {

    if (!changePasswordButton) {

        return;
    }

    changePasswordButton.disabled =
        false;

    changePasswordButton.textContent =
        "Vista lykilorð";
}

// =========================================
// LOGOUT
// =========================================

if (logoutButton) {

    logoutButton.addEventListener(
        "click",
        async function () {

            logoutButton.disabled =
                true;

            logoutButton.textContent =
                "Skrái út...";

            const {
                error
            } =
                await supabaseClient.auth
                    .signOut();

            if (error) {

                console.error(
                    "Logout error:",
                    error
                );

                logoutButton.disabled =
                    false;

                logoutButton.textContent =
                    "Útskrá";

                return;
            }

            window.location.href =
                "leiktiminn.html";
        }
    );
}

// =========================================
// AUTH CHANGES
// =========================================

supabaseClient.auth.onAuthStateChange(
    function (
        event,
        session
    ) {

        if (
            event === "PASSWORD_RECOVERY"
        ) {

            showLoggedOut();

            setAuthMode(
                "recovery"
            );

            return;
        }

        if (
            authMode === "recovery"
        ) {

            showLoggedOut();

            return;
        }

        if (
            session
            && session.user
        ) {

            currentUser =
                session.user;

            showLoggedIn();

        } else {

            currentUser =
                null;

            currentProfile =
                null;

            showLoggedOut();
        }
    }
);

// =========================================
// START
// =========================================

checkAuthSession();