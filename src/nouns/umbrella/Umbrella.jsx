import { useEffect, useMemo } from "react";
import * as THREE from "three";

import { merge } from "../../world/merge.js";
import { unlitMat } from "../../adjectives/unlit/material.js";
import { UMBRELLA } from "./objects.js";

const clamp01 = (v) => Math.min(1, Math.max(0, v));

// How far off the shaft the ribs lie when the umbrella is furled: not
// quite flat along it, so the cloth still has a little body.
const FURLED = 0.07;

// Where the ribs point. A rib is as long as the open canopy's slant, from
// the apex to the rim; closing swings it down toward the shaft, so the
// rim comes in (`reach`) and drops (`drop`). `bulge` is the cloth's
// belly when furled, bunched round the middle of the ribs.
function ribsOf(C) {
  const o = clamp01(C.open);
  const depth = C.radius * C.canopy.sag;
  const L = Math.hypot(C.radius, depth);
  const spread = Math.atan2(C.radius, depth);
  const angle = FURLED + (spread - FURLED) * o;
  return {
    reach: L * Math.sin(angle),
    drop: L * Math.cos(angle),
    bulge: (1 - o) * 0.07,
    curve: 1 + 0.7 * o, // the ribs bow when open, lie straight when furled
    open: o,
  };
}

// The point of the cloth `u` of the way down a gore (0 the apex, 1 the
// rim) and `v` across it (0 and 1 at the ribs), for the gore at `a0`
// spanning `da` radians. Between ribs the cloth pinches in and dips a
// little, most of all at the rim, which scallops the edge.
function clothAt(C, R, a0, da, u, v, out) {
  const pinch = Math.sin(Math.PI * v) * u * u;
  const r = (R.reach * u + R.bulge * Math.sin(Math.PI * u)) * (1 - C.canopy.scallop * pinch);
  const a = a0 + da * v;
  out[0] = r * Math.sin(a);
  out[1] = C.height - R.drop * Math.pow(u, R.curve) - 0.06 * R.reach * pinch;
  out[2] = r * Math.cos(a);
  return out;
}

const RINGS = 4; // steps down a gore
const ACROSS = 4; // steps across one

// Every other gore as one geometry: a fan of smooth patches, one per gore,
// creased at the ribs because the gores share no vertices. Both faces are
// built, so the underside shows when looked up at.
function canopyOf(C, R, parity) {
  const N = Math.max(3, Math.round(C.panels));
  const da = (2 * Math.PI) / N;
  const positions = [];
  const index = [];
  const p = [0, 0, 0];
  for (let i = parity; i < N; i += 2) {
    const base = positions.length / 3;
    for (let ring = 0; ring <= RINGS; ring++) {
      for (let k = 0; k <= ACROSS; k++) {
        clothAt(C, R, i * da, da, ring / RINGS, k / ACROSS, p);
        positions.push(p[0], p[1], p[2]);
      }
    }
    const at = (ring, k) => base + ring * (ACROSS + 1) + k;
    for (let ring = 0; ring < RINGS; ring++) {
      for (let k = 0; k < ACROSS; k++) {
        const a = at(ring, k), b = at(ring, k + 1), c = at(ring + 1, k), d = at(ring + 1, k + 1);
        if (ring > 0) index.push(a, c, b);
        index.push(b, c, d);
      }
    }
  }
  // the underside: the same cloth, wound the other way
  const n = positions.length / 3;
  const m = index.length;
  for (let i = 0; i < n * 3; i++) positions.push(positions[i]);
  for (let i = 0; i < m; i += 3) index.push(index[i] + n, index[i + 2] + n, index[i + 1] + n);
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  g.setIndex(index);
  g.computeVertexNormals();
  return g;
}

