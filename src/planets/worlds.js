// Ported from the planets project as an ES module: the original is a classic
// script sharing globals, so the export line at the end is the only change.

const SPECIES = {
  // ── EARTHLIKE ─────────────────────────────────────────────
  earthlike: {
    label: "earthlike",
    noun: "planet",
    surface: "hills",
    climate: {
      temperature: { min: -15, max: 85 }, // °F, averaged over the year
      rainfall: { min: 12, max: 95 }, // inches, over the same year
    },
    terrain: {
      frequency: { min: 1.6, max: 2.6 },
      amplitude: { min: 0.45, max: 0.75 },
      seaLevel: { min: 0.38, max: 0.5 },
      octaves: { min: 4, max: 5, whole: true },
      bands: [
        { above: 0.62, role: "snow" },
        { above: 0.48, role: "land" },
        { above: -Infinity, role: "sea" },
      ],
    },
    palettes: [
      {
        name: "temperate",
        snow: "#FFFDFA",
        land: "#729C44",
        sea: "#1993F0",
        air: "#BFD9F2",
        moon: ["#D8DDE8", "#C4CCDA"],
      },
      {
        name: "arid",
        climate: { rainfall: { min: 1, max: 10 } },
        snow: "#F4ECD8",
        land: "#C08A4E",
        sea: "#2E8FA8",
        air: "#E8CFA8",
        moon: ["#E0D6C6", "#C4B7A4"],
      },
      {
        name: "jungle",
        climate: {
          temperature: { min: 65, max: 95 },
          rainfall: { min: 70, max: 140 },
        },
        snow: "#E8F5D8",
        land: "#2F7A3E",
        sea: "#0F6E86",
        air: "#A9E5C9",
        moon: ["#CFE3D2", "#B0C9B8"],
      },
      {
        name: "oceanic",
        climate: {
          temperature: { min: 40, max: 70 },
          rainfall: { min: 55, max: 110 },
        },
        snow: "#F6FBFF",
        land: "#6E9C8A",
        sea: "#0B5FA8",
        air: "#A8CDF5",
        moon: ["#DCE6F2", "#BFCBDD"],
      },
    ],
    moons: { min: 1, max: 3, scale: 1 },
    rings: ["none"],
    atmosphere: {
      radius: { min: 1.1, max: 1.18 },
      opacity: { min: 0.15, max: 0.24 },
    },
    scale: { min: 0.92, max: 1.12 },
    tilt: { min: -25, max: 25 },
  },

  // ── ROCKY ─────────────────────────────────────────────────
  rocky: {
    label: "barren",
    noun: "planet",
    surface: "terrain",
    climate: {
      temperature: { min: -95, max: 195 },
      rainfall: { min: 0, max: 1.5 },
    },
    terrain: {
      frequency: { min: 1.8, max: 3.0 },
      amplitude: { min: 0.35, max: 0.7 },
      seaLevel: 0,
      octaves: { min: 3, max: 5, whole: true },
      craters: true,
      bands: [
        { above: 0.66, role: "peaks" },
        { above: 0.55, role: "highlands" },
        { above: 0.42, role: "lowlands" },
        { above: -Infinity, role: "floor" },
      ],
    },
    palettes: [
      {
        name: "candy",
        peaks: "#FFF3D6",
        highlands: "#F2B279",
        lowlands: "#E37F9D",
        floor: "#8A7AC2",
        air: "#BFD9F2",
        moon: ["#D8DDE8", "#E8B7C9", "#C9E0D4"],
        ring: [
          "#E8B7C9",
          "#C9E0D4",
          "#F2B279",
          "#8A7AC2",
          "#FFF3D6",
          "#9BD3E8",
        ],
      },
      {
        name: "rust",
        peaks: "#FFE3C0",
        highlands: "#E08A4A",
        lowlands: "#B4532F",
        floor: "#6B2F22",
        air: "#E9A876",
        moon: ["#E8CDB4", "#C08A6A"],
        ring: ["#FFE3C0", "#E08A4A", "#B4532F", "#8A6A55", "#D9BFA6"],
      },
      {
        name: "basalt",
        peaks: "#DCDCE4",
        highlands: "#9AA0B0",
        lowlands: "#5E6473",
        floor: "#33363F",
        air: "#9FB0C8",
        moon: ["#C8CCD6", "#8A8F9C"],
        ring: ["#DCDCE4", "#9AA0B0", "#5E6473", "#B4BAC6"],
      },
      {
        name: "sulfur",
        peaks: "#FFF6C2",
        highlands: "#F0D054",
        lowlands: "#C99326",
        floor: "#7A5A18",
        air: "#E8D68A",
        moon: ["#F2E8C0", "#C8B478"],
        ring: ["#FFF6C2", "#F0D054", "#C99326", "#E8C97A"],
      },
    ],
    moons: { min: 0, max: 2, scale: 1 },
    rings: ["belt"],
    atmosphere: {
      radius: { min: 1.06, max: 1.14 },
      opacity: { min: 0.05, max: 0.11 },
    },
    scale: { min: 0.78, max: 0.95 },
    tilt: { min: 14, max: 32 },
  },
  dwarf: {
    label: "dwarf",
    noun: "planet",
    surface: "terrain",
    climate: {
      temperature: { min: -330, max: 5 },
      rainfall: { min: 0, max: 0 },
    },
    terrain: {
      frequency: { min: 4.0, max: 6.0 },
      amplitude: { min: 0.15, max: 0.26 },
      seaLevel: 0,
      octaves: { min: 4, max: 5, whole: true },
      craters: true,
      bands: [
        { above: 0.6, role: "rim" },
        { above: 0.5, role: "regolith" },
        { above: 0.4, role: "rock" },
        { above: -Infinity, role: "basin" },
      ],
    },
    palettes: [
      {
        name: "grey",
        rim: "#E8E4DC",
        regolith: "#B0A79C",
        rock: "#7A7268",
        basin: "#4F4A45",
        moon: ["#E8E4DC", "#B0A79C"],
        ring: ["#E8E4DC", "#C4BCB2", "#B0A79C", "#7A7268"],
      },
      {
        name: "iron",
        rim: "#E8D8CC",
        regolith: "#B08A72",
        rock: "#7A5748",
        basin: "#45322A",
        moon: ["#E8D8CC", "#B08A72"],
        ring: ["#E8D8CC", "#C4A38C", "#B08A72", "#7A5748"],
      },
      {
        name: "carbon",
        rim: "#C8C8CC",
        regolith: "#83838C",
        rock: "#4E4E57",
        basin: "#2A2A31",
        moon: ["#C8C8CC", "#83838C"],
        ring: ["#C8C8CC", "#A5A5AD", "#83838C", "#4E4E57"],
      },
      {
        name: "frost",
        rim: "#F4F8FF",
        regolith: "#CBD8E4",
        rock: "#93A3B4",
        basin: "#5C6874",
        moon: ["#F4F8FF", "#CBD8E4"],
        ring: ["#F4F8FF", "#DDE6EE", "#CBD8E4", "#93A3B4"],
      },
    ],
    moons: { min: 0, max: 3, scale: 1.2 },
    rings: ["none", "belt"],
    atmosphere: false,
    scale: { min: 0.36, max: 0.5 },
    tilt: { min: -22, max: 22 },
  },

  tundra: {
    label: "tundra",
    noun: "planet",
    surface: "snow tufts",
    climate: {
      temperature: { min: -75, max: 25 },
      rainfall: { min: 5, max: 28 },
    },
    terrain: {
      frequency: { min: 2.4, max: 3.8 },
      amplitude: { min: 0.4, max: 0.7 },
      seaLevel: { min: 0.4, max: 0.52 },
      octaves: { min: 4, max: 5, whole: true },
      sharpness: { min: 2.0, max: 4.0 },
      bands: [
        { above: 0.72, role: "spire" },
        { above: 0.58, role: "snow" },
        { above: 0.44, role: "rock" },
        { above: -Infinity, role: "lake" },
      ],
    },
    palettes: [
      {
        name: "frost",
        spire: "#FFFFFF",
        snow: "#D6E4F2",
        rock: "#6B7D93",
        lake: "#4FB3D4",
        air: "#BFD9F2",
        moon: ["#D8DDE8", "#C9E0D4"],
      },
      {
        name: "taiga",
        spire: "#FFFFFF",
        snow: "#DCE8E0",
        rock: "#4F6B52",
        lake: "#3E8F7A",
        air: "#C6E2D6",
        moon: ["#D4E2D8", "#AEC4B4"],
      },
      {
        name: "dusk",
        spire: "#FFF0F4",
        snow: "#E2CBD8",
        rock: "#7A6480",
        lake: "#8E5FA8",
        air: "#D9C0E8",
        moon: ["#E4D6E8", "#B9A4C4"],
      },
      {
        name: "ochre",
        spire: "#FFF7EC",
        snow: "#E8D4B8",
        rock: "#8A6A50",
        lake: "#4C8FA0",
        air: "#DCC8AC",
        moon: ["#E8DCC8", "#C0AC92"],
      },
    ],
    moons: { min: 1, max: 3, scale: 1 },
    rings: ["none"],
    atmosphere: {
      radius: { min: 1.1, max: 1.18 },
      opacity: { min: 0.16, max: 0.26 },
    },
    scale: { min: 0.9, max: 1.08 },
    tilt: { min: 8, max: 26 },
  },

  ice: {
    label: "icy",
    noun: "planet",
    surface: "spires",
    // Cold enough that what falls out of the sky isn't water.
    climate: {
      temperature: { min: -310, max: -110 },
      rainfall: { min: 0, max: 2.5 },
    },
    terrain: {
      // sharpness is capped at 5.5 because the curve fights the
      // amplitude: past that it crushes so much of the range that
      // even amplitude 2.6 comes out a smooth ball with no spires.
      frequency: { min: 2.4, max: 3.2 },
      amplitude: { min: 1.6, max: 2.4 },
      seaLevel: { min: 0.2, max: 0.28 },
      octaves: { min: 4, max: 5, whole: true },
      sharpness: { min: 4.0, max: 5.5 },
      bands: [
        { above: 0.78, role: "spire" },
        { above: 0.62, role: "glacier" },
        { above: 0.5, role: "crevasse" },
        { above: -Infinity, role: "plain" },
      ],
    },
    palettes: [
      {
        name: "glacier",
        spire: "#FFFFFF",
        glacier: "#A8DDF0",
        crevasse: "#31597A",
        plain: "#6FC2DC",
        air: "#BFD9F2",
        moon: ["#FFFFFF", "#D3E1EE"],
        ring: ["#FFFFFF", "#F2F7FC", "#E4EDF6", "#D3E1EE", "#C3D4E4"],
      },
      {
        // Teal rather than green. Tundra's "taiga" palette is the
        // neighbor to stay clear of: vegetation green on a world
        // with the same white peaks reads as the wrong species.
        name: "methane",
        spire: "#FFFFFF",
        glacier: "#B0EAE4",
        crevasse: "#12504F",
        plain: "#43C2BE",
        air: "#B0EAE4",
        moon: ["#FFFFFF", "#CCE8E6"],
        ring: ["#FFFFFF", "#E0F6F4", "#CCE8E6", "#A8D8D4"],
      },
      {
        // Blue-violet rather than lilac, so it stays on the ice
        // side of the line the crystal world sits on.
        name: "aurora",
        spire: "#FFFFFF",
        glacier: "#C6D8FF",
        crevasse: "#2E3F7A",
        plain: "#7E8FE0",
        air: "#C3CFFF",
        moon: ["#FFFFFF", "#D6DEF8"],
        ring: ["#FFFFFF", "#EAEFFF", "#D6DEF8", "#BAC6EC"],
      },
      {
        // Old ice, dusted with whatever the system threw at it.
        name: "ancient",
        spire: "#F2F5F5",
        glacier: "#C2D2CE",
        crevasse: "#40514F",
        plain: "#8FA8A2",
        air: "#CBD9D6",
        moon: ["#E8EDEC", "#B4C2BE"],
        ring: ["#E8EDEC", "#D2DCDA", "#B4C2BE", "#95A5A1"],
      },
    ],
    moons: { min: 0, max: 2, scale: 1 },
    rings: ["none", "none", "belt"], // one ice world in three keeps its rubble
    atmosphere: {
      radius: { min: 1.03, max: 1.08 },
      opacity: { min: 0.18, max: 0.3 },
    },
    scale: { min: 0.88, max: 1.05 },
    tilt: { min: 12, max: 30 },
  },
  crystal: {
    label: "gem",
    noun: "planet",
    surface: "crystalline structure",
    climate: {
      temperature: { min: -40, max: 250 },
      rainfall: { min: 0, max: 6 },
    },
    terrain: {
      frequency: { min: 2.8, max: 4.0 },
      amplitude: { min: 0.4, max: 1.9 },
      seaLevel: 0,
      octaves: { min: 6, max: 8, whole: true },
      craters: true,
      bands: [
        { above: 0.72, role: "facet" },
        { above: 0.56, role: "shard" },
        { above: 0.42, role: "vein" },
        { above: -Infinity, role: "bed" },
      ],
    },
    palettes: [
      {
        name: "amethyst",
        facet: "#FFF2FD",
        shard: "#C89BE8",
        vein: "#7A4FB0",
        bed: "#3C2A63",
        air: "#D7A9F5",
        moon: ["#E8D6F5", "#B79CD0"],
      },
      {
        name: "citrine",
        facet: "#FFFBEC",
        shard: "#F0C766",
        vein: "#B07A1E",
        bed: "#4A3512",
        air: "#F5D98C",
        moon: ["#F5E8C4", "#C8B078"],
      },
      {
        name: "emerald",
        facet: "#F0FFF6",
        shard: "#7FE0AE",
        vein: "#2C8A5E",
        bed: "#123A2B",
        air: "#9BF0C6",
        moon: ["#D6F5E4", "#9CC8B0"],
      },
      {
        name: "rose",
        facet: "#FFF4F6",
        shard: "#F2A8BE",
        vein: "#B0526F",
        bed: "#4A1F30",
        air: "#F7B9CB",
        moon: ["#F7DCE4", "#C89CAA"],
      },
    ],
    moons: { min: 0, max: 2, scale: 1 },
    rings: ["none"],
    atmosphere: {
      radius: { min: 1, max: 1.2 },
      opacity: { min: 0.0, max: 0.2 },
    },
    scale: { min: 0.82, max: 0.98 },
    tilt: { min: -25, max: 25 },
  },

  gas: {
    label: "gas giant",
    noun: "", // "giant" is already the noun
    surface: "cloud bands",
    climate: {
      temperature: { min: -255, max: -75 },
      rainfall: { min: 15, max: 120 },
    },
    terrain: {
      frequency: { min: 1.2, max: 2.2 },
      amplitude: 0.03,
      seaLevel: 0,
      octaves: { min: 1, max: 24, whole: true },
      banding: "latitude",
      bandCount: { min: 0, max: 4.8, whole: true },
      swirl: { min: 0.1, max: 0.44 }, // how far noise bends an edge
      oblateness: { min: 0.98, max: 1 }, // spin-flattened at the poles
      bands: [
        { above: 0.75, role: "zone" },
        { above: 0.5, role: "belt" },
        { above: 0.25, role: "storm" },
        { above: -Infinity, role: "deep" },
      ],
    },
    palettes: [
      {
        name: "jovian",
        zone: "#F5E6C8",
        belt: "#E0B87E",
        storm: "#C4834E",
        deep: "#8E5638",
        air: "#BFD9F2",
        moon: ["#D8DDE8", "#E8B7C9", "#C9E0D4"],
        ring: ["#FFF3D6", "#F2B279", "#E37F9D", "#8A7AC2"],
      },
      {
        name: "cerulean",
        zone: "#E4F2FA",
        belt: "#9FC8E8",
        storm: "#5A8FC4",
        deep: "#2E5A8A",
        air: "#BFD9F2",
        moon: ["#DCE6F2", "#B4C6DC"],
        ring: ["#E4F2FA", "#9FC8E8", "#5A8FC4", "#CFE2F0"],
      },
      {
        name: "verdant",
        zone: "#EEF7DC",
        belt: "#BEDC8E",
        storm: "#7FA84E",
        deep: "#4A6B2E",
        air: "#C6E2A8",
        moon: ["#E4EED4", "#B4C89C"],
        ring: ["#EEF7DC", "#BEDC8E", "#7FA84E", "#D8E8BC"],
      },
      {
        name: "ember",
        zone: "#FFE8D2",
        belt: "#F2A96B",
        storm: "#C45A34",
        deep: "#7A2E1C",
        air: "#F0B48C",
        moon: ["#F5DCC8", "#C8A088"],
        ring: ["#FFE8D2", "#F2A96B", "#C45A34", "#E8C4A4"],
      },
    ],
    moons: { min: 2, max: 5, scale: 0.7 },
    rings: ["torus", "torus", "belt"],
    atmosphere: {
      radius: { min: 1.1, max: 1.18 },
      opacity: { min: 0.05, max: 0.1 },
    },
    // Sized to sit above every rocky/icy/gem world's own range
    // (their ceiling is earthlike's 1.12) and below the star's
    // floor, so the ordering holds regardless of what two planets
    // a reroll happens to put side by side.
    scale: { min: 1.5, max: 1.8 },
    tilt: { min: -15, max: 15 },
  },

  // ── STAR ──────────────────────────────────────────────────
  // Lights the others; doesn't keep a family of its own. `unlit`
  // skips the lighting model entirely, so the bands show exactly
  // as painted — no terminator, no dark side. Tight frequency
  // and tiny amplitude read as granulation, not continents.
  star: {
    label: "star",
    noun: "", // not a planet at all
    surface: "photosphere",
    // The species band is only a fallback here: on a star the
    // color IS the temperature, so every palette below states
    // its own and none of them inherit this.
    climate: {
      temperature: { min: 5400, max: 16200 },
      rainfall: { min: 0, max: 0 },
    },
    terrain: {
      frequency: { min: 2.8, max: 4.5 }, // coarse blotches ↔ fine mottling
      amplitude: { min: 0.03, max: 0.08 },
      seaLevel: 0,
      octaves: { min: 3, max: 5, whole: true },
      unlit: true,
      bands: [
        { above: 0.66, role: "core" },
        { above: 0.5, role: "surface" },
        { above: 0.36, role: "flare" },
        { above: -Infinity, role: "spot" },
      ],
    },
    // ── SELF-LIT ─────────────────────────────────────────────
    // The only body here with no sun to be lit by, so none of
    // these dials are about a light's direction. Every one of
    // them is measured from the LINE OF SIGHT instead — see the
    // self-lit section in script.js for why that's the only
    // angle a star has to offer.
    glow: {
      rim: "flare", // palette color the disc cools toward at its edge
      hot: "core", //  ...and blows out toward in the middle
      curve: 1.0, // <1 keeps the middle flat and drops fast at the
      //             rim, which is the shape real limb darkening has
      cool: 0.9, // how far the edge actually travels toward `rim`
      heat: 0.35, // ...and the middle toward `hot`
      steps: 4, // rings of brightness across the disc; 0 = smooth
      corona: {
        color: "flare", // the light that gets out past the surface
        radius: 1.55, // how far it reaches, in planet radii
        opacity: 0.55, // brightness where it leaves the surface
        falloff: 2.5, // how fast it thins on the way out
      },
    },
    palettes: [
      {
        name: "yellow",
        climate: { temperature: { min: 9400, max: 10650 } },
        core: "#FFFBEA",
        surface: "#FFD84D",
        flare: "#FF9E2C",
        spot: "#E0611B",
      },
      {
        // A cinder. The fire is out and what's left is a crust
        // with heat still showing through where it has cracked,
        // so the bands run the same way every other star's do —
        // brightest in the deepest part of the noise — but start
        // from an ember rather than a photosphere.
        //
        // Nothing here is black, and `flare` least of all: it is
        // the color the limb cools toward AND the color of the
        // corona, which is blended additively. Black adds nothing,
        // so a black flare doesn't make a dark star, it makes a
        // star with no edge and no halo at all. The dimmest band
        // is a tinted near-black instead, a shade off the sky, so
        // the silhouette still reads as a body and not a hole cut
        // in the sky behind it.
        name: "dead",
        climate: { temperature: { min: 1200, max: 3600 } },
        core: "#FF7A3C", // the cracks, still glowing
        surface: "#8A3A22", // cooling crust
        flare: "#4A2233", // the last of the corona, a dark bruise
        spot: "#2A2436", // cold slag
      },
      {
        name: "red dwarf",
        climate: { temperature: { min: 4700, max: 6150 } },
        core: "#FFE8D0",
        surface: "#FF9A5C",
        flare: "#E8582C",
        spot: "#A32E14",
      },
      {
        name: "blue giant",
        climate: { temperature: { min: 32400, max: 54000 } },
        core: "#FFFFFF",
        surface: "#CFE4FF",
        flare: "#7FA8FF",
        spot: "#3D5FD9",
      },
      {
        name: "white",
        climate: { temperature: { min: 12600, max: 17150 } },
        core: "#FFFFFF",
        surface: "#F2F4FF",
        flare: "#CBD4F0",
        spot: "#9AA6C8",
      },
    ],
    moons: { min: 0, max: 0, scale: 1 },
    rings: ["none"],
    atmosphere: false,
    // Twice the gas giant's own ceiling (1.8) at its smallest, so
    // the sun doesn't merely win the size comparison — it wins it
    // at a glance, from across the system, next to the largest
    // thing that orbits it.
    scale: { min: 3.6, max: 4.4 },
    tilt: { min: 0, max: 0 },
  },
};

