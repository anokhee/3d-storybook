import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";

import { merge } from "../../world/merge.js";
import { unlitMat } from "../../adjectives/unlit/material.js";
import { WALL_CLOCK } from "./objects.js";

// How tall it stands off the ground it is placed on: the top of the case.
export function wallClockHeightOf(C) {
  return C.hang + 2 * C.radius;
}

// How far out from its middle it spreads, across (x) and off the wall (z).
export function wallClockFootprintOf(C) {
  return { x: C.radius, z: C.depth / 2 };
}

// Where a hand points at `hours` on the dial, as a turn clockwise from
// twelve, in radians: the hour hand once round in twelve hours, the
// minute hand once round in one.
const hourTurn = (hours) => ((hours % 12) / 12) * Math.PI * 2;
const minuteTurn = (hours) => (hours % 1) * Math.PI * 2;

// One wall clock (see WALL_CLOCK), its foot at y = 0 and facing +z, hung
// `hang` up. `config` overrides any of WALL_CLOCK's fields for this one.
export default function WallClock({ config }) {
  const C = useMemo(() => merge(WALL_CLOCK, config), [config]);
  const R = C.radius;
  const faceR = Math.max(0.05, R - C.rim);
  const faceZ = C.depth - C.inset; // where the face's surface is, off the wall

  // The case, turned in one piece: up the back, out along the bezel's
  // front, and down into the well the face sits in. The lathe turns
  // about y, so it is laid over to face +z.
  const caseGeo = useMemo(() => {
    const pts = [
      new THREE.Vector2(0, 0),
      new THREE.Vector2(R, 0),
      new THREE.Vector2(R, C.depth),
      new THREE.Vector2(faceR, C.depth),
      new THREE.Vector2(faceR, faceZ),
      new THREE.Vector2(0, faceZ),
    ];
    return new THREE.LatheGeometry(pts, C.sides);
  }, [R, faceR, C.depth, faceZ, C.sides]);
  useEffect(() => () => caseGeo.dispose(), [caseGeo]);

  // The twelve ticks, standing in from the face's edge, the quarters longer.
  const ticks = useMemo(() => {
    const out = [];
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2;
      const long = i % 3 === 0;
      const len = C.tick.length * (long ? 1.6 : 1) * (faceR / 0.44);
      const r = faceR * 0.9 - len / 2;
      out.push({ x: Math.sin(a) * r, y: Math.cos(a) * r, rot: -a, len, wide: C.tick.width * (long ? 1.3 : 1) });
    }
    return out;
  }, [faceR, C.tick]);

  // The hands turn from the middle: each one a group turned to its hour,
  // with its bar reaching out along the group's +y.
  const hour = useRef();
  const minute = useRef();
  const shown = useRef(C.time);
  const point = () => {
    if (hour.current) hour.current.rotation.z = -hourTurn(shown.current);
    if (minute.current) minute.current.rotation.z = -minuteTurn(shown.current);
  };
  useEffect(() => {
    shown.current = C.time;
    point();
  }, [C.time, C.run]);
  useFrame((_, delta) => {
    if (!C.run) return;
    const dt = Math.min(delta, 0.05);
    shown.current += (dt * C.speed) / 60;
    point();
  });

  const t = C.hands.thickness;
  const H = C.hands;
  const handMat = unlitMat(C.colors.hands);
  return (
    <group position-y={C.hang + R}>
      <mesh castShadow receiveShadow geometry={caseGeo} rotation-x={Math.PI / 2} material={unlitMat(C.colors.case)} />
      <mesh castShadow receiveShadow position-z={faceZ + t / 2} rotation-x={Math.PI / 2} material={unlitMat(C.colors.face)}>
        <cylinderGeometry args={[faceR, faceR, t, C.sides]} />
      </mesh>
      {ticks.map((k, i) => (
        <mesh key={i} position={[k.x, k.y, faceZ + t * 1.5]} rotation-z={k.rot} material={handMat}>
          <boxGeometry args={[k.wide, k.len, t]} />
        </mesh>
      ))}
      <group ref={hour} position-z={faceZ + t * 2.5} rotation-z={-hourTurn(C.time)}>
        <mesh castShadow position-y={(faceR * H.hour.reach) / 2 - H.hour.width} material={handMat}>
          <boxGeometry args={[H.hour.width, faceR * H.hour.reach + H.hour.width * 2, t]} />
        </mesh>
      </group>
      <group ref={minute} position-z={faceZ + t * 3.5} rotation-z={-minuteTurn(C.time)}>
        <mesh castShadow position-y={(faceR * H.minute.reach) / 2 - H.minute.width} material={handMat}>
          <boxGeometry args={[H.minute.width, faceR * H.minute.reach + H.minute.width * 2, t]} />
        </mesh>
      </group>
      <mesh position-z={faceZ + t * 4} rotation-x={Math.PI / 2} material={handMat}>
        <cylinderGeometry args={[H.cap, H.cap, t * 2, 12]} />
      </mesh>
    </group>
  );
}
