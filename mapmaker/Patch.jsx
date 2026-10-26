// A GROUNDCOVER PATCH on the stage: the things it plants (grass tufts,
// daisies, pebbles — none for bare ground or road), dealt by ../runtime/cover.js
// over the field every patch on the map makes together, so a patch shows
// what the game will plant; under them a PLATE, its own rounded rectangle
// draped on the ground, faint (or clear) but there to click — a road's is
// solid, in tarmac, since that is what the road is — and when the patch is
// picked an outline round it. The plate and outline are the
// editor's (`userData.editorOnly`), left out of the saved file.
//
// Drawn inside the placement's group (Scene.jsx), which is stood at the
// patch's middle; the things stand each on its own ground, so they are
// placed in world terms under a group that undoes the placement's frame.
import React, { useEffect, useMemo, useState } from "react";
import * as THREE from "three";
import { useMap } from "./store.js";
import { ENTRY } from "./catalog.js";
import { COVER, PATCH, DASH, isWater, coverLobes, coverField, sampleCover, roundedRect, fromLocal } from "../runtime/cover.js";
import { buildFence, fenceStands, fenceGaps, inGap, onRoad, roadArcs } from "../runtime/fence.js";
import { strandGeometry } from "../src/cutout.js";
import { clayStrand } from "../src/nouns/grass/clay.js";
import { GRASS } from "../src/nouns/grass/objects.js";
import { GRASS_PALETTES } from "../src/nouns/grass/palettes.js";
import { PEBBLE } from "../src/nouns/pebble/objects.js";
import { pebbleGeometry } from "../src/nouns/pebble/geometry.js";
import { FLOWER } from "../src/nouns/flower/objects.js";
import { flowerHead } from "../src/nouns/flower/Flower.jsx";
import { FLOWER_PALETTES } from "../src/nouns/flower/palettes.js";

const hexOf = (s) => (typeof s === "string" ? s : s.hex);
const between = ([a, b], r) => a + (b - a) * r;
const rad = (d) => (d * Math.PI) / 180;

// What each type plants: its bodies (variants, one instanced mesh each),
// their material, the swatches they are tinted from, and how each is stood
// — its size roll, its lean, how far it sinks, how high it is lifted, and
// a stalk under it if it is lifted.
const KINDS = {};
function kindOf(type) {
  if (KINDS[type]) return KINDS[type];
  let K = null;
  if (type === "grass") {
    const bodies = [];
    const roll = (f, u) => between(GRASS.hand[f], u);
    for (let v = 0; v < 4; v++) {
      const u = (v + 0.5) / 4;
      const G = { ...GRASS, height: roll("height", 1 - u), baseRadius: roll("baseRadius", u), taper: roll("taper", 1 - u), bend: roll("bend", u), stiff: roll("stiff", 1 - u) };
      const strand = strandGeometry({ length: G.height, radius: G.baseRadius, taper: G.taper, cap: G.cap, bend: G.bend, stiff: G.stiff, shaft: G.shaft, dome: G.dome, radial: G.radial, shade: G.shade, soft: G.soft, tip: G.tip, tipFrom: G.tipFrom });
      bodies.push(clayStrand(strand, G.height, { ...G.clay, seed: v }));
    }
    K = { bodies, material: new THREE.MeshToonMaterial({ color: 0xffffff, vertexColors: true }), swatches: GRASS_PALETTES.lush, size: [0.5, 1.5], lean: 20, sink: [0.05, 0.2], lift: 0 };
  } else if (type === "pebbles") {
    K = { bodies: [pebbleGeometry(PEBBLE)], material: new THREE.MeshToonMaterial({ color: 0xffffff }), swatches: PEBBLE.blocks, size: [0.7, 1.4], lean: 25, sink: [0.03, 0.08], lift: 0 };
  } else if (type === "flowers") {
    const { petals } = flowerHead("daisy", FLOWER.radius);
    K = {
      bodies: [petals],
      material: new THREE.MeshToonMaterial({ color: 0xffffff, side: THREE.DoubleSide }),
      swatches: FLOWER_PALETTES.pastel,
      size: [0.8, 1.3],
      lean: 15,
      sink: [0, 0],
      lift: 0.55,
      stalk: { geometry: new THREE.CylinderGeometry(0.018, 0.03, 1, 5).translate(0, 0.5, 0), material: new THREE.MeshToonMaterial({ color: hexOf(GRASS.color) }) },
    };
  }
  KINDS[type] = K;
  return K;
}

