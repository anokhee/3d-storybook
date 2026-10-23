// WALK: a four-legged animal trotting on the spot, whatever built it.
// The animals are each poured their own way, so the legs are found from
// the animal as drawn: the points of it just over the ground, split
// into four by side and by front and back, are the feet, each leg
// everything over its foot from there up to the belly — the lowest of
// it between the legs. Each frame every leg swings from its hip, the
// points of it bent round (more the further down the leg, so it bends
// out of the body rather than tearing off it) the way the tails' wag is
// done (see world/lump.js, bendTail): diagonal pairs together, a trot,
// the leg coming forward lifted. Paint on the legs (hooves, socks,
// stripes) is points too, so it goes with them; a small part of its
// own on a leg (a hoof block) swings whole. `bob` is lowered as the
// legs swing out so the feet stay down.
import { useEffect, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";

const FEET = 0.06; // how high the feet are taken to reach, as a share of the animal's height
const SWING = 0.35; // how far each leg swings either way, in radians
const LIFT = 0.1; // how high a foot comes up going forward, as a share of the leg
const BEND = 0.3; // how far down the leg the swing takes it fully, as a share of the leg
const RIGID = 600; // a part with fewer points than this swings whole
const PHASE = [0, Math.PI, Math.PI, 0]; // back-left, back-right, front-left, front-right: diagonals together

const v = new THREE.Vector3(), n = new THREE.Vector3(), q = new THREE.Quaternion(), X = new THREE.Vector3(1, 0, 0);
const m = new THREE.Matrix4(), m2 = new THREE.Matrix4();

// The animal's parts, each with its frame in the animal's
function partsOf(root) {
  root.updateWorldMatrix(true, true);
  const inv = root.matrixWorld.clone().invert();
  const parts = [];
  root.traverse((o) => {
    if (!o.isMesh || !o.geometry?.attributes?.position) return;
    parts.push({ mesh: o, rel: inv.clone().multiply(o.matrixWorld) });
  });
  return parts;
}

// The four legs: each a foot's middle [x, z], how far round it the leg
// reaches, and the belly over them; or null if it has no four feet
function legsOf(parts) {
  const pts = [];
  for (const { mesh, rel } of parts) {
    const p = mesh.geometry.attributes.position;
    const step = Math.max(1, Math.floor(p.count / 4000));
    for (let i = 0; i < p.count; i += step) pts.push(v.fromBufferAttribute(p, i).applyMatrix4(rel).toArray());
  }
  if (!pts.length) return null;
  let lo = Infinity, hi = -Infinity;
  for (const [, y] of pts) { lo = Math.min(lo, y); hi = Math.max(hi, y); }
  const feet = pts.filter(([, y]) => y < lo + FEET * (hi - lo));
  let zLo = Infinity, zHi = -Infinity;
  for (const [, , z] of feet) { zLo = Math.min(zLo, z); zHi = Math.max(zHi, z); }
  const zMid = (zLo + zHi) / 2;
  const quad = ([x, , z]) => (z < zMid ? 0 : 2) + (x < 0 ? 0 : 1);
  const legs = [0, 1, 2, 3].map(() => ({ x: 0, z: 0, k: 0, r: 0 }));
  for (const p of feet) { const l = legs[quad(p)]; l.x += p[0]; l.z += p[2]; l.k++; }
  if (legs.some((l) => !l.k)) return null;
  for (const l of legs) { l.x /= l.k; l.z /= l.k; }
  for (const p of feet) { const l = legs[quad(p)]; l.r = Math.max(l.r, Math.hypot(p[0] - l.x, p[2] - l.z)); }
  // The belly: the lowest of it between the four legs
  const inX = Math.min(...legs.map((l) => Math.abs(l.x))) * 0.5;
  const zBack = Math.max(legs[0].z, legs[1].z), zFront = Math.min(legs[2].z, legs[3].z);
  let belly = Infinity;
  for (const [x, y, z] of pts) if (Math.abs(x) < inX && z > zBack && z < zFront && y > lo + FEET * (hi - lo)) belly = Math.min(belly, y);
  if (!Number.isFinite(belly)) return null;
  const length = belly - lo;
  return { legs: legs.map((l) => ({ ...l, r: l.r * 1.3 })), belly, length, zMid };
}

// Which leg a point in the animal's frame is on, and how much it swings
function weigh(L, x, y, z) {
  if (y >= L.belly) return null;
  const leg = (z < L.zMid ? 0 : 2) + (x < 0 ? 0 : 1);
  const l = L.legs[leg];
  if (Math.hypot(x - l.x, z - l.z) > l.r) return null;
  const t = Math.min(1, (L.belly - y) / (BEND * L.length));
  return { leg, w: t * t * (3 - 2 * t) };
}

// Everything the swing moves, its rest kept to bend from each frame
function rig(parts, L) {
  const rigs = [];
  for (const { mesh, rel } of parts) {
    const geo = mesh.geometry, p = geo.attributes.position;
    if (p.count < RIGID) {
      geo.computeBoundingSphere();
      const c = geo.boundingSphere.center.clone().applyMatrix4(rel);
      const hit = weigh(L, c.x, c.y, c.z);
      if (hit) rigs.push({ rigid: true, mesh, ...hit, rest: mesh.matrix.clone(), parent: rel.clone().multiply(mesh.matrix.clone().invert()) });
      continue;
    }
    const nor = geo.attributes.normal;
    const idx = [], leg = [], w = [], pos = [], norm = [];
    const relInv = rel.clone().invert(), turn = new THREE.Matrix3().getNormalMatrix(rel);
    for (let i = 0; i < p.count; i++) {
      v.fromBufferAttribute(p, i).applyMatrix4(rel);
      const hit = weigh(L, v.x, v.y, v.z);
      if (!hit) continue;
      idx.push(i); leg.push(hit.leg); w.push(hit.w);
      pos.push(v.x, v.y, v.z);
      if (nor) { n.fromBufferAttribute(nor, i).applyMatrix3(turn).normalize(); norm.push(n.x, n.y, n.z); }
    }
    if (idx.length) rigs.push({ mesh, idx, leg, w, pos, norm, rel, relInv, back: new THREE.Matrix3().getNormalMatrix(relInv) });
  }
  return rigs;
}

// A point of leg `l` at weight `w`, swung `a` and lifted `up`, into `out`
function swing(L, l, w, a, up, out) {
  const hip = L.legs[l];
  q.setFromAxisAngle(X, -a * w);
  return out.set(out.x - hip.x, out.y - L.belly, out.z - hip.z).applyQuaternion(q).add(v.set(hip.x, L.belly + up * w, hip.z));
}

function pose(rigs, L, angles, lifts) {
  for (const r of rigs) {
    if (r.rigid) {
      const hip = L.legs[r.leg];
      q.setFromAxisAngle(X, -angles[r.leg] * r.w);
      m.makeTranslation(hip.x, L.belly + lifts[r.leg] * r.w, hip.z).multiply(m2.makeRotationFromQuaternion(q)).multiply(new THREE.Matrix4().makeTranslation(-hip.x, -L.belly, -hip.z));
      // the part's own matrix: out of its parent's frame, swung, back
      const local = r.parent.clone().invert().multiply(m).multiply(r.parent).multiply(r.rest);
      local.decompose(r.mesh.position, r.mesh.quaternion, r.mesh.scale);
      continue;
    }
    const geo = r.mesh.geometry, p = geo.attributes.position.array, nor = geo.attributes.normal?.array;
    const out = new THREE.Vector3();
    for (let j = 0; j < r.idx.length; j++) {
      const i = r.idx[j], l = r.leg[j], w = r.w[j];
      out.set(r.pos[j * 3], r.pos[j * 3 + 1], r.pos[j * 3 + 2]);
      swing(L, l, w, angles[l], lifts[l], out).applyMatrix4(r.relInv);
      p[i * 3] = out.x; p[i * 3 + 1] = out.y; p[i * 3 + 2] = out.z;
      if (nor && r.norm.length) {
        q.setFromAxisAngle(X, -angles[l] * w);
        n.set(r.norm[j * 3], r.norm[j * 3 + 1], r.norm[j * 3 + 2]).applyQuaternion(q).applyMatrix3(r.back).normalize();
        nor[i * 3] = n.x; nor[i * 3 + 1] = n.y; nor[i * 3 + 2] = n.z;
      }
    }
    geo.attributes.position.needsUpdate = true;
    if (nor) geo.attributes.normal.needsUpdate = true;
  }
}

const STILL = [0, 0, 0, 0];

// Walk the animal in `root` at `speed` strides a second (0 stands it
// still), lowering `bob` to keep its feet down; found again whenever
// `deps` change (the animal rebuilt)
export function useWalk(root, bob, speed, deps) {
  const state = useRef({ dirty: true, rigs: null, L: null, phase: 0 });
  useEffect(() => { state.current.dirty = true; }, deps); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => () => { const s = state.current; if (s.rigs) pose(s.rigs, s.L, STILL, STILL); }, []);
  useFrame((_, dt) => {
    const s = state.current;
    if (!root.current) return;
    if (s.dirty) {
      if (s.rigs) pose(s.rigs, s.L, STILL, STILL); // put the old legs back before measuring
      const parts = partsOf(root.current);
      s.L = legsOf(parts);
      s.rigs = s.L ? rig(parts, s.L) : null;
      s.dirty = false;
    }
    if (!s.rigs) return;
    s.phase += Math.min(dt, 0.05) * speed * Math.PI * 2;
    const angles = PHASE.map((o) => SWING * Math.sin(s.phase + o) * (speed > 0 ? 1 : 0));
    const lifts = PHASE.map((o) => (speed > 0 ? LIFT * s.L.length * Math.max(0, Math.cos(s.phase + o)) : 0));
    pose(s.rigs, s.L, angles, lifts);
    // the legs on the ground are as far out as the others, so lower it by what that shortens them
    if (bob.current) bob.current.position.y = -s.L.length * (1 - Math.cos(Math.abs(angles[0])));
  });
}
