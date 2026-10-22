// The balls there are to stand on, by name. A station is built on one of
// them, and the doll belongs to one at a time — `you.body`, which the
// flight measures everything from — or to none: each has a gravity SHELL,
// a radius from its center within which it pulls, and outside every shell
// there is no gravity at all and the doll flies free. Climb out of a shell
// and you are let go. How a ball takes you is `catch`: "shell" has you the
// moment you drift into its shell, "touch" only once your feet come within
// `touch` of its ground. Both pull with the same surface gravity
// (FALL.gravity).
import * as THREE from "three";

import { PLANET } from "./objects.js";
import { MOON } from "../moon/objects.js";

export const BODIES = {
  planet: {
    name: "planet",
    center: new THREE.Vector3(0, 0, 0),
    radius: PLANET.radius,
    shell: PLANET.shell,
    catch: PLANET.catch,
  },
  moon: {
    name: "moon",
    center: new THREE.Vector3(...MOON.center),
    radius: MOON.radius,
    shell: MOON.shell,
    catch: MOON.catch,
    touch: MOON.touch,
  },
};

// A body by name, or the object itself passed through; anything else is a
// mistake worth hearing about.
export function bodyOf(body = "planet") {
  const b = typeof body === "string" ? BODIES[body] : body;
  if (!b)
    throw new Error(
      `body must be one of ${Object.keys(BODIES).join(", ")}, got ${JSON.stringify(body)}`,
    );
  return b;
}