// The things of one lobe, as instanced meshes in world terms.
function plant(lobe, lobes, field, surface) {
  const K = kindOf(lobe.type);
  if (!K) return [];
  const spots = [];
  sampleCover(lobes, { only: lobe.type, field, visit: (p, l, rand) => l === lobe && spots.push({ dir: p.clone(), u: [rand(), rand(), rand(), rand(), rand()] }) });
  if (!spots.length) return [];
  const n = K.bodies.length;
  const meshes = K.bodies.map((g) => new THREE.InstancedMesh(g, K.material, Math.ceil(spots.length / n) + 1));
  const stalks = K.stalk ? new THREE.InstancedMesh(K.stalk.geometry, K.stalk.material, spots.length) : null;
  const counts = new Array(n).fill(0);
  const one = new THREE.Object3D();
  const tint = new THREE.Color();
  spots.forEach((s, i) => {
    const [ua, ub, uc, ud, ue] = s.u;
    const size = between(K.size, ua) * lobe.size;
    const ground = surface.radiusAt(s.dir);
    const q = surface.standAt(s.dir.toArray(), 0, ub * Math.PI * 2).quaternion;
    one.position.copy(s.dir).multiplyScalar(ground - between(K.sink, uc) * size + K.lift * size);
    one.quaternion.copy(q);
    one.rotateZ(rad(between([-K.lean, K.lean], ud)));
    one.scale.setScalar(size);
    one.updateMatrix();
    const v = i % n;
    meshes[v].setMatrixAt(counts[v], one.matrix);
    tint.set(hexOf(K.swatches[Math.floor(ue * K.swatches.length)])).offsetHSL(0, 0, (ua - 0.5) * 0.06);
    meshes[v].setColorAt(counts[v], tint);
    counts[v]++;
    if (stalks) {
      one.position.copy(s.dir).multiplyScalar(ground - 0.05);
      one.quaternion.copy(q);
      one.scale.set(1, K.lift * size, 1);
      one.updateMatrix();
      stalks.setMatrixAt(i, one.matrix);
    }
  });
  meshes.forEach((m, v) => {
    m.count = counts[v];
    m.instanceMatrix.needsUpdate = true;
    if (m.instanceColor) m.instanceColor.needsUpdate = true;
    m.castShadow = m.receiveShadow = true;
    m.name = `${lobe.type}:${lobe.id}:${v}`;
  });
  if (stalks) {
    stalks.instanceMatrix.needsUpdate = true;
    stalks.name = `stalks:${lobe.id}`;
    meshes.push(stalks);
  }
  return meshes;
}

// The plate: the lobe's own rounded rectangle, draped on the ground — a
// grid over it, every point outside walked in onto the edge — and the
// outline round it.
export function drape(lobe, surface, height, N = 20) {
  const { hw, hl, r, frame } = lobe;
  const at = (x, z) => {
    let d = roundedRect(x, z, hw, hl, r);
    for (let i = 0; i < 2 && d > 0; i++) {
      const e = 1e-3;
      const gx = (roundedRect(x + e, z, hw, hl, r) - roundedRect(x - e, z, hw, hl, r)) / (2 * e);
      const gz = (roundedRect(x, z + e, hw, hl, r) - roundedRect(x, z - e, hw, hl, r)) / (2 * e);
      x -= gx * d;
      z -= gz * d;
      d = roundedRect(x, z, hw, hl, r);
    }
    const dir = fromLocal(frame, x, z);
    return dir.multiplyScalar(surface.radiusAt(dir) + height);
  };
  const pos = [];
  for (let j = 0; j <= N; j++) for (let i = 0; i <= N; i++) pos.push(at(-hw + (2 * hw * i) / N, -hl + (2 * hl * j) / N));
  const idx = [];
  for (let j = 0; j < N; j++)
    for (let i = 0; i < N; i++) {
      const a = j * (N + 1) + i, b = a + 1, c = a + N + 1, d = c + 1;
      idx.push(a, c, b, b, c, d);
    }
  const plate = new THREE.BufferGeometry().setFromPoints(pos);
  plate.setIndex(idx);
  plate.computeVertexNormals();
  // the outline: round the rectangle's edge
  const ring = [];
  const M = 72;
  for (let i = 0; i < M; i++) {
    const a = (i / M) * Math.PI * 2;
    // a point well outside, walked in onto the edge
    ring.push(at(Math.cos(a) * (hw + hl + 2), Math.sin(a) * (hw + hl + 2)));
  }
  const outline = new THREE.BufferGeometry().setFromPoints(ring);
  return { plate, outline };
}

