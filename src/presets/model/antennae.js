export const hairDefaults = {
  count: [1, 4], // how many antennae are there
  omit: [], // which counts to omit
  startAtCenter: true,
  spread: [0.14, 0.45],
  length: [0.5, 1.4],
  radius: [0.1, 0.1],
  topRadius: [0.01, 0.01],
  taper: 0.8,
  segments: [1, 5],
  stalk: "barrel",
  stalkCurve: 0,
  beadSize: [0.1, 0.18],
  tip: "ball",
  tipAspect: 1,
  tipFlat: 1,
  capBulge: 0,
  capWobble: 0,
  stiffness: [0.45, 0.85],
  ascendingChance: 0.5,
  jitter: [0, 0],
  rigidity: 0,
  seat: 0,
  azimuth: 0,
  shiftColor: true,
  // How far the root link may lean off the way it grows, as a share of a
  // right angle: 0 bolts it to the skull, 1 lets it fold flat along it. The
  // rest of the antenna swings freely past the root; this only stops the
  // whole thing being knocked down over the head, base showing.
  lean: 0.6,
};

export const hairs = {
  none: { count: 0 },
  segmented: {},
  antennae: {
    count: [1, 2],
    spread: [0.1, 0.28],
    length: [0.55, 1.21],
    segments: [1, 1],
    stalk: "tube",
    radius: [0.8, 0.8],
    topRadius: [0.012, 0.032],
    stalkCurve: [0.88, 1.8],
    beadSize: [0.14, 0.38],
    tip: "ball",
    stiffness: [0.1, 0.2],
    seat: 0.5,
    // Grows out of the head, so it keeps the head's material exactly rather
    // than rolling to its own shade.
    shiftColor: false,
  },
  beadStack: {
    count: [1, 3],
    spread: [0.16, 0.38],
    length: [0.9, 1.3],
    segments: [4, 6],
    stalk: "bead",
    // The smallest bead, as a radius. With the link cut to match, this is
    // half the width of the foot of the stack — the whole stack is scaled off
    // it, height included.
    radius: [0.055, 0.075],
    // The ramp itself — the far bead is this many times the near one. This is
    // the whole reason the stack reads as a stack and not as a column, so keep
    // it well clear of 1.
    taper: [2, 2.8],
    // The crown: one more ball, straddling the last point, drawn a shade past
    // the biggest stalk bead so the run finishes rather than stopping. Divided
    // by `taper` when the stack descends, so it lands on the small end there.
    tip: "ball",
    beadSize: [0.2, 0.27],
    // The bias: mostly stacks that grow away from the head, and now and then
    // one that starts fat at the skull and closes to a small bead at the tip.
    // Nothing else changes between them — it is the same ramp read from the
    // other end. Set it to 1 or 0 to pin the whole axis one way.
    ascendingChance: 0.7,
    // Stiff enough to hold the column up — a stack that sags stops reading as
    // stacked — but not pinned, so it still rocks.
    stiffness: [0.5, 0.8],
  },
  leaves: {
    count: [2, 8],
    omit: [3, 4, 5, 6, 7],
    spread: [0.22, 0.62],
    length: [0.15, 0.26],
    radius: [0.05, 0.1],
    segments: [5, 7],
    beadSize: [0.5, 0.5],
    tip: "leaf",
    tipAspect: [2.1, 8.2], // long — a blade, not a paddle
    tipFlat: 0.35,
    stiffness: [0.88, 0.95],
    startAtCenter: false,
    // Foliage, not a crown — a sprout's leaves come up where they come up.
    jitter: [0.35, 0.8],
    // Mostly held: foliage should ride the head and rustle at the edges, not
    // flap. Raise toward 1 for stiller yet.
    rigidity: [0.55, 0.8],
  },
  horns: {
    count: [2, 2],
    spread: [0.3, 0.5],
    length: [0.04, 0.06], // the buried stub
    segments: [1, 1],
    stalk: "tube",
    radius: [0.05, 0.08],
    topRadius: [0.09, 0.09],
    // The horn itself. Half-width is beadSize over count — THIS is the base
    // radius dial (there is no `baseRadius` key; nothing reads one).
    beadSize: [0.7, 0.9],
    tip: "cone",
    tipAspect: [1.2, 1.7], // well over 1: a point, not a mushroom cap
    tipFlat: [0.55, 0.75], // squashed out of round, the way an ear is
    capBulge: [0, 0.2], // near-straight sides — a clean triangle
    capWobble: [0, 0.03],
    stiffness: [0.95, 1],
    rigidity: [0.96, 1],
    startAtCenter: false,
    // Sunk to the skull's curve so the rim doesn't float where the head falls
    // away, plus a shade extra for the texture crust underneath it.
    seat: [1, 1.2],
  },

  // The stalk as-is, capped. Held stiffer and gathered tighter than the
  // others: a mushroom that lolls reads as broken, and the cap is wide
  // enough that a big splay walks it straight into its neighbor.
  mushroom: {
    count: [1, 5],
    // Two caps side by side read as a pair of eyes on a stalk. One reads as a
    // mushroom and three or more as a clump; the twos land on threes.
    omit: [2, 3, 4],
    spread: [0.3, 0.2],
    length: [0.4, 0.88],
    radius: [0.05, 0.2],
    topRadius: [0.001, 0.1],
    segments: [1, 1],
    stalk: "tube",
    beadSize: [0.8, 1],
    tip: "cone",
    tipAspect: [0.38, 0.62], // well under 1: a wide shallow cap
    tipFlat: 1, // round in plan
    capBulge: [0.25, 0.6],
    capWobble: [0.03, 0.09],
    stiffness: [0.01, 0.1],
    // Mushrooms clump where the spores fell, not on a fairy ring. Only ever
    // fires on the 6+ clumps — the low counts are all under the 3-and-under
    // floor or omitted above.
    jitter: [0.3, 0.7],
  },
};
export const hairGlow = {
  types: ["mushroom", "beadStack", "antennae", "leaves"],
  reach: 3.2,
  alpha: 0.5,
  // Leans with the body rather than matching it: the doll's own board is where
  // the color starts, then it is carried this far toward `warm`. That lean is
  // what keeps a walnut doll from glowing brown — a glow is fire, and fire is
  // yellow before it is anything else.
  warm: [255, 208, 96],
  toward: 0.6,
  // The HSL pass that is left. Small now: the lean above does most of the
  // lifting, and pushing these on top of it is how a tip goes white.
  wash: 0.06,
  lift: 0.12,
  // And the two ends, pinned. Half the boards in the table are pale, a pale
  // board mixes to a pale color, and a pale color under additive blending is
  // white — which is the whole thing this was trying not to be. So the mix is
  // never less saturated than `floor` and never lighter than `cap`. What comes
  // through the clamp is the doll's HUE, which is the part that says whose
  // glow it is; how strong it burns is the effect's call and not the board's.
  floor: 0.58,
  cap: 0.55,
};