// ============================================================
// SHARED SHAPES — the parts every species borrows. Color is
// never decided here; these are fallbacks and geometry only.
// ============================================================

// One belt rock's worth of dice. Shared by every species that
// rolls a "belt", which is why nothing in here is colored.
const BELT_SHAPE = {
  style: "belt",
  count: { min: 34, max: 70 },
  distance: { min: 1.5, max: 2.0 }, // orbital radius of one rock
  height: { min: -0.09, max: 0.09 }, // how far off the belt plane
  size: { min: 0.018, max: 0.055 }, // base radius before stretching
  // Per-AXIS scale jitter, rolled three times per rock. This is
  // what makes them read as irregular chunks instead of a field
  // of identical pebbles at different sizes.
  stretch: { min: 0.55, max: 1.6 },
  tilt: { min: -7, max: 7 }, // degrees of inclination, per rock
  spinScale: 0.0016, // tumble rate
  speedScale: 0.022, // orbit rate before the distance falloff
  // Coarser and deeper than a moon's: few facets, big dents.
  surface: { detail: 1, frequency: 5, amplitude: 0.5, octaves: 3 },
};

// Two ring SHAPES — geometry only. Which colors they wear is
// entirely the palette's business: `palette.ring`, or the
// palette's own band colors if it doesn't name a list. There is
// deliberately no default color here to fall back to, because a
// shared default is how a species that later grows rings ends up
// wearing another species' colors.
const RING_STYLES = {
  belt: {
    ...BELT_SHAPE,
  },
  torus: {
    style: "torus",
    // Fixed for every band.
    flatness: 0.1, // squash through the ring's face — 1 is a round
    //                 tube, 0.25 is a CD, 0 is a sheet of paper
    radialSegments: 8, // roundness of the tube's cross-section
    tubularSegments: 100, // steps around the big circle

    // Everything below is ROLLED PER PLANET from its seed, the
    // same way moons are — so no two worlds wear the same rings,
    // and the same seed wears the same ones every time.
    //
    // The builder walks outward from `inner`, laying a band, then
    // a gap, then a band, and stops at `outer`. The planet's
    // surface is at 1 and the air just past it, so the system
    // starts clear of both; moons orbit from 2.0 out, so it ends
    // short of that.
    count: { min: 2, max: 5 }, // concentric bands, a ceiling not a promise
    inner: { min: 1.24, max: 1.42 }, // where the system starts...
    outer: { min: 1.68, max: 1.94 }, // ...and where it runs out of room
    width: { min: 0.03, max: 0.2 }, // one band, edge to edge
    gap: { min: 0.025, max: 0.1 }, // empty space before the next band
    opacity: { min: 0.55, max: 0.9 }, // 1 is solid; lower lets the
    //                                   planet and stars read through
  },
};

