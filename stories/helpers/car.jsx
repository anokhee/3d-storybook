// CAR: the characters of the Car project (Desktop/Car/3d), the toad and
// the chicken: plain three.js builders that return a group and an
// `animate(state, dt)` that walks, blinks and flaps. Each is built once
// and walked on the spot: the game's own animation, told it is on the
// ground and moving. And the car itself, its wheels turning. Source:
// src/car/.
import { useEffect, useMemo } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { buildFrog } from "../../src/car/frog.js";
import { buildChicken } from "../../src/car/chicken.js";
import { buildCar, CAR } from "../../src/car/car.js";
import { toon } from "../../src/adjectives/unlit/toon.js";

// The builders take a `finish(color, extra)` that makes every lit
// material; this is the project's own: matte, standard.
const standard = (color, extra = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.6, ...extra });

function Walker({ built, walking }) {
  const state = useMemo(() => ({ grounded: true, moving: walking, vy: 0, gliding: false }), [walking]);
  useEffect(() => () => built.group.traverse?.((o) => o.geometry?.dispose?.()), [built]);
  useFrame((_, dt) => built.animate(state, Math.min(dt, 0.05)));
  return <primitive object={built.group} />;
}

// The toad: the chicken's blob torso with the xylophone toad's features,
// on wide flat feet. Faces +x.
export function Toad({ walking = true }) {
  const built = useMemo(() => buildFrog(standard), []);
  return <Walker built={built} walking={walking} />;
}

// The chicken: the blob torso, a scalloped icing cap, a beak, bead eyes,
// bent-plate wings and orange shanks. `wingRaise` 0 is wings folded, 1
// straight out. Faces +x.
export function Chicken({ walking = true, wingRaise = 0.35 }) {
  const built = useMemo(() => buildChicken({ wingRaise }, standard), [wingRaise]);
  return <Walker built={built} walking={walking} />;
}

// The car: the roadster, in the stage's toon (the game's is its own
// toon), facing +x, its wheels turning as if driving at `speed` world
// units a second. `body`, `trim` and `wheel` are its colors.
export function Car({ speed = 6, body = CAR.body, trim = CAR.trim, wheel = CAR.wheel }) {
  const built = useMemo(() => buildCar((color, extra) => toon(new THREE.Color(color), extra), { ...CAR, body, trim, wheel }), [body, trim, wheel]);
  useEffect(() => () => built.group.traverse((o) => o.geometry?.dispose?.()), [built]);
  useFrame((_, dt) => built.roll(Math.min(dt, 0.05), speed));
  return <primitive object={built.group} />;
}
