import * as THREE from "three";
import { mergeVertices } from "three/addons/utils/BufferGeometryUtils.js";

import { merge } from "../../world/merge.js";
import {
  bumpAt,
  bumpFrom,
  textureDefaults,
  textures,
} from "../../presets/materials/textures.js";
import { PRIMITIVES, FORM, ROTATION, CLAY } from "./objects.js";
import { CLAY_ON } from "../../world/clay.js";

const rad = (deg) => (deg * Math.PI) / 180;

// A `rotation` { x, y, z } in degrees — any of them left out is 0 — as the
// euler a group takes, so every noun turns the same way by the same words.
export function eulerOf(rotation) {
  const R = merge(ROTATION, rotation);
  return [rad(R.x), rad(R.y), rad(R.z)];
}

// `geometry` turned by `rotation`, for a thing drawn by the geometry alone
// with no group to turn it — an instanced field. The shared solid is left
// as it is: a turned COPY comes back, or the geometry itself where the
// rotation does nothing.
export function turnedGeometry(geometry, rotation) {
  const [x, y, z] = eulerOf(rotation);
  if (!x && !y && !z) return geometry;
  const g = geometry.clone();
  g.applyMatrix4(
    new THREE.Matrix4().makeRotationFromEuler(new THREE.Euler(x, y, z)),
  );
  g.computeBoundingBox();
  return g;
}

const smoothstep = (e0, e1, x) => {
  if (e1 <= e0) return x < e0 ? 0 : 1;
  const t = Math.min(1, Math.max(0, (x - e0) / (e1 - e0)));
  return t * t * (3 - 2 * t);
};

// Pushes the stock solid about as `F` (a full FORM) says: each vertex is
// weighted by which side of the cut it lies on — 1 wholly top, 0 wholly
// bottom, blended across `feather` — and takes that much of each side's
// inflate (scaled out from the y axis) and extrude (moved along it), and
// the whole of it is scaled across x by `widen`, along z by `deepen` and
// up y by `tall`. The
// solid is left where it was built — a cut off center just means the two
// sides are different sizes — and its shading is recomputed from the moved
// triangles.
function formGeometry(g, r, F) {
  g.computeBoundingBox();
  const { min, max } = g.boundingBox;
  const height = max.y - min.y || 1;
  const half = F.feather / 2;
  const pos = g.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const t = (pos.getY(i) - min.y) / height;
    const w = smoothstep(F.center - half, F.center + half, t);
    const inflate = F.bottom.inflate + (F.top.inflate - F.bottom.inflate) * w;
    const along = (F.top.extrude * w - F.bottom.extrude * (1 - w)) * r;
    pos.setXYZ(
      i,
      pos.getX(i) * inflate * F.widen,
      pos.getY(i) * F.tall + along,
      pos.getZ(i) * inflate * F.deepen,
    );
  }
  pos.needsUpdate = true;
  g.computeVertexNormals();
  g.computeBoundingBox();
  return g;
}

// Clay, laid over a formed solid: the dolls' own bump field (see CLAY),
// sampled at each vertex's bearing from the middle the way a head samples
// its skin, in the head's units — a share of `r` — and pushed out along
// the vertex's normal. The solid is welded first, its normals and uvs
// dropped so the seams and the box's edges join, and shaded smooth over
// the result: that is what turns a cube's edge into a pinched corner and
// keeps the lumps from tearing the skin open at it.
function clayGeometry(g, r, C) {
  g.deleteAttribute("normal");
  g.deleteAttribute("uv");
  g = mergeVertices(g);
  g.computeVertexNormals();
  const tex = { ...textureDefaults, ...textures[C.texture], detail: 14 };
  const bump = bumpFrom(C.amount, C.seed, tex);
  const pos = g.attributes.position;
  const nrm = g.attributes.normal;
  const d = new THREE.Vector3();
  const n = new THREE.Vector3();
  for (let i = 0; i < pos.count; i++) {
    d.fromBufferAttribute(pos, i).normalize();
    const h = bumpAt(bump, d.x, d.y, d.z) * r;
    n.fromBufferAttribute(nrm, i);
    pos.setXYZ(
      i,
      pos.getX(i) + n.x * h,
      pos.getY(i) + n.y * h,
      pos.getZ(i) + n.z * h,
    );
  }
  pos.needsUpdate = true;
  g.computeVertexNormals();
  g.computeBoundingBox();
  return g;
}