// How a moon is built and how it moves. HOW MANY a planet gets
// is the species' call; everything about the individual moon is
// the same across the system.
const MOON_SHAPE = {
  radius: { min: 0.04, max: 0.18 },
  distance: { min: 2.0, max: 2.8 },
  tilt: { min: -40, max: 40 },
  spinScale: 0.0011,
  retrogradeChance: 0.35,
  speedScale: 0.024,
  // No color list here either — a moon is colored by its
  // planet's palette, same as its rings. See RING_STYLES above.
  surface: {
    detail: 6,
    frequency: 6,
    amplitude: 0.12,
    octaves: 3,
  },
};

// The atmosphere's construction. Its SIZE and STRENGTH are the
// species' ranges; its color is the palette's `air`.
const ATMOSPHERE = {
  detail: 16,
  color: "#BFD9F2", // fallback if a palette declares no `air`
  layers: 1,
  innerRatio: 0.55, // only matters when layers > 1: where the
  //                   innermost shell sits, as a fraction of the
  //                   gap between the surface and the outer radius
};

const PLANET_GEOMETRY = {
  radius: 1,
  detail: 60,
};

const SHADING = {
  toonSteps: [110, 190, 255],
};

// The gem terrain's mirror coat, layered on top of the ordinary
// toon shading rather than replacing it — see gemMaterial() in
// script.js. fresnelPower shapes the falloff: higher means only
// grazing angles pick up reflection, lower spreads it toward the
// whole facet.
// ── THE MARKS ─────────────────────────────────────────────────
// One glyph per kind of world, drawn on a 12×12 grid to sit in a
// line of 12px type. Shape says what KIND a world is; the color
// they're drawn in says WHICH one — every mark is tinted with its
// own planet's accent, the same color that planet's survey card
// wears. See renderIndex() in script.js.
//
// Silhouettes rather than pictures: at twelve pixels a snowflake
// with detail on it is a smudge, and the only thing that survives
// is the outline. Craters and moons are punched out with
// fill-rule rather than drawn in a second color, so one `fill`
// paints the whole mark.
const ICONS = {
  // A disc with rays. The only one that emits rather than reflects.
  star: `<circle cx="6" cy="6" r="3.2"/><rect x="5.2" y="0" width="1.6" height="2"/><rect x="5.2" y="10" width="1.6" height="2"/><rect x="0" y="5.2" width="2" height="1.6"/><rect x="10" y="5.2" width="2" height="1.6"/>`,

  // A plain world. Nothing about an earthlike planet is unusual;
  // that IS the unusual thing about it.
  earthlike: `<circle cx="6" cy="6" r="5"/>`,

  // The same disc, cratered.
  rocky: `<path fill-rule="evenodd" d="M6 1a5 5 0 1 0 0 10A5 5 0 1 0 6 1zM4.2 3.6a1.1 1.1 0 1 0 0 2.2 1.1 1.1 0 1 0 0-2.2zM8 6.6a1.3 1.3 0 1 0 0 2.6 1.3 1.3 0 1 0 0-2.6z"/>`,

  // The same disc, smaller. Size is the whole of what a dwarf is.
  dwarf: `<circle cx="6" cy="6" r="3"/>`,

  // Six spokes.
  tundra: `<path d="M6 0.6v10.8M1.3 3.3l9.4 5.4M10.7 3.3l-9.4 5.4" stroke="currentColor" stroke-width="1.4" fill="none"/>`,

  // A lattice — ice is the one that grows in a shape.
  ice: `<path d="M6 0.5 11 3.25v5.5L6 11.5 1 8.75v-5.5z"/>`,

  // Facets, cut flat on top.
  crystal: `<path d="M3.2 1h5.6l3 3.4L6 11.4 0.2 4.4z"/>`,

  // A disc with a ring around it, tipped the way a ring is drawn
  // everywhere else here.
  gas: `<circle cx="6" cy="6" r="3.6"/><ellipse cx="6" cy="6" rx="5.5" ry="1.9" fill="none" stroke="currentColor" stroke-width="1.2" transform="rotate(-18 6 6)"/>`,
};

