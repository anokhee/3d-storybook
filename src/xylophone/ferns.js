// Ported from the xylophone project as an ES module: the original is a
// classic script sharing globals (COLOR_PALETTE, ...), so the import and
// the export line below are the only changes.
import { COLOR_PALETTE } from "./palette.js";

// ---------- the ferns: what the vibraphone grows instead of flowers ----------
// Loaded after palette.js and before script.js. Their colors live in palette.js (fernColors, fernStem); the
// code that grows them is in script.js (sproutFern and updateFern)
// a single upright frond growing out of the ground, curling over at its tip. It is a stem with a pair of
// leaflets at every segment; they start folded up along it and unfurl from the base to the tip as it rises,
// then droop and shrink away. Green, tinted toward the note
const FERNS = {
  fronds: 1, // fronds per plant. 1 = a lone leaf out of the ground; more spread evenly round a bush
  segments: 14, // each frond is a chain of this many bendable pieces, with a pair of leaflets at the end of each
  lean: 0.05, // tilt of a frond's base away from upright, radians. Near 0 = sticks straight up
  arch: 0.15, // how far the open frond bows over along its whole length, radians. Near 0 = a straight stem below the tip curl
  midArch: -0.9, // a bend packed into the middle of the frond, radians. Negative bows it in toward the plant's center, positive out
  midAt: 0.5, // where along the frond that bend is centered, 0 = base, 1 = tip
  midWidth: 0.35, // how far either side of that point the bend spreads, as a fraction of the frond's length
  tipCurl: 2.6, // extra bend packed into the end of the frond, radians, so the tip curls over. ~3.1 curls it right under
  tipShare: 0.3, // how much of the frond, from the tip back, takes that curl. Smaller = a tighter curl at the very end
  curl: 4.5, // extra bend while it is still furled, so it starts as a tight fiddlehead and unrolls as it grows
  stemByPitch: [3.2, 5.8], // frond length for the lowest note and for the highest
  sizeByPitch: [1.6, 0.7], // leaflet size multiplier for the lowest note and for the highest
  leafletLength: 0.95, // at the base of the frond; they shrink toward the tip
  leafletWidth: 0.2,
  closed: 1.35, // leaflet angle from flat while still furled, radians (nearly along the stem)
  open: 0.25, // leaflet angle when open
  wilt: -0.55, // and when fading: drooping
  grow: 0.9, // seconds: fronds rising
  unfurl: 1.1, // seconds: leaflets opening up the frond
  hold: 2.5,
  fade: 0.8,
  size: [0.9, 1.1],
  tint: 0.3, // how much of the note's color goes into the green
  colors: COLOR_PALETTE.fernColors,
  stem: COLOR_PALETTE.fernStem,
};

// ferns through the grass: leafy clumps scattered over the meadow in place of its flowers, for instruments
// that ask for them (the forest scenes: each instrument's `ferns` setting). Built once, fully open, from the
// same fronds as above with these changes
const MEADOW_FERNS = {
  count: 110, // how many clumps
  spacing: 1.6, // clumps keep at least this many times their combined scales apart
  footprint: 1.2, // how much ground a clump covers, times its scale: note sprouts keep off it
  variants: 5, // distinct clump shapes built and reused
  fronds: [5, 7], // fronds per clump
  length: [1.5, 2.4], // frond length range
  leaflet: [0.75, 1.0], // leaflet size multiplier range
  scale: [0.85, 1.2], // random per-clump size multiplier
  frond: { lean: 0.75, arch: 0.6, midArch: 0.25, tipCurl: 1.4 }, // overrides of the frond shape above: spread out and arching over
};


export { FERNS, MEADOW_FERNS };
