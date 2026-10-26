// MOUNTED: a four-legged animal (its component, as `children`) with one
// of the drivers (see driver.jsx) sat astride its back in the "ride"
// pose, walking at `walk` strides a second (see walk.js; 0 stands it
// still). `rider` "none" draws only the animal.
//
// The animals are each built their own way, so where the back is gets
// found from the animal as drawn, not its config: rays across it just
// over the ground find its legs, front pair and back pair, and the seat
// goes between them, `forward` of the middle as a share of the span
// (the withers end); a ray down there finds the top of the back, and
// rays in from the sides how broad the animal is at heights down its
// flank. The rider is sized to the animal, `size` times as tall as the
// back is high, its thighs forward along the back (knees to the front)
// swung out just far enough that the knees clear the animal where they
// are, and its shins just far enough to clear the flank as far down as
// they reach. The animals face +z; so do the characters. Found
// again whenever the animal changes.
import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import Anthro, { RIDE } from "../../src/nouns/anthro/Anthro.jsx";
import { ANTHRO } from "../../src/nouns/anthro/objects.js";
import { merge } from "../../src/world/merge.js";
import { DRIVERS, KINDS } from "./driver.jsx";
import { useWalk } from "./walk.js";

export const RIDERS = DRIVERS;
const COLUMNS = 64; // rays along the animal, front to back
const FEET = 0.04; // how high the leg-finding rays run, as a share of its height
const SINK = 0.03; // how far the seat settles into the back, as a share of the rider's height
const CLEAR = 0.06; // the feet's room outside the flank, at the rider's size 1
const MAX_OUT = 1.2; // the widest a thigh or shin swings out
const FLANK = 0.7; // how far down the flank the width is measured, as a share of the back's height
const ROWS = 10; // how many heights it is measured at
const AHEAD = { reach: 0.4, steps: 3 }; // how far ahead of the seat it is measured, as a share of the back's height, and at how many places

// Every surface a ray from `from` along `dir` meets, in the group's own
// frame, nearest first
function hits(group, ray, from, dir) {
  const m = group.matrixWorld;
  ray.set(new THREE.Vector3(...from).applyMatrix4(m), new THREE.Vector3(...dir).transformDirection(m));
  const inv = m.clone().invert();
  return ray.intersectObject(group, true).map((h) => h.point.applyMatrix4(inv));
}

// The seat on the back, the broadest half-width below it, or null if the
// animal is not drawn yet
function backOf(group) {
  group.updateWorldMatrix(true, true);
  const box = new THREE.Box3().setFromObject(group).applyMatrix4(group.matrixWorld.clone().invert());
  if (box.isEmpty()) return null;
  const ray = new THREE.Raycaster();
  const size = box.getSize(new THREE.Vector3());
  const far = size.x + 1;

  // The legs: which columns a ray across, just over the ground, meets
  const legs = [];
  for (let i = 0; i < COLUMNS; i++) {
    const z = box.min.z + ((i + 0.5) / COLUMNS) * size.z;
    if (hits(group, ray, [box.max.x + 1, box.min.y + FEET * size.y, z], [-1, 0, 0]).length) legs.push(z);
  }
  // ...split into the front pair and the back pair at the widest gap
  let cut = 1;
  for (let i = 1; i < legs.length; i++) if (legs[i] - legs[i - 1] > legs[cut] - legs[cut - 1]) cut = i;
  const mid = (a) => (a[0] + a[a.length - 1]) / 2;
  let back = legs.length > 1 ? mid(legs.slice(0, cut)) : legs[0];
  let front = legs.length > 1 ? mid(legs.slice(cut)) : legs[0];
  // No front and back pair to sit between (a duck's two legs side by
  // side, a rubber duck's none): the middle half of the body instead
  if (!legs.length || front - back < 0.15 * size.z) {
    back = box.min.z + 0.25 * size.z;
    front = box.max.z - 0.25 * size.z;
  }
  return (forward) => {
    const z = back + (front - back) * (0.5 + forward);
    const top = hits(group, ray, [0, box.max.y + 1, z], [0, -1, 0])[0];
    if (!top) return null;
    // the half-width at heights down the flank, each [depth below the
    // back, half-width], the widest from the seat forward to where the
    // knees come (over the shoulders)
    const flank = [];
    for (let k = 1; k <= ROWS; k++) {
      const depth = (k / ROWS) * FLANK * top.y;
      let half = 0;
      for (let j = 0; j <= AHEAD.steps; j++) {
        const side = hits(group, ray, [far, top.y - depth, z + (j / AHEAD.steps) * AHEAD.reach * top.y], [-1, 0, 0])[0];
        if (side) half = Math.max(half, side.x);
      }
      if (half) flank.push([depth, half]);
    }
    return { at: [0, top.y, z], flank };
  };
}

export function Mounted({ rider = "none", size = 1, forward = 0.1, walk = 0, children }) {
  const group = useRef(), bob = useRef();
  useWalk(group, bob, walk, [children]);
  const [seat, setSeat] = useState(null);
  const dirty = useRef(true);
  useEffect(() => { dirty.current = true; }, [children, forward]);
  // Measured on the frame after the animal is drawn
  useFrame(() => {
    if (!dirty.current || !group.current) return;
    const found = backOf(group.current)?.(forward);
    if (found) { dirty.current = false; setSeat(found); }
  });

  const base = KINDS[rider];
  let figure = null;
  if (base && seat) {
    const C = merge(ANTHRO, base);
    const tall = RIDE.tall(C);
    const scale = (size * seat.at[1]) / tall;
    // how far out a leg piece `length` long, from `x`, must swing to put its end `room` out
    const swing = (x, room, length) => Math.min(MAX_OUT, Math.asin(Math.min(1, Math.max(0, (room - x) / length))));
    // the widest the animal is down to `depth` below the back, at the rider's size 1
    const halfTo = (depth) => Math.max(0, ...seat.flank.filter(([d]) => d <= depth * scale).map(([, h]) => h)) / scale;
    // the thigh, out round the back as far down as the knee drops (the
    // knee then drops less; it is measured to where it would be unswung)
    const kneeDrop = RIDE.thigh * Math.cos(RIDE.a);
    const out = swing(RIDE.hipX, halfTo(kneeDrop) + CLEAR, RIDE.thigh);
    // the shin, from the knee, out round the flank as far down as it reaches
    const kneeX = RIDE.hipX + RIDE.thigh * Math.sin(out);
    const shinOut = swing(kneeX, halfTo(kneeDrop * Math.cos(out) + RIDE.shin) + CLEAR, RIDE.shin);
    const straddle = [out, shinOut];
    figure = (
      <group position={[seat.at[0], seat.at[1] - SINK * tall * scale, seat.at[2]]}>
        <Anthro config={{ ...base, pose: "ride", straddle, size: scale }} />
      </group>
    );
  }
  return (
    <group ref={bob}>
      <group ref={group}>{children}</group>
      {figure}
    </group>
  );
}
