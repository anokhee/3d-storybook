// HUNG: an ornament on a string, facing the camera. Shared by the
// Ornaments stories (one file per shape, so each is its own entry in the
// sidebar under the ORNAMENTS header). STANDING is the same shape with no
// string, sitting on the ground: the Primitives stories.
//
// `ornamentOf` turns a short spec ({ shape, radius }) into what the
// Ornament component draws; `Facing` is what the garland uses to turn a
// flat ornament to look outward, and here "outward" is toward the camera.
// The string is the garland's own cord, as a thin stick.
import * as THREE from "three";
import Ornament, { ornamentOf, dropOf, Facing } from "../../src/nouns/ornament/Ornament.jsx";
import { GARLAND } from "../../src/nouns/garland/objects.js";
import { toon } from "../../src/adjectives/unlit/toon.js";
import { hue, solid, PALETTE } from "../../src/world/palette.js";

const KNOT = 3; // where the string is tied, in world units above the ground
const STRING = 1.2; // how long the string is

const stringGeometry = new THREE.CylinderGeometry(GARLAND.wire.radius, GARLAND.wire.radius, STRING, GARLAND.wire.sides);
const stringMaterial = toon(hue(GARLAND.wire.color));

// `light` is one of LIGHT_TYPES (src/adjectives/lit/objects.js): "unlit",
// "lit" (a halo round it) or "glowing" (lit from inside); `brightness` 0..1
// scales the light. A lit ornament also casts a real point light here
// (`casts`), which the garland rations but a single ornament can afford.
export function Standing({ shape, radius = 0.6, color = PALETTE.white.hex, light = "unlit", brightness = 1 }) {
  const o = ornamentOf({ shape, radius, light: { type: light, brightness } });
  // Its middle a radius up, so it rests on the ground (every primitive is
  // as tall below its middle as its radius)
  return (
    <group position-y={radius}>
      <Facing x={0} z={1} faceOut={o.faceOut}>
        <Ornament ornament={o} swatch={solid(color)} casts={light !== "unlit"} />
      </Facing>
    </group>
  );
}
export function Hung({ shape, radius = 0.6, color = PALETTE.white.hex, light = "unlit", brightness = 1 }) {
  const o = ornamentOf({ shape, radius, light: { type: light, brightness } });
  return (
    <group position-y={KNOT}>
      <mesh geometry={stringGeometry} material={stringMaterial} position-y={-STRING / 2} />
      {/* Hung off the end of the string by what it is: a flower hangs by its
          top point, a ball by its middle (dropOf). */}
      <group position-y={-STRING - dropOf(o)}>
        <Facing x={0} z={1} faceOut={o.faceOut}>
          <Ornament ornament={o} swatch={solid(color)} casts={light !== "unlit"} />
        </Facing>
      </group>
    </group>
  );
}
