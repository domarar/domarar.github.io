const menuButton = document.getElementById("menuButton");
const menuOverlay = document.getElementById("menuOverlay");
const menuClose = document.getElementById("menuClose");

function openMenu() {
    menuOverlay.classList.add("open");
    document.body.style.overflow = "hidden";
}

function closeMenu() {
    menuOverlay.classList.remove("open");
    document.body.style.overflow = "";
}

menuButton.addEventListener("click", openMenu);

menuClose.addEventListener("click", closeMenu);

menuOverlay.addEventListener("click", event => {
    if (event.target === menuOverlay) {
        closeMenu();
    }
});

document.addEventListener("keydown", event => {
    if (event.key === "Escape") {
        closeMenu();
        closeAbout();
    }
});
const aboutMenuButton = document.getElementById("aboutMenuButton");
const aboutOverlay = document.getElementById("aboutOverlay");
const aboutClose = document.getElementById("aboutClose");

function openAbout() {
    closeMenu();
    aboutOverlay.classList.add("open");
    document.body.style.overflow = "hidden";
}

function closeAbout() {
    aboutOverlay.classList.remove("open");
    document.body.style.overflow = "";
}

aboutMenuButton.addEventListener("click", openAbout);

aboutClose.addEventListener("click", closeAbout);

aboutOverlay.addEventListener("click", event => {
    if (event.target === aboutOverlay) {
        closeAbout();
    }
});