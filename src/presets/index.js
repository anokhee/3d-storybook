import { headDefaults, faceDefaults, heads } from "./model/head.js";
import { bodyDefaults, bodies } from "./model/body.js";
import { limbDefaults, limbs } from "./model/limbs.js";
import { hairDefaults, hairs } from "./model/antennae.js";
import { textureDefaults, textures } from "./materials/textures.js";
import { PALETTE } from "../world/palette.js";

// One continuous band instead of five named ones. The old chubby/skinny/long/
// round/stout ranges are unioned here, so the space is as wide as all five put
// together and a doll can land anywhere in it rather than in one of five bins.
//
// Two things are DERIVED rather than drawn, because independent draws there
// produce a broken doll rather than an unusual one: limb thickness has to
// track body size (a 1.5-scale body on 0.05-radius arms is a bug, not a
// variant), and an end ball has to track the limb it caps. Segment count is
// NOT derived any more — it is the body's own `limbSegments` band, and each
// link just gets length / segments of the drawn reach.
// ============================================================ bands
// Every tunable number in the generator lives here. Two shapes:
//
//   [min, max]   drawn per doll, somewhere inside the pair
//   42           fixed — every doll gets exactly this
//
// The two are interchangeable everywhere: replace a pair with a bare number to
// pin that param, and the draw is still consumed, so pinning one thing doesn't
// reshuffle everything after it.
//
// Two params are NOT plain draws, and say so where they sit:
//   derived — computed from another value rather than drawn on its own
//   ratio   — a fraction of something else, not a world-space length
const BANDS = {
  headDefaults,
  faceDefaults,
  heads,
  // The body, and the neck it carries. Its own table rather than a second
  // deal out of `heads`: a neck belongs to a body, and the head presets had
  // nowhere to put one. Dealt independently of the head, so any pairing is
  // reachable.
  bodyDefaults,
  bodies,

  // The `arms`/`legs` band tables live in presets/bodies.js now — limbs hang
  // off a torso, so each body preset carries its own copy over
  // `bodyDefaults.arms`/`.legs`, plus `limbSegments` (the link count, one
  // band per body), a `spacer` block (the washers, bands per body), and an
  // `omit` list of refused limb presets. What the limbs are STRUNG from —
  // dowel or beads — is still its own table and its own tab; see
  // presets/limbs.js.
  limbDefaults,
  limbs,

  hairDefaults,
  hairs,
  // ---- texture -----------------------------------------------------------
  // What the surface is like underneath: smooth, or thumbed. See
  // presets/materials/textures.js.
  textureDefaults,
  textures,

  rope: { gravity: 14, damping: 0.97, iterations: 8 },

  // The surface: everything is plasticine, in the world's one finish. A doll
  // is pinched from one of these blocks — the color axis the grid deals —
  // and its eyes and mouth dabbed in the one paint. See world/palette.js.
  colors: PALETTE.dolly.blocks,
  paint: PALETTE.dolly.paint,
};

export { BANDS };
