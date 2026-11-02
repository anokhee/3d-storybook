// THE TERRAIN on the stage — the cliffs, cuts and ramps (../runtime/terrain.js)
// — shown as the ground it makes, as the GAME shows it. One mesh per
// CLUSTER of pieces that touch (TerrainGround): the ball knitted as the
// game knits it, an icosahedron of near-equilateral facets, each vertex
// pushed out by the field's rise there, so a cliff stands up as a flat top
// with banked sides, a ramp as its deck climbing into the cliff it meets,
// notch, joins, cuts and storeys and all. Every facet is flat and coloured
// whole — the map's ground colour on top, the cliff's earth where the
// skin climbs more than ~20°, dirt on a ramp's deck — under a cel ramp like
// the game's, so the edges read hard, not blurred. Over that, the WALLS
// (TerrainWalls): where a step is too tall to walk, the game builds a wall
// along the edge — a cap, a round lip, strata to a dark foot — and kerbs
// up every ramp; the same recipe (CLIFF_WALL) is built here.
//
// Everything here is the editor's (`userData.editorOnly`), left out of the
// saved file; the ground meshes are RISERS, which the pointer hits
// (surface.js), so a click on a plateau's top lands on its top — and picks
// the piece under it (pieceAt). A piece's own group (TerrainLobe, inside the
// placement's group in Scene.jsx) draws only its outline, picked.
import React, { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { useMap } from "./store.js";
import { ENTRY } from "./catalog.js";
import { TERRAIN, CLIFF, CLIFF_WALL, isWall } from "../runtime/terrain.js";
import { toLocal, roundedRect, lobeDistance } from "../runtime/cover.js";
import { GhostPatch, drape } from "./Patch.jsx";

export const RISERS = new Set();

const COLORS = { wall: new THREE.Color(CLIFF_WALL.colors.wall), deck: new THREE.Color(CLIFF_WALL.colors.dirt) };
const lerp = (a, b, t) => a + (b - a) * t;
const smooth01 = (x) => {
  const t = Math.max(0, Math.min(1, x));
  return t * t * (3 - 2 * t);
};
// How far past its rectangle a piece's ground is its own to draw.
const marginOf = (l) => (l.type === "cliff" ? l.k + l.wobble + CLIFF.wall + 1.5 : 1);

// THE CEL RAMP the game lights its world with (planet.js's LIGHTING.ramp):
// four bands, hard-edged. The terrain here is lit through the same.
const CEL_BANDS = [
  { from: 0, tone: 0.15 },
  { from: 0.14, tone: 0.24 },
  { from: 0.34, tone: 0.55 },
  { from: 0.56, tone: 1 },
];
const RAMP = (() => {
  const width = 256;
  const data = new Uint8Array(width);
  for (let i = 0; i < width; i++) {
    const at = (i + 0.5) / width;
    let tone = CEL_BANDS[0].tone;
    for (let k = 1; k < CEL_BANDS.length; k++) if (at >= CEL_BANDS[k].from) tone = CEL_BANDS[k].tone;
    data[i] = Math.round(255 * tone);
  }
  const tex = new THREE.DataTexture(data, width, 1, THREE.RedFormat);
  tex.minFilter = tex.magFilter = THREE.NearestFilter;
  tex.needsUpdate = true;
  return tex;
})();
// (polygon offset, so the mesh's ragged edge over the flat ground, green on green, wins the depth fight with the ball)
const GROUND_MATERIAL = new THREE.MeshToonMaterial({ color: 0xffffff, vertexColors: true, gradientMap: RAMP, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1 });
const WALL_MATERIAL = new THREE.MeshToonMaterial({ color: 0xffffff, vertexColors: true, gradientMap: RAMP });
// The walls' caps lie right on the skin's flat top, so they are pulled
// further forward than the skin is off the ball: they win, and the skin's
// steep facets under them no longer show through in brown slivers
const CAP_MATERIAL = new THREE.MeshToonMaterial({ color: 0xffffff, vertexColors: true, gradientMap: RAMP, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -4 });

// THE KNIT: the ball as an icosahedron, as the game's is (planet.js's
// PLANET.detail, 72) — each of its twenty faces split into detail² facets,
// the vertices shared (indexed as it is built, so each is sampled once),
// with each vertex's bearing and each facet's middle (for the cull). The
// fine knit is the game's own or finer (facets about FACET across at
// most); the coarse one, half that, is for while a piece is being dragged
// or a stroke is in hand, so the ground keeps up with the pointer. Cached
// by radius and detail: it is built once a session for each.
const FACET = 0.3;
const ICO = new Map();
// An icosphere's shared vertices (unit bearings) and faces, three.js's
// IcosahedronGeometry's own layout: each face of the icosahedron cut into
// a detail × detail grid of facets, the vertices along shared edges and at
// the corners the same vertex (found by their rounded bearing).
function icosphere(detail) {
  const t = (1 + Math.sqrt(5)) / 2;
  const V = [
    [-1, t, 0], [1, t, 0], [-1, -t, 0], [1, -t, 0],
    [0, -1, t], [0, 1, t], [0, -1, -t], [0, 1, -t],
    [t, 0, -1], [t, 0, 1], [-t, 0, -1], [-t, 0, 1],
  ].map((v) => new THREE.Vector3(...v).normalize());
  const F = [
    [0, 11, 5], [0, 5, 1], [0, 1, 7], [0, 7, 10], [0, 10, 11],
    [1, 5, 9], [5, 11, 4], [11, 10, 2], [10, 7, 6], [7, 1, 8],
    [3, 9, 4], [3, 4, 2], [3, 2, 6], [3, 6, 8], [3, 8, 9],
    [4, 9, 5], [2, 4, 11], [6, 2, 10], [8, 6, 7], [9, 8, 1],
  ];
  const dirs = [];
  const seen = new Map();
  const _v = new THREE.Vector3();
  const vertex = (a, b, c, i, j) => {
    // the point i/detail of the way a→b and j/detail of the way a→c, on the sphere
    _v.copy(a).multiplyScalar(detail - i - j).addScaledVector(b, i).addScaledVector(c, j).normalize();
    const key = `${Math.round(_v.x * 1e5)},${Math.round(_v.y * 1e5)},${Math.round(_v.z * 1e5)}`;
    let id = seen.get(key);
    if (id === undefined) {
      id = dirs.length / 3;
      seen.set(key, id);
      dirs.push(_v.x, _v.y, _v.z);
    }
    return id;
  };
  const index = [];
  for (const [ia, ib, ic] of F) {
    const a = V[ia], b = V[ib], c = V[ic];
    for (let j = 0; j < detail; j++)
      for (let i = 0; i < detail - j; i++) {
        index.push(vertex(a, b, c, i, j), vertex(a, b, c, i + 1, j), vertex(a, b, c, i, j + 1));
        if (i + j < detail - 1) index.push(vertex(a, b, c, i + 1, j), vertex(a, b, c, i + 1, j + 1), vertex(a, b, c, i, j + 1));
      }
  }
  return { dirs: new Float32Array(dirs), index: new Uint32Array(index) };
}
function knitOf(R, fine) {
  const detail = Math.min(220, Math.max(fine ? 72 : 36, Math.round((1.05 * R) / (fine ? FACET : FACET * 2))));
  const key = `${R}:${detail}`;
  if (!ICO.has(key)) {
    const { dirs, index: I } = icosphere(detail);
    const mids = new Float32Array(I.length);
    for (let f = 0; f < I.length; f += 3) {
      let x = 0, y = 0, z = 0;
      for (let k = 0; k < 3; k++) {
        const v = I[f + k] * 3;
        x += dirs[v];
        y += dirs[v + 1];
        z += dirs[v + 2];
      }
      const l = Math.hypot(x, y, z);
      mids[f] = x / l;
      mids[f + 1] = y / l;
      mids[f + 2] = z / l;
    }
    ICO.set(key, { detail, index: I, dirs, mids, count: dirs.length / 3 });
  }
  return ICO.get(key);
}

// THE GROUND, as one piece: the pieces that touch one another make a
// CLUSTER (a cliff and the ramps up it, cliffs that run together, the cuts
// in them), and each cluster is the knit's facets within its reach, each
// vertex pushed out by the field. A cluster is rebuilt when a piece in it
// changes (the field is the whole map's, so a cluster is keyed on the
// pieces in it).
const clustersOf = (lobes) => {
  const R = lobes[0]?.frame.R ?? 36;
  // pieces that can touch: their outlines and the blend between them, not the whole margin the mesh is cut with (on a small ball that merged far-apart cliffs into one grid wider than the ball)
  const reach = (l) => Math.hypot(l.hw, l.hl) + (l.type === "cliff" ? l.k + l.wobble : 1);
  const parent = lobes.map((_, i) => i);
  const find = (i) => (parent[i] === i ? i : (parent[i] = find(parent[i])));
  for (let i = 0; i < lobes.length; i++)
    for (let j = i + 1; j < lobes.length; j++)
      if (lobes[i].frame.d.angleTo(lobes[j].frame.d) * R < reach(lobes[i]) + reach(lobes[j])) parent[find(i)] = find(j);
  const groups = new Map();
  lobes.forEach((l, i) => (groups.get(find(i)) ?? groups.set(find(i), []).get(find(i))).push(l));
  return [...groups.values()];
};
function buildCluster(lobes, field, surface, top, knit) {
  const R = surface.radius;
  const centre = new THREE.Vector3();
  for (const l of lobes) centre.add(l.frame.d);
  centre.normalize();
  let reach = 0;
  for (const l of lobes) reach = Math.max(reach, centre.angleTo(l.frame.d) * R + Math.hypot(l.hw, l.hl) + marginOf(l));
  const cos = Math.cos(Math.min(Math.PI, (reach + 1) / R));
  const { index: I, dirs, mids } = knit;
  // each vertex sampled once: the skin's rise there, and where it stands
  const rise = new Float32Array(knit.count).fill(NaN);
  const where = new Float32Array(knit.count * 3);
  const d = new THREE.Vector3();
  const sample = (v) => {
    if (!Number.isNaN(rise[v])) return rise[v];
    d.set(dirs[v * 3], dirs[v * 3 + 1], dirs[v * 3 + 2]);
    const h = field.rise(d, false);
    rise[v] = h;
    const r = surface.baseAt(d) + h - surface.dropAt(d);
    where[v * 3] = d.x * r;
    where[v * 3 + 1] = d.y * r;
    where[v * 3 + 2] = d.z * r;
    return h;
  };
  const pos = [], col = [], level = [];
  const mix = new THREE.Color();
  const m = new THREE.Vector3(), u = new THREE.Vector3(), w = new THREE.Vector3(), p0 = new THREE.Vector3(), p1 = new THREE.Vector3(), p2 = new THREE.Vector3();
  for (let f = 0; f < I.length; f += 3) {
    if (mids[f] * centre.x + mids[f + 1] * centre.y + mids[f + 2] * centre.z < cos) continue;
    const i0 = I[f], i1 = I[f + 1], i2 = I[f + 2];
    const h0 = sample(i0), h1 = sample(i1), h2 = sample(i2);
    if (h0 < 0.02 && h1 < 0.02 && h2 < 0.02) continue; // flat ground: the ball shows it
    // the facet's steepness: the rise's gradient over it, in the plane at its middle
    m.set(mids[f], mids[f + 1], mids[f + 2]);
    u.set(0, 1, 0).cross(m);
    if (u.lengthSq() < 1e-6) u.set(1, 0, 0).cross(m);
    u.normalize();
    w.crossVectors(m, u);
    p0.set(dirs[i0 * 3], dirs[i0 * 3 + 1], dirs[i0 * 3 + 2]).multiplyScalar(R);
    p1.set(dirs[i1 * 3], dirs[i1 * 3 + 1], dirs[i1 * 3 + 2]).multiplyScalar(R);
    p2.set(dirs[i2 * 3], dirs[i2 * 3 + 1], dirs[i2 * 3 + 2]).multiplyScalar(R);
    const ax = p1.dot(u) - p0.dot(u), az = p1.dot(w) - p0.dot(w), bx = p2.dot(u) - p0.dot(u), bz = p2.dot(w) - p0.dot(w);
    const det = ax * bz - az * bx || 1e-9;
    const gx = ((h1 - h0) * bz - (h2 - h0) * az) / det, gz = ((h2 - h0) * ax - (h1 - h0) * bx) / det;
    const slope = Math.hypot(gx, gz);
    // its colour, whole: the earth where the skin climbs more than ~20°,
    // a ramp's dirt on a deck, the ground's green on top — and the green
    // again where the rise runs out, so the ragged edge is green on green
    const own = slope > 0.35 ? COLORS.wall : field.onRamp(m) > 0.5 ? COLORS.deck : top;
    mix.copy(top).lerp(own, Math.min(1, (h0 + h1 + h2) / 3 / 0.4));
    for (const i of [i0, i1, i2]) {
      pos.push(where[i * 3], where[i * 3 + 1], where[i * 3 + 2]);
      col.push(mix.r, mix.g, mix.b);
    }
    level.push(slope < 0.35);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute("color", new THREE.Float32BufferAttribute(col, 3));
  g.computeVertexNormals(); // flat: every facet its own three vertices
  // …but a level facet (a top, a gentle bank) is lit straight up off the
  // ball, smooth as the ball itself is: flat, each tilted a hair from the
  // next round the curve, they fell either side of a cel band's edge in
  // rings across every top. The walls' caps are lit the same way.
  const N = g.attributes.normal.array;
  for (let f = 0; f < level.length; f++) {
    if (!level[f]) continue;
    for (let v = f * 9; v < f * 9 + 9; v += 3) {
      const l = Math.hypot(pos[v], pos[v + 1], pos[v + 2]) || 1;
      N[v] = pos[v] / l;
      N[v + 1] = pos[v + 1] / l;
      N[v + 2] = pos[v + 2] / l;
    }
  }
  return g;
}
const clusterKey = (lobes) => lobes.map((l) => `${l.id}:${l.type}:${l.order}:${l.frame.d.x.toFixed(5)},${l.frame.d.y.toFixed(5)},${l.frame.d.z.toFixed(5)}:${l.frame.X.x.toFixed(4)},${l.frame.X.z.toFixed(4)}:${l.hw}:${l.hl}:${l.r}:${l.k}:${l.h}:${l.wobble}:${l.road}:${l.tier}`).join(";");

// The fine builds, one a frame: a whole ground grown at once is many
// clusters, and all of them built in one go would hold the page for a
// second. A job can be called off (its cluster changed again meanwhile).
const FINE = [];
let pumping = false;
const pump = () => {
  const job = FINE.shift();
  if (job && !job.off) job.fn();
  if (FINE.length) requestAnimationFrame(pump);
  else pumping = false;
};
const queueFine = (fn) => {
  const job = { fn, off: false };
  FINE.push(job);
  if (!pumping) {
    pumping = true;
    requestAnimationFrame(pump);
  }
  return () => (job.off = true);
};
// One cluster's ground: the coarse knit a beat after the last change to a
// piece in it (a drag, a slider, a stroke), the fine one once it has
// rested. Pieces elsewhere on the ball do not touch it (that is what a
// cluster is), so a change to them — every stamp of a stroke over there —
// does not build it again: only its own pieces, the water (its basins
// sink the ground) and the ground colour do. The mesh is a RISER, which
// the pointer hits; `onPick` gets the press, to find the piece under it
// (Scene.jsx).
function Cluster({ lobes, surface, onPick }) {
  const groundColor = useMap((s) => s.map.look.ground);
  const key = clusterKey(lobes);
  const latest = useRef({ lobes, surface });
  latest.current = { lobes, surface };
  const [geometry, setGeometry] = useState(null);
  useEffect(() => {
    const top = new THREE.Color(groundColor).offsetHSL(0, 0, 0.03);
    const build = (fine) => {
      const { lobes, surface } = latest.current;
      setGeometry(buildCluster(lobes, surface.field, surface, top, knitOf(surface.radius, fine)));
    };
    let off = null;
    const coarse = setTimeout(() => build(false), 40);
    const fine = setTimeout(() => (off = queueFine(() => build(true))), 360);
    return () => {
      clearTimeout(coarse);
      clearTimeout(fine);
      off?.();
    };
  }, [key, surface.basin, surface.radius, groundColor]);
  useEffect(() => () => geometry?.dispose(), [geometry]);
  const [mesh, setMesh] = useState(null);
  useEffect(() => {
    if (!mesh) return;
    RISERS.add(mesh);
    return () => RISERS.delete(mesh);
  }, [mesh]);
  if (!geometry) return null;
  return <mesh ref={setMesh} geometry={geometry} material={GROUND_MATERIAL} userData={{ editorOnly: true, shadowed: true }} castShadow receiveShadow onPointerDown={onPick} />;
}
// The map's own ground, cluster by cluster. Drawn once, outside the
// placements (a piece's own group draws only its outline, TerrainLobe).
export function TerrainGround({ surface, onPick }) {
  const field = surface.field;
  const clusters = useMemo(() => clustersOf(field.lobes), [field]);
  return clusters.map((lobes) => <Cluster key={lobes[0].id} lobes={lobes} surface={surface} onPick={onPick} />);
}

// THE WALLS, as the game builds them (planet.js, "the cliffs' walls"; the
// recipe is CLIFF_WALL). The skin under a tier only eases up to its top
// inside the edge; where the step up the edge is too steep to walk, the
// wall that shows stands along the edge itself — the zero line of the
// tier's field, marched and chained into loops (field.edgesOf) — a flat
// cap over the skin's easing in the ground's own colour, a warm round-over
// at the lip, the face in flat strata leaning out a little to a dark foot
// buried in the lower ground. Every quad is its own flat facet. A ramp's
// sides are built the same way: a kerb along each edge of the deck,
// standing up off it, with the face under it down to the ground. Where a
// ramp meets a tier's edge the wall is left out for it.
function buildWalls(field, surface, top) {
  const R = surface.radius;
  const W = CLIFF_WALL, C = CLIFF_WALL.colors;
  const wallPos = [], wallCol = [], capPos = [], capCol = [];
  const lipC = new THREE.Color(C.lip), footC = new THREE.Color(C.foot), kerbC = new THREE.Color(C.kerb);
  const strataColors = W.strata.map((_, s) => new THREE.Color(s % 2 ? C.band : C.wall));
  const _n = new THREE.Vector3(), _e1 = new THREE.Vector3(), _e2 = new THREE.Vector3();
  // A quad from four corners, wound to face `facing`, into the wall in `color` — or, with none, into the cap, in the ground's colour.
  const quad = (a, b, c, d, facing, color) => {
    _e1.subVectors(b, a);
    _e2.subVectors(c, a);
    _n.crossVectors(_e1, _e2);
    const tri = _n.dot(facing) >= 0 ? [a, b, c, a, c, d] : [a, d, c, a, c, b];
    const P = color ? wallPos : capPos, K = color ? wallCol : capCol, k = color ?? top;
    for (const v of tri) {
      P.push(v.x, v.y, v.z);
      K.push(k.r, k.g, k.b);
    }
  };
  const strip = (A, B, facings, colors) => {
    for (let k = 0; k < colors.length; k++) quad(A[k], B[k], B[k + 1], A[k + 1], Array.isArray(facings) ? facings[k] : facings, colors[k]);
  };
  // the hard ground: what stands on it stands here (the game's groundRadiusAt)
  const groundR = (d) => surface.baseAt(d) + field.rise(d, true) - surface.dropAt(d);
  const hardRise = (d) => field.rise(d, true);
  // The wall's profile at a point on the edge, `out` across it: from the
  // cap's inner edge over the skin's rise, the round-over at the lip, the
  // strata leaning out, to the foot buried under the lower ground.
  const profileAt = (p, out, topR, footR, inner) => {
    const faceTop = W.lip[W.lip.length - 1][1];
    const footY = footR - topR - W.bury;
    const faceSpan = footY + W.foot - faceTop;
    const nodes = [[-inner, 0], ...W.lip];
    let cum = 0;
    for (let s = 0; s < W.strata.length - 1; s++) {
      cum += W.strata[s];
      nodes.push([W.batter * cum, faceTop + faceSpan * cum]);
    }
    nodes.push([W.batter, footY + W.foot], [W.batter + 0.03, footY]);
    return nodes.map(([m, y]) => p.clone().multiplyScalar(R).addScaledVector(out, m).normalize().multiplyScalar(topR + y));
  };
  const wallColors = [null, ...W.lip.slice(1).map(() => lipC), ...strataColors, footC];
  // How far in from a point on the edge the cap reaches: over the skin's
  // easing under a wall (CLIFF.wallEase and the cap), or less where the top is narrower than
  // that — a thin neck, the sliver beside a cut — so the cap never pokes
  // out through the wall on the far side. The tier's field is read going
  // in: the cap stops where the ground stops getting deeper.
  const CAP_REACH = CLIFF.wallEase + W.cap;
  const _in = new THREE.Vector3();
  const capReach = (tier, p, out) => {
    let reach = 0.3;
    for (let d = 0.6; d <= CAP_REACH + 1e-6; d += 0.3) {
      _in.copy(p).multiplyScalar(R).addScaledVector(out, -d).normalize();
      const m = tier.field(_in);
      if (!(m < -Math.min(d, CAP_REACH - d + 0.3) * 0.7)) break;
      reach = d;
    }
    return Math.min(CAP_REACH, reach + 0.3);
  };
  const dressTier = (tier) => {
    for (const loop of field.edgesOf(tier, { cell: W.cell, step: W.step, smooth: W.smooth })) {
      const N = loop.length;
      // across the edge at each point, turned to point off the tier
      const outs = loop.map((p, i) => {
        const t = loop[(i + 1) % N].clone().sub(loop[(i - 1 + N) % N]);
        t.addScaledVector(p, -t.dot(p));
        return new THREE.Vector3().crossVectors(t, p).normalize();
      });
      const probe = loop[0].clone().multiplyScalar(R).addScaledVector(outs[0], 0.5).normalize();
      if (tier.field(probe) < tier.field(loop[0])) for (const o of outs) o.negate();
      // a wall only where the step up this edge is too steep to walk; a step of the stock rise is a bank, left to the skin
      let step = 0;
      for (let i = 0; i < N; i += Math.max(1, Math.floor(N / 16))) {
        const up = hardRise(loop[i].clone().multiplyScalar(R).addScaledVector(outs[i], -0.6).normalize());
        const down = hardRise(loop[i].clone().multiplyScalar(R).addScaledVector(outs[i], 0.6).normalize());
        step = Math.max(step, up - down);
      }
      if (!isWall(step)) continue;
      const rows = loop.map((p, i) => {
        // the cap at the highest of the skin under it, a hair over, so the skin further in never pokes through it (a jagged crack along the top)
        const inner = capReach(tier, p, outs[i]);
        let topR = 0;
        for (let d = 0.3; d <= inner + 1e-6; d += 0.15) topR = Math.max(topR, groundR(p.clone().multiplyScalar(R).addScaledVector(outs[i], -d).normalize()));
        const footR = groundR(p.clone().multiplyScalar(R).addScaledVector(outs[i], 0.6).normalize());
        return profileAt(p, outs[i], topR + 0.02, footR, inner);
      });
      for (let i = 0; i < N; i++) {
        const j = (i + 1) % N;
        if (field.cutByRamp(loop[i]) && field.cutByRamp(loop[j])) continue;
        strip(rows[i], rows[j], outs[i].clone().add(loop[i]), wallColors);
      }
    }
  };
  // A ramp's sides: from just before its foot up to where each edge of
  // its deck meets the tier's edge, the kerb — its inner face up off the
  // deck, its top, and the wall's strata down the outside to the foot.
  const dressRamp = (r) => {
    const Fh = CLIFF.feather;
    for (const s of [-1, 1]) {
      const deckAt = (u) => lerp(r.h0, r.h1, smooth01(u / r.L));
      let uEnd = r.L - 3;
      while (uEnd < r.L + 4 && !(field.tierRise(field.rampDirAt(r, uEnd, s * r.hw), true, !r.docked) >= r.h1 - 1e-3 && r.h1 - deckAt(uEnd) < 0.3)) uEnd += 0.1;
      if (field.tierRise(field.rampDirAt(r, r.L, s * r.hw), true, true) >= r.h1 - 1e-3) uEnd = Math.max(uEnd, r.L);
      uEnd += 0.15;
      const us = [];
      for (let u = -0.4; u < uEnd; u += W.step) us.push(u);
      us.push(uEnd);
      const inner = s * (r.hw - Fh), outer = s * r.hw;
      const rows = us.map((u) => {
        const deckR = groundR(field.rampDirAt(r, u, inner - s * 0.1));
        const groundRr = groundR(field.rampDirAt(r, u, outer + s * 0.4));
        const topR = deckR + CLIFF.kerb * smooth01((u + 0.4) / 1.2) * (1 - smooth01((u - (uEnd - 2.5)) / 2.5));
        const faceBottom = Math.min(topR, groundRr + W.foot);
        const nodes = [
          [inner, deckR],
          [inner, topR],
          [outer, topR],
        ];
        let cum = 0;
        for (let k = 0; k < W.strata.length - 1; k++) {
          cum += W.strata[k];
          nodes.push([outer + s * W.batter * cum, lerp(topR, faceBottom, cum)]);
        }
        nodes.push([outer + s * W.batter, faceBottom], [outer + s * (W.batter + 0.03), groundRr - W.bury]);
        return nodes.map(([v, rad]) => field.rampDirAt(r, u, v).multiplyScalar(rad));
      });
      const outward = r.frame.X.clone().multiplyScalar(s).add(r.frame.d);
      const inward = r.frame.X.clone().multiplyScalar(-s).add(r.frame.d);
      const facings = [inward, outward, ...strataColors.map(() => outward), outward];
      const colors = [kerbC, kerbC, ...strataColors, footC];
      for (let j = 0; j + 1 < rows.length; j++) strip(rows[j], rows[j + 1], facings, colors);
    }
  };
  // (a tier no taller than the step a wall takes can be a wall nowhere: its edge is not marched)
  for (const t of field.tiers) if (isWall(t.h)) dressTier(t);
  for (const r of field.ramps) dressRamp(r);
  const geometryOf = (P, K, up = false) => {
    if (!P.length) return null;
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(P, 3));
    g.setAttribute("color", new THREE.Float32BufferAttribute(K, 3));
    if (up) {
      // straight up off the ball, as the skin's flat top beside it is, so the cel light bands them alike and no seam shows between
      const N = new Float32Array(P.length);
      for (let i = 0; i < P.length; i += 3) {
        const l = Math.hypot(P[i], P[i + 1], P[i + 2]) || 1;
        N[i] = P[i] / l;
        N[i + 1] = P[i + 1] / l;
        N[i + 2] = P[i + 2] / l;
      }
      g.setAttribute("normal", new THREE.BufferAttribute(N, 3));
    } else g.computeVertexNormals();
    return g;
  };
  return { walls: geometryOf(wallPos, wallCol), caps: geometryOf(capPos, capCol, true) };
}
// The walls and kerbs of the whole map, built once the ground has rested
// a moment after a change. Not risers: the pointer goes through to the
// skin under them, so a click on a wall's face lands on the ground there.
export function TerrainWalls({ surface }) {
  const groundColor = useMap((s) => s.map.look.ground);
  const [geo, setGeo] = useState(null);
  useEffect(() => {
    if (surface.field.empty) return setGeo(null);
    const t = setTimeout(() => setGeo(buildWalls(surface.field, surface, new THREE.Color(groundColor).offsetHSL(0, 0, 0.03))), 300);
    return () => clearTimeout(t);
  }, [surface, groundColor]);
  useEffect(
    () => () => {
      geo?.walls?.dispose();
      geo?.caps?.dispose();
    },
    [geo],
  );
  if (!geo) return null;
  return (
    <>
      {geo.walls && <mesh geometry={geo.walls} material={WALL_MATERIAL} userData={{ editorOnly: true, shadowed: true }} castShadow receiveShadow raycast={() => {}} />}
      {geo.caps && <mesh geometry={geo.caps} material={CAP_MATERIAL} userData={{ editorOnly: true, shadowed: true }} castShadow receiveShadow raycast={() => {}} />}
    </>
  );
}

// The piece under a bearing, for a press on the ground: a ramp's deck
// first (it lies on the cliffs), then a cut (it lies in one), else the
// topmost cliff whose outline holds it (its wobble and all), else nothing.
const _pl = { x: 0, z: 0 };
export function pieceAt(field, dir) {
  const within = (f, hw, hl) => {
    toLocal(f, dir, _pl);
    return Math.abs(_pl.x) <= hw + 0.3 && Math.abs(_pl.z) <= hl + 0.3;
  };
  // (a ramp as docked is shorter than as drawn: either rectangle picks it)
  for (const r of [...field.ramps, ...field.level]) if (r.lobe && (within(r.frame, r.hw, r.hl) || within(r.lobe.frame, r.lobe.hw, r.lobe.hl))) return r.id;
  for (const l of field.lobes) {
    if (l.type !== "cut" || !(l.h > 0)) continue;
    toLocal(l.frame, dir, _pl);
    if (roundedRect(_pl.x, _pl.z, l.hw, l.hl, l.r) < 0.3) return l.id;
  }
  const cliffs = field.lobes.filter((l) => l.type === "cliff").sort((a, b) => b.layer - a.layer || b.order - a.order);
  for (const l of cliffs) {
    toLocal(l.frame, dir, _pl);
    if (roundedRect(_pl.x, _pl.z, l.hw, l.hl, l.r) < l.wobble + 0.3) return l.id;
  }
  return null;
}

// THE SHAPE a cliff or cut belongs to: every piece of its tier (cliffs of
// that height, and the cuts made in it) joined to it, piece to piece,
// where they touch or run together by the blend — what one sculpt stroke,
// or many run together, made. Deleting a picked cliff takes the shape.
// Cuts left over it with nothing to cut (the storey they were cut into
// gone: only their outline shows) go with it too. (A storey on it is its
// own shape; with it gone, the storey stands on the ground.)
export function shapeOf(field, id) {
  const start = field?.lobes.find((l) => l.id === id);
  if (!start || (start.type !== "cliff" && start.type !== "cut")) return [id];
  const R = start.frame.R ?? 36;
  const tier = field.lobes.filter((l) => (l.type === "cliff" || l.type === "cut") && Math.abs(l.h - start.h) < 0.005);
  const idle = field.lobes.filter((l) => l.type === "cut" && !(l.h > 0));
  const k = Math.max(0, ...tier.map((l) => l.k ?? 0));
  const extent = (l) => Math.hypot(Math.max(0, l.hw - (l.r ?? 0)), Math.max(0, l.hl - (l.r ?? 0))) + (l.r ?? 0);
  const touch = (a, b) => a.frame.d.angleTo(b.frame.d) * R < extent(a) + extent(b) + k + (a.wobble ?? 0) + (b.wobble ?? 0) && Math.min(lobeDistance(a, b.frame.d) - extent(b), lobeDistance(b, a.frame.d) - extent(a)) < k + 0.3;
  const seen = new Set([start.id]);
  const queue = [start];
  while (queue.length) {
    const a = queue.pop();
    for (const b of tier) if (!seen.has(b.id) && touch(a, b)) seen.add(b.id), queue.push(b);
  }
  for (const c of idle) if (tier.some((a) => seen.has(a.id) && a.type === "cliff" && lobeDistance(a, c.frame.d) < 0.3)) seen.add(c.id);
  return [...seen];
}

export function TerrainLobe({ p, surface, ghost = false }) {
  const entry = ENTRY[p.entry];
  const type = entry?.terrain ?? "cliff";
  const tint = TERRAIN[type]?.tint ?? "#888";
  if (ghost) return <GhostPatch p={p} tint={tint} />;
  return <LiveTerrain p={p} surface={surface} type={type} />;
}

function LiveTerrain({ p, surface, type }) {
  const selected = useMap((s) => s.selected === p.id);
  const field = surface.field;
  const lobe = field.lobes.find((l) => l.id === p.id);
  // the group that undoes the placement's frame, so children are in world terms
  const inverse = useMemo(() => {
    const { position, quaternion } = surface.standAt(p.dir, p.lift, p.yaw);
    return new THREE.Matrix4().compose(position, quaternion, new THREE.Vector3(1, 1, 1)).invert();
  }, [surface, p.dir, p.lift, p.yaw]);
  // a ramp lying level makes no ground, and a cut over no cliff takes none: only the outline shows, so it can be found and moved
  const idle = !!lobe && ((type === "ramp" && field.level.some((r) => r.id === p.id)) || (type === "cut" && !(lobe.h > 0)));
  const shown = selected || idle;
  // The ground itself is the cluster's (TerrainGround); this is the
  // outline round the piece, picked — built a beat after the last change,
  // and only while it shows (every piece's, on every change, was a cost).
  const [outline, setOutline] = useState(null);
  useEffect(() => {
    if (!lobe || !shown) return;
    const t = setTimeout(() => setOutline(drape({ ...lobe, r: lobe.r ?? 0 }, surface, 0.1).outline), 40);
    return () => clearTimeout(t);
  }, [surface, p.id, p.yaw, shown]);
  useEffect(() => () => outline?.dispose(), [outline]);
  if (!lobe || !outline || !shown) return null;
  return (
    <group matrixAutoUpdate={false} matrix={inverse}>
      {(selected || idle) && (
        <lineLoop geometry={outline} userData={{ editorOnly: true }} renderOrder={6} raycast={() => {}}>
          <lineBasicMaterial color={selected ? "#6B86A8" : TERRAIN[type]?.tint ?? TERRAIN.ramp.tint} depthTest={false} transparent opacity={selected ? 0.95 : 0.8} />
        </lineLoop>
      )}
    </group>
  );
}

// What a ramp came out as, for the inspector: its two heights and its grade (the steepest of its deck).
export function rampInfo(field, id) {
  if (!field) return null;
  if (field.level.some((r) => r.id === id)) return { flat: true };
  const r = field.ramps.find((r) => r.id === id);
  if (!r) return null;
  return { flat: false, h0: r.h0, h1: r.h1, L: r.L, slope: r.slope, grade: r.grade, steep: r.grade > CLIFF.climb * 0.8 };
}
