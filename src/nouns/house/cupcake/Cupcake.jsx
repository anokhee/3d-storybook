import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";

import { merge } from "../../../world/merge.js";
import { mulberry32 } from "../../../world/random.js";
import { LIGHT } from "../../../adjectives/lit/objects.js";
import { unlitMat } from "../../../adjectives/unlit/material.js";
import Primitive from "../../primitive/Primitive.jsx";
import Seated from "../../primitive/Seated.jsx";
import { useBody } from "../../planet/OnPlanet.jsx";
import { registerSolid, unregisterSolid } from "../../../player/solids.js";
import { Arch, Coin } from "../mushroom/MushroomHouse.jsx";
import { useDoorAt } from "../House.jsx";
import { CUPCAKE } from "./objects.js";

const rad = (deg) => (deg * Math.PI) / 180;

// The paper case: a drum tapering to its foot, pleated — every other
// vertex round it pushed out by `pleat`, the ones between pulled in, so
// its rim is a zigzag and its wall a ring of ridges — and shaded flat, so
// each pleat's two faces catch the light apart, the way folded paper
// does. Built about its own middle, like a primitive, so the door and
// windows can be seated on it (see Seated). Cached by its sizes.
const cups = new Map();
function cupGeometry(C) {
  const key = `${C.radius}:${C.foot}:${C.height}:${C.flutes}:${C.pleat}`;
  if (cups.has(key)) return cups.get(key);
  const g = new THREE.CylinderGeometry(
    C.radius,
    C.radius * C.foot,
    C.height,
    C.flutes * 2,
    1,
    false,
  );
  const pos = g.attributes.position;
  const step = Math.PI / C.flutes;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i),
      z = pos.getZ(i);
    const rho = Math.hypot(x, z);
    if (rho < 1e-6) continue;
    const k = Math.round(Math.atan2(x, z) / step);
    const scale = 1 + (k % 2 === 0 ? C.pleat : -C.pleat);
    pos.setX(i, x * scale);
    pos.setZ(i, z * scale);
  }
  const flat = g.toNonIndexed();
  flat.computeVertexNormals();
  flat.computeBoundingBox();
  g.dispose();
  cups.set(key, flat);
  return flat;
}

// Where the case's rim is, off the ground.
const rimOf = (C) => C.height - C.sink;

// The cake's dome: a sphere's top half, pressed down to `squash` of its
// height, its cut on the rim.
const cakeRadiusOf = (K) => K.cup.radius * K.cake.radius;
const cakeTopOf = (K) => rimOf(K.cup) + cakeRadiusOf(K) * K.cake.squash;

// The frosting's tiers, stacked from the cake's crown: each a sphere
// pressed to `tall` of its height, sat `overlap` of its own half-height
// down into what is under it — as `{ radius, tall, y }`, its middle off
// the ground, and where the top of the stack ends up.
function tiersOf(K) {
  const F = K.frosting;
  let top = cakeTopOf(K);
  const tiers = F.tiers.map(({ radius, tall }) => {
    const r = K.cup.radius * radius;
    const half = r * tall;
    const y = top - half * F.overlap + half;
    top = y + half;
    return { radius: r, tall, y, half };
  });
  return { tiers, top };
}

// Where the cherry sits: on the frosting's top, sunk in a little.
const cherryOf = (K) => {
  const H = K.cherry;
  if (!H) return null;
  const y = tiersOf(K).top + H.radius * (1 - H.sink);
  return { y, top: y + H.radius + (H.stem ? H.stem.height * 0.9 : 0) };
};

// How tall the cupcake stands off its ground, for the posts to clear: the
// cherry's stem, or the frosting's top without one.
export function cupcakeHeightOf(K) {
  const cherry = cherryOf(K);
  return cherry ? cherry.top : tiersOf(K).top;
}

// How far out from its middle it spreads, for the player to be kept out
// of and the grass to keep back from: the cake's swell or the case's rim,
// round with it.
export function cupcakeFootprintOf(K) {
  const r = Math.max(K.cup.radius * (1 + K.cup.pleat), cakeRadiusOf(K));
  return { x: r, z: r, round: true };
}

// The sprinkles: each laid on a tier's surface where the roll puts it —
// which tier, how far up it and round it — lying flat along the surface
// there, turned a random way about its own up, and colored in turn.
function sprinklesOf(K, tiers) {
  const S = K.sprinkles;
  if (!S || !tiers.length) return [];
  const rand = mulberry32(S.seed);
  const up = new THREE.Vector3(0, 1, 0);
  return Array.from({ length: S.count }, (_, i) => {
    const t = tiers[Math.floor(rand() * tiers.length)];
    const la = rad(S.lat + rand() * (88 - S.lat));
    const lo = rand() * Math.PI * 2;
    // A point on the pressed sphere, and its normal — the sphere's
    // scaled by the squash, the way a squashed ball's normal goes.
    const dir = new THREE.Vector3(
      Math.cos(la) * Math.sin(lo),
      Math.sin(la),
      Math.cos(la) * Math.cos(lo),
    );
    const at = new THREE.Vector3(
      dir.x * t.radius,
      t.y + dir.y * t.radius * t.tall,
      dir.z * t.radius,
    );
    const normal = new THREE.Vector3(dir.x, dir.y / t.tall, dir.z).normalize();
    // Stood on the surface: y along the normal, spun about it, then the
    // rod — built standing along y — laid over on its side.
    const stand = new THREE.Quaternion().setFromUnitVectors(up, normal);
    const spin = new THREE.Quaternion().setFromAxisAngle(
      up,
      rand() * Math.PI * 2,
    );
    const lie = new THREE.Quaternion().setFromAxisAngle(
      new THREE.Vector3(0, 0, 1),
      Math.PI / 2,
    );
    return {
      position: at.addScaledVector(normal, S.radius * 0.6).toArray(),
      quaternion: stand.multiply(spin).multiply(lie).toArray(),
      color: S.colors[i % S.colors.length],
    };
  });
}