// The sky, taken once as a cube map for the earthlike ocean to
// mirror — see waterMaterial() in script.js. Nothing else samples
// it, and nothing repaints it: it holds the empty sky and the
// stars, which don't change.
const ENV = {
  size: 256,
};

// A thin shell just above the earthlike ocean floor — see
// buildWater() and waterMaterial() in script.js. `radius` sits a
// hair over 1: sculptTerrain clamps every sea vertex to exactly
// the unit sphere, so anything bigger risks swallowing the
// shoreline where land has barely climbed above sea level.
// fresnelPower controls the reflection-vs-tint handoff, and the
// water reads inverted from a mirror: near-normal (looking
// straight down) shows `minOpacity` of the sea tint, as if seeing
// down into it, while grazing angles climb toward a full mirror.
const WATER = {
  radius: 1.006,
  detail: 24,
  fresnelPower: 3,
  minOpacity: 0.55,
};

// ============================================================
// THE ROOM — belongs to the whole scene, not to any planet.
// ============================================================

const SKY = {
  background: "#101119",
};

const STARS = {
  count: 400,
  color: "#FFFDFA",
  size: { min: 0.08, max: 0.25 },
  shell: { inner: 50, outer: 80 },
  detail: 1,
};

// The solar system: every species at once, the star in the middle
// and the rest going round it. Distances are world units, the same
// ones a single planet is built in.
const SYSTEM = {
  // Which body sits at the center.
  star: "star",

  // How many worlds go round it. With the star that's 5 to 8
  // bodies — few enough to take in at a glance, and few enough
  // that no system holds one of everything. What a sky leaves out
  // is as much of its character as what it holds, and it's the
  // reason to roll another one.
  count: { min: 4, max: 7 },

  // The roster the dice draw from.
  //
  //   zone   where in a system this kind of world belongs. The
  //          draw is sorted by it, so however the dice fall a
  //          system still reads rocky and close-in to icy and
  //          far-out rather than shuffled.
  //   weight how often it comes up, relative to the others.
  //   max    how many of it one system may hold. Repeats are the
  //          point — a system with two gas giants is a system
  //          with a Jupiter and a Saturn — but a sky of nothing
  //          but gas giants is a bug that looks like a choice.
  //
  // Worlds of the same zone land next to each other, which is
  // what makes a pair of giants read as a pair rather than as one
  // giant twice.
  worlds: [
    { species: "rocky", zone: 1, weight: 3, max: 3 },
    { species: "earthlike", zone: 2, weight: 2, max: 2 },
    { species: "crystal", zone: 3, weight: 2, max: 2 },
    { species: "tundra", zone: 4, weight: 2, max: 2 },
    { species: "gas", zone: 5, weight: 3, max: 3 },
    { species: "ice", zone: 6, weight: 2, max: 2 },
    { species: "dwarf", zone: 7, weight: 2, max: 3 },
  ],

  // The innermost and outermost orbits; everything else is spaced
  // between them by a constant RATIO rather than a constant gap,
  // which is roughly how a real system spreads — crowded near the
  // sun, generous at the edge. That's also what keeps the giants
  // apart: they sort to the outside, where the gaps are widest,
  // and their moons don't reach into a neighbor's lane.
  //
  // `outer` is bounded by how far the seat can back off
  // (CAMERA.range.max) and still hold the whole system in frame.
  orbits: { inner: 2.6, outer: 11 },

  // A few percent of slop on each radius, so two systems with the
  // same number of worlds don't step out to the same marks.
  jitter: 0.05,

  // Everything is drawn small out here. A star alone is over four
  // units of radius, and eleven bodies at their own scale would
  // never fit in front of a camera that can only back off to
  // CAMERA.range.max.
  scale: 0.24,

  // Ground detail for a body a third of a unit wide. A world
  // that fills the window earns PLANET_GEOMETRY's 60; eight of
  // them at that detail is over a million vertices of noise per
  // rebuild, for facets smaller than a pixel.
  detail: 16,

  // Kepler's third law, which is the whole of "sane speed
  // depending on radius": the period goes as r^1.5, so the inner
  // worlds hurry and the outer ones crawl. One orbit at `radius`
  // takes `frames`; every other orbit is scaled off that.
  period: { radius: 2.6, frames: 620 },

  // Where the seat goes to watch: far enough back for the outer
  // orbit, and lifted off the plane so the orbits read as rings
  // rather than as a row of dots.
  view: { distance: 19, polar: Math.PI / 2 - 0.62 },

  // The sun's own light, added only while the system is on
  // screen. Without it the star is the one lit thing in a system
  // it's supposed to be lighting. Its color isn't stated here —
  // it's whatever star the seed rolled, same as the key light.
  // See tuneSunlight().
  light: { intensity: 0.55 },

  // The path each world is on, drawn. A hairline — the one width
  // WebGL gives a line whatever you ask for — kept dim enough to
  // read as the diagram under the system rather than as part of
  // it. The segment count is what stops the outer rings looking
  // like polygons: at radius 9 seen from 17 away, 256 of them is
  // an edge a few pixels long.
  ring: { color: "#39406A", opacity: 0.6, segments: 256 },

  // The halo a world wears while the cursor is on it. Same shader
  // the star's corona is drawn with — a glow around a silhouette
  // is a corona, whatever brought it on — so `radius` is a
  // multiple of the body's own, and the falloff shapes how
  // quickly it gives out. Neutral rather than the planet's own
  // color: it says "this one", not "this kind".
  hover: {
    color: "#CFE9FF",
    radius: 1.45,
    opacity: 0.7,
    falloff: 2.2,
  },
};

