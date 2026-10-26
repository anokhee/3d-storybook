// FENCES ALONG A ROAD: a road's `fence` knob names a kind, and either side
// of it stands that fence, just past its tarmac. Plain three.js (the
// mapmaker and the game both build it from here: a game keeps a COPY in
// its own folder, copy it again when this changes).
//
//   buildFence(kind, stands, closed) → [{ color, opacity, geometry }]
//
// `stands` are the places along ONE side of the road a post may stand, in
// order: `{ pos, up, skip }` — where it meets the ground, the ground's up
// there, and `skip` for where there is to be no fence (over water, at a
// junction). The fence runs between each stand and the next that is not
// skipped. One geometry per colour, merged.
import * as THREE from "three";

// The kinds the knob offers (the enclosure's own, from src/nouns/enclosure,
// built here in plain boxes).
export const FENCE_KINDS = ["none", "wooden", "picket", "chainlink", "posts"];
// How far apart the posts stand, at most.
export const FENCE_SPACING = 3;
const HEIGHT = { wooden: 1.0, picket: 0.9, chainlink: 1.0, posts: 1.0 };
const LOOK = {
  wooden: { post: "#E8C39E", rail: "#CF8F5E" },
  picket: { post: "#F3EFE6", board: "#F3EFE6", rail: "#E4DDCF" },
  chainlink: { post: "#9AA0A6", rail: "#9AA0A6", mesh: "#B8BEC4" },
  posts: { post: "#E8C39E", cap: "#F3EFE6" },
};

const _m = new THREE.Matrix4();
const _x = new THREE.Vector3(), _z = new THREE.Vector3();

// Boxes collected by colour, merged at the end.
class Pile {
  constructor() {
    this.by = new Map();
  }
  // A box `size` (along, up, across) about `at`, its along-axis `t`, up `up`.
  box(color, size, at, t, up, opacity = 1) {
    const key = color + "|" + opacity;
    const g = new THREE.BoxGeometry(size[0], size[1], size[2]).toNonIndexed();
    g.deleteAttribute("uv");
    _z.crossVectors(t, up).normalize();
    _x.copy(t);
    _m.makeBasis(_x, up, _z).setPosition(at);
    g.applyMatrix4(_m);
    if (!this.by.has(key)) this.by.set(key, { color, opacity, list: [] });
    this.by.get(key).list.push(g);
  }
  parts() {
    return [...this.by.values()].map(({ color, opacity, list }) => {
      let n = 0;
      for (const g of list) n += g.attributes.position.count;
      const pos = new Float32Array(n * 3), nor = new Float32Array(n * 3);
      let o = 0;
      for (const g of list) {
        pos.set(g.attributes.position.array, o * 3);
        nor.set(g.attributes.normal.array, o * 3);
        o += g.attributes.position.count;
        g.dispose();
      }
      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute("position", new THREE.BufferAttribute(pos, 3));
      geometry.setAttribute("normal", new THREE.BufferAttribute(nor, 3));
      return { color, opacity, geometry };
    });
  }
}

