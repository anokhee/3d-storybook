/* ============================================================
   the shared torso: ONE continuous smooth surface for body, neck and head.
   A signed-distance field (an egg body, an ellipsoid head and a tapered neck
   capsule, joined with a smooth-min so the joins fillet like icing settling)
   is polygonized with marching cubes and shaded with the field's gradient
   normals. Optionally, a "cap": the surface cut exactly along a scalloped
   line around the neck and pushed outward as a thin solid shell with a rim,
   for a second color on the head (the chicken's white).
   Both characters are built on this, so their bodies match.
   ============================================================ */
import * as THREE from "three";
import { MarchingCubes } from "three/addons/objects/MarchingCubes.js";

const smin = (a, b, k) => { const h = Math.max(k - Math.abs(a - b), 0) / k; return Math.min(a, b) - h * h * k * 0.25; };
let mc = null, mcRes = 0; // the grid is sized at construction, so it's remade when the resolution changes

// o: { bodyR, bodyShape, headR, headShape, neckDir, neckLen, resolution, cutFrac?, cap?: { scallops, drip, thick }, bumps? }
// bumps: [{ at: Vector3 (from the body's center), r, blend }], spheres melted
// into the body with their own fillet width: a shoulder the arm grows out of.
// All geometry comes back relative to the body's center.
export function buildBlobGeometry(o) {
  const cutFrac = o.cutFrac ?? 0.75; // the neck leaves the egg this far up it (fraction of the half-height)
  const bodyR = o.bodyR, headR = o.headR, BS = o.bodyShape, HS = o.headShape, DIR = o.neckDir;
  const bodyCutDist = cutFrac * bodyR * BS.y;                   // along the neck axis
  const bodyCutR = bodyR * BS.x * Math.sqrt(1 - cutFrac * cutFrac); // the egg's cross-section there
  const headCenter = DIR.clone().multiplyScalar(bodyCutDist + o.neckLen);
  const res = Math.round(o.resolution);
  if (mcRes !== res) { mc = new MarchingCubes(res, new THREE.MeshBasicMaterial(), false, false, 120000); mc.isolation = 0; mcRes = res; }

  // --- the field --- the grid spans -1..1, scaled by E; margin because the outermost layer isn't polygonized
  const headReach = headR * Math.max(HS.x, HS.y, HS.z);
  const bumps = o.bumps ?? [];
  const bumpReach = bumps.reduce((m, b) => Math.max(m, b.at.length() + b.r), 0);
  const E = Math.max(bodyR * BS.y, bodyCutDist + o.neckLen + headReach, bumpReach) * 1.12 + 0.1;
  const A = DIR.clone().multiplyScalar(bodyR * 0.6); // neck capsule starts inside the body...
  const B = headCenter;                               // ...and ends at the head's center
  const AB = B.clone().sub(A), ab2 = AB.lengthSq(), AdotAB = A.dot(AB);
  const rNeck0 = bodyCutR * 0.9, rNeck1 = headR * Math.min(HS.x, HS.y, HS.z) * 0.92;
  const k = 0.22 * bodyR; // blend radius: how wide the fillets are
  const hsMin = Math.min(HS.x, HS.y, HS.z), bsMin = Math.min(BS.x, BS.y, BS.z);
  const size = mc.size, half = mc.halfsize, field = mc.field;
  const p = new THREE.Vector3(), q = new THREE.Vector3();
  for (let z = 0; z < size; z++) for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    p.set(((x - half) / half) * E, ((y - half) / half) * E, ((z - half) / half) * E);
    const dBody = (Math.hypot(p.x / BS.x, p.y / BS.y, p.z / BS.z) - bodyR) * bsMin; // egg (scaled sphere)
    q.copy(p).sub(B);
    const dHead = (Math.hypot(q.x / HS.x, q.y / HS.y, q.z / HS.z) - headR) * hsMin;
    const t = Math.max(0, Math.min(1, (p.dot(AB) - AdotAB) / ab2));
    q.copy(A).addScaledVector(AB, t);
    const rN = (rNeck0 + (rNeck1 - rNeck0) * t) * (1 - 0.1 * Math.sin(Math.PI * t)); // tapered, slightly pinched
    const dNeck = p.distanceTo(q) - rN;
    let d = smin(smin(dBody, dNeck, k), dHead, k);
    for (const b of bumps) d = smin(d, p.distanceTo(b.at) - b.r, b.blend);
    field[z * size * size + y * size + x] = -d; // positive inside
  }
  mc.update();

  // --- copy the triangles out ---
  const n = mc.count; // vertices (3 per triangle)
  const pos = new Float32Array(n * 3);
  for (let i = 0; i < n * 3; i++) pos[i] = mc.positionArray[i] * E;
  const nrm = mc.normalArray.slice(0, n * 3); // from the field's gradient, so the surface shades smoothly
  for (let i = 0; i < n; i++) {
    const l = Math.hypot(nrm[i * 3], nrm[i * 3 + 1], nrm[i * 3 + 2]) || 1;
    nrm[i * 3] /= l; nrm[i * 3 + 1] /= l; nrm[i * 3 + 2] /= l;
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  geometry.setAttribute("normal", new THREE.BufferAttribute(nrm, 3));

  // --- the cap --- f > 0 is head. f = height along the neck axis above the body's
  // cut plane, plus a scalloped drip that depends on the angle around the axis
  let cap = null;
  if (o.cap) {
    const { scallops, drip, thick } = o.cap;
    const u = new THREE.Vector3(0, 0, 1), v = new THREE.Vector3().crossVectors(DIR, u); // u, v span the cut plane
    const c = new THREE.Vector3();
    const fAt = (x, y, z) => {
      c.set(x, y, z);
      const th = Math.atan2(c.dot(v), c.dot(u));
      return c.dot(DIR) - bodyCutDist + drip * (0.3 + 0.7 * Math.abs(Math.sin((scallops * th) / 2)));
    };
    const sPos = [], sNrm = [];
    const vert = (i) => ({ p: [pos[i * 3], pos[i * 3 + 1], pos[i * 3 + 2]], n: [nrm[i * 3], nrm[i * 3 + 1], nrm[i * 3 + 2]], f: fAt(pos[i * 3], pos[i * 3 + 1], pos[i * 3 + 2]) });
    const mix = (a, b) => { // the point on edge a-b where f = 0
      const t = a.f / (a.f - b.f);
      const pp = a.p.map((x, j) => x + (b.p[j] - x) * t), nn = a.n.map((x, j) => x + (b.n[j] - x) * t);
      const l = Math.hypot(...nn) || 1;
      return { p: pp, n: nn.map((x) => x / l), f: 0, cut: true };
    };
    const pushShell = (a) => { sPos.push(a.p[0] + a.n[0] * thick, a.p[1] + a.n[1] * thick, a.p[2] + a.n[2] * thick); sNrm.push(...a.n); };
    const pushRim = (a, b) => { // quad from the surface up to the shell, facing away from the head
      const e = [b.p[0] - a.p[0], b.p[1] - a.p[1], b.p[2] - a.p[2]];
      const m = [(a.n[0] + b.n[0]) / 2, (a.n[1] + b.n[1]) / 2, (a.n[2] + b.n[2]) / 2];
      let r = [e[1] * m[2] - e[2] * m[1], e[2] * m[0] - e[0] * m[2], e[0] * m[1] - e[1] * m[0]];
      const l = Math.hypot(...r) || 1; r = r.map((x) => x / l);
      if (r[0] * DIR.x + r[1] * DIR.y + r[2] * DIR.z > 0) r = r.map((x) => -x);
      const A2 = a.p.map((x, j) => x + a.n[j] * thick), B2 = b.p.map((x, j) => x + b.n[j] * thick);
      for (const qq of [a.p, b.p, B2, a.p, B2, A2]) { sPos.push(...qq); sNrm.push(...r); }
    };
    for (let i = 0; i < n; i += 3) {
      const tri = [vert(i), vert(i + 1), vert(i + 2)], poly = [];
      for (let j = 0; j < 3; j++) {
        const a = tri[j], b = tri[(j + 1) % 3];
        if (a.f >= 0) poly.push(a);
        if ((a.f >= 0) !== (b.f >= 0)) poly.push(mix(a, b));
      }
      for (let j = 1; j + 1 < poly.length; j++) { pushShell(poly[0]); pushShell(poly[j]); pushShell(poly[j + 1]); }
      for (let j = 0; j < poly.length; j++) {
        const a = poly[j], b = poly[(j + 1) % poly.length];
        if (a.cut && b.cut) pushRim(a, b);
      }
    }
    cap = new THREE.BufferGeometry();
    cap.setAttribute("position", new THREE.Float32BufferAttribute(sPos, 3));
    cap.setAttribute("normal", new THREE.Float32BufferAttribute(sNrm, 3));
  }
  return { geometry, cap, headCenter, bodyCutDist, bodyCutR };
}