const LIGHTS = {
  directional: {
    // No color of its own. It's the light of whatever star the
    // current seed rolls, so a world seen in close-up is lit by
    // the sun it would be orbiting out in its own system — see
    // tuneSunlight() in script.js.
    //
    // `from` is the star's blown-out middle and `toward` the
    // color its disc actually reads as. Leaning partway rather
    // than taking the photosphere straight is what keeps a yellow
    // sun from painting every world yellow: a red dwarf casts
    // peach, a blue giant a cool white, and the difference is
    // legible without being a filter over the whole planet.
    // `strength` is how much of that color reaches the light at
    // all — the rest of the way is white. It's a separate dial
    // from `amount` because the two answer different questions:
    // amount decides WHICH of the star's colors to take, strength
    // decides how much of it to spend. A cinder's own middle is
    // already orange, so no setting of `amount` alone could stop
    // it painting its whole system sunset.
    tint: { from: "core", toward: "surface", amount: 0.5, strength: 0.45 },
    intensity: 0.98,
    position: { x: 5, y: 3, z: 4 },
  },
  ambient: {
    color: "#ffffff",
    intensity: 0.12,
  },
};


export { SPECIES, BELT_SHAPE, RING_STYLES, MOON_SHAPE, ATMOSPHERE, PLANET_GEOMETRY, SHADING, ICONS, ENV, WATER, SKY, STARS, SYSTEM, LIGHTS };
