import * as THREE from "three";

import { merge } from "../../world/merge.js";
import { latLonDir, standOn } from "../../world/layout.js";
import { bodyOf } from "../planet/bodies.js";
import { standAt } from "../planet/standAt.js";
import { STATION, AT_CENTRE } from "../station/objects.js";
import { WATER, GROUND, KINDS, bathStandOf, TUBBED } from "./objects.js";

// Pools, out of the bodies of water in the lots. A body of water is a
// rounded rectangle of water where it stands in its lot (see WATER); two
// that touch run together into ONE pool, the way blobs of the same clay
// do — so a pool is a cluster of them, its "lobes", and its edge is where
// the lobes' joined distance field crosses zero: each lobe's own
// rounded-rectangle distance, the lot of them blended by a smooth minimum
// `blend` wide (see WATER), so two lobes that come near each other bulge
// out to meet and neck together rather than crossing in a hard corner.
// The sheet, the foam, the wade and the grass all read that one field, so
// they agree on where the water is.
//
// A patch of ground lying in a pool is an island: its own rounded
// rectangle taken OUT of the field — a "hole" — blended the same way, so
// the water necks away from it as it necks toward another lobe.
//
// A pool is `{ body, dir, origin, frame, lobes, holes, blend, W, lift,
// members, key }`:
// `body` the ball it lies on and `dir` its middle as a direction from the
// ball's center, `origin` that on the ground and `frame` the turn from
// the ball's frame into the pool's own (x across, z along, y up), `lift`
// how far the whole pool stands off the ground (its first member's
// `position.z`, like any object's); `lobes`
// each `{ x, z, turn, halfWidth, halfLength, cornerRadius, depth }`, its
// middle and its turn (degrees about y) in the pool's frame, and `holes`
// the same for the ground cut out of it; `W` the pool's WATER config, the
// first member's; `members` the bodies of water, each "si.oi" — which
// station and which object in it — and `key` a string that changes when
// any of the shape does.

// A body of water's config: WATER, its kind's own changes over that (see
// KINDS), and the object's own `config` over both.
export function waterConfigOf(config) {
  const kind = config?.kind ?? WATER.kind;
  return merge(merge(WATER, KINDS[kind] ?? {}), config);
}

// The rounded rectangle a body of water — or a patch of ground — makes:
// its config's `width` by `length`, its corners `cornerRadius` round,
// never rounder than half the short side.
export function lobeConfigOf(W) {
  const halfWidth = W.width / 2;
  const halfLength = W.length / 2;
  return {
    W,
    halfWidth,
    halfLength,
    cornerRadius: Math.max(0, Math.min(W.cornerRadius, halfWidth, halfLength)),
  };
}

// Every object of `type` — "waterFeature" or "ground" — in the stations, as a
// lobe's source: `{ si, oi, B, dir, quat, L }` — which station and which
// object, the ball it lies on, its middle as a direction from the ball's
// center, the turn from the ball's frame into its own (x across, y up),
// and its rounded rectangle (see lobeConfigOf). Where it lies is where
// the station draws it: its spot in the lot, off the station's middle,
// dropped onto the ball there and turned by its own turn on top of the
// station's (see ../station/Station.jsx).
const NO_TURN = { x: 0, y: 0, z: 0 };
const rad = (deg) => (deg * Math.PI) / 180;
const _y = new THREE.Vector3(0, 1, 0);
export function lobeSourcesOf(stations, type) {
  const out = [];
  stations.forEach((st, si) => {
    const S = merge(STATION, st.config);
    const B = bodyOf(st.body);
    const centre = latLonDir(st.lat, st.lon);
    const turn = merge(NO_TURN, S.rotation);
    const frame = standOn(centre).multiply(
      new THREE.Quaternion().setFromEuler(
        new THREE.Euler(rad(turn.x), rad(turn.y), rad(turn.z)),
      ),
    );
    const origin = centre.clone().multiplyScalar(B.radius).add(B.center);
    S.objects.forEach((o, oi) => {
      if (o.type !== type) return;
      const { x, y, z: lift } = merge(AT_CENTRE, o.position);
      const { width, length } = S.boundingBox;
      const spot = standAt((x - 0.5) * width, (y - 0.5) * length, 0, B);
      const world = spot.position.applyQuaternion(frame).add(origin);
      const dir = world.sub(B.center).normalize();
      const own = merge(NO_TURN, o.rotation).y;
      const quat = frame
        .clone()
        .multiply(new THREE.Quaternion().fromArray(spot.quaternion))
        .multiply(new THREE.Quaternion().setFromAxisAngle(_y, rad(own)));
      const W =
        type === "waterFeature" ?
          waterConfigOf(o.config)
        : merge(GROUND, o.config);
      out.push({ si, oi, B, dir, quat, lift, L: lobeConfigOf(W) });
    });
  });
  return out;
}

