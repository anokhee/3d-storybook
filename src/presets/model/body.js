export const bodyDefaults = {
  size: [0.75, 1.5],
  split: 0,
  feather: 1,
  topBalloon: 0,
  pullUp: 0,
  topPoint: false,
  botBalloon: 0,
  pullDown: 0,
  botPoint: false,
  // Same key as the head's: depth of the flat cut above the shape's lowest
  // point, 0 for none. Here so the two tables keep feeding shapeFrom() the
  // same eight-plus keys — and a flat base is how a body sits flush one day.
  chin: 0,
  balloonGapKnee: 0.15,
  minBalloonGap: 0,
  neck: {
    length: [0.01, 0.82],
    topRadius: [0.15, 0.18], // absolute — sits on the unit-scale head
    bottomFrac: [0.32, 0.9], // ratio of size
    minFlare: 1.25, // the bottom is never thinner than topRadius x this
    blend: [1.8, 2.8], // how the profile runs between the two rings
    fillet: 0.35, // how much of the bottom is blended into the body
    sink: 0.08, // how far both rings are pulled inside the surface
  },
  // Limb presets this body refuses — keys out of presets/limbs.js.
  omit: [],
  // How many links each limb is strung from — ONE count, dealt per doll and
  // worn by all four limbs. It never touches the drawn `length`: each
  // non-spacer bead's own length is simply length / limbSegments, so more
  // segments mean shorter beads on the same reach, never a longer limb. The
  // bead's WIDTH is the shared `limb.radius` band below, times the
  // `bead.scale` band — count and width are the two dials, and the bead
  // stretches or squashes along the limb to fit its link.
  limbSegments: [8, 13],
  // The torus threaded on every interior joint — the washer on the elastic of
  // a real strung doll. Moved here from presets/limbs.js: the body deals the
  // limbs, so the body says how their washers are proportioned. Bands now,
  // drawn once per doll and worn by all four limbs (one torus cut per doll).
  //
  //   scale  ring radius over the limb's radius at that joint. Above 1 it
  //          stands proud of a dowel and reads as a collar; below 1 it tucks
  //          into the neck between two beads.
  //   tube   the torus' own thickness, as a ratio of its ring radius.
  //
  // Mind the RIM: the solid-body law holds every joint off the torso by the
  // widest thing threaded there, and a spacer's outer rim is scale x
  // (1 + tube) of the limb's radius. Push that much past ~1.5 and the first
  // joint stands so far off the shoulder that the root link kinks — the arm
  // reads as bent at the top. Keep scale x (1 + tube) near the bead's own
  // width and the limb drapes flush instead.
  spacer: {
    scale: [0.7, 0.9],
    tube: [0.3, 0.45],
  },
  // The bead itself — every non-spacer link of the limb, on the same footing
  // as the spacer's block above.
  //
  //   scale  the bead's width over the limb's radius at that point. Above 1
  //          the beads swell chubbier than the limb they are strung on, below
  //          1 they run slimmer. Drawn once per doll, worn by all four limbs.
  //
  // Width only: a bead's LENGTH is still length / limbSegments, and the
  // limb's skeleton thickness — what the spacers and end balls size off —
  // stays the shared `limb.radius` band below. So this dial fattens or
  // slims the beads without moving anything strung between them.
  bead: {
    scale: [0.9, 1.1],
  },
  // ONE deal for every limb. Arms and legs are strung from the same stock on
  // a real doll, so the numbers that say what a limb IS — look and reach —
  // are stated once and drawn once per doll. `arms`/`legs` below keep only
  // placement: where they hang (`y`, `spread`).
  //
  //   radius        the limb's thickness. Derived — read at body size, not
  //                 drawn — so a big body never lands on twig limbs.
  //   radiusJitter  drawn wobble on top of that.
  //   ballRatio     the ball capping the end, as a ratio of radius.
  //   taper         how much thinner the far end runs.
  //   length        the LEG's reach — legs are the base, since they set the
  //                 stance and how the doll meets the ground.
  //   armRatio      arms over legs. A ratio rather than a second length, so
  //                 the pairing is always a statement: [1, 1] pins arms to
  //                 legs exactly, below 1 runs them shorter, and a wide band
  //                 buys back uncorrelated limbs only if you ask for them.
  limb: {
    radius: [0.055, 0.13],
    radiusJitter: [0.88, 1.12],
    ballRatio: [1.8, 2.2],
    taper: [0.55, 0.88],
    length: [0.7, 2.7],
    armRatio: [0.8, 1.1],
  },
  arms: {
    y: [0.5, 0.78],
    spread: [0.0, 0.5],
  },
  legs: {
    spread: [0.3, 0.68],
  },
};