// One cupcake, standing on the ground at y = 0 with its front facing +z.
// `config` overrides any of CUPCAKE's fields for this one instance.
export default function Cupcake({ config }) {
  const K = useMemo(() => merge(CUPCAKE, config), [config]);
  const C = K.cup;
  const A = K.cake;
  const F = K.frosting;
  const H = K.cherry;

  // Solid to the player: registered by where it actually IS, as a column
  // the cake's reach and the cupcake's height, so it may sit anywhere in
  // the tree.
  const root = useRef();
  const ball = useBody();
  useEffect(() => {
    const at = new THREE.Vector3();
    root.current.updateWorldMatrix(true, false);
    root.current.getWorldPosition(at);
    at.sub(ball.center);
    const solid = registerSolid({
      body: ball,
      dir: at.clone().normalize(),
      top: at.length() - ball.radius + cupcakeHeightOf(K),
      radius: cupcakeFootprintOf(K).x,
    });
    return () => unregisterSolid(solid);
  }, [K, ball]);

  const cup = useMemo(() => cupGeometry(C), [C]);
  // The case is built about its middle: lifted so its foot meets the
  // ground less what is sunk into it.
  const cupLift = C.height / 2 - C.sink;
  const cakeRadius = cakeRadiusOf(K);
  const cakeForm = useMemo(() => ({ tall: A.squash }), [A.squash]);
  const { tiers } = useMemo(() => tiersOf(K), [K]);
  const tierForms = useMemo(() => tiers.map(({ tall }) => ({ tall })), [tiers]);
  const sprinkles = useMemo(() => sprinklesOf(K, tiers), [K, tiers]);
  const cherry = useMemo(() => cherryOf(K), [K]);
  // Where the door and windows sit on the case, as Seated reads it: x
  // across, y DOWN from the case's mid-height, z out from the face. The
  // door's foot is on the ground; a window round the case at `apart`
  // degrees from the front lands where a ray fired in at that x meets it.
  const W = K.windows;
  const D = K.door;
  // The door can be gone in at (see ../House.jsx, useDoorAt): its foot is
  // on the ground at the case's front, where the case is its foot's
  // radius. Inside: the case's color, and the frosting's underfoot.
  const foot = useRef();
  const room = useMemo(
    () => ({
      walls: C.color,
      floor: F.color,
      rooms: K.interior.rooms,
      ways: {
        arch: K.interior.arch,
        door: K.interior.door,
        window: K.interior.window,
      },
      door: D,
      window: W,
    }),
    [C, F, K.interior, D, W],
  );
  useDoorAt(foot, D.height, room);
  const seats = useMemo(() => {
    const mid = (C.radius * (1 + C.foot)) / 2;
    return {
      door: { translation: { x: 0, y: cupLift - D.height / 2, z: 0 }, ...D },
      windows: [-1, 1].map((side) => ({
        translation: {
          x: side * mid * Math.sin(rad(W.apart)),
          y: cupLift - W.y,
          z: 0,
        },
        ...W,
      })),
    };
  }, [C, cupLift, W, D]);
  return (
    <group ref={root}>
      <group ref={foot} position-z={C.radius * C.foot} />
      <group position-y={cupLift}>
        <mesh geometry={cup} material={unlitMat(C.color)} />
        <Seated body={cup} spec={seats.door} part={Arch} />
        {seats.windows.map((spec, i) => (
          <Seated key={i} body={cup} spec={spec} part={Coin} />
        ))}
      </group>
      <group position-y={rimOf(C)}>
        <Primitive
          shape="sphere"
          radius={cakeRadius}
          detail={A.detail}
          form={cakeForm}
          clay={A.clay}
          half="top"
          swatch={A.color}
        />
        <group position-y={-A.base / 2}>
          <Primitive
            shape="cylinder"
            radius={cakeRadius}
            detail={A.detail}
            form={{ tall: A.base / (2 * cakeRadius) }}
            swatch={A.color}
          />
        </group>
      </group>
      {tiers.map(({ radius, y }, i) => (
        <group key={i} position-y={y}>
          <Primitive
            shape="sphere"
            radius={radius}
            detail={F.detail}
            form={tierForms[i]}
            clay={{ ...F.clay, seed: F.clay.seed + i }}
            swatch={F.color}
            light={LIGHT}
          />
        </group>
      ))}
      {sprinkles.map(({ position, quaternion, color }, i) => (
        <group key={i} position={position} quaternion={quaternion}>
          <mesh material={unlitMat(color)}>
            <capsuleGeometry
              args={[K.sprinkles.radius, K.sprinkles.length, 2, 6]}
            />
          </mesh>
        </group>
      ))}
      {cherry && (
        <group position-y={cherry.y}>
          <Primitive shape="sphere" radius={H.radius} swatch={H.color} />
          {H.stem && (
            <group position-y={H.radius * 0.8} rotation-z={rad(H.stem.lean)}>
              <mesh
                position-y={H.stem.height / 2}
                material={unlitMat(H.stem.color)}
              >
                <cylinderGeometry
                  args={[H.stem.radius, H.stem.radius * 0.7, H.stem.height, 6]}
                />
              </mesh>
            </group>
          )}
        </group>
      )}
    </group>
  );
}