// How far a primitive's top face spreads from its axis, across (x) and
// along (z): the reach of its topmost vertices, within `tolerance` of the
// crown as a share of its height — loose enough to take in a clay-lumped
// face. A flat-topped solid, then; on a dome this is nearly a point.
export function primitiveTopFace(geometry, tolerance = 0.05) {
  if (!geometry.boundingBox) geometry.computeBoundingBox();
  const { min, max } = geometry.boundingBox;
  const eps = (max.y - min.y) * tolerance;
  const pos = geometry.attributes.position;
  let x = 0,
    z = 0;
  for (let i = 0; i < pos.count; i++) {
    if (pos.getY(i) < max.y - eps) continue;
    x = Math.max(x, Math.abs(pos.getX(i)));
    z = Math.max(z, Math.abs(pos.getZ(i)));
  }
  return { x, z };
}

// Where a primitive's foot and crown land on y once it is formed, so a
// thing built out of primitives can stack them by what they really are.
export function primitiveExtent(shape, r, sides, detail, form, half, clay) {
  const g = primitiveGeometry(shape, r, sides, detail, form, half, clay);
  if (!g.boundingBox) g.computeBoundingBox();
  return { bottom: g.boundingBox.min.y, top: g.boundingBox.max.y };
}

// Where the front of a primitive is, for a thing that has to sit ON it: a
// ray fired straight in along -z at height `y`, `x` across from the axis,
// and where it lands — the point, and the flat normal of the facet it
// landed on — or null where it misses, past the top, bottom or side. Off
// the geometry itself, so it holds for any shape and any `form`.
const _ray = new THREE.Raycaster();
const _probe = new THREE.Mesh();
export function primitiveSurfaceAt(geometry, x, y) {
  if (!geometry.boundingBox) geometry.computeBoundingBox();
  const far = geometry.boundingBox.max.z + 1;
  _ray.set(new THREE.Vector3(x, y, far), new THREE.Vector3(0, 0, -1));
  _probe.geometry = geometry;
  _probe.updateMatrixWorld();
  const hit = _ray.intersectObject(_probe, false)[0];
  return hit ? { point: hit.point, normal: hit.face.normal.clone() } : null;
}

// A seat on a primitive's own surface for a thing that stands on its
// front: a `translation` { x, y, z } in world units from the middle of its
// front at mid-height, x straight across, y running DOWN, like a screen's,
// and z straight out from the face. Where that lands — on the surface
// there, stood off it by z plus `lift` — and the turn that stands +z
// along the facet's normal at that point, so a thing built lying in x/y
// and bulging out along +z sits flush, on a flat face or round a drum.
// Nothing here knows what shape the solid is — it asks the geometry — so a
// thing seated this way sits as well on a cube as on a drum. Null where
// there is no face to seat on.
const FRONT = new THREE.Vector3(0, 0, 1);
export function primitiveSeatOn(geometry, { x: tx, y: ty, z: tz }, lift = 0) {
  if (!geometry.boundingBox) geometry.computeBoundingBox();
  const { min, max } = geometry.boundingBox;
  const hit = primitiveSurfaceAt(geometry, tx, (min.y + max.y) / 2 - ty);
  if (!hit) return null;
  return {
    at: hit.point.clone().addScaledVector(hit.normal, tz + lift),
    face: new THREE.Quaternion().setFromUnitVectors(FRONT, hit.normal),
  };
}

// Which half of a solid `half` keeps, by the side that STAYS — see HALVES.
// A three.js solid is built with +z out of the page, +x to the right and
// +y up; each table below is the start of the half-turn round the solid
// that keeps that side, in whatever angle the shape is built by.
const HALVES = ["front", "back", "left", "right", "top", "bottom"];
// A sphere's phi runs from -x through +z: the half from 0 keeps the front.
const PHI = {
  front: 0,
  right: Math.PI / 2,
  back: Math.PI,
  left: (3 * Math.PI) / 2,
};
// A cylinder's theta runs from +z through +x.
const THETA = {
  front: -Math.PI / 2,
  right: 0,
  back: Math.PI / 2,
  left: Math.PI,
};
// A torus lies flat in x/y, its arc running from +x through +y: the half
// from 0 keeps the top, and the rest are that turned round z.
const TURN = {
  top: 0,
  left: Math.PI / 2,
  bottom: Math.PI,
  right: -Math.PI / 2,
};
// Which way each side lies, for a cube.
const SIDE = {
  right: [1, 0, 0],
  left: [-1, 0, 0],
  top: [0, 1, 0],
  bottom: [0, -1, 0],
  front: [0, 0, 1],
  back: [0, 0, -1],
};

