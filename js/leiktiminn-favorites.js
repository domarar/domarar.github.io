/* =========================================
   LEIKTÍMINN
   PLAYED MATCH FAVORITES
========================================= */


(() => {

    const favoriteFilter =
        document.getElementById(
            "playedFavoritesFilter"
        );


    const periodFilter =
    document.getElementById(
        "playedPeriodFilter"
    );

    const customDateRange =
    document.getElementById(
        "playedCustomDateRange"
    );


const dateFrom =
    document.getElementById(
        "playedDateFrom"
    );


const dateTo =
    document.getElementById(
        "playedDateTo"
    );


    let favoritesOnly =
        false;


    const pendingMatchIds =
        new Set();



    /* =========================================
       PREPARE PLAYED MATCHES
    ========================================= */

    function preparePlayedMatches(
        playedMatches
    ) {

        let result =
            Array.isArray(
                playedMatches
            )
                ? [...playedMatches]
                : [];


        if (favoritesOnly) {

            result =
                result.filter(
                    match =>
                        match.favorite ===
                        true
                );
        }


        const period =
    periodFilter?.value ||
    "all";


const now =
    new Date();


result =
    result.filter(
        match => {

            const matchDate =
                getMatchDate(
                    match
                );


            if (
                period ===
                "week"
            ) {

                const cutoff =
                    new Date(
                        now
                    );

                cutoff.setDate(
                    cutoff.getDate() - 7
                );


                return (
                    matchDate >= cutoff
                    &&
                    matchDate <= now
                );
            }


            if (
                period ===
                "month"
            ) {

                const cutoff =
                    new Date(
                        now
                    );

                cutoff.setMonth(
                    cutoff.getMonth() - 1
                );


                return (
                    matchDate >= cutoff
                    &&
                    matchDate <= now
                );
            }


            if (
                period ===
                "year"
            ) {

                return (
                    matchDate.getFullYear()
                    ===
                    now.getFullYear()
                );
            }


            if (
                period ===
                "last-year"
            ) {

                return (
                    matchDate.getFullYear()
                    ===
                    now.getFullYear() - 1
                );
            }

            if (
    period ===
    "custom"
) {

    const fromValue =
        dateFrom?.value ||
        "";


    const toValue =
        dateTo?.value ||
        "";


    if (
        fromValue
        &&
        matchDate <
        new Date(
            `${fromValue}T00:00:00`
        )
    ) {

        return false;
    }


    if (
        toValue
        &&
        matchDate >
        new Date(
            `${toValue}T23:59:59`
        )
    ) {

        return false;
    }


    return true;
}
            return true;
        }
    );


result.sort(
    (
        a,
        b
    ) =>
        getMatchDate(b)
        -
        getMatchDate(a)
);


        return result;
    }



    /* =========================================
       FAVORITES FILTER STATE
    ========================================= */

    function isFavoritesOnly() {

        return favoritesOnly;
    }



    /* =========================================
       UPDATE FILTER BUTTON
    ========================================= */

    function updateFilterButton() {

        if (!favoriteFilter) {
            return;
        }


        favoriteFilter.classList.toggle(
            "active",
            favoritesOnly
        );


        favoriteFilter.setAttribute(
            "aria-pressed",
            favoritesOnly
                ? "true"
                : "false"
        );


        favoriteFilter.setAttribute(
            "aria-label",
            favoritesOnly
                ? "Sýna alla spilaða leiki"
                : "Sýna aðeins uppáhaldsleiki"
        );


        const icon =
            favoriteFilter.querySelector(
                "span"
            );


        if (icon) {

            icon.textContent =
                favoritesOnly
                    ? "★"
                    : "☆";
        }
    }



    /* =========================================
       FAVORITE FILTER CLICK
    ========================================= */

    favoriteFilter
        ?.addEventListener(
            "click",
            () => {

                favoritesOnly =
                    !favoritesOnly;


                updateFilterButton();


                if (
                    typeof renderPlayedMatches ===
                    "function"
                ) {

                    renderPlayedMatches();
                }
            }
        );



    /* =========================================
       DATE SORT
    ========================================= */

    periodFilter
    ?.addEventListener(
        "change",
        () => {

            if (
                customDateRange
            ) {

                customDateRange.hidden =
                    periodFilter.value !==
                    "custom";
            }


            if (
                typeof renderPlayedMatches ===
                "function"
            ) {

                renderPlayedMatches();
            }
        }
    );

    dateFrom
    ?.addEventListener(
        "change",
        () => {

            if (
                typeof renderPlayedMatches ===
                "function"
            ) {

                renderPlayedMatches();
            }
        }
    );


dateTo
    ?.addEventListener(
        "change",
        () => {

            if (
                typeof renderPlayedMatches ===
                "function"
            ) {

                renderPlayedMatches();
            }
        }
    );



    /* =========================================
       TOGGLE MATCH FAVORITE
    ========================================= */

    async function toggleMatchFavorite(
        matchId
    ) {

        if (
            !matchId
            ||
            pendingMatchIds.has(
                matchId
            )
        ) {

            return;
        }


        const match =
            matches.find(
                item =>
                    String(item.id) ===
                    String(matchId)
            );


        if (!match) {

            return;
        }


        const nextFavorite =
            match.favorite !==
            true;


        pendingMatchIds.add(
            matchId
        );


        try {

            const session =
                await getCurrentSession();


            if (
                !session?.user?.id
            ) {

                return;
            }


            const {
                data,
                error
            } =
                await supabaseClient
                    .from(
                        "matches"
                    )
                    .update({
                        favorite:
                            nextFavorite
                    })
                    .eq(
                        "id",
                        matchId
                    )
                    .eq(
                        "user_id",
                        session.user.id
                    )
                    .select(
                        "id, favorite"
                    )
                    .single();


            if (error) {

                console.error(
                    "Villa við að vista uppáhaldsleik:",
                    error
                );

                return;
            }


            match.favorite =
                data?.favorite ===
                true;


            renderPlayedMatches();


        } catch (error) {

            console.error(
                "Villa við að vista uppáhaldsleik:",
                error
            );

        } finally {

            pendingMatchIds.delete(
                matchId
            );
        }
    }



    /* =========================================
       INITIAL STATE
    ========================================= */

    updateFilterButton();



    /* =========================================
       PUBLIC API
    ========================================= */

    window.LeiktiminnFavorites = {

        preparePlayedMatches,
        isFavoritesOnly,
        toggleMatchFavorite

    };

})();