// A lobe's own signed distance at (x, z) in the POOL's frame: carried
// into the lobe's, then the rounded rectangle's — negative inside.
export function lobeDistance(l, x, z) {
  const c = Math.cos(l.rad),
    s = Math.sin(l.rad);
  const dx = x - l.x,
    dz = z - l.z;
  // Into the lobe's frame: turned back by its own turn about y.
  const lx = dx * c - dz * s;
  const lz = dx * s + dz * c;
  const r = l.cornerRadius;
  const qx = Math.abs(lx) - (l.halfWidth - r);
  const qz = Math.abs(lz) - (l.halfLength - r);
  const ox = Math.max(qx, 0),
    oz = Math.max(qz, 0);
  return Math.hypot(ox, oz) + Math.min(Math.max(qx, qz), 0) - r;
}

// The pool's signed distance: its lobes' blended by a smooth minimum
// `blend` wide — the exponential one, since it treats any number of lobes
// alike — with the nearest pulled out first so the sum never underflows.
// With no blend it is the plain minimum.
// Then each hole taken out: the water's distance is kept out of the hole
// by the smooth maximum of it and the hole's own, turned inside out.
export function poolDistance(pool, x, z) {
  const k = pool.blend;
  let m = Infinity;
  for (const l of pool.lobes) m = Math.min(m, lobeDistance(l, x, z));
  let d = m;
  if (k > 0 && pool.lobes.length > 1) {
    let sum = 0;
    for (const l of pool.lobes)
      sum += Math.exp(-(lobeDistance(l, x, z) - m) / k);
    d = m - k * Math.log(sum);
  }
  for (const h of pool.holes ?? []) d = smax(d, -lobeDistance(h, x, z), k);
  return d;
}
// The smooth maximum of two distances, `k` wide — the smooth minimum of
// their negatives — or the plain one with no width.
function smax(a, b, k) {
  if (!(k > 0)) return Math.max(a, b);
  const m = Math.max(a, b);
  return m + k * Math.log(Math.exp((a - m) / k) + Math.exp((b - m) / k));
}

// How deep the pool is at (x, z): the nearest lobe's depth.
export function poolDepthAt(pool, x, z) {
  let best = pool.lobes[0];
  let m = Infinity;
  for (const l of pool.lobes) {
    const d = lobeDistance(l, x, z);
    if (d < m) ((m = d), (best = l));
  }
  return best.depth;
}

// How far the pool reaches from its middle, across and along: the
// furthest any lobe's corner could lie, plus the blend's bulge.
export function poolBounds(pool) {
  let x = 0,
    z = 0;
  for (const l of pool.lobes) {
    const reach = Math.hypot(l.halfWidth, l.halfLength);
    x = Math.max(x, Math.abs(l.x) + reach);
    z = Math.max(z, Math.abs(l.z) + reach);
  }
  return { x: x + pool.blend, z: z + pool.blend };
}

