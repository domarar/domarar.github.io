window.LeiktiminnNotifications = (() => {
    let userId = null;
    let state = { initialized: false, known: [], seen: [] };

    function storageKey() {
        return `leiktiminn-played-notifications-v1:${userId}`;
    }

    function save() {
        if (!userId) return;

        try {
            localStorage.setItem(storageKey(), JSON.stringify(state));
        } catch (error) {
            console.warn("Ekki tókst að vista tilkynningar.", error);
        }
    }

    function setUser(id) {
        if (userId === id) return;

        userId = id || null;
        state = { initialized: false, known: [], seen: [] };

        if (!userId) return;

        try {
            const stored = JSON.parse(
                localStorage.getItem(storageKey()) || "null"
            );

            if (
                stored &&
                Array.isArray(stored.known) &&
                Array.isArray(stored.seen)
            ) {
                state = {
                    initialized: stored.initialized === true,
                    known: stored.known,
                    seen: stored.seen
                };
            }
        } catch (error) {
            console.warn("Ekki tókst að lesa tilkynningar.", error);
        }
    }

    function sync(playedMatches) {
        if (!userId) return;

        const ids = playedMatches.map(match => String(match.id));

        if (!state.initialized) {
            // Existing games should not all appear as new.
            state.known = ids;
            state.seen = ids;
            state.initialized = true;
        } else {
            state.known = [...new Set([...state.known, ...ids])];
        }

        save();
    }

    function isUnread(matchId) {
        const id = String(matchId);

        return (
            !!userId &&
            state.initialized &&
            state.known.includes(id) &&
            !state.seen.includes(id)
        );
    }

    function markSeen(matchId) {
        if (!userId || !matchId) return;

        const id = String(matchId);

        if (!state.seen.includes(id)) {
            state.seen.push(id);
        }

        save();
    }

    return { setUser, sync, isUnread, markSeen };
})();