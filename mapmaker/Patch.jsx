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
import React, { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { useMap } from "./store.js";
import { ENTRY } from "./catalog.js";
import { COVER, PATCH, DASH, BASIN, BASIN_LINE, isWater, coverLobes, coverField, sampleCover, roundedRect, fromLocal, lobeDistance, mulberry32, springRocks, clearingsOf } from "../runtime/cover.js";
import { primitiveGeometry } from "../src/nouns/primitive/geometry.js";
import { SPRING } from "../src/nouns/water/objects.js";
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
function plant(lobe, lobes, field, surface, clearings = []) {
  const K = kindOf(lobe.type);
  if (!K) return [];
  const spots = [];
  // (nothing on the sand round the water, as the game keeps its things off it: BASIN.out and a little past a water patch's edge)
  const sandy = (p) => !!surface.basin && !surface.basin.empty && surface.basin.field(p) < BASIN.out + 1;
  sampleCover(lobes, { only: lobe.type, field, clearings, visit: (p, l, rand) => l === lobe && !sandy(p) && spots.push({ dir: p.clone(), u: [rand(), rand(), rand(), rand(), rand()] }) });
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

// The rocks round a hot spring, as instanced meshes in world terms: the
// storybook's clay lumps (nouns/water/Rocks.jsx), stood where cover.js's
// springRocks puts them — the game stands its own there.
let ROCKS = null;
function rockKinds() {
  if (ROCKS) return ROCKS;
  const K = SPRING.rocks;
  ROCKS = {
    bodies: Array.from({ length: BASIN.spring.rocks.variants }, (_, v) => primitiveGeometry("sphere", 1, undefined, K.detail, undefined, undefined, K.clay ? { ...K.clay, seed: K.clay.seed + v } : null)),
    material: new THREE.MeshToonMaterial({ color: 0xffffff }),
  };
  return ROCKS;
}
function rocksOf(lobe, surface) {
  const K = rockKinds();
  const rocks = springRocks(lobe, (d) => surface.radiusAt(d));
  if (!rocks.length) return [];
  const n = K.bodies.length;
  const meshes = K.bodies.map((g) => new THREE.InstancedMesh(g, K.material, rocks.length));
  const counts = new Array(n).fill(0);
  const one = new THREE.Object3D();
  const tint = new THREE.Color();
  for (const r of rocks) {
    one.position.copy(r.dir).multiplyScalar(r.ground + r.lift);
    one.quaternion.copy(surface.standAt(r.dir.toArray(), 0, r.spin).quaternion);
    one.scale.fromArray(r.scale);
    one.updateMatrix();
    const m = meshes[r.variant];
    m.setMatrixAt(counts[r.variant], one.matrix);
    m.setColorAt(counts[r.variant], tint.set(r.color));
    counts[r.variant]++;
  }
  meshes.forEach((m, v) => {
    m.count = counts[v];
    m.instanceMatrix.needsUpdate = true;
    if (m.instanceColor) m.instanceColor.needsUpdate = true;
    m.castShadow = m.receiveShadow = true;
    m.name = `rocks:${lobe.id}:${v}`;
  });
  return meshes;
}

// The FOAM on the water, as the car game draws it (planet.js's foam
// shader): a sheet just over the water with patches of white cut out of
// it by noise, thick along the waterline — gathered over `bank` in from it
// — and sparse in the open (`cover`), each patch `scale` across, with a
// solid `line` right along the waterline. The game's drifts; here it
// stands still (its drift is a constant), so the stage costs nothing to
// leave open. A spring's is the storybook's scum: cream, thin, along the
// rocks (nouns/water SPRING's foam). The lobes handed in are the water
// patches near this one, so the foam gathers along the JOINED waterline
// where two run together.
const FOAM = { color: BASIN.colors.foam, bank: 2, cover: 0.1, scale: 4, line: 1.4, edge: 1, alpha: 0.85, lift: 0.06 };
const SCUM = { color: "#F1E9D2", bank: 0.9, cover: 0.06, scale: 0.9, line: 0.6, edge: 1, alpha: 0.7, lift: 0.06 };
const NOWHERE = { frame: { d: new THREE.Vector3(0, 1, 0), X: new THREE.Vector3(1, 0, 0), Z: new THREE.Vector3(0, 0, 1), R: 36 }, hw: -1e6, hl: -1e6, r: 0 };
function foamMaterial(lobes, F, islands = []) {
  const ponds = lobes.length ? lobes : [NOWHERE];
  const isles = islands.length ? islands : [NOWHERE];
  return new THREE.ShaderMaterial({
    uniforms: {
      uLobes: { value: ponds.map((l) => l.frame.d) },
      uAxisX: { value: ponds.map((l) => l.frame.X) },
      uAxisZ: { value: ponds.map((l) => l.frame.Z) },
      uSize: { value: ponds.map((l) => new THREE.Vector3(l.hw, l.hl, Math.min(l.r, l.hw, l.hl))) },
      uIsles: { value: isles.map((l) => l.frame.d) },
      uIsleX: { value: isles.map((l) => l.frame.X) },
      uIsleZ: { value: isles.map((l) => l.frame.Z) },
      uIsleSize: { value: isles.map((l) => new THREE.Vector3(l.hw, l.hl, Math.min(l.r, l.hw, l.hl))) },
      uBlend: { value: BASIN.blend },
      uLine: { value: BASIN_LINE },
      uR: { value: ponds[0].frame.R },
      uColor: { value: new THREE.Color(F.color) },
      uAlpha: { value: F.alpha },
      uBank: { value: F.bank },
      uCover: { value: F.cover },
      uScale: { value: F.scale },
      uLineW: { value: F.line },
      uEdge: { value: F.edge },
      uDrift: { value: new THREE.Vector3(0.37, 0.11, 0.23) }, // where the game's drift happens to be: still, here
    },
    vertexShader: /* glsl */ `
      varying vec3 vDir;
      void main() {
        vDir = normalize(position);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }`,
    fragmentShader: /* glsl */ `
      #define MAXI ${ponds.length}
      #define MAXJ ${isles.length}
      uniform vec3 uLobes[MAXI];
      uniform vec3 uAxisX[MAXI];
      uniform vec3 uAxisZ[MAXI];
      uniform vec3 uSize[MAXI];
      uniform vec3 uIsles[MAXJ];
      uniform vec3 uIsleX[MAXJ];
      uniform vec3 uIsleZ[MAXJ];
      uniform vec3 uIsleSize[MAXJ];
      uniform float uBlend, uLine, uR, uAlpha, uBank, uCover, uScale, uLineW, uEdge;
      uniform vec3 uColor, uDrift;
      varying vec3 vDir;
      float rect(vec3 d, vec3 X, vec3 Z, vec3 size, vec3 n) {
        float c = clamp(dot(n, d), -1.0, 1.0);
        float th = acos(c);
        float sn = sin(th);
        vec3 t = n - d * c;
        float s = sn < 1e-6 ? 0.0 : th * uR / sn;
        vec2 q = abs(vec2(s * dot(t, X), s * dot(t, Z))) - size.xy + size.z;
        return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - size.z;
      }
      float pond(int i, vec3 n) { return rect(uLobes[i], uAxisX[i], uAxisZ[i], uSize[i], n); }
      // how far into the water from the nearest shore: the ponds' joined edge, or an island's
      float shoreAway(vec3 n) {
        float m = 1e9;
        for (int i = 0; i < MAXI; i++) m = min(m, pond(i, n));
        float sum = 0.0;
        for (int i = 0; i < MAXI; i++) sum += exp(-(pond(i, n) - m) / uBlend);
        float away = -(m - uBlend * log(sum)); // (from the patch's edge, as the game's is: uLine is for a reader, not the shader)
        for (int j = 0; j < MAXJ; j++) away = min(away, rect(uIsles[j], uIsleX[j], uIsleZ[j], uIsleSize[j], n));
        return away;
      }
      float cut(float at, float x) { float w = fwidth(x); return smoothstep(at - w, at + w, x); }
      float hash(vec3 p) { return fract(sin(dot(p, vec3(127.1, 311.7, 74.7))) * 43758.5453); }
      float noise(vec3 p) {
        vec3 i = floor(p), f = fract(p);
        f = f * f * (3.0 - 2.0 * f);
        return mix(
          mix(mix(hash(i), hash(i + vec3(1, 0, 0)), f.x), mix(hash(i + vec3(0, 1, 0)), hash(i + vec3(1, 1, 0)), f.x), f.y),
          mix(mix(hash(i + vec3(0, 0, 1)), hash(i + vec3(1, 0, 1)), f.x), mix(hash(i + vec3(0, 1, 1)), hash(i + vec3(1, 1, 1)), f.x), f.y),
          f.z);
      }
      void main() {
        vec3 n = normalize(vDir);
        float away = shoreAway(n);
        if (away < -1.0) discard;
        vec3 p = n * uR / uScale;
        float k = 0.65 * noise(p + uDrift) + 0.35 * noise(p * 2.3 - uDrift * 0.7 + 17.0);
        float bank = 1.0 - smoothstep(0.0, uBank, away);
        float open = 1.0 - 0.55 * uCover;
        float lace = cut(mix(open, 0.42, bank), k);
        float line = uEdge * (1.0 - cut(uLineW * (0.8 + 0.4 * noise(p * 3.0 + uDrift)), away));
        float foam = max(lace, line);
        if (foam <= 0.0) discard;
        gl_FragColor = vec4(uColor, uAlpha * foam);
        #include <colorspace_fragment>
      }`,
    transparent: true,
    depthWrite: false,
  });
}

// The STEAM off a hot spring: the storybook's (nouns/water/Steam.jsx) —
// one Points mesh, a puff for every so much of the water, each climbing
// off its own spot on the water, swelling and thinning, born again at
// the bottom on its own loop. All of it runs in the vertex shader off one
// clock (LivePatch ticks it), nothing touched from here after the puffs
// are strewn.
const STEAM_VERT = /* glsl */ `
  attribute vec3 aUp;
  attribute float aPhase;
  attribute float aLife;
  attribute float aSize;
  attribute float aSeed;
  uniform float time, rise, sway, born, pixelScale;
  varying float vFade;
  void main() {
    float age = fract(time / aLife + aPhase);
    vec3 across = normalize(cross(aUp, abs(aUp.y) < 0.9 ? vec3(0.0, 1.0, 0.0) : vec3(1.0, 0.0, 0.0)));
    vec3 along = cross(aUp, across);
    float wobble = age * 6.2831853;
    vec3 drift = across * sin(wobble * 0.7 + aSeed * 40.0) + along * cos(wobble * 0.5 + aSeed * 23.0);
    float climb = age * (2.0 - age);
    vec3 p = position + aUp * (rise * climb) + drift * (sway * age);
    vFade = smoothstep(0.0, 0.15, age) * pow(1.0 - age, 1.6);
    float size = aSize * mix(born, 1.0, age);
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_PointSize = size * pixelScale / max(1.0, -mv.z);
    gl_Position = projectionMatrix * mv;
  }`;
const STEAM_FRAG = /* glsl */ `
  uniform vec3 color;
  uniform float alpha;
  varying float vFade;
  void main() {
    float d = length(gl_PointCoord - 0.5) * 2.0;
    if (d > 1.0) discard;
    float k = pow(1.0 - d * d, 2.0) * vFade * alpha;
    gl_FragColor = vec4(color, k);
    #include <colorspace_fragment>
  }`;
function steamOf(lobe, waterR) {
  const S = SPRING.steam;
  const rand = mulberry32(7);
  const px = lobe.hw, pz = lobe.hl;
  const want = Math.ceil(S.density * 4 * px * pz);
  const position = [], up = [], phase = [], life = [], size = [], seed = [];
  const dir = new THREE.Vector3();
  for (let i = 0; i < want; i++) {
    const x = (rand() * 2 - 1) * px, z = (rand() * 2 - 1) * pz;
    if (roundedRect(x, z, lobe.hw, lobe.hl, lobe.r) > BASIN_LINE - 0.3) continue; // on the water, in from the waterline
    fromLocal(lobe.frame, x, z, dir);
    up.push(dir.x, dir.y, dir.z);
    position.push(dir.x * (waterR + S.lift), dir.y * (waterR + S.lift), dir.z * (waterR + S.lift));
    phase.push(rand());
    life.push(between(S.life, rand()));
    size.push(between(S.size, rand()));
    seed.push(rand());
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(position, 3));
  g.setAttribute("aUp", new THREE.Float32BufferAttribute(up, 3));
  g.setAttribute("aPhase", new THREE.Float32BufferAttribute(phase, 1));
  g.setAttribute("aLife", new THREE.Float32BufferAttribute(life, 1));
  g.setAttribute("aSize", new THREE.Float32BufferAttribute(size, 1));
  g.setAttribute("aSeed", new THREE.Float32BufferAttribute(seed, 1));
  const material = new THREE.ShaderMaterial({
    uniforms: { color: { value: new THREE.Color(hexOf(S.color)) }, alpha: { value: S.alpha }, rise: { value: S.rise }, sway: { value: S.sway }, born: { value: S.born }, pixelScale: { value: 900 }, time: { value: 0 } },
    vertexShader: STEAM_VERT,
    fragmentShader: STEAM_FRAG,
    transparent: true,
    depthWrite: false,
  });
  const points = new THREE.Points(g, material);
  points.frustumCulled = false;
  points.renderOrder = 5;
  points.raycast = () => {};
  points.userData.editorOnly = true;
  return points;
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
  [0, lobe.hl * 0.9, -lobe.hl * 0.9].some((z) => field.distance("water", fromLocal(lobe.frame, 0, z)) < BASIN.out);

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
  // on the ground — or, over a basin, on the deck of the bridge the game builds there (surface.deckAt)
  const groundAt = (d) => surface.deckAt(d);
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
      p.multiplyScalar(groundAt(p) + lift);
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
      // (a bridge wherever the basin is dug under the road: BASIN.out past the water's edge, as the game's onDeck has it)
      const water = field.byType.has("water") ? lobe.samples.map((s) => field.distance("water", s.dir) < BASIN.out) : null;
      const lift = DASH.lift + lobe.order * 0.004; // the later-laid road lies a hair higher where two cross
      const ribbon = ribbonOf(lobe.samples, lobe.closed, lobe.width / 2, surface, lift, () => true, water ? (i) => (water[i] ? timber : tarmac) : null);
      const dashes = ribbonOf(lobe.samples, lobe.closed, DASH.width / 2, surface, lift + 0.02, (i) => i % (DASH.on + DASH.off) < DASH.on);
      const deckAt = (d) => surface.deckAt(d); // the bridge's deck over a basin
      const handles = lobe.knots.map((k) => k.clone().multiplyScalar(deckAt(k) + 0.35));
      // the fence the road's knob names, either side, just past its tarmac (none over water)
      const kind = lobe.args?.fence ?? "none";
      const fences = [];
      // no fence where another road crosses: within its tarmac and its verge —
      // the road's own farther stretches too, where it loops back over itself or ends on itself (onRoad)
      const R = surface.radius;
      const arcs = roadArcs(lobe.samples, lobe.closed, R);
      const reachOf = (o) => o.width / 2 + 0.6; // just past where its own fence stands, so the two fences meet there
      const onCrossing = (i, dir) => crossing.some((o) => onRoad(o.samples, dir, reachOf(o), R, null, o.closed)) || onRoad(lobe.samples, dir, reachOf(lobe), R, { arcs, i, closed: lobe.closed });
      // …and wherever its fence lines cross another road's, or its own (fenceGaps), the stretch between that road's sides
      const gaps = fenceGaps([lobe, ...crossing].map((l) => ({ samples: l.samples, closed: l.closed, out: l.width / 2 + 0.5, width: l.width })), R)[0];
      if (kind !== "none") {
        const out = lobe.width / 2 + 0.5;
        for (const sign of [-1, 1]) {
          const stands = fenceStands(lobe.samples, lobe.closed, sign, out, deckAt, (i, d, fi = i) => !!water?.[i] || onCrossing(i, d) || inGap(gaps[sign], fi), surface.radius);
          fences.push(...buildFence(kind, stands, lobe.closed));
        }
      }
      // …and the bridge fence, on the stretches over water, whatever the road's own fence is (the two meet at a post at the water's edge)
      const bridge = lobe.args?.bridgeFence ?? "wooden";
      if (bridge !== "none" && water) {
        const out = lobe.width / 2 + 0.5;
        for (const sign of [-1, 1]) {
          const stands = fenceStands(lobe.samples, lobe.closed, sign, out, deckAt, (i, d, fi = i) => !water[i] || onCrossing(i, d) || inGap(gaps[sign], fi), surface.radius);
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
  // the placed things' CLEARINGS that can reach this patch (cover.js clearingsOf): a house moved replants the grass round it
  const clearings = useMemo(() => (lobe ? clearingsOf(placements, surface.radius).filter((c) => c.dir.angleTo(lobe.frame.d) * surface.radius < reachOf(lobe) + c.radius) : []), [placements, lobe, surface.radius]);
  const nearKey = near.map(lobeKey).join(";") + "|" + clearings.map((c) => `${c.id}:${c.dir.x.toFixed(4)},${c.dir.y.toFixed(4)},${c.dir.z.toFixed(4)}:${c.radius}`).join(";");
  // …and the GROUND it stands on: the pieces of terrain (cliffs, cuts, ramps)
  // that can reach it, and the basins. A cliff sculpted on the far side of
  // the ball leaves it be; one beside it replants it.
  const groundKey = useMemo(() => {
    if (!lobe) return "";
    const R = surface.radius;
    const reach = reachOf(lobe) + 8;
    return surface.field.lobes
      .filter((l) => l.frame.d.angleTo(lobe.frame.d) * R < reach + Math.hypot(l.hw, l.hl) + (l.k ?? 0) + (l.wobble ?? 0))
      .map((l) => `${l.id}:${l.type}:${l.order}:${l.frame.d.x.toFixed(4)},${l.frame.d.y.toFixed(4)},${l.frame.d.z.toFixed(4)}:${l.frame.X.x.toFixed(3)},${l.frame.X.z.toFixed(3)}:${l.hw}:${l.hl}:${l.r}:${l.k}:${l.h}:${l.wobble}:${l.tier}`)
      .join(";");
  }, [surface.field, surface.radius, lobe]);
  const latest = useRef(surface);
  latest.current = surface;
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
      const surface = latest.current; // the ground as it is now
      const field = coverField(near);
      const me = near.find((l) => l.id === lobe.id);
      const meshes = plant(me, near, field, surface, clearings);
      // WATER lies in its basin: the game digs one under every pond (cover.js's
      // BASIN) and the surface sinks the ball the same. The
      // sheet is then a SHEET at the water's level, out past the edge (the
      // ground hides it beyond the waterline); a pond the ground is not dug
      // for is the flat plate, as it was. A spring has its rocks round it.
      let sheet = null, foam = null, steam = null;
      if (isWater(type)) {
        const level = surface.basin?.lobes.find((l) => l.id === me.id)?.level ?? 0;
        const dug = surface.dug;
        if (dug) {
          const o = BASIN.out;
          const waterR = surface.radius + level - BASIN.water;
          const wide = { ...me, hw: me.hw + o, hl: me.hl + o, r: me.r + o };
          sheet = drape(wide, { radiusAt: () => waterR }, 0.02, 24).plate;
          // the foam, over the sheet, gathered along the waterline the near water patches make together
          const F = type === "spring" ? SCUM : FOAM;
          // (an island cuts the ponds and oceans laid before it, never a spring)
          const isles = type === "spring" ? [] : near.filter((l) => l.type === "island" && l.order > me.order);
          foam = { geometry: drape(wide, { radiusAt: () => waterR }, F.lift, 24).plate, material: foamMaterial(near.filter((l) => l.type === "water"), F, isles) };
          if (type === "spring") {
            meshes.push(...rocksOf(me, surface));
            steam = steamOf(me, waterR + 0.02);
          }
        }
      }
      for (const m of meshes) m.raycast = () => {}; // the plate takes the clicks, not thousands of tufts
      const shapes = drape(me, surface, 0.06);
      setBuilt({ meshes, shapes, sheet, foam, steam, bridge: me.type === "road" && overWater(me, field) });
    }, 40);
    return () => clearTimeout(t);
  }, [nearKey, groundKey, surface.basin, surface.radius]);
  useEffect(
    () => () => {
      built?.meshes.forEach((m) => m.dispose());
      built?.shapes.plate.dispose();
      built?.shapes.outline.dispose();
      built?.sheet?.dispose();
      built?.foam?.geometry.dispose();
      built?.steam?.geometry.dispose();
      // the shader materials a beat later, once the new ones have drawn: a
      // material let go before its successor's first frame takes its compiled
      // program with it, and the successor compiles it all over again — a
      // hitch on every change to the ground (every stamp of a sculpt stroke)
      const late = [built?.foam?.material, built?.steam?.material].filter(Boolean);
      if (late.length) setTimeout(() => late.forEach((m) => m.dispose()), 600);
    },
    [built],
  );
  // the steam's clock: the only thing on the stage that moves
  useFrame((_, dt) => {
    if (built?.steam) built.steam.material.uniforms.time.value += dt;
  });
  if (!lobe || !built) return null;
  // a road's plate is the road: solid tarmac, as the game paints it — or,
  // over water, the BRIDGE's timber deck, which the game builds there;
  // water's is the water, see-through; the rest are faint
  const road = type === "road";
  const water = isWater(type);
  const spring = type === "spring";
  const bare = type === "bare" || type === "island";
  const opacity = road ? 1 : water ? 0.72 : selected ? 0.28 : bare ? 0.16 : 0;
  const color = road && built.bridge ? BRIDGE : tint;
  return (
    <group matrixAutoUpdate={false} matrix={inverse}>
      {built.sheet ? (
        // the water's sheet in its basin, as the game draws it: matte, a little see-through — milky for a spring
        <mesh geometry={built.sheet} userData={{ editorOnly: true, shadowed: true }} renderOrder={3} receiveShadow>
          <meshToonMaterial color={spring ? BASIN.spring.color : BASIN.colors.water} transparent opacity={spring ? BASIN.spring.alpha : 0.7} depthWrite={false} side={THREE.DoubleSide} />
        </mesh>
      ) : (
        <mesh geometry={built.shapes.plate} userData={{ editorOnly: true, shadowed: true }} renderOrder={water ? 1 : 2} receiveShadow={road}>
          {road ? (
            <meshToonMaterial color={color} polygonOffset polygonOffsetFactor={-3} polygonOffsetUnits={-3} />
          ) : (
            <meshBasicMaterial color={tint} transparent opacity={opacity} depthWrite={false} side={THREE.DoubleSide} polygonOffset polygonOffsetFactor={-2} />
          )}
        </mesh>
      )}
      {built.foam && <mesh geometry={built.foam.geometry} material={built.foam.material} userData={{ editorOnly: true, shadowed: true }} renderOrder={4} raycast={() => {}} />}
      {built.steam && <primitive object={built.steam} />}
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
