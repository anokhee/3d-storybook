import {
  bumpAt,
  bumpFrom,
  textureDefaults,
  textures,
} from "../../presets/materials/textures.js";
import { PLANET } from "./objects.js";
import { CLAY_ON } from "../../world/clay.js";

// The ground's surface, thumbed: the dolls' own bump field (see PLANET.clay)
// pressed into the ball as hollows. Only ever pressed IN — the flat of the
// field is left at `radius`, where everything that stands on the ground
// expects it, and the field's dips are pressed down by up to `depth` — so
// a thing over a hollow floats a little rather than a thing on a lump
// being buried. Read by the planet to build itself and by the ground cover
// to root each plant in the dent it grows from.
const C = PLANET.clay;
const bump =
  C &&
  bumpFrom(C.amount, C.seed, {
    ...textureDefaults,
    ...textures[C.texture],
    detail: PLANET.detail,
  });

// How far the ground is from the center along the unit bearing `dir`.
export function groundRadiusAt(dir) {
  if (!CLAY_ON || !bump || !(bump.amplitude > 0)) return PLANET.radius; // see world/clay.js
  const k = C.lumps;
  // The field runs about -1..1 once its own amplitude is divided out.
  const f = bumpAt(bump, dir.x * k, dir.y * k, dir.z * k) / bump.amplitude;
  return PLANET.radius - C.depth * Math.max(0, -f);
}
