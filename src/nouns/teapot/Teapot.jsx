import { useEffect, useMemo } from "react";
import * as THREE from "three";

import { merge } from "../../world/merge.js";
import { unlitMat } from "../../adjectives/unlit/material.js";
import { TEAPOT } from "./objects.js";

// Where the lid's rim is, off the ground: the body's height.
const rimOf = (C) => C.size * C.body.tall;

// How tall it stands: the top of the lid's knob.
export function teapotHeightOf(C) {
  return rimOf(C) + C.size * (C.lid.height + 2 * C.lid.knob);
}

// How far out from its middle it spreads, across (x) from the handle's
// outside to the spout's tip, and along (z) the belly.
export function teapotFootprintOf(C) {
  const s = C.size;
  return {
    x: s * Math.max(C.body.belly + C.handle.reach + C.handle.radius, 0.72 * C.spout.length + C.spout.radius),
    z: s * C.body.belly,
  };
}

// A profile for the lathe, smoothed through its corners: the given points
// are run through a spline and sampled, so a handful of them make a belly.
const smooth = (pts, n) => {
  const curve = new THREE.CatmullRomCurve3(pts.map(([r, y]) => new THREE.Vector3(r, y, 0)), false, "catmullrom", 0.5);
  return curve.getPoints(n).map((p) => new THREE.Vector2(Math.max(0, p.x), p.y));
};

// One teapot (see TEAPOT), standing on the ground at y = 0 and facing +z
// (its spout out to +x). `config` overrides any of TEAPOT's fields.
export default function Teapot({ config }) {
  const C = useMemo(() => merge(TEAPOT, config), [config]);
  const s = C.size;
  const B = C.body;
  const L = C.lid;
  const h = rimOf(C); // the body's height
  const belly = s * B.belly;
  const bellyAt = h * 0.42; // where the belly is widest, off the ground

  // The body: a flat foot, swelling to the belly and drawing in to the neck.
  const body = useMemo(() => {
    const pts = smooth(
      [
        [0, 0],
        [s * B.foot, 0],
        [s * B.foot * 1.25, h * 0.1],
        [belly, bellyAt],
        [belly * 0.86, h * 0.72],
        [s * B.neck * 1.1, h * 0.92],
        [s * B.neck, h],
      ],
      16,
    );
    pts.unshift(new THREE.Vector2(0, 0));
    return new THREE.LatheGeometry(pts, C.sides);
  }, [s, B, h, belly, bellyAt, C.sides]);

  // The lid: a brim resting on the rim, doming up to where the knob sits.
  const lid = useMemo(() => {
    const brim = s * (B.neck + L.lip);
    const pts = smooth(
      [
        [0, 0],
        [brim, 0],
        [brim, s * 0.03],
        [brim * 0.72, s * L.height * 0.7],
        [s * L.knob * 0.8, s * L.height],
        [0, s * L.height],
      ],
      12,
    );
    pts.unshift(new THREE.Vector2(0, 0));
    return new THREE.LatheGeometry(pts, C.sides);
  }, [s, B.neck, L, C.sides]);

  // The spout: leaves the belly low on the right and curves up to pour,
  // its mouth a little above the rim.
  const spout = useMemo(() => {
    const k = C.spout.length;
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(belly * 0.6, bellyAt * 0.9, 0),
      new THREE.Vector3(belly + s * 0.12 * k, bellyAt + s * 0.1 * k, 0),
      new THREE.Vector3(belly + s * 0.3 * k, h * 0.75 + s * 0.05 * k, 0),
      new THREE.Vector3(belly + s * 0.4 * k, h * 1.05 + s * 0.08 * k, 0),
    ]);
    return new THREE.TubeGeometry(curve, 10, s * C.spout.radius, 8, false);
  }, [belly, bellyAt, h, s, C.spout]);

  // The handle: a loop out from the shoulder, round and back in at the belly.
  const handle = useMemo(() => {
    const out = belly + s * C.handle.reach;
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-belly * 0.75, h * 0.8, 0),
      new THREE.Vector3(-out * 0.95, h * 0.86, 0),
      new THREE.Vector3(-out, h * 0.55, 0),
      new THREE.Vector3(-out * 0.9, h * 0.3, 0),
      new THREE.Vector3(-belly * 0.8, bellyAt * 0.8, 0),
    ]);
    return new THREE.TubeGeometry(curve, 12, s * C.handle.radius, 8, false);
  }, [belly, bellyAt, h, s, C.handle]);

  useEffect(() => () => body.dispose(), [body]);
  useEffect(() => () => lid.dispose(), [lid]);
  useEffect(() => () => spout.dispose(), [spout]);
  useEffect(() => () => handle.dispose(), [handle]);

  const bodyMat = unlitMat(C.colors.body);
  return (
    <group>
      <mesh castShadow receiveShadow geometry={body} material={bodyMat} />
      <mesh castShadow receiveShadow geometry={spout} material={bodyMat} />
      <mesh castShadow receiveShadow geometry={handle} material={bodyMat} />
      <mesh castShadow receiveShadow geometry={lid} position-y={h} material={unlitMat(C.colors.lid)} />
      <mesh castShadow receiveShadow position-y={h + s * (L.height + L.knob * 0.9)} material={bodyMat}>
        <sphereGeometry args={[s * L.knob, 16, 12]} />
      </mesh>
    </group>
  );
}