// The crook: the shaft comes down, rounds through a half circle under
// itself and turns back up a little way, as a tube along that J. Its
// lowest point rests on the ground.
function crookOf(C) {
  const H = C.handle.hook;
  const t = C.handle.radius;
  const cy = H + t;
  const pts = [new THREE.Vector3(0, cy + 0.4, 0), new THREE.Vector3(0, cy + 0.2, 0)];
  for (let i = 0; i <= 12; i++) {
    const a = Math.PI + (Math.PI * i) / 12;
    pts.push(new THREE.Vector3(H + H * Math.cos(a), cy + H * Math.sin(a), 0));
  }
  pts.push(new THREE.Vector3(2 * H, cy + 0.14, 0), new THREE.Vector3(2 * H, cy + 0.28, 0));
  const curve = new THREE.CatmullRomCurve3(pts, false, "centripetal");
  return { geometry: new THREE.TubeGeometry(curve, 40, t, 8, false), top: cy + 0.4, tip: new THREE.Vector3(2 * H, cy + 0.28, 0) };
}

// How tall it stands: the ferrule's tip.
export function umbrellaHeightOf(C) {
  return C.height + C.shaft.ferrule + 0.04;
}

// How far it spreads from the shaft, across and along: the canopy's rim,
// or the crook when the canopy is furled smaller than that.
export function umbrellaFootprintOf(C) {
  const R = ribsOf(C);
  const r = Math.max(R.reach + R.bulge, 2 * C.handle.hook + C.handle.radius);
  return { x: r, z: r };
}

// One umbrella, its handle on the ground at the origin and its canopy
// spread at the top, facing +z. `config` overrides any of UMBRELLA's fields.
export default function Umbrella({ config }) {
  const C = useMemo(() => merge(UMBRELLA, config), [config]);
  const R = useMemo(() => ribsOf(C), [C]);
  const paint = C.colors;

  const parts = useMemo(
    () => ({ canopyA: canopyOf(C, R, 0), canopyB: canopyOf(C, R, 1), crook: crookOf(C) }),
    [C, R],
  );
  useEffect(
    () => () => {
      parts.canopyA.dispose();
      parts.canopyB.dispose();
      parts.crook.geometry.dispose();
    },
    [parts],
  );

  const N = Math.max(3, Math.round(C.panels));
  const tips = useMemo(() => {
    const p = [0, 0, 0];
    const list = [];
    for (let i = 0; i < N; i++) {
      clothAt(C, R, (i * 2 * Math.PI) / N, 0, 1, 0, p);
      list.push([p[0], p[1], p[2]]);
    }
    return list;
  }, [C, R, N]);

  const shaftFrom = parts.crook.top;
  const shaftTo = C.height + C.shaft.ferrule;
  // the strap, a ring round the furled cloth, only while it is near shut
  const strapAt = 0.55;
  const strapR = R.reach * strapAt + R.bulge * Math.sin(Math.PI * strapAt) + 0.01;
  const strapY = C.height - R.drop * Math.pow(strapAt, R.curve);

  return (
    <group>
      <mesh geometry={parts.canopyA} material={unlitMat(paint.canopyA)} castShadow receiveShadow />
      <mesh geometry={parts.canopyB} material={unlitMat(paint.canopyB)} castShadow receiveShadow />
      {tips.map((p, i) => (
        <mesh key={i} position={p} material={unlitMat(paint.shaft)} castShadow receiveShadow>
          <sphereGeometry args={[0.05, 8, 6]} />
        </mesh>
      ))}
      <mesh position-y={(shaftFrom + shaftTo) / 2} material={unlitMat(paint.shaft)} castShadow receiveShadow>
        <cylinderGeometry args={[C.shaft.radius, C.shaft.radius, shaftTo - shaftFrom, 10]} />
      </mesh>
      <mesh position-y={shaftTo + 0.02} material={unlitMat(paint.shaft)} castShadow receiveShadow>
        <sphereGeometry args={[0.05, 8, 6]} />
      </mesh>
      <mesh geometry={parts.crook.geometry} material={unlitMat(paint.handle)} castShadow receiveShadow />
      <mesh position={parts.crook.tip} material={unlitMat(paint.handle)} castShadow receiveShadow>
        <sphereGeometry args={[C.handle.radius, 8, 6]} />
      </mesh>
      {R.open < 0.35 && (
        <mesh position-y={strapY} rotation-x={Math.PI / 2} material={unlitMat(paint.shaft)} castShadow receiveShadow>
          <torusGeometry args={[strapR, 0.022, 6, 16]} />
        </mesh>
      )}
    </group>
  );
}
