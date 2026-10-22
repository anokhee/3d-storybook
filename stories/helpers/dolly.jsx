// DOLLY: a doll from the dollies project, built by its own Doll class
// (src/renderGrid/buildOneDolly.js) from a config dealt by randomConfig: a
// head preset (a veggie), and, rolled at random from what suits that head,
// a body, limbs, what grows on its head (its "hair": antennae, horns,
// leaves...), a skin texture, a color, and a seed for everything else.
// The arms, legs and antennae are ropes solved each frame in world space,
// so they live in a group of their own at the scene's top level, as the
// game's DollView has it. A doll hangs in the game's grid with its legs
// dangling; here it is settled for a moment, then lifted so its feet rest
// on the ground.
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { createPortal, useFrame, useThree } from "@react-three/fiber";
import { Doll, randomConfig, compatibleHairs, compatibleLimbs, compatibleTextures } from "../../src/renderGrid/buildOneDolly.js";
import { BANDS } from "../../src/presets/index.js";
import { toon } from "../../src/adjectives/unlit/toon.js";

export const HEADS = Object.keys(BANDS.heads);
const BODIES = Object.keys(BANDS.bodies), LIMBS = Object.keys(BANDS.limbs), HAIRS = Object.keys(BANDS.hairs), TEXTURES = Object.keys(BANDS.textures), COLORS = Object.keys(BANDS.colors);
const pick = (list, r) => list[Math.floor(r() * list.length)];
const mulberry = (seed) => () => { seed |= 0; seed = (seed + 0x6d2b79f5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };

// THE dolly: the base one, an acorn head (pointed at the chin, a cap of
// leaves on top; the pear read as a blob) on a round citrus body, bead
// limbs, smooth skin, butter yellow, with ball-tipped antennae.
export const BASE = { head: "acorn", body: "citrus", limb: "bead", hair: "antennae", texture: "smooth", color: "butter", seed: 41 };

// A doll: roll 0 is the base dolly above; any other roll deals the whole
// thing at random, head included (or the given head), from what suits.
export function dealDolly(head, roll) {
  if (!roll) {
    const B = BASE;
    return randomConfig(B.seed, B.head, B.body, B.limb, B.hair, B.texture, B.color);
  }
  const r = mulberry(roll * 7919 + 1);
  head = head ?? pick(HEADS, r);
  const body = pick(BODIES, r);
  const limb = pick(compatibleLimbs(body, LIMBS), r);
  const hair = pick(compatibleHairs(head, HAIRS), r);
  const texture = pick(compatibleTextures(head, TEXTURES), r);
  const color = pick(COLORS, r);
  return randomConfig(Math.floor(r() * 1e9), head, body, limb, hair, texture, color);
}

const STEP = 1 / 60, MAX_STEPS = 4;

export function DollyFigure({ head = null, roll = 0, position = null }) {
  const scene = useThree((s) => s.scene);
  const doll = useMemo(() => {
    const d = new Doll(dealDolly(head, roll), new THREE.Vector3(), toon);
    d.down.set(0, -1, 0);
    // Settle the ropes, then stand the doll on its feet: lift it so the
    // lowest point of its ropes sits on the ground.
    for (let i = 0; i < 90; i++) { d.root.updateWorldMatrix(true, false); d.step(STEP); }
    const box = new THREE.Box3();
    d.ropeGroup.updateWorldMatrix(true, true);
    d.ropeGroup.traverse((o) => { if (o.isMesh) box.expandByObject(o); });
    if (!box.isEmpty() && box.min.y < 0) d.root.position.y = -box.min.y;
    d.root.updateWorldMatrix(true, false);
    d.carryRopes();
    return d;
  }, [head, roll]);
  useEffect(() => () => doll.dispose(), [doll]);
  // The ropes: a fixed-size physics step, as the game's DollView does it.
  const debt = useRef(0);
  useFrame((_, delta) => {
    debt.current = Math.min(debt.current + Math.min(delta, 1 / 30), STEP * MAX_STEPS);
    if (debt.current >= STEP) doll.root.updateWorldMatrix(true, false);
    while (debt.current >= STEP) { debt.current -= STEP; doll.step(STEP); }
    doll.carryRopes();
  });
  return (
    <>
      <primitive object={doll.root} />
      {createPortal(<primitive object={doll.ropeGroup} />, scene)}
    </>
  );
}

// A grid of dolls, the way the dollies project deals a wall of them: every
// head twice, each its own roll. `roll` reseeds the lot.
export function DollyGrid({ roll = 1, columns = 4, spacing = 5 }) {
  const dolls = HEADS.flatMap((head, i) => [0, 1].map((k) => ({ head, roll: roll * 1000 + i * 2 + k + 1 })));
  const rows = Math.ceil(dolls.length / columns);
  return dolls.map((d, i) => (
    <group key={`${d.head}-${d.roll}`} position={[((i % columns) - (columns - 1) / 2) * spacing, 0, (Math.floor(i / columns) - (rows - 1) / 2) * spacing]}>
      <DollyFigure head={d.head} roll={d.roll} />
    </group>
  ));
}