export function buildFence(kind, stands, closed = false) {
  if (!HEIGHT[kind] || stands.length < 2) return [];
  const H = HEIGHT[kind], L = LOOK[kind];
  const pile = new Pile();
  const up = new THREE.Vector3(), t = new THREE.Vector3(), at = new THREE.Vector3();
  const sink = 0.5;
  // the posts
  for (const s of stands) {
    if (s.skip) continue;
    up.copy(s.up).normalize();
    t.set(1, 0, 0).addScaledVector(up, -up.x).normalize();
    if (t.lengthSq() < 1e-6) t.set(0, 0, 1).addScaledVector(up, -up.z).normalize();
    const w = kind === "chainlink" ? 0.12 : kind === "picket" ? 0.2 : 0.3;
    at.copy(s.pos).addScaledVector(up, (H + sink) / 2 - sink + 0.02);
    pile.box(L.post, [w, H + sink, w], at, t, up);
    if (kind === "posts") pile.box(L.cap, [w * 1.4, 0.12, w * 1.4], at.clone().addScaledVector(up, (H + sink) / 2 + 0.06), t, up);
  }
  // what runs between them
  const N = stands.length;
  for (let i = 0; i < (closed ? N : N - 1); i++) {
    const a = stands[i], b = stands[(i + 1) % N];
    if (a.skip || b.skip) continue;
    up.copy(a.up).add(b.up).normalize();
    t.subVectors(b.pos, a.pos);
    const len = t.length();
    if (len < 0.05) continue;
    t.divideScalar(len);
    const mid = new THREE.Vector3().addVectors(a.pos, b.pos).multiplyScalar(0.5);
    const rail = (color, h, thick, depth = thick, along = len) => pile.box(color, [along, thick, depth], at.copy(mid).addScaledVector(up, h), t, up);
    if (kind === "wooden") {
      for (const f of [0.28, 0.64, 1.0]) rail(L.rail, H * f - 0.08, 0.2, 0.2);
    } else if (kind === "picket") {
      rail(L.rail, H * 0.25, 0.1, 0.08);
      rail(L.rail, H * 0.7, 0.1, 0.08);
      const n = Math.max(1, Math.floor(len / 0.5));
      for (let k = 0; k < n; k++) {
        const u = ((k + 0.5) / n - 0.5) * len;
        pile.box(L.board, [0.32, H * 0.95, 0.05], at.copy(mid).addScaledVector(up, H * 0.47).addScaledVector(t, u), t, up);
      }
    } else if (kind === "chainlink") {
      rail(L.rail, H - 0.05, 0.1);
      pile.box(L.mesh, [len, H * 0.85, 0.03], at.copy(mid).addScaledVector(up, H * 0.45), t, up, 0.45);
    }
  }
  return pile.parts();
}

// Whether the road is wet (`wet(j)` of a sample index) within a fence bay of
// sample `i`, along it either way. The bridge's fence takes in the land post
// beside the water, so it and the land fence meet at one post, no gap.
export function nearWet(samples, closed, i, wet, R = 36, reach = FENCE_SPACING + 0.5) {
  const N = samples.length;
  for (const step of [1, -1]) {
    let arc = 0;
    for (let n = 1; n < N; n++) {
      const a = (i + step * (n - 1) + N * 2) % N, b = (i + step * n + N * 2) % N;
      if (!closed && (step > 0 ? b < a : b > a)) break;
      arc += samples[a].dir.angleTo(samples[b].dir) * R;
      if (arc > reach) break;
      if (wet(b)) return true;
    }
  }
  return false;
}

