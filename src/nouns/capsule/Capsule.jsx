import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";

import { hue } from "../../world/palette.js";
import { toon } from "../../adjectives/unlit/toon.js";
import { useGameStore } from "../../game/store.js";
import { emit, onEvent } from "../../player/events.js";
import { primitiveExtent, primitiveGeometry } from "../primitive/geometry.js";
import { CAPSULE } from "./objects.js";
import KnockHint from "./KnockHint.jsx";

// The two halves of the ball: a sphere (pulled tall if `tall` says so),
// cut at its middle, one half kept each way. Both open along the cut, so they are drawn on both
// sides — the inside of the base is what the doll stands in.
const formOf = (C) => ({ tall: C.tall });
const halfOf = (C, half) =>
  primitiveGeometry(
    "sphere",
    C.radius,
    undefined,
    C.detail,
    formOf(C),
    half,
    C.clay,
  );
const extentOf = (C, half) =>
  primitiveExtent(
    "sphere",
    C.radius,
    undefined,
    C.detail,
    formOf(C),
    half,
    C.clay,
  );

// How high the shut ball's crown stands above the ground, once sunk.
export const capsuleHeightOf = (C) => extentOf(C, "top").top - C.sink;
// How far out it spreads on the ground: as far one way as the other.
export const capsuleFootprintOf = (C) => ({
  x: C.radius,
  z: C.radius,
  round: true,
});

// The capsule, stood on the ground where it is mounted: the base set
// `sink` into it, the lid on top. It reads the game's phase itself: shut
// until the doll hatches, then the lid eases up and back, hinged at the
// back of the base's rim — and once it is open the whole ball shrinks
// away to nothing and is gone, so the doll lands on bare moon.
//
// It is colored like the doll shut inside it: the lid in its skin, the
// base in its limbs, read off the store (the player puts them there when
// it deals). Until then it wears the config's own colors.
//
// A click on it is a knock — see the store's knock(): three in a row
// hatch it. Each knock before the last hops the whole ball off the ground
// a little, the second more than the first (C.knock), and it falls back
// with one small bounce — each touch-down a "capsuleLand", with the speed
// it came down at, for the sound.
export default function Capsule({ config: C = CAPSULE }) {
  const [gone, setGone] = useState(false);
  const knock = useGameStore((s) => s.knock);
  const lid = useMemo(() => halfOf(C, "top"), [C]);
  const base = useMemo(() => halfOf(C, "bottom"), [C]);
  // The base's foot is where its lowest lump is, not its nominal radius.
  const foot = useMemo(() => extentOf(C, "bottom").bottom, [C]);
  const lift = -foot - C.sink;
  // The hit area: an unseen ball round the egg, C.knock.reach wide, so a
  // click near it is a knock too.
  const reach = useMemo(
    () => new THREE.SphereGeometry(C.knock.reach, 16, 12),
    [C],
  );
  useEffect(() => () => reach.dispose(), [reach]);
  // Gone with the cursor still over it, the hand would stick.
  useEffect(() => () => (document.body.style.cursor = ""), []);
  const hatchling = useGameStore((s) => s.hatchling);
  const lidColor = hatchling?.skin ?? hue(C.lid.color).getHex();
  const baseColor = hatchling?.limb ?? hue(C.base.color).getHex();
  // Toon like everything else, on both sides — ours to drop. Its emissive
  // is its own color, at nothing, for the hover glow to raise.
  const paint = (color) =>
    toon(color, {
      side: THREE.DoubleSide,
      emissive: color,
      emissiveIntensity: 0,
    });
  const lidMat = useMemo(() => paint(lidColor), [lidColor]);
  const baseMat = useMemo(() => paint(baseColor), [baseColor]);
  useEffect(() => () => lidMat.dispose(), [lidMat]);
  useEffect(() => () => baseMat.dispose(), [baseMat]);

  // How far open the lid is, 0 shut to 1 wide, chased toward the phase's
  // goal rather than snapped.
  // Then how far gone the egg is, 0 whole to 1 nothing, chased the same
  // way once the lid is `C.gone.after` open.
  const open = useRef(0);
  const away = useRef(0);
  const hinge = useRef();
  const egg = useRef();
  // The hop: how high off the ground it is, and how fast it is going up.
  const hop = useRef({ y: 0, vel: 0 });
  // The hover glow: whether the pointer is over it, and how far up the
  // glow is, chased.
  const hovered = useRef(false);
  const glow = useRef(0);
  useEffect(
    () =>
      onEvent((name, detail) => {
        if (name !== "knock") return;
        const H = C.knock.hop;
        hop.current.vel = H[Math.min(H.length, detail.n) - 1];
      }),
    [C],
  );
  useFrame((_, dt) => {
    const shut = useGameStore.getState().phase === "capsule";
    const want = hovered.current && shut ? 1 : 0;
    glow.current += (want - glow.current) * (1 - Math.exp(-C.hover.rate * dt));
    lidMat.emissiveIntensity = baseMat.emissiveIntensity =
      C.hover.glow * glow.current;
    const h = hop.current;
    if (h.y > 0 || h.vel > 0) {
      h.vel -= C.knock.gravity * dt;
      h.y += h.vel * dt;
      if (h.y <= 0) {
        h.y = 0;
        emit("capsuleLand", { speed: -h.vel });
        // Back down: keep a little of the fall as another hop, until it
        // is too small to see.
        h.vel = h.vel < -0.5 ? -h.vel * C.knock.bounce : 0;
      }
      if (egg.current) egg.current.position.y = lift + h.y;
    }
    const goal = useGameStore.getState().phase === "capsule" ? 0 : 1;
    open.current += (goal - open.current) * (1 - Math.exp(-C.lid.rate * dt));
    const hg = hinge.current;
    if (!hg) return;
    const t = open.current;
    hg.position.y = C.lid.lift * t;
    hg.rotation.x = -THREE.MathUtils.degToRad(C.lid.tilt) * t;
    if (t < C.gone.after) return;
    away.current += (1 - away.current) * (1 - Math.exp(-C.gone.rate * dt));
    if (away.current > 0.99) setGone(true);
    else egg.current.scale.setScalar(1 - away.current);
  });

  if (gone) return null;
  return (
    <group
      ref={egg}
      position-y={lift}
      onClick={(e) => {
        e.stopPropagation();
        knock();
      }}
      // A hand over it while it can still be knocked on.
      onPointerOver={() => {
        hovered.current = true;
        if (useGameStore.getState().phase === "capsule")
          document.body.style.cursor = "pointer";
      }}
      onPointerOut={() => {
        hovered.current = false;
        document.body.style.cursor = "";
      }}
    >
      <mesh geometry={reach} visible={false} />
      {/* The click prompt over it, until it is knocked on. */}
      <KnockHint config={C.hint} />
      <mesh geometry={base} material={baseMat} />
      {/* The hinge sits at the back of the rim, the lid its radius in
          front of it, so a turn about the hinge's x swings the front up. */}
      <group ref={hinge} position-z={-C.radius}>
        <mesh geometry={lid} material={lidMat} position-z={C.radius} />
      </group>
    </group>
  );
}
