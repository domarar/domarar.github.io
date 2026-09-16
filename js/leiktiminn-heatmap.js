(function () {

    "use strict";


    // =========================================
    // ELEMENTS
    // =========================================

    const section =
        document.getElementById(
            "matchHeatmapSection"
        );


    const content =
        document.getElementById(
            "matchHeatmapContent"
        );


    const filters =
        Array.from(
            document.querySelectorAll(
                "[data-heatmap-period]"
            )
        );


    const routeToggle =
        document.getElementById(
            "matchHeatmapRouteToggle"
        );


    if (
        !section
        ||
        !content
    ) {

        return;
    }



    // =========================================
    // MATCH ID
    // =========================================

    const params =
        new URLSearchParams(
            window.location.search
        );


    const currentMatchId =
        params.get(
            "id"
        );


    if (
        !currentMatchId
    ) {

        return;
    }



    // =========================================
    // STATE
    // =========================================

    let allPoints =
        [];


    let activePeriod =
        "all";


    let showRoute =
        false;



    // =========================================
    // ROUTE TOGGLE
    // =========================================

    if (
        routeToggle
    ) {

        routeToggle.addEventListener(
            "click",
            () => {

                showRoute =
                    !showRoute;


                routeToggle.setAttribute(
                    "aria-pressed",
                    showRoute
                        ? "true"
                        : "false"
                );


                routeToggle.classList.toggle(
                    "active",
                    showRoute
                );


                renderCurrentTrack();
            }
        );
    }



    // =========================================
    // START
    // =========================================

    loadGpsTrack();



    // =========================================
    // LOAD GPS CHUNKS
    // =========================================

    async function loadGpsTrack() {

        if (
            typeof supabaseClient ===
            "undefined"
        ) {

            console.error(
                "HEATMAP: Supabase client missing"
            );

            return;
        }


        const {
            data,
            error
        } =
            await supabaseClient
                .from(
                    "match_gps_chunks"
                )
                .select(
                    "chunk_index, gps_format_version, points"
                )
                .eq(
                    "match_id",
                    currentMatchId
                )
                .order(
                    "chunk_index",
                    {
                        ascending: true
                    }
                );


        if (
            error
        ) {

            console.error(
                "HEATMAP: Could not load GPS chunks",
                error
            );

            return;
        }


        if (
            !data
            ||
            data.length === 0
        ) {

            return;
        }


        const merged =
            [];


        for (
            const chunk of data
        ) {

            if (
                !Array.isArray(
                    chunk.points
                )
            ) {

                continue;
            }


            for (
                const point of
                chunk.points
            ) {

                const normalized =
                    normalizeGpsPoint(
                        point
                    );


                if (
                    normalized
                ) {

                    merged.push(
                        normalized
                    );
                }
            }
        }


        merged.sort(
            (
                a,
                b
            ) =>
                a.t - b.t
        );


        if (
            merged.length === 0
        ) {

            return;
        }


        allPoints =
            merged;


        section.hidden =
            false;


        configureAvailableFilters();


        renderCurrentTrack();
    }



    // =========================================
    // NORMALIZE POINT
    // =========================================

    function normalizeGpsPoint(
        point
    ) {

        if (
            !point
            ||
            typeof point !==
                "object"
        ) {

            return null;
        }


        const t =
            Number(
                point.t
            );


        const p =
            Number(
                point.p
            );


        const lat =
            Number(
                point.lat
            );


        const lon =
            Number(
                point.lon
            );


        const q =
            Number(
                point.q
            );


        if (
            !Number.isFinite(
                t
            )
            ||
            !Number.isFinite(
                p
            )
            ||
            !Number.isFinite(
                lat
            )
            ||
            !Number.isFinite(
                lon
            )
        ) {

            return null;
        }


        return {
            t,
            p,
            lat,
            lon,

            q:
                Number.isFinite(
                    q
                )
                    ? q
                    : 0
        };
    }



    // =========================================
    // FILTER BUTTONS
    // =========================================

    function configureAvailableFilters() {

        const periods =
            new Set(
                allPoints.map(
                    point =>
                        point.p
                )
            );


        for (
            const button of
            filters
        ) {

            const value =
                button.dataset
                    .heatmapPeriod;


            if (
                value ===
                "all"
            ) {

                button.hidden =
                    false;

            } else {

                const periodNumber =
                    Number(
                        value
                    );


                button.hidden =
                    !periods.has(
                        periodNumber
                    );
            }


            button.addEventListener(
                "click",
                handleFilterClick
            );
        }
    }



    function handleFilterClick(
        event
    ) {

        const button =
            event.currentTarget;


        const value =
            button.dataset
                .heatmapPeriod;


        activePeriod =
            value;


        for (
            const item of
            filters
        ) {

            item.classList.toggle(
                "active",
                item ===
                    button
            );
        }


        renderCurrentTrack();
    }



    // =========================================
    // CURRENT FILTER
    // =========================================

    function getFilteredPoints() {

        if (
            activePeriod ===
            "all"
        ) {

            return allPoints;
        }


        const period =
            Number(
                activePeriod
            );


        return allPoints.filter(
            point =>
                point.p ===
                period
        );
    }



    // =========================================
    // RENDER
    // =========================================

    function renderCurrentTrack() {

        const points =
            getFilteredPoints();


        if (
            points.length === 0
        ) {

            content.innerHTML = `
                <div class="match-heatmap-message">
                    Engin GPS gögn fyrir þetta tímabil.
                </div>
            `;

            return;
        }


        const projected =
            projectGpsPoints(
                points
            );


        const densityPoints =
            calculateDensity(
                projected
            );


        const heatMarkup =
            createHeatMarkup(
                densityPoints
            );


        const path =
            projected
                .map(
                    (
                        point,
                        index
                    ) =>
                        (
                            index === 0
                                ? "M"
                                : "L"
                        )
                        +
                        point.x.toFixed(
                            2
                        )
                        +
                        " "
                        +
                        point.y.toFixed(
                            2
                        )
                )
                .join(
                    " "
                );


        const first =
            projected[0];


        const last =
            projected[
                projected.length - 1
            ];


        content.innerHTML = `
            <div class="match-heatmap-body">

                <div class="match-heatmap-pitch-wrap">

                    <div class="match-heatmap-pitch">

                        <svg
                            viewBox="0 0 680 1050"
                            preserveAspectRatio="xMidYMid meet"
                            aria-label="GPS hitakort"
                        >

                            <defs>

                                <filter
                                    id="heatBlur"
                                    x="-50%"
                                    y="-50%"
                                    width="200%"
                                    height="200%"
                                >

                                    <feGaussianBlur
                                        stdDeviation="28"
                                    ></feGaussianBlur>

                                </filter>

                            </defs>


                            ${createPitchMarkup()}


                            <!-- =========================
                                 HEAT DENSITY
                            ========================== -->

                            <g
                                filter="url(#heatBlur)"
                                style="mix-blend-mode: screen;"
                            >

                                ${heatMarkup}

                            </g>


                            <!-- =========================
                                 MOVEMENT ROUTE
                            ========================== -->

                            ${showRoute
                                ? `
                                    <path
                                        d="${path}"
                                        fill="none"
                                        stroke="rgba(105, 235, 125, 0.34)"
                                        stroke-width="3"
                                        stroke-linecap="round"
                                        stroke-linejoin="round"
                                    ></path>
                                `
                                : ""
                            }


                            ${showRoute
                                ? `
                                    <!-- =========================
                                         START / END
                                    ========================== -->

                                    <circle
                                        cx="${first.x}"
                                        cy="${first.y}"
                                        r="7"
                                        fill="#ffffff"
                                        stroke="#63df73"
                                        stroke-width="3"
                                    ></circle>


                                    <circle
                                        cx="${last.x}"
                                        cy="${last.y}"
                                        r="7"
                                        fill="#63df73"
                                        stroke="rgba(255,255,255,0.78)"
                                        stroke-width="3"
                                    ></circle>
                                `
                                : ""
                            }

                        </svg>

                    </div>

                </div>

            </div>
        `;
    }



    // =========================================
    // CALCULATE LOCAL DENSITY
    //
    // Density is based on estimated TIME,
    // not relative to the hottest point.
    //
    // Garmin records roughly one point
    // every 5 seconds.
    // =========================================

    function calculateDensity(
        points
    ) {

        if (
            points.length === 0
        ) {

            return [];
        }


        const SAMPLE_SECONDS =
            5;


        const METERS_PER_HEAT_RADIUS =
    6;


const SVG_UNITS_PER_METER =
    632
    /
    68;


const radius =
    METERS_PER_HEAT_RADIUS
    *
    SVG_UNITS_PER_METER;


const sigma =
    radius
    *
    0.52;


        return points.map(
            point => {

                let weightedSamples =
                    0;


                for (
                    const other of
                    points
                ) {

                    const dx =
                        point.x
                        -
                        other.x;


                    const dy =
                        point.y
                        -
                        other.y;


                    const distanceSquared =
                        (
                            dx
                            *
                            dx
                        )
                        +
                        (
                            dy
                            *
                            dy
                        );


                    weightedSamples +=
                        Math.exp(
                            -
                            distanceSquared
                            /
                            (
                                2
                                *
                                sigma
                                *
                                sigma
                            )
                        );
                }


                const densitySeconds =
                    weightedSamples
                    *
                    SAMPLE_SECONDS;


                return {
                    ...point,

                    densitySeconds
                };
            }
        );
    }



    // =========================================
    // CREATE HEAT BLOBS
    // =========================================

    function createHeatMarkup(
        points
    ) {

        return points
            .map(
                point => {

                    const color =
                        getHeatColor(
                            point.densitySeconds
                        );


                    const heatStrength =
                        Math.min(
                            1,
                            point.densitySeconds
                            /
                            180
                        );


                    const SVG_UNITS_PER_METER =
    632
    /
    68;


const baseRadiusMeters =
    2.8;


const extraRadiusMeters =
    2.2;


const radius =
    (
        baseRadiusMeters
        +
        (
            heatStrength
            *
            extraRadiusMeters
        )
    )
    *
    SVG_UNITS_PER_METER;


                    const opacity =
                        Math.min(
                            0.82,
                            0.16
                            +
                            (
                                heatStrength
                                *
                                0.66
                            )
                        );


                    return `
                        <circle
                            cx="${point.x}"
                            cy="${point.y}"
                            r="${radius.toFixed(1)}"
                            fill="${color}"
                            opacity="${opacity.toFixed(2)}"
                        ></circle>
                    `;
                }
            )
            .join(
                ""
            );
    }



    // =========================================
    // HEAT COLOR
    //
    // Absolute local time scale:
    //
    // 0–30 sec    green
    // 30–60 sec   light green
    // 60–120 sec  yellow
    // 120–180 sec orange
    // 180+ sec    red
    // =========================================

    function getHeatColor(
        densitySeconds
    ) {

        const seconds =
            Math.max(
                0,
                Number(
                    densitySeconds ?? 0
                )
            );


        if (
            seconds < 30
        ) {

            return "#45dc72";
        }


        if (
            seconds < 60
        ) {

            return "#8ee968";
        }


        if (
            seconds < 120
        ) {

            return "#e5ed58";
        }


        if (
            seconds < 180
        ) {

            return "#ffb84d";
        }


        return "#ff624d";
    }



    // =========================================
    // PROJECT GPS TO REAL PITCH
    // =========================================
      function projectGpsPoints(
    points
) {

    // =========================================
    // REAL FOOTBALL PITCH SCALE
    //
    // 105 m long × 68 m wide.
    //
    // GPS is mapped at ONE fixed scale.
    // It is never stretched to fill the pitch.
    // =========================================

    const PITCH_LENGTH_METERS =
        105;


    const PITCH_WIDTH_METERS =
        68;


    const SVG_PITCH_X =
        24;


    const SVG_PITCH_WIDTH =
        632;


    const SVG_METERS_SCALE =
        SVG_PITCH_WIDTH
        /
        PITCH_WIDTH_METERS;


    const SVG_PITCH_HEIGHT =
        PITCH_LENGTH_METERS
        *
        SVG_METERS_SCALE;


    const SVG_PITCH_Y =
        (
            1050
            -
            SVG_PITCH_HEIGHT
        )
        /
        2;


    const SVG_CENTER_X =
        SVG_PITCH_X
        +
        SVG_PITCH_WIDTH
        /
        2;


    const SVG_CENTER_Y =
        SVG_PITCH_Y
        +
        SVG_PITCH_HEIGHT
        /
        2;



    // =========================================
    // ONE TRANSFORM FOR THE WHOLE MATCH
    //
    // Allt / 1H / 2H use the SAME pitch
    // orientation and the SAME centre.
    //
    // The full match decides the transform.
    // The filter only decides which points show.
    // =========================================

    const referencePoints =
        allPoints.length > 0
            ? allPoints
            : points;


    const firstReferencePoint =
        referencePoints[0];


    const originLat =
        firstReferencePoint.lat;


    const originLon =
        firstReferencePoint.lon;


    const cosLat =
        Math.cos(
            originLat
            *
            Math.PI
            /
            180
        );



    // =========================================
    // LAT/LON -> LOCAL METRES
    // =========================================

    function toLocalMeters(
        collection
    ) {

        return collection.map(
            point => {

                const xMeters =
                    (
                        point.lon
                        -
                        originLon
                    )
                    *
                    111320
                    *
                    cosLat;


                const yMeters =
                    (
                        point.lat
                        -
                        originLat
                    )
                    *
                    110540;


                return {
                    ...point,

                    localX:
                        xMeters,

                    localY:
                        yMeters
                };
            }
        );
    }


    const referenceLocal =
        toLocalMeters(
            referencePoints
        );


    const selectedLocal =
        points === referencePoints
            ? referenceLocal
            : toLocalMeters(
                points
            );



    // =========================================
    // PCA / DOMINANT MOVEMENT AXIS
    //
    // Full match decides the field angle.
    // Rotation changes direction only.
    // It never changes GPS metre scale.
    // =========================================

    const meanX =
        referenceLocal.reduce(
            (
                total,
                point
            ) =>
                total
                +
                point.localX,
            0
        )
        /
        referenceLocal.length;


    const meanY =
        referenceLocal.reduce(
            (
                total,
                point
            ) =>
                total
                +
                point.localY,
            0
        )
        /
        referenceLocal.length;


    let xx =
        0;


    let yy =
        0;


    let xy =
        0;


    for (
        const point of
        referenceLocal
    ) {

        const dx =
            point.localX
            -
            meanX;


        const dy =
            point.localY
            -
            meanY;


        xx +=
            dx
            *
            dx;


        yy +=
            dy
            *
            dy;


        xy +=
            dx
            *
            dy;
    }


    xx /=
        referenceLocal.length;


    yy /=
        referenceLocal.length;


    xy /=
        referenceLocal.length;



    // =========================================
    // PRINCIPAL AXIS
    // =========================================

    const principalAngle =
        0.5
        *
        Math.atan2(
            2
            *
            xy,

            xx
            -
            yy
        );



    // =========================================
    // ORIENTATION CONFIDENCE
    // =========================================

    const trace =
        xx
        +
        yy;


    const difference =
        Math.sqrt(
            Math.max(
                0,

                (
                    xx
                    -
                    yy
                )
                *
                (
                    xx
                    -
                    yy
                )
                +
                4
                *
                xy
                *
                xy
            )
        );


    const eigenLarge =
        (
            trace
            +
            difference
        )
        /
        2;


    const eigenSmall =
        (
            trace
            -
            difference
        )
        /
        2;


    const axisRatio =
        eigenSmall > 0
            ? eigenLarge
              /
              eigenSmall
            : 999;


    const useAutomaticRotation =
        referenceLocal.length >= 8
        &&
        axisRatio >= 1.18;



    // =========================================
    // ALIGN LONG AXIS WITH PITCH LENGTH
    // =========================================

    const rotation =
        useAutomaticRotation
            ? (
                Math.PI
                /
                2
            )
            -
            principalAngle
            : 0;


    const cosRotation =
        Math.cos(
            rotation
        );


    const sinRotation =
        Math.sin(
            rotation
        );


    function rotateLocalPoints(
        collection
    ) {

        return collection.map(
            point => {

                const rotatedX =
                    (
                        point.localX
                        *
                        cosRotation
                    )
                    -
                    (
                        point.localY
                        *
                        sinRotation
                    );


                const rotatedY =
                    (
                        point.localX
                        *
                        sinRotation
                    )
                    +
                    (
                        point.localY
                        *
                        cosRotation
                    );


                return {
                    ...point,

                    rotatedX,

                    rotatedY
                };
            }
        );
    }


    const referenceRotated =
        rotateLocalPoints(
            referenceLocal
        );


    const selectedRotated =
        selectedLocal === referenceLocal
            ? referenceRotated
            : rotateLocalPoints(
                selectedLocal
            );



    // =========================================
    // AUTO-CENTRE FULL MATCH FOOTPRINT
    //
    // No assumed starting position.
    // No stretching.
    //
    // The full match footprint is centred
    // around the centre of the pitch.
    //
    // Both longitudinal ends therefore land
    // in roughly comparable locations.
    // =========================================

    const minRotatedX =
        Math.min(
            ...referenceRotated.map(
                point =>
                    point.rotatedX
            )
        );


    const maxRotatedX =
        Math.max(
            ...referenceRotated.map(
                point =>
                    point.rotatedX
            )
        );


    const minRotatedY =
        Math.min(
            ...referenceRotated.map(
                point =>
                    point.rotatedY
            )
        );


    const maxRotatedY =
        Math.max(
            ...referenceRotated.map(
                point =>
                    point.rotatedY
            )
        );


    const footprintCenterX =
        (
            minRotatedX
            +
            maxRotatedX
        )
        /
        2;


    const footprintCenterY =
        (
            minRotatedY
            +
            maxRotatedY
        )
        /
        2;



    // =========================================
    // REAL METRES -> SVG
    //
    // NO AUTO-FIT.
    // NO STRETCHING.
    //
    // Every metre of GPS movement keeps
    // the same scale on the pitch.
    // =========================================

    const projected =
        selectedRotated.map(
            point => ({

                ...point,

                x:
                    SVG_CENTER_X
                    +
                    (
                        (
                            point.rotatedX
                            -
                            footprintCenterX
                        )
                        *
                        SVG_METERS_SCALE
                    ),

                y:
                    SVG_CENTER_Y
                    -
                    (
                        (
                            point.rotatedY
                            -
                            footprintCenterY
                        )
                        *
                        SVG_METERS_SCALE
                    )
            })
        );



    // =========================================
    // DEBUG
    // =========================================

    console.log(
        "HEATMAP ORIENTATION:",
        {
            automatic:
                useAutomaticRotation,

            referencePoints:
                referenceLocal.length,

            axisRatio:
                axisRatio.toFixed(
                    2
                ),

            rotationDegrees:
                (
                    rotation
                    *
                    180
                    /
                    Math.PI
                ).toFixed(
                    1
                ),

            footprintWidthMeters:
                (
                    maxRotatedX
                    -
                    minRotatedX
                ).toFixed(
                    1
                ),

            footprintLengthMeters:
                (
                    maxRotatedY
                    -
                    minRotatedY
                ).toFixed(
                    1
                ),

            svgUnitsPerMeter:
                SVG_METERS_SCALE.toFixed(
                    2
                )
        }
    );


    return projected;
}


    // =========================================
    // FOOTBALL PITCH
    // =========================================

    function createPitchMarkup() {

        // =========================================
        // REAL METRIC PITCH GEOMETRY
        //
        // Playable rectangle:
        // 105 m × 68 m.
        //
        // Same scale as the GPS coordinates.
        // =========================================

        const pitchX =
            24;


        const pitchWidth =
            632;


        const unitsPerMeter =
            pitchWidth
            /
            68;


        const pitchHeight =
            105
            *
            unitsPerMeter;


        const pitchY =
            (
                1050
                -
                pitchHeight
            )
            /
            2;


        const pitchBottom =
            pitchY
            +
            pitchHeight;


        const centerX =
            pitchX
            +
            pitchWidth
            /
            2;


        const centerY =
            pitchY
            +
            pitchHeight
            /
            2;



        // =========================================
        // REAL FIELD MARKING DIMENSIONS
        // =========================================

        const centerCircleRadius =
            9.15
            *
            unitsPerMeter;


        const penaltyAreaDepth =
            16.5
            *
            unitsPerMeter;


        const penaltyAreaWidth =
            40.32
            *
            unitsPerMeter;


        const goalAreaDepth =
            5.5
            *
            unitsPerMeter;


        const goalAreaWidth =
            18.32
            *
            unitsPerMeter;


        const penaltyMarkDistance =
            11
            *
            unitsPerMeter;


        const penaltyAreaX =
            centerX
            -
            penaltyAreaWidth
            /
            2;


        const goalAreaX =
            centerX
            -
            goalAreaWidth
            /
            2;



        return `
            <g class="match-gps-pitch-lines">

                <rect
                    x="${pitchX.toFixed(2)}"
                    y="${pitchY.toFixed(2)}"
                    width="${pitchWidth.toFixed(2)}"
                    height="${pitchHeight.toFixed(2)}"
                    rx="3"
                ></rect>


                <line
                    x1="${pitchX.toFixed(2)}"
                    y1="${centerY.toFixed(2)}"
                    x2="${(
                        pitchX
                        +
                        pitchWidth
                    ).toFixed(2)}"
                    y2="${centerY.toFixed(2)}"
                ></line>


                <circle
                    cx="${centerX.toFixed(2)}"
                    cy="${centerY.toFixed(2)}"
                    r="${centerCircleRadius.toFixed(2)}"
                ></circle>


                <circle
                    cx="${centerX.toFixed(2)}"
                    cy="${centerY.toFixed(2)}"
                    r="4"
                    fill="currentColor"
                ></circle>



                <!-- =========================
                     TOP PENALTY AREA
                ========================== -->

                <rect
                    x="${penaltyAreaX.toFixed(2)}"
                    y="${pitchY.toFixed(2)}"
                    width="${penaltyAreaWidth.toFixed(2)}"
                    height="${penaltyAreaDepth.toFixed(2)}"
                ></rect>


                <rect
                    x="${goalAreaX.toFixed(2)}"
                    y="${pitchY.toFixed(2)}"
                    width="${goalAreaWidth.toFixed(2)}"
                    height="${goalAreaDepth.toFixed(2)}"
                ></rect>


                <circle
                    cx="${centerX.toFixed(2)}"
                    cy="${(
                        pitchY
                        +
                        penaltyMarkDistance
                    ).toFixed(2)}"
                    r="4"
                    fill="currentColor"
                ></circle>



                <!-- =========================
                     BOTTOM PENALTY AREA
                ========================== -->

                <rect
                    x="${penaltyAreaX.toFixed(2)}"
                    y="${(
                        pitchBottom
                        -
                        penaltyAreaDepth
                    ).toFixed(2)}"
                    width="${penaltyAreaWidth.toFixed(2)}"
                    height="${penaltyAreaDepth.toFixed(2)}"
                ></rect>


                <rect
                    x="${goalAreaX.toFixed(2)}"
                    y="${(
                        pitchBottom
                        -
                        goalAreaDepth
                    ).toFixed(2)}"
                    width="${goalAreaWidth.toFixed(2)}"
                    height="${goalAreaDepth.toFixed(2)}"
                ></rect>


                <circle
                    cx="${centerX.toFixed(2)}"
                    cy="${(
                        pitchBottom
                        -
                        penaltyMarkDistance
                    ).toFixed(2)}"
                    r="4"
                    fill="currentColor"
                ></circle>

            </g>
        `;
    }



    // =========================================
    // GPS QUALITY
    //
    // Kept available for later internal
    // diagnostics even though we no longer
    // display the value on the match page.
    // =========================================

    function getAverageQuality(
        points
    ) {

        const valid =
            points.filter(
                point =>
                    Number.isFinite(
                        point.q
                    )
            );


        if (
            valid.length === 0
        ) {

            return "–";
        }


        const average =
            valid.reduce(
                (
                    total,
                    point
                ) =>
                    total
                    +
                    point.q,
                0
            )
            /
            valid.length;


        return average.toFixed(
            1
        );
    }
    })();