export const bodies = {
  gourd: {
    size: [0.68, 1.35],
    split: [0.0, 0.18],
    feather: [0.5, 0.8],
    topBalloon: [-0.5, -0.34],
    pullUp: [0.3, 0.62],
    botBalloon: [0.05, 0.18],
    pullDown: [0.02, 0.26],
    balloonGapKnee: 0.15,
    neck: {
      length: [0.25, 0.78],
      topRadius: [0.07, 0.1],
      bottomFrac: [1, 1.8],
      blend: [1, 2],
      fillet: 1,
    },
    omit: [],
    limbSegments: [2, 5],
    // Prouder collars than the default — a gourd's limbs read as turned and
    // strung — but the rim (scale x (1 + tube)) tops out near 1.5, which is
    // as far as a spacer can stand off the limb before the solid-body
    // clearance kinks the shoulder.
    spacer: {
      scale: [0.5, 0.5],
      tube: [0.25, 0.35],
    },
    bead: {
      scale: [0.9, 1.1],
    },
    limb: {
      radius: [0.1, 0.13],
      radiusJitter: [0.88, 1.12],
      ballRatio: [1.8, 2.2],
      taper: [0.55, 0.88],
      length: [0.7, 2.7],
      armRatio: [0.8, 1.1],
    },
    arms: {
      y: [0.3, 0.66],
      spread: [0.0, 0.5],
    },
    legs: {
      spread: [0.3, 0.68],
    },
  },

  // Round by intent and a little squat: both ends inflated, both pulled in,
  // and a wide feather so there is no waist at all. `balloonGapKnee` 0 opts it
  // out of the minimum-taper floor — the same escape the round heads take,
  // since forcing a taper on something meant to be a sphere just pinches it.
  //
  // Almost no neck. What there is, is short and wide, so the head sits down on
  // the shoulder rather than standing off it.
  citrus: {
    size: [0.85, 1.45],
    split: [-0.08, 0.08],
    feather: [1.2, 1.7],
    topBalloon: [0.0, 0.14],
    pullUp: [-0.14, -0.02],
    botBalloon: [0.0, 0.14],
    pullDown: [-0.12, 0.0],
    balloonGapKnee: 0,
    neck: {
      length: [0.088, 0.34],
      topRadius: [0.09, 0.15],
      bottomFrac: [0.5, 0.9],
      // A low blend keeps the short profile close to a straight cone; a high
      // one on a neck this short reads as a bulge rather than a taper.
      blend: [1.5, 2.0],
      // Generous, because at this length the fillet IS the neck — most of what
      // you see is the blend into the shoulder.
      fillet: 0.55,
    },
    // Same deal as the gourd's: today's defaults, a citrus' own to tune.
    omit: [],
    limbSegments: [4, 8],
    // Tucked washers, rim well under the bead's width — a citrus is round and
    // squat, so its limbs sit close and any shoulder stand-off shows.
    spacer: {
      scale: [0.7, 0.9],
      tube: [0.3, 0.45],
    },
    bead: {
      scale: [0.9, 1.1],
    },
    limb: {
      radius: [0.055, 0.13],
      radiusJitter: [0.88, 1.12],
      ballRatio: [1.8, 2.2],
      taper: [0.55, 0.88],
      length: [0.7, 2.7],
      armRatio: [0.8, 1.1],
    },
    arms: {
      y: [0.5, 0.78],
      spread: [0.0, 0.5],
    },
    legs: {
      spread: [0.3, 0.68],
    },
  },
};