// A road piece is a bridge where it lies over water: its middle or either
// end in the water's own field (uncut: the road itself cuts the water's
// field, as roads cut everything).
const BRIDGE = "#B08A5E";
const overWater = (lobe, field) =>
  [0, lobe.hl * 0.9, -lobe.hl * 0.9].some((z) => field.distance("water", fromLocal(lobe.frame, 0, z)) < 0);

const coverKey = (placements, surface) =>
  surface.radius + "|" + placements.filter((p) => p.entry.startsWith("cover-")).map((p) => `${p.id}:${p.dir.join(",")}:${p.yaw}:${JSON.stringify(p.args)}`).join(";");

export function Patch({ p, surface, ghost = false }) {
  const entry = ENTRY[p.entry];
  const type = entry?.cover ?? "grass";
  const tint = COVER[type]?.tint ?? "#888";
  if (type === "road") return ghost ? <GhostPen p={p} tint={tint} /> : <RoadPatch p={p} surface={surface} tint={tint} />;
  if (ghost) return <GhostPatch p={p} tint={tint} />;
  return <LivePatch p={p} surface={surface} type={type} tint={tint} />;
}

// ---- ROADS: strokes
// The pen's tip, following the pointer while a road is being placed: a
// ring the road's width.
function GhostPen({ p, tint }) {
  const A = { ...COVER.road.path, ...(ENTRY[p.entry]?.args ?? {}), ...p.args };
  const hw = A.width / 2;
  const geometry = useMemo(() => {
    const pts = [];
    for (let i = 0; i < 48; i++) pts.push(new THREE.Vector3(Math.cos((i / 48) * Math.PI * 2) * hw, 0.08, Math.sin((i / 48) * Math.PI * 2) * hw));
    return new THREE.BufferGeometry().setFromPoints(pts);
  }, [hw]);
  useEffect(() => () => geometry.dispose(), [geometry]);
  return (
    <lineLoop geometry={geometry} userData={{ editorOnly: true }} renderOrder={6}>
      <lineBasicMaterial color={tint} depthTest={false} transparent opacity={0.95} />
    </lineLoop>
  );
}

