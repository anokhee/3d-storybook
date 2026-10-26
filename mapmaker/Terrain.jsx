// A PIECE OF TERRAIN on the stage — a cliff or a ramp (../runtime/terrain.js)
// — shown as the ground it makes: a heightfield over its own rectangle and
// a margin, each vertex at the base ground plus the field's rise there, so
// a cliff stands up as a flat top with banked sides, a ramp as its deck
// climbing into the cliff it meets, notch, joins and storeys and all (the
// field is the whole map's). Faces are flat-shaded, tops in the map's
// ground colour, sides in the cliff's earth, a ramp's deck in dirt. The
// game builds its own walls from the same field; this is the editor's look
// at it.
//
// Where two pieces overlap, the later-placed draws over the earlier
// (polygon offset by order), and a piece leaves out what lies wholly
// inside an earlier piece's reach, so they do not fight. Everything here is
// the editor's (`userData.editorOnly`), left out of the saved file; the
// meshes are RISERS, which the pointer hits (surface.js), so a click on a
// plateau's top lands on its top.
//
// Drawn inside the placement's group (Scene.jsx), which is stood at the
// piece's middle; the heightfield is in world terms under a group that
// undoes the placement's frame, as a patch's things are (Patch.jsx).
import React, { useEffect, useMemo, useState } from "react";
import * as THREE from "three";
import { useMap } from "./store.js";
import { ENTRY } from "./catalog.js";
import { TERRAIN, CLIFF } from "../runtime/terrain.js";
import { fromLocal, toLocal } from "../runtime/cover.js";
import { GhostPatch, drape } from "./Patch.jsx";

export const RISERS = new Set();

const COLORS = { wall: new THREE.Color("#A68B6F"), deck: new THREE.Color("#C9A67E") };
// One material per stacking order: the later-placed piece is offset nearer, so it draws over an earlier one where they overlap.
const materials = new Map();
const materialFor = (order) => {
  if (!materials.has(order)) materials.set(order, new THREE.MeshToonMaterial({ color: 0xffffff, vertexColors: true, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -(order + 1) }));
  return materials.get(order);
};

// How far past its rectangle a piece's ground is its own to draw.
const marginOf = (l) => (l.type === "cliff" ? l.k + l.wobble + CLIFF.wall + 1.5 : 1);
const _l = { x: 0, z: 0 };
const within = (l, dir, m) => {
  toLocal(l.frame, dir, _l);
  return Math.abs(_l.x) < l.hw + m && Math.abs(_l.z) < l.hl + m;
};
const smooth01 = (x) => {
  const t = Math.max(0, Math.min(1, x));
  return t * t * (3 - 2 * t);
};
// The ground as the preview shows it: a cliff's own edge eased, as the
// game's skin is (its wall stands over the easing); a ramp's notch and
// sides a hard step, as the game's walls and kerbs make them. `deck` where
// a ramp's deck or kerb stands above the cliffs — not past its head.
function previewRise(field, dir) {
  let soft = 0, hard = 0;
  for (const t of field.tiers) {
    const raw = t.raw(dir);
    if (raw === Infinity) continue;
    const step = t.field(dir) < 0 ? 1 : 0;
    soft = Math.max(soft, t.h * Math.min(smooth01(-raw / CLIFF.wall), step));
    hard = Math.max(hard, t.h * step);
  }
  const all = field.rise(dir, true);
  const ramp = all > hard + 1e-6 ? all : 0;
  return { h: Math.max(soft, ramp), deck: all > hard + 0.02 };
}
// Sample lines across an extent: even, plus any `extra` lines (an edge's two
// sides, so a step there is a vertical face, not a slope one cell wide).
const linesOf = (ex, extra) => {
  const n = Math.min(64, Math.ceil((2 * ex) / 0.35));
  const xs = [];
  for (let i = 0; i <= n; i++) xs.push(-ex + (2 * ex * i) / n);
  for (const e of extra) if (Math.abs(e) < ex) xs.push(e);
  return [...new Set(xs)].sort((a, b) => a - b);
};

