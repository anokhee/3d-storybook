import { PALETTE } from "../../world/palette.js";

import * as THREE from "three";

// The moon: a second ball to stand on, and the light the sky throws.
// Colors come from PALETTE (src/world/palette.js).
//
// A ball like the planet, that stations can be built on and that pulls the
// doll within its own gravity shell — see ../planet/bodies.js. `center` is
// in world units from the planet's middle: straight up for now, over the
// trampoline on the pole. `shell` is world units from the moon's own
// center, 32 above its ground — but it only LETS GO there: the moon's pull
// stays off until the doll actually lands on it, its feet within `touch`
// of the ground, so it can be flown past and around freely.
export const MOON = {
  center: [0, 200, 0],
  radius: 8,
  shell: 40,
  catch: "touch",
  touch: 3,
  color: PALETTE.moon.body,
  glow: {
    reach: 4.2,
    alpha: 0.17,
    color: PALETTE.moon.glow,
  },
  // The surface: clay, the same stock the dolls are thrown from. The lumps
  // are the dolls' own bump field (src/presets/materials/textures.js) —
  // `texture` names a preset there and `amount` is its one dial, the same
  // one a doll draws its lumpiness from — laid over a smooth ball. `seed`
  // picks which lumps; `detail` is the icosphere's subdivision, finer than
  // a head's because the ball is so much bigger on screen. Relief is the
  // preset's amplitude as a share of the radius, so the doll, which stands
  // on the bare radius, is never far off the ground. `clear` is where the
  // lumps are eased flat for a station — lat/lon on the moon, radius in
  // world units, eased out over `fade` more.
  terrain: {
    texture: "bumpiness",
    amount: 0.6,
    seed: 7,
    detail: 24,
    clear: [
      { lat: 90, lon: 0, radius: 6, fade: 3 },
      // The underside, facing the planet: where the capsule sits (see
      // game/scenes.js).
      { lat: -90, lon: 0, radius: 4, fade: 2 },
    ],
  },
  // The sun that lights it, and the light it throws onto the planet, are
  // both in refactored/lighting.js — MOON_SUN and LIGHTING.
};

// The moon's bearing from the planet's center, as a unit vector for
// anything that hangs off it.
export const MOON_DIR = new THREE.Vector3(...MOON.center).normalize();
