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