// Points round a lobe's edge, in the pool's frame: `n` of them, dealt
// round the rectangle's perimeter and drawn in onto the corner arcs.
function lobeEdge(l, n = 32) {
  const w = l.halfWidth,
    h = l.halfLength,
    r = l.cornerRadius;
  const c = Math.cos(l.rad),
    s = Math.sin(l.rad);
  const pts = [];
  const per = 2 * (2 * w + 2 * h);
  for (let i = 0; i < n; i++) {
    let t = (i / n) * per;
    let x, z;
    if (t < 2 * w) ((x = -w + t), (z = -h));
    else if ((t -= 2 * w) < 2 * h) ((x = w), (z = -h + t));
    else if ((t -= 2 * h) < 2 * w) ((x = w - t), (z = h));
    else ((t -= 2 * w), (x = -w), (z = h - t));
    const qx = Math.abs(x) - (w - r);
    const qz = Math.abs(z) - (h - r);
    if (qx > 0 && qz > 0) {
      const d = Math.hypot(qx, qz);
      x = Math.sign(x) * (w - r + (qx * r) / d);
      z = Math.sign(z) * (h - r + (qz * r) / d);
    }
    // Out of the lobe's frame into the pool's: turned by its turn.
    pts.push([l.x + x * c + z * s, l.z - x * s + z * c]);
  }
  return pts;
}

// A lobe's source as a lobe in the frame at `origin`/`into` on its ball:
// its middle carried into that frame and read off the ground plane, and
// its turn as the angle its own x makes there.
const _v = new THREE.Vector3();
const X = new THREE.Vector3(1, 0, 0);
function lobeIn({ B, dir, quat, L }, origin, into) {
  _v.copy(dir).multiplyScalar(B.radius).add(B.center).sub(origin);
  _v.applyQuaternion(into);
  const x = _v.x,
    z = _v.z,
    y = _v.y;
  _v.copy(X).applyQuaternion(quat).applyQuaternion(into);
  const rad = Math.atan2(-_v.z, _v.x);
  return {
    x,
    z,
    y,
    rad,
    turn: (rad * 180) / Math.PI,
    halfWidth: L.halfWidth,
    halfLength: L.halfLength,
    cornerRadius: L.cornerRadius,
    depth: L.W.depth ?? 0,
  };
}

// The frame on `B` at `dir`: the ground there, and the turn into it.
function frameAt(B, dir) {
  const frame = standOn(dir);
  return {
    origin: dir.clone().multiplyScalar(B.radius).add(B.center),
    frame,
    into: frame.clone().invert(),
  };
}

// Whether two bodies of water run together: measured in the first's own
// frame, the second's edge comes within reach of the first — the gap at
// which the blend's neck closes between them, 2 ln 2 times the blend —
// or either's middle is inside the other, one swallowing the other.
// Measured over the ground first: the frame flattens the ball, so a
// body on the far side of it would land in the middle of this one and
// count as swallowed — two pools can only touch if the ground between
// their middles is shorter than their reaches put together.
function touching(a, b) {
  const B = a.B;
  const blend = Math.max(a.L.W.blend, b.L.W.blend);
  const reach = 2 * Math.LN2 * blend;
  const across = (L) => Math.hypot(L.halfWidth, L.halfLength);
  const cosine = a.dir.dot(b.dir);
  const arc = B.radius * Math.acos(Math.max(-1, Math.min(1, cosine)));
  if (arc > across(a.L) + across(b.L) + reach) return false;
  const near = (p, q) => {
    const { origin, into } = frameAt(B, p.dir);
    const lp = lobeIn(p, origin, into);
    const lq = lobeIn(q, origin, into);
    if (lobeDistance(lp, lq.x, lq.z) <= 0) return true;
    return lobeEdge(lq).some(([x, z]) => lobeDistance(lp, x, z) <= reach);
  };
  return near(a, b) || near(b, a);
}

const round = (n) => Math.round(n * 100) / 100;