// The heightfield of one piece: flat-shaded triangles in world terms. A ramp
// draws its own ground over any cliff's (its grid lines up with its edges);
// between pieces of a kind, the later-placed owns where they overlap.
function build(lobe, field, surface, top) {
  const ramp = lobe.type === "ramp";
  const frame = ramp ? (field.ramps.find((r) => r.id === lobe.id)?.frame ?? lobe.frame) : lobe.frame;
  const m = marginOf(lobe);
  const ex = lobe.hw + m, ez = lobe.hl + m;
  const e = 0.003;
  const xs = linesOf(ex, ramp ? [lobe.hw - e, lobe.hw + e, -lobe.hw + e, -lobe.hw - e, lobe.hw - CLIFF.feather, -lobe.hw + CLIFF.feather] : []);
  const zs = linesOf(ez, ramp ? [lobe.hl, -lobe.hl] : []);
  const owners = field.lobes.filter((o) => o !== lobe && (o.type === "ramp" ? !ramp || o.order > lobe.order : !ramp && o.order > lobe.order));
  // every grid point: its bearing, its ground, its rise, and whether another piece owns it
  const pts = [];
  for (const z of zs)
    for (const x of xs) {
      const dir = fromLocal(frame, x, z);
      const { h, deck } = previewRise(field, dir);
      const owned = owners.some((o) => within(o, dir, marginOf(o)));
      pts.push({ dir, pos: dir.clone().multiplyScalar(surface.baseAt(dir) + h), rise: h, deck, owned });
    }
  const nx = xs.length - 1, nz = zs.length - 1;
  const pos = [], col = [];
  const n = new THREE.Vector3(), e1 = new THREE.Vector3(), e2 = new THREE.Vector3(), c = new THREE.Vector3();
  const tri = (a, b, d) => {
    if (a.rise < 0.02 && b.rise < 0.02 && d.rise < 0.02) return; // flat ground: the ball shows it
    if (a.owned && b.owned && d.owned) return; // another piece's
    e1.subVectors(b.pos, a.pos);
    e2.subVectors(d.pos, a.pos);
    n.crossVectors(e1, e2).normalize();
    c.copy(a.dir).add(b.dir).add(d.dir).normalize();
    const up = n.dot(c);
    const steep = up < 0.8; // a face leaning more than ~35° off level is a side
    const color = steep ? COLORS.wall : a.deck && b.deck && d.deck ? COLORS.deck : top;
    for (const v of up >= 0 ? [a, b, d] : [a, d, b]) {
      pos.push(v.pos.x, v.pos.y, v.pos.z);
      col.push(color.r, color.g, color.b);
    }
  };
  for (let j = 0; j < nz; j++)
    for (let i = 0; i < nx; i++) {
      const a = pts[j * (nx + 1) + i], b = pts[j * (nx + 1) + i + 1], cc = pts[(j + 1) * (nx + 1) + i], d = pts[(j + 1) * (nx + 1) + i + 1];
      tri(a, cc, b);
      tri(b, cc, d);
    }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute("color", new THREE.Float32BufferAttribute(col, 3));
  g.computeVertexNormals();
  return g;
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
  const groundColor = useMap((s) => s.map.look.ground);
  const field = surface.field;
  const lobe = field.lobes.find((l) => l.id === p.id);
  // the group that undoes the placement's frame, so children are in world terms
  const inverse = useMemo(() => {
    const { position, quaternion } = surface.standAt(p.dir, p.lift, p.yaw);
    return new THREE.Matrix4().compose(position, quaternion, new THREE.Vector3(1, 1, 1)).invert();
  }, [surface, p.dir, p.lift, p.yaw]);
  // Built a beat after the last change, not on every pointer move.
  const [built, setBuilt] = useState(null);
  useEffect(() => {
    if (!lobe) return;
    const t = setTimeout(() => {
      const top = new THREE.Color(groundColor).offsetHSL(0, 0, 0.03);
      const geometry = build(lobe, field, surface, top);
      const outline = drape({ ...lobe, r: lobe.r ?? 0 }, surface, 0.1).outline;
      setBuilt({ geometry, outline, order: lobe.order });
    }, 40);
    return () => clearTimeout(t);
  }, [surface, p.id, p.yaw, groundColor]);
  useEffect(
    () => () => {
      built?.geometry.dispose();
      built?.outline.dispose();
    },
    [built],
  );
  // the mesh is a riser: the pointer hits it
  const [mesh, setMesh] = useState(null);
  useEffect(() => {
    if (!mesh) return;
    RISERS.add(mesh);
    return () => RISERS.delete(mesh);
  }, [mesh]);
  if (!lobe || !built) return null;
  // a ramp lying level makes no ground: only its outline shows, so it can be found and moved
  const level = type === "ramp" && field.level.some((r) => r.id === p.id);
  return (
    <group matrixAutoUpdate={false} matrix={inverse}>
      <mesh ref={setMesh} geometry={built.geometry} material={materialFor(built.order)} userData={{ editorOnly: true, shadowed: true }} castShadow receiveShadow />
      {(selected || level) && (
        <lineLoop geometry={built.outline} userData={{ editorOnly: true }} renderOrder={6}>
          <lineBasicMaterial color={selected ? "#6B86A8" : TERRAIN.ramp.tint} depthTest={false} transparent opacity={selected ? 0.95 : 0.8} />
        </lineLoop>
      )}
    </group>
  );
}

// What a ramp came out as, for the inspector: its two heights and its grade.
export function rampInfo(field, id) {
  if (!field) return null;
  if (field.level.some((r) => r.id === id)) return { flat: true };
  const r = field.ramps.find((r) => r.id === id);
  if (!r) return null;
  return { flat: false, h0: r.h0, h1: r.h1, L: r.L, slope: r.slope, steep: r.slope > CLIFF.climb * 0.8 };
}