// A ribbon along a stroke's samples, `hw` either side, `lift` over the
// ground: two vertices a sample, a bay between each sample and the next
// that `keep` says to draw (the dashes skip some). `color(i)` per sample.
function ribbonOf(samples, closed, hw, surface, lift, keep = () => true, color = null) {
  const R = surface.radius;
  const pos = [], col = [], idx = [];
  const rows = new Map();
  const p = new THREE.Vector3();
  const N = samples.length;
  // The ball curves across a wide road: with only its two edges set on the ground, the flat between them sinks under it (hw²/2R, more than the lift). So a vertex every unit or so across, each set on the ground.
  const W = Math.max(2, Math.min(11, Math.ceil(hw * 2) + 1));
  const row = (i) => {
    const s = samples[i % N];
    const base = pos.length / 3;
    const c = color ? color(i % N) : null;
    for (let k = 0; k < W; k++) {
      const w = -hw + (2 * hw * k) / (W - 1);
      p.copy(s.dir).multiplyScalar(R).addScaledVector(s.side, w).normalize();
      p.multiplyScalar(surface.radiusAt(p) + lift);
      pos.push(p.x, p.y, p.z);
      if (c) col.push(c.r, c.g, c.b);
    }
    return base;
  };
  const bays = closed ? N : N - 1;
  for (let i = 0; i < bays; i++) {
    if (!keep(i)) continue;
    const a = rows.get(i) ?? row(i);
    rows.set(i, a);
    const b = rows.get(i + 1) ?? row(i + 1);
    rows.set(i + 1, b);
    for (let k = 0; k < W - 1; k++) idx.push(a + k, a + k + 1, b + k, a + k + 1, b + k + 1, b + k);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  if (color) g.setAttribute("color", new THREE.Float32BufferAttribute(col, 3));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}
const roadKey = (p) => `${JSON.stringify(p.knots ?? p.dir)}:${p.yaw}:${!!p.closed}:${JSON.stringify(p.args)}`;

// A ROAD on the stage: its tarmac ribbon along the stroke (timber where it
// lies over water, a bridge the game builds there), the cream dashes down
// its middle as the game draws them, and — picked — a handle at each knot,
// to drag the road's shape by (Scene.jsx). The ribbon takes the clicks.
function RoadPatch({ p, surface, tint }) {
  const placements = useMap((s) => s.map.placements);
  const selected = useMap((s) => s.selected === p.id);
  const knotSel = useMap((s) => (s.selected === p.id ? s.knot : null));
  const lobes = useMemo(() => coverLobes(placements, surface.radius), [placements, surface]);
  const lobe = lobes.find((l) => l.id === p.id);
  // the water patches it may lie over, for the bridge's timber
  const near = useMemo(() => (lobe ? touching(lobe, lobes).filter((l) => l === lobe || l.type === "water") : []), [lobe, lobes]);
  // the other roads that cross it: no fence where they do
  const crossing = useMemo(() => (lobe ? touching(lobe, lobes).filter((l) => l !== lobe && l.type === "road") : []), [lobe, lobes]);
  const nearKey = near.map(lobeKey).join(";") + "|" + roadKey(p) + "|" + crossing.map((l) => `${l.id}:${l.samples.length}:${l.samples[0].dir.x.toFixed(4)},${l.samples[l.samples.length >> 1].dir.y.toFixed(4)}:${l.width}:${l.verge}`).join(";");
  const inverse = useMemo(() => {
    const { position, quaternion } = surface.standAt(p.dir, p.lift, p.yaw);
    return new THREE.Matrix4().compose(position, quaternion, new THREE.Vector3(1, 1, 1)).invert();
  }, [surface, p.dir, p.lift, p.yaw]);
  const [built, setBuilt] = useState(null);
  useEffect(() => {
    if (!lobe) return;
    const t = setTimeout(() => {
      const field = coverField(near);
      const tarmac = new THREE.Color(tint), timber = new THREE.Color(BRIDGE);
      const water = field.byType.has("water") ? lobe.samples.map((s) => field.distance("water", s.dir) < 0) : null;
      const lift = DASH.lift + lobe.order * 0.004; // the later-laid road lies a hair higher where two cross
      const ribbon = ribbonOf(lobe.samples, lobe.closed, lobe.width / 2, surface, lift, () => true, water ? (i) => (water[i] ? timber : tarmac) : null);
      const dashes = ribbonOf(lobe.samples, lobe.closed, DASH.width / 2, surface, lift + 0.02, (i) => i % (DASH.on + DASH.off) < DASH.on);
      const handles = lobe.knots.map((k) => k.clone().multiplyScalar(surface.radiusAt(k) + 0.35));
      // the fence the road's knob names, either side, just past its tarmac (none over water)
      const kind = lobe.args?.fence ?? "none";
      const fences = [];
      // no fence where another road crosses: within its tarmac and its verge —
      // the road's own farther stretches too, where it loops back over itself or ends on itself (onRoad)
      const R = surface.radius;
      const arcs = roadArcs(lobe.samples, lobe.closed, R);
      const reachOf = (o) => o.width / 2 + 0.6; // just past where its own fence stands, so the two fences meet there
      const onCrossing = (i, dir) => crossing.some((o) => onRoad(o.samples, dir, reachOf(o), R)) || onRoad(lobe.samples, dir, reachOf(lobe), R, { arcs, i, closed: lobe.closed });
      // …and wherever its fence lines cross another road's, or its own (fenceGaps), the stretch between that road's sides
      const gaps = fenceGaps([lobe, ...crossing].map((l) => ({ samples: l.samples, closed: l.closed, out: l.width / 2 + 0.5, width: l.width })), R)[0];
      if (kind !== "none") {
        const out = lobe.width / 2 + 0.5;
        for (const sign of [-1, 1]) {
          const stands = fenceStands(lobe.samples, lobe.closed, sign, out, (d) => surface.radiusAt(d), (i, d, fi = i) => !!water?.[i] || onCrossing(i, d) || inGap(gaps[sign], fi), surface.radius);
          fences.push(...buildFence(kind, stands, lobe.closed));
        }
      }
      // …and the bridge fence, on the stretches over water, whatever the road's own fence is (the two meet at a post at the water's edge)
      const bridge = lobe.args?.bridgeFence ?? "wooden";
      if (bridge !== "none" && water) {
        const out = lobe.width / 2 + 0.5;
        for (const sign of [-1, 1]) {
          const stands = fenceStands(lobe.samples, lobe.closed, sign, out, (d) => surface.radiusAt(d), (i, d, fi = i) => !water[i] || onCrossing(i, d) || inGap(gaps[sign], fi), surface.radius);
          fences.push(...buildFence(bridge, stands, lobe.closed));
        }
      }
      setBuilt({ ribbon, dashes, handles, fences, colored: !!water });
    }, 40);
    return () => clearTimeout(t);
  }, [nearKey, surface]);
  useEffect(
    () => () => {
      built?.ribbon.dispose();
      built?.dashes.dispose();
      built?.fences?.forEach((f) => f.geometry.dispose());
    },
    [built],
  );
  if (!lobe || !built) return null;
  return (
    <group matrixAutoUpdate={false} matrix={inverse}>
      <mesh geometry={built.ribbon} userData={{ editorOnly: true, shadowed: true }} renderOrder={2} receiveShadow>
        <meshToonMaterial color={built.colored ? 0xffffff : tint} vertexColors={built.colored} polygonOffset polygonOffsetFactor={-3} polygonOffsetUnits={-3} />
      </mesh>
      <mesh geometry={built.dashes} userData={{ editorOnly: true, shadowed: true }} renderOrder={3} raycast={() => {}}>
        <meshToonMaterial color={DASH.color} polygonOffset polygonOffsetFactor={-4} polygonOffsetUnits={-4} />
      </mesh>
      {built.fences.map((f, i) => (
        <mesh key={i} geometry={f.geometry} userData={{ editorOnly: true, shadowed: true }} raycast={() => {}} castShadow receiveShadow renderOrder={f.opacity < 1 ? 4 : undefined}>
          <meshToonMaterial color={f.color} transparent={f.opacity < 1} opacity={f.opacity} depthWrite={f.opacity >= 1} />
        </mesh>
      ))}
      {selected &&
        built.handles.map((h, i) => (
          <mesh key={i} position={h} userData={{ editorOnly: true, knot: i }} renderOrder={7}>
            <sphereGeometry args={[0.38, 12, 8]} />
            <meshBasicMaterial color={knotSel === i ? "#E0893A" : "#6B86A8"} depthTest={false} transparent opacity={0.95} />
          </mesh>
        ))}
    </group>
  );
}

// The ghost, following the pointer while placing: only the stock outline,
// flat in the placement's own frame — nothing is planted and the ground is
// not asked for, so it costs nothing to move.
export function GhostPatch({ p, tint }) {
  const geometry = useMemo(() => {
    const A = { ...PATCH, ...(ENTRY[p.entry]?.args ?? {}), ...p.args }; // (an entry's args carry its own stock shape)
    const hw = A.width / 2, hl = A.length / 2, r = Math.min(A.corner, hw, hl);
    const pts = [];
    for (let i = 0; i < 72; i++) {
      const a = (i / 72) * Math.PI * 2;
      let x = Math.cos(a) * (hw + hl), z = Math.sin(a) * (hw + hl);
      for (let k = 0; k < 3; k++) {
        const d = roundedRect(x, z, hw, hl, r);
        if (d <= 1e-3) break;
        const e = 1e-3;
        x -= ((roundedRect(x + e, z, hw, hl, r) - roundedRect(x - e, z, hw, hl, r)) / (2 * e)) * d;
        z -= ((roundedRect(x, z + e, hw, hl, r) - roundedRect(x, z - e, hw, hl, r)) / (2 * e)) * d;
      }
      pts.push(new THREE.Vector3(x, 0.08, z));
    }
    return new THREE.BufferGeometry().setFromPoints(pts);
  }, [p.entry, p.args]);
  useEffect(() => () => geometry.dispose(), [geometry]);
  return (
    <lineLoop geometry={geometry} userData={{ editorOnly: true }} renderOrder={6}>
      <lineBasicMaterial color={tint} depthTest={false} transparent opacity={0.95} />
    </lineLoop>
  );
}

// Lobes that can touch this one: within reach of each other, blends and all.
const reachOf = (l) => Math.hypot(l.hw, l.hl) + l.k + 0.5;
const touching = (me, lobes) => lobes.filter((l) => l === me || me.frame.d.angleTo(l.frame.d) * me.frame.R < reachOf(me) + reachOf(l));
const lobeKey = (l) => `${l.id}:${l.type}:${l.order}:${l.frame.d.x.toFixed(5)},${l.frame.d.y.toFixed(5)},${l.frame.d.z.toFixed(5)}:${l.frame.X.x.toFixed(4)},${l.frame.X.y.toFixed(4)},${l.frame.X.z.toFixed(4)}:${l.hw}:${l.hl}:${l.r}:${l.k}:${l.density}:${l.size}`;

function LivePatch({ p, surface, type, tint }) {
  const placements = useMap((s) => s.map.placements);
  const selected = useMap((s) => s.selected === p.id);
  // every patch's lobe (cheap), and of those the ones that can touch this one:
  // only a change to one of THOSE replants it, not a patch moving on the far side
  const lobes = useMemo(() => coverLobes(placements, surface.radius), [placements, surface]);
  const lobe = lobes.find((l) => l.id === p.id);
  const near = useMemo(() => (lobe ? touching(lobe, lobes) : []), [lobe, lobes]);
  const nearKey = near.map(lobeKey).join(";");
  // the group that undoes the placement's frame, so children are in world terms
  const inverse = useMemo(() => {
    const { position, quaternion } = surface.standAt(p.dir, p.lift, p.yaw);
    return new THREE.Matrix4().compose(position, quaternion, new THREE.Vector3(1, 1, 1)).invert();
  }, [surface, p.dir, p.lift, p.yaw]);
  // Planted a beat after the last change, not on every pointer move: a drag
  // or a slider replants when it pauses, and the plate follows the same way.
  const [built, setBuilt] = useState(null);
  useEffect(() => {
    if (!lobe) return;
    const t = setTimeout(() => {
      const field = coverField(near);
      const me = near.find((l) => l.id === lobe.id);
      const meshes = plant(me, near, field, surface);
      for (const m of meshes) m.raycast = () => {}; // the plate takes the clicks, not thousands of tufts
      const shapes = drape(me, surface, 0.06);
      setBuilt({ meshes, shapes, bridge: me.type === "road" && overWater(me, field) });
    }, 40);
    return () => clearTimeout(t);
  }, [nearKey, surface]);
  useEffect(
    () => () => {
      built?.meshes.forEach((m) => m.dispose());
      built?.shapes.plate.dispose();
      built?.shapes.outline.dispose();
    },
    [built],
  );
  if (!lobe || !built) return null;
  // a road's plate is the road: solid tarmac, as the game paints it — or,
  // over water, the BRIDGE's timber deck, which the game builds there;
  // water's is the water, see-through; the rest are faint
  const road = type === "road";
  const water = isWater(type);
  const bare = type === "bare";
  const opacity = road ? 1 : water ? 0.72 : selected ? 0.28 : bare ? 0.16 : 0;
  const color = road && built.bridge ? BRIDGE : tint;
  return (
    <group matrixAutoUpdate={false} matrix={inverse}>
      <mesh geometry={built.shapes.plate} userData={{ editorOnly: true, shadowed: true }} renderOrder={water ? 1 : 2} receiveShadow={road}>
        {road ? (
          <meshToonMaterial color={color} polygonOffset polygonOffsetFactor={-3} polygonOffsetUnits={-3} />
        ) : (
          <meshBasicMaterial color={tint} transparent opacity={opacity} depthWrite={false} side={THREE.DoubleSide} polygonOffset polygonOffsetFactor={-2} />
        )}
      </mesh>
      {selected && (
        <lineLoop geometry={built.shapes.outline} userData={{ editorOnly: true }} renderOrder={6}>
          <lineBasicMaterial color="#6B86A8" depthTest={false} transparent opacity={0.95} />
        </lineLoop>
      )}
      {built.meshes.map((m) => (
        <primitive key={m.uuid} object={m} />
      ))}
    </group>
  );
}