// Every pool in `stations`: the bodies of water in their lots, clustered
// by touching, each cluster stood at the middle of its members and its
// lobes laid out round that. A ball's pools only ever join pools on the
// same ball.
export function poolsOf(stations) {
  const waters = lobeSourcesOf(stations, "waterFeature");
  const grounds = lobeSourcesOf(stations, "ground");
  // Clusters, by union-find over touching pairs.
  const parent = waters.map((_, i) => i);
  const find = (i) => (parent[i] === i ? i : (parent[i] = find(parent[i])));
  for (let i = 0; i < waters.length; i++)
    for (let j = i + 1; j < waters.length; j++) {
      const a = waters[i],
        b = waters[j];
      if (a.B !== b.B) continue;
      if (touching(a, b)) parent[find(i)] = find(j);
    }
  const clusters = new Map();
  waters.forEach((w, i) => {
    const root = find(i);
    if (!clusters.has(root)) clusters.set(root, []);
    clusters.get(root).push(w);
  });
  return [...clusters.values()].map((members) => {
    const B = members[0].B;
    const dir = members
      .reduce((sum, m) => sum.add(m.dir), new THREE.Vector3())
      .normalize();
    const { origin, frame, into } = frameAt(B, dir);
    const lobes = members.map((m) => lobeIn(m, origin, into));
    const W = members[0].L.W;
    const blend = members.reduce((k, { L }) => Math.max(k, L.W.blend), 0);
    // How far the whole pool stands off the ground: its first member's
    // own `position.z`, the way any object's is — a tub up on a deck —
    // and a bath's tub up on its feet besides (see bathStandOf).
    const lift = members[0].lift + bathStandOf(W);
    const pool = { body: B, dir, origin, frame, lobes, blend, W, lift };
    // The ground on this ball that lies within the pool's bounds, on its
    // own side of the ball — the rest could not touch it, and the far side
    // would land on the plane in the wrong place.
    const { x: bx, z: bz } = poolBounds(pool);
    const holes = grounds
      .filter((g) => g.B === B)
      .map((g) => lobeIn(g, origin, into))
      .filter((h) => {
        const reach = Math.hypot(h.halfWidth, h.halfLength);
        return (
          h.y > -B.radius / 2 &&
          Math.abs(h.x) < bx + reach &&
          Math.abs(h.z) < bz + reach
        );
      });
    const shape = (l) => [
      round(l.x),
      round(l.z),
      round(l.turn),
      l.halfWidth,
      l.halfLength,
      round(l.cornerRadius),
    ];
    return {
      ...pool,
      holes,
      members: members.map(({ si, oi }) => `${si}.${oi}`),
      key:
        JSON.stringify([lobes.map(shape), holes.map(shape)]) +
        `:${blend}:${W.stitch}:${W.lift}:${W.kind}:${W.pool.waterline}:${W.tub.height}:${W.tub.waterline}:${W.kiddie.rings.count}:${W.kiddie.rings.radius}:${lift}`,
    };
  });
}

// How far past the water's edge a pool's ground runs: a swimming pool's
// tiled border, a spring's rocks — as far out as the biggest could
// wander — a pond's nothing.
export const poolBorderOf = (W) => {
  if (W.kind === "pool") return W.pool.border;
  if (TUBBED.includes(W.kind)) return W.tub.thickness + W.tub.rim.out + 0.3;
  if (W.kind === "kiddie") return 2 * W.kiddie.rings.radius + 0.2;
  if (W.kind === "spring") {
    const K = W.spring.rocks;
    return K.out + K.jitter * K.spacing + K.radius[1] * K.widen[1];
  }
  return 0;
};

// Where the planet's pools keep the grass back: each as `{ origin, frame,
// pool, pad }` — the pool's own field, `bank` wider all round, and the
// border wider again for a swimming pool — marked `water` so a layer may
// grow on the bed alone (see GroundCover) — and `tiled` where that bed is
// a swimming pool's, which grows nothing.
export function poolClearings(stations) {
  return poolsOf(stations)
    .filter((p) => p.body.name === "planet")
    .map((pool) => ({
      origin: pool.origin,
      frame: pool.frame,
      pool,
      pad: pool.W.bank + poolBorderOf(pool.W),
      water: true,
      tiled: pool.W.kind === "pool",
    }));
}
