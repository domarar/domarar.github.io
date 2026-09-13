(() => {

    const menuButton =
        document.getElementById("menuButton");

    const authMenuButton =
        document.getElementById("authMenuButton");

    const menuOverlay =
        document.getElementById("menuOverlay");

    const menuClose =
        document.getElementById("menuClose");

    const aboutMenuButton =
        document.getElementById("aboutMenuButton");

    const aboutOverlay =
        document.getElementById("aboutOverlay");

    const aboutClose =
        document.getElementById("aboutClose");


    /* =========================================
       MAIN MENU
    ========================================== */

    function openMenu() {

        if (!menuOverlay) {
            return;
        }

        menuOverlay.classList.add("open");

        document.body.style.overflow =
            "hidden";


        if (menuButton) {
            menuButton.setAttribute(
                "aria-expanded",
                "true"
            );
        }


        if (authMenuButton) {
            authMenuButton.setAttribute(
                "aria-expanded",
                "true"
            );
        }
    }


    function closeMenu() {

        if (!menuOverlay) {
            return;
        }

        menuOverlay.classList.remove("open");


        if (
            !aboutOverlay ||
            !aboutOverlay.classList.contains("open")
        ) {
            document.body.style.overflow = "";
        }


        if (menuButton) {
            menuButton.setAttribute(
                "aria-expanded",
                "false"
            );
        }


        if (authMenuButton) {
            authMenuButton.setAttribute(
                "aria-expanded",
                "false"
            );
        }
    }


    /* =========================================
       UM DÓMARAR
    ========================================== */

    function openAbout() {

        if (!aboutOverlay) {
            return;
        }


        if (menuOverlay) {
            menuOverlay.classList.remove("open");
        }


        aboutOverlay.classList.add("open");

        document.body.style.overflow =
            "hidden";
    }


    function closeAbout() {

        if (!aboutOverlay) {
            return;
        }


        aboutOverlay.classList.remove("open");

        document.body.style.overflow =
            "";
    }


    /* =========================================
       BUTTON EVENTS
    ========================================== */

    if (menuButton) {

        menuButton.addEventListener(
            "click",
            openMenu
        );
    }


    if (authMenuButton) {

        authMenuButton.addEventListener(
            "click",
            openMenu
        );
    }


    if (menuClose) {

        menuClose.addEventListener(
            "click",
            closeMenu
        );
    }


    if (aboutMenuButton) {

        aboutMenuButton.addEventListener(
            "click",
            function (event) {

                event.preventDefault();
                event.stopPropagation();

                openAbout();

            }
        );
    }


    if (aboutClose) {

        aboutClose.addEventListener(
            "click",
            closeAbout
        );
    }


    /* =========================================
       CLICK OUTSIDE
    ========================================== */

    if (menuOverlay) {

        menuOverlay.addEventListener(
            "click",
            function (event) {

                if (
                    event.target === menuOverlay
                ) {
                    closeMenu();
                }

            }
        );
    }


    if (aboutOverlay) {

        aboutOverlay.addEventListener(
            "click",
            function (event) {

                if (
                    event.target === aboutOverlay
                ) {
                    closeAbout();
                }

            }
        );
    }


    /* =========================================
       ESCAPE
    ========================================== */

    document.addEventListener(
        "keydown",
        function (event) {

            if (event.key !== "Escape") {
                return;
            }


            if (
                aboutOverlay &&
                aboutOverlay.classList.contains("open")
            ) {

                closeAbout();

                return;
            }


            if (
                menuOverlay &&
                menuOverlay.classList.contains("open")
            ) {

                closeMenu();

            }

        }
    );


    /* =========================================
       SAME-ORIGIN LINKS IN PWA
    ========================================== */

    const isStandalone =
        window.matchMedia(
            "(display-mode: standalone)"
        ).matches ||
        window.navigator.standalone === true;


    if (isStandalone) {

        document.addEventListener(
            "click",
            function (event) {

                const link =
                    event.target.closest(
                        "a[href]"
                    );


                if (!link) {
                    return;
                }


                const href =
                    link.getAttribute("href");


                if (
                    !href ||
                    href.startsWith("#") ||
                    href.startsWith("mailto:") ||
                    href.startsWith("tel:")
                ) {
                    return;
                }


                const targetUrl =
                    new URL(
                        link.href,
                        window.location.href
                    );


                if (
                    targetUrl.origin !==
                    window.location.origin
                ) {
                    return;
                }


                event.preventDefault();

                window.location.href =
                    targetUrl.href;

            }
        );
    }

})();