// The geometry of one primitive, sized off `radius` — see PRIMITIVES for
// what that means per shape. `sides` left out takes the table's, and
// `detail` scales whatever count is in play (and a torus's tube). No silent
// default on the shape: an unrecognised one is a typo, and falling through
// to a sphere would render something plausible and hide it (Ornament checks
// the name first, so this is the backstop). `form` overrides FORM to push
// the solid about — see there. `half` keeps only one half of it: null for
// the whole, or the side that stays, one of HALVES — "front" keeps +z,
// "top" keeps +y, and so on — cut through the middle, and left OPEN along
// the cut, since a half is for seating flat on a face where the cut is
// never seen. The facets are thinned to match, so a half looks as fine as
// its whole. A torus lies flat, so it has no front or back half. Cached,
// since a field of pebbles is one geometry drawn many times.
const cache = new Map();
// `clay` — see CLAY — throws the solid in lumpy clay; anything it needs
// (facets to lump) is built in here, so the same words give the same
// geometry to whoever asks, and the cache key carries it.
export function primitiveGeometry(
  shape,
  r,
  sides,
  detail = 1,
  form,
  half,
  clay,
) {
  const P = PRIMITIVES[shape];
  if (!P) throw new Error(`Primitive: unknown shape ${JSON.stringify(shape)}`);
  if (half != null && !HALVES.includes(half))
    throw new Error(`Primitive: unknown half ${JSON.stringify(half)}`);
  const facets = (count) => Math.max(3, Math.round(count * detail));
  const n = facets(sides ?? P.sides);
  const F = merge(FORM, form);
  // CLAY_ON off: no clay at all, whatever the config asks (see world/clay.js).
  const C = clay && CLAY_ON ? merge(CLAY, clay) : null;
  const key = `${shape}:${r}:${n}:${detail}:${JSON.stringify(F)}:${half ?? ""}:${JSON.stringify(C)}`;
  if (cache.has(key)) return cache.get(key);
  const upright = half === "top" || half === "bottom";
  // Half as many facets round a half-turn, so they stay the same width.
  const round = half && !upright ? Math.max(2, Math.round(n / 2)) : n;
  const h = r * P.height;
  let g;
  switch (shape) {
    case "sphere": {
      // Half as many rings as facets: a ball needs fewer going over the top
      // than round the middle to read as round.
      const rings = Math.max(3, Math.round(n / 2));
      g =
        !half ? new THREE.SphereGeometry(r, n, rings)
        : upright ?
          new THREE.SphereGeometry(
            r,
            n,
            Math.max(2, Math.round(rings / 2)),
            0,
            Math.PI * 2,
            half === "top" ? 0 : Math.PI / 2,
            Math.PI / 2,
          )
        : new THREE.SphereGeometry(r, round, rings, PHI[half], Math.PI);
      break;
    }
    case "cube": {
      // A plain box is six quads. Clay needs vertices to lump, so it is
      // built `segments` to the edge instead.
      const segs = C ? Math.max(2, Math.round(C.segments * detail)) : 1;
      if (!half) {
        g = new THREE.BoxGeometry(r * 2, r * 2, r * 2, segs, segs, segs);
      } else {
        const [x, y, z] = SIDE[half];
        g = new THREE.BoxGeometry(
          x ? r : r * 2,
          y ? r : r * 2,
          z ? r : r * 2,
          segs,
          segs,
          segs,
        ).translate((x * r) / 2, (y * r) / 2, (z * r) / 2);
      }
      break;
    }
    case "torus":
      if (half === "front" || half === "back")
        throw new Error(`Primitive: a torus lies flat, so has no ${half} half`);
      g =
        !half ?
          new THREE.TorusGeometry(r, r * P.tube, facets(8), n)
        : new THREE.TorusGeometry(
            r,
            r * P.tube,
            facets(8),
            round,
            Math.PI,
          ).rotateZ(TURN[half]);
      break;
    case "cylinder":
      g =
        !half ? new THREE.CylinderGeometry(r, r, h, n)
        : upright ?
          new THREE.CylinderGeometry(r, r, h / 2, n).translate(
            0,
            half === "top" ? h / 4 : -h / 4,
            0,
          )
        : new THREE.CylinderGeometry(
            r,
            r,
            h,
            round,
            1,
            false,
            THETA[half],
            Math.PI,
          );
      break;
  }
  if (JSON.stringify(F) !== JSON.stringify(FORM)) g = formGeometry(g, r, F);
  if (C) g = clayGeometry(g, r, C);
  cache.set(key, g);
  return g;
}
