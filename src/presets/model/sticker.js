// The doll as a 2D sticker: a cardboard-thin disc with the doll's head
// printed on it, face-on — its portrait. Ported from the vanilla grid's
// sticker tab. The builder is renderGrid/sticker.js; every knob is here.
export const STICKER = {
  radius: 0.9,
  thickness: 0.06, // cardboard, not paper
  segments: 48,
  // The border round the printed head, as a fraction of the radius: thick
  // enough to read as drawn, subtle because it is the head's own color
  // knocked down rather than an ink of its own.
  stroke: 0.08,
  // How far the WHOLE print — head, features and antennae together — slides
  // down the chip, as a fraction of the radius. Positive is down; it re-uses
  // the room the antennae leave above the head.
  yTranslation: 0.16,
  // The stalks' width as a multiple of the keyline's — heavier than the
  // border, so a topper reads at thumbnail size.
  stalkWidth: 1.8,
  // The chip's background is the skin's complement — but kept this quiet
  // (its saturation capped here) so the SKIN is the color you see.
  bgSaturation: [0.12, 0.28],
};

// ---- the identity map ----------------------------------------------------
// A sticker face is NOT the doll's face verbatim: honest 3D proportions read
// as caricature at chip scale. dollyToStickerParams() pulls every feature
// toward the canonical, ID-photo-ish proportions below —
// stickerVal = lerp(canonical, actual, IDENTITY_STRENGTH) — then clamps it
// to its sane on-chip range. Tune the look here, not in the builder.
export const IDENTITY_STRENGTH = 0.6;

// Per-feature overrides on that: what must read at thumbnail size is kept
// at the doll's own value (1) rather than pulled toward canon — the head's
// shape and the cheeks, the two things a glance should tell apart.
export const IDENTITY_KEEP = {
  headAspect: 1,
  cheekSize: 1,
  cheekAz: 0.9,
};

// The face every sticker leans toward. Latitudes and azimuths are in
// unit-head space — the same coordinates the face bands in the head presets
// use — and sizes are unit-head radii.
export const STICKER_CANON = {
  headAspect: 0.9, // silhouette width / height
  eyeLat: 0.22,
  eyeAz: 0.45,
  eyeSize: 0.085,
  noseLat: 0.1, // the RESOLVED latitude, not the drop-below-eyes band
  noseR: 0.1,
  cheekLat: 0.05,
  cheekAz: 0.62,
  cheekSize: 0.16,
  mouthLat: -0.1,
  mouthW: 0.36,
  mouthH: 0.09,
  mouthTaper: 1,
  // Magnitude only; the doll's own sign is kept. Deep, and floored deep in
  // the clamps below, so every chip plainly smiles or plainly frowns.
  mouthBow: 0.4,
};

// Post-lerp guard rails, [min, max] per canon key, so no single feature can
// leave its sane on-chip range however extreme the source doll.
export const STICKER_CLAMPS = {
  headAspect: [0.55, 1.4],
  eyeLat: [0.05, 0.38],
  eyeAz: [0.3, 0.62],
  eyeSize: [0.07, 0.11],
  noseLat: [-0.05, 0.22],
  noseR: [0.07, 0.13],
  cheekLat: [-0.15, 0.2],
  cheekAz: [0.4, 0.8],
  // A cheeked doll's cheeks are never small on the chip: the floor is what
  // reads at 96px, and the color is the point.
  cheekSize: [0.14, 0.26],
  mouthLat: [-0.3, 0],
  mouthW: [0.26, 0.5],
  mouthH: [0.07, 0.12],
  mouthTaper: [0.7, 1],
  mouthBow: [0.3, 0.6],
};

// Chip-fit numbers. `headFill`/`rimSafety` are fractions of the sticker
// radius; the antenna layout runs in unit-head units (the head's own radius
// is 1) because it happens in the pure mapping layer, before any chip scale
// exists — and angles are scale-free anyway.
export const STICKER_FIT = {
  headFill: 0.66, // of the chip DIAMETER the head (topper excluded) fills
  rimSafety: 0.97, // how far out a bead may reach before being pulled back
  // ---- antenna layout ----
  antMinTipGap: 0.18, // minimum tip-to-tip gap; min separation = gap / length
  antMaxSpreadDeg: 110, // hard cap on the full fan
  antMinLen: 0.25, // floor under any antenna length
  antMaxLen: 1.8, // lengthen-to-fit stops here; past it the count drops
  beadMinRatio: 3, // minimum bead DIAMETER as a multiple of keyline width
  beadScale: 1.6, // sticker-only grow on the beads themselves
  hornScale: 0.8, // sticker-only scale on the horn triangles
  hornSepBoost: 1.1, // sticker-only widen on the horn pair's separation
  leafStalkScale: 0.25, // sticker-only cut on a leaf antenna's stalk length
  leafLenScale: 0.8, // sticker-only cut on the blade's length; width holds
  // Hard cap on the blade's length, as a fraction of the sticker radius. The
  // bead dial divides by count, so one or two leaves come out huge on the
  // real doll — the sticker only needs enough to say "leaf".
  leafMaxLen: 0.45,
  mushroomScale: 1, // sticker-only scale on the mushroom's semicircle cap
  // The antenna balls' own stroke — their color knocked down like the head
  // keyline — as a fraction of the keyline width. Half, because a full
  // keyline swallows a bead that is only 1.5 keylines wide to begin with.
  beadStrokeScale: 0.5,
};
