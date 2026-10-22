import { PALETTE } from "../../world/palette.js";
import { FINISH } from "../../adjectives/unlit/objects.js";

export const GRASS = {
  height: 0.7, // strand height, before the size roll
  baseRadius: 0.5, // strand radius at the root
  taper: 0.42, // tip radius as a fraction of the root's — low is pinched
  cap: 1.2, // ensures that the end is rounded, not flat (bugfix)
  bend: 0.5, // how far the tip finishes over from the root
  stiff: 0.3, // how much of the strand runs straight before it curls
  shaft: 4, // segments up the straight part — enough for the clay to lump
  dome: 3, // segments round the cap (rounds out the top)
  radial: 6, // segments around the stalk
  shade: 0.45, // how dark the root is; the field's depth comes from this
  soft: 0.45, // normals leaned toward up, for one soft mass not many tubes
  tip: 0, // how white the tip is, 0 to 1 — see strandGeometry
  tipFrom: 0.6, // how far up the whitening starts
  clay: { texture: "bumpiness", amount: 0.6, seed: 0, lumps: 2.2, depth: 0.05 },
  hand: {
    height: [0.5, 0.95],
    baseRadius: [0.32, 0.6],
    taper: [0.25, 0.65],
    bend: [0.2, 0.8],
    stiff: [0.15, 0.55],
    lumps: [1, 3],
    depth: [0.02, 0.09],
  },
  finish: FINISH,
  color: PALETTE.grass.green,
};