// The places one side of a road's fence stands: the road's samples (each
// `{ dir, tangent, side }`), `out` off its middle to that side (`sign` ±1),
// `ground(dir)` how far out the ground is there, `skip(i, dir)` true at a
// sample where there is to be no fence (over water, on a crossing road).
// The fence runs in RUNS, each the stretch between two skipped samples: a
// post at each end of the run — right at the edge of what breaks it, found
// to within a fraction of a sample — and
// posts evenly between, FENCE_SPACING apart at most. Between one run and
// the next stands a marker with `skip` set, so what reads the stands sees
// the break. A scrap of a run shorter than SCRAP is no fence, and goes.
const SCRAP = 1.5;
const _da = new THREE.Vector3(), _sa = new THREE.Vector3();
export function fenceStands(samples, closed, sign, out, ground, skip = () => false, R = 36) {
  const N = samples.length;
  if (N < 2) return [];
  const arcs = roadArcs(samples, closed, R);
  const total = arcs.total;
  // the fence line's bearing at sample i, or `a` along the road (between samples)
  const standAt = (i) => samples[i].dir.clone().multiplyScalar(R).addScaledVector(samples[i].side, sign * out).normalize();
  const at = (a) => {
    if (closed) a = ((a % total) + total) % total;
    let i = 0;
    while (i < N - 1 && arcs[i + 1] < a) i++;
    const j = closed ? (i + 1) % N : Math.min(N - 1, i + 1);
    const len = (j === 0 ? total : arcs[j]) - arcs[i];
    const t = len > 1e-9 ? Math.max(0, Math.min(1, (a - arcs[i]) / len)) : 0;
    _da.copy(samples[i].dir).lerp(samples[j].dir, t).normalize();
    _sa.copy(samples[i].side).lerp(samples[j].side, t).normalize();
    return _da.multiplyScalar(R).addScaledVector(_sa, sign * out).normalize().clone();
  };
  const stand = (dir, isSkip = false) => ({ pos: dir.clone().multiplyScalar(ground(dir)), up: dir, skip: isSkip });
  const keep = samples.map((s, i) => !skip(i, standAt(i)));
  // the runs: [first, last] sample of each, in order along the road
  const runs = [];
  if (closed && keep.every(Boolean)) {
    // one fence all the way round
    const n = Math.max(3, Math.ceil(total / FENCE_SPACING));
    return Array.from({ length: n }, (_, k) => stand(at((k * total) / n)));
  }
  const start = closed ? keep.findIndex((k) => !k) : 0;
  let i = 0;
  while (i < N) {
    const s = (start + i) % N;
    if (!keep[s]) {
      i++;
      continue;
    }
    let m = i;
    while (m + 1 < N && keep[(start + m + 1) % N]) m++;
    runs.push({ a: (start + i) % N, b: (start + m) % N, gapAfter: m + 1 < N || closed });
    i = m + 1;
  }
  // Where a run really ends: between a kept sample and the skipped one beside it
  // the break is somewhere in that bay, found by halving it (`skip` is asked at a
  // fractional sample index, the third argument; the first stays the skipped sample's), so the fence stops right at the edge of what breaks
  // it — at a junction, on the other road's fence line, where its own fence ends too.
  const fromTo = (kept, dirn) => {
    const gone = (kept + dirn + N) % N;
    const bay = dirn > 0 ? (gone === 0 ? total : arcs[gone]) - arcs[kept] : arcs[kept] - (kept === 0 ? arcs[N - 1] - total : arcs[gone]);
    if (!(bay > 1e-9)) return 0;
    let lo = 0, hi = 1;
    for (let k = 0; k < 8; k++) {
      const mid = (lo + hi) / 2;
      if (skip(gone, at(arcs[kept] + dirn * bay * mid), kept + dirn * mid)) hi = mid;
      else lo = mid;
    }
    return bay * lo;
  };
  const stands = [];
  for (const r of runs) {
    let a0 = arcs[r.a];
    let end = arcs[r.b];
    if (closed || r.a > 0) a0 -= fromTo(r.a, -1);
    if (closed || r.b < N - 1) end += fromTo(r.b, 1);
    const len = closed ? (((end - a0) % total) + total) % total : end - a0;
    if (len < SCRAP) continue;
    const n = Math.max(1, Math.ceil(len / FENCE_SPACING));
    for (let k = 0; k <= n; k++) stands.push(stand(at(a0 + (len * k) / n)));
    if (r.gapAfter) stands.push(stand(standAt((r.b + 1) % N), true));
  }
  return stands;
}

// SELF-CROSSINGS: a road that loops back over itself, or ends on its own
// earlier stretch, is there a road crossing a road. Any stretch of it more
// than SELF_WINDOW along the road from a place counts, at that place, as
// another road; nearer along it is the road's own bend (a hairpin's far
// side is no crossing). `roadArcs` is how far along the road each sample
// lies; `arcBetween` the way along it between two (the shorter way round a
// loop).
export const SELF_WINDOW = 16;
export function roadArcs(samples, closed = false, R = 36) {
  const N = samples.length;
  const arcs = new Float64Array(N);
  for (let i = 1; i < N; i++) arcs[i] = arcs[i - 1] + samples[i - 1].dir.angleTo(samples[i].dir) * R;
  arcs.total = N ? arcs[N - 1] + (closed ? samples[N - 1].dir.angleTo(samples[0].dir) * R : 0) : 0;
  return arcs;
}
export function arcBetween(arcs, i, j, closed = false) {
  const d = Math.abs(arcs[i] - arcs[j]);
  return closed ? Math.min(d, arcs.total - d) : d;
}
// Whether `dir` lies on a road: within `reach` of one of its samples — for
// the road that sample `i` is on (`self`), only of its stretches beyond
// SELF_WINDOW along it, see above.
export function onRoad(samples, dir, reach, R = 36, self = null) {
  for (let j = 0; j < samples.length; j++) {
    if (self && arcBetween(self.arcs, self.i, j, self.closed) <= SELF_WINDOW) continue;
    if (samples[j].dir.angleTo(dir) * R < reach) return true;
  }
  return false;
}

// CROSSINGS: where one road's fence line meets another's, the road is open.
// For every fence line (a road's samples carried `out` to a side), find
// where it crosses the OTHER roads' fence lines — on the ball, as great-arc
// meets great-arc — and its own, where the road comes back over itself
// (beyond SELF_WINDOW along it) — and open the stretch of it that lies
// between a road's two sides there, and a little more. `roads` are
// `{ samples, closed, out, width }`; the answer is, per road and side
// (`gaps[i][sign]`), a list of `[from, to]` in SAMPLE index (fractions) to
// leave without fence, for `skip(i)` to read.
const _n1 = new THREE.Vector3(), _n2 = new THREE.Vector3(), _gx = new THREE.Vector3(), _gc = new THREE.Vector3();
const within = (a, b, n, x) => _gc.crossVectors(a, x).dot(n) >= -1e-9 && _gc.crossVectors(x, b).dot(n) >= -1e-9;
export function fenceGaps(roads, R = 36, margin = 0.1) {
  const lines = roads.map((r) =>
    [-1, 1].map((sign) => r.samples.map((s) => s.dir.clone().multiplyScalar(R).addScaledVector(s.side, sign * r.out).normalize())),
  );
  const arcs = roads.map((r) => roadArcs(r.samples, r.closed, R));
  const out = roads.map(() => ({ "-1": [], 1: [] }));
  roads.forEach((r1, i1) => {
    [-1, 1].forEach((sign, k1) => {
      const L = lines[i1][k1];
      const N1 = L.length, bays1 = r1.closed ? N1 : N1 - 1;
      const step = (L.slice(1).reduce((t, p, i) => t + p.angleTo(L[i]) * R, 0) / Math.max(1, N1 - 1)) || 0.4;
      roads.forEach((r2, i2) => {
        const self = i2 === i1;
        const hits = [];
        for (const M of lines[i2]) {
          const N2 = M.length, bays2 = r2.closed ? N2 : N2 - 1;
          for (let i = 0; i < bays1; i++) {
            const p1 = L[i], p2 = L[(i + 1) % N1];
            _n1.crossVectors(p1, p2).normalize();
            for (let j = 0; j < bays2; j++) {
              if (self && arcBetween(arcs[i1], i, j, r1.closed) <= SELF_WINDOW) continue;
              const q1 = M[j], q2 = M[(j + 1) % N2];
              if (p1.angleTo(q1) * R > 8) continue;
              _n2.crossVectors(q1, q2).normalize();
              _gx.crossVectors(_n1, _n2);
              if (_gx.lengthSq() < 1e-12) continue;
              _gx.normalize();
              for (const f of [1, -1]) {
                const X = _gx.clone().multiplyScalar(f);
                if (X.dot(p1) > 0 && within(p1, p2, _n1, X) && within(q1, q2, _n2, X)) {
                  hits.push(i + p1.angleTo(X) / Math.max(1e-9, p1.angleTo(p2)));
                  break;
                }
              }
            }
          }
        }
        if (!hits.length) return;
        hits.sort((a, b) => a - b);
        // one crossing's hits lie together (a road's two sides); several crossings, far apart
        const together = 30;
        let from = hits[0], prev = hits[0];
        const close = (lo, hi) => {
          const m = margin / step;
          out[i1][sign].push([lo - m, hi + m]);
        };
        for (let h = 1; h < hits.length; h++) {
          if (hits[h] - prev > together) {
            close(from, prev);
            from = hits[h];
          }
          prev = hits[h];
        }
        close(from, prev);
      });
    });
  });
  return out;
}
// Whether sample `i` of a fence line falls in one of its gaps.
export const inGap = (gaps, i) => gaps.some(([a, b]) => i >= a && i <= b);
