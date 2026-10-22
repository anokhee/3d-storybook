// ALBATROSS: the objects of the albatross game, each stood on the stage.
// That game builds plain three.js geometry (no React), so each helper here
// builds the geometry once and hands it to a mesh. Its source is in
// src/albatross/, as copied from the game, minus the global shader patch.
//
// The game's materials are standard, matte ones (no toon): under the Flat
// look they are lit exactly as in the game; under Toon they are simply
// standard-lit, since the toon swap only touches toon materials.
import { useMemo } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { buildTree, treeMaterial, buildObelisk, buildLanternGlow, TREES, OBELISKS } from "../../src/albatross/scenery.js";
import { buildAlbatross, withVariant, ALBATROSS } from "../../src/albatross/albatross.js";
import { buildHead, breakHead, mulberry32, DEFAULTS, PARAMS, setKnob } from "../../src/albatross/heads.js";
import { variantParams, VARIANTS } from "../../src/albatross/statues.js";
import { buildArm } from "../../src/albatross/hands.js";
import { PALETTE as SEA_PALETTE } from "../../src/albatross/palette.js";
import { makeBeachUniforms, beachShader } from "../../src/albatross/beach.js";

// The stone the statues and markers are cut from, and the dark of the eyes.
const plaster = new THREE.MeshStandardMaterial({ color: 0xa7a59c, roughness: 0.95 });
const dark = new THREE.MeshStandardMaterial({ color: 0x55534d, roughness: 1 });
const lamp = new THREE.MeshBasicMaterial({ color: 0xffc56b }); // a lantern's lit panes

// Stands a geometry on the ground: its lowest point to y = 0.
const grounded = (g) => {
  g.computeBoundingBox();
  g.translate(0, -g.boundingBox.min.y, 0);
  return g;
};

// A tree: kinds cedar, cloud, bottle (TREE_KINDS); `k` picks one of the
// TREES.shapes shapes of that kind.
export function AlbatrossTree({ kind = "cedar", k = 0 }) {
  const geometry = useMemo(() => buildTree(kind, k % TREES.shapes), [kind, k]);
  const material = useMemo(treeMaterial, []);
  return <mesh geometry={geometry} material={material} />;
}

// A stone marker or lamp: kinds in OBELISK_KINDS; `k` its height, 0 the
// shortest to OBELISKS.heights - 1 the tallest. The lamp kinds have panes:
// `lit`, they glow and throw a warm light; unlit, the panes are dark glass.
// The light is the field's (main.field.js LANTERN_GLOW and the look's lamp
// numbers in flatlight.js): a point light of the lamp's power and reach,
// and the pool of warm light on the ground round its foot, a disc added
// over the ground, fading out from the middle (or, as far as `lamp` has
// it, a flat disc), as faint as the look's `pool`.
const pane = new THREE.MeshStandardMaterial({ color: 0x3a3d44, roughness: 0.6 });
const LANTERN = {
  color: 0xffc56b,
  power: 70, // the lamp's intensity, lit (flatlight.js lampPower)
  reach: 45, // world units its light carries (LANTERN_GLOW.lampReach)
  pool: 9, // world units of pool round the foot (LANTERN_GLOW.pool)
  poolStrength: 0.14, // how bright the pool is (flatlight.js pool)
  lamp: 0.28, // 0 a fading pool, 1 a flat disc (flatlight.js lamp)
  soft: 0, // the flat disc's edge, as a share of the pool (flatlight.js soft)
};
// The pool's texture, as the field draws it (flatlight.js poolTexture)
function poolTexture() {
  const c = document.createElement("canvas");
  c.width = c.height = 64;
  const x = c.getContext("2d"), img = x.createImageData(64, 64);
  const soft = (r) => (r < 0.45 ? 1 - (r / 0.45) * 0.65 : Math.max(0, 0.35 * (1 - (r - 0.45) / 0.55)));
  const w = Math.max(LANTERN.soft, 0.01) * 2;
  const flat = (r) => 1 - THREE.MathUtils.smoothstep(r, 0.85 - w, 0.85 + w);
  for (let j = 0; j < 64; j++)
    for (let i = 0; i < 64; i++) {
      const r = Math.hypot(i + 0.5 - 32, j + 0.5 - 32) / 32, o = (j * 64 + i) * 4;
      img.data[o] = img.data[o + 1] = img.data[o + 2] = 255;
      img.data[o + 3] = Math.round(THREE.MathUtils.lerp(soft(r), flat(r), LANTERN.lamp) * 255);
    }
  x.putImageData(img, 0, 0);
  return new THREE.CanvasTexture(c);
}
let poolMat = null;
const poolMaterial = () => (poolMat ??= new THREE.MeshBasicMaterial({ color: LANTERN.color, map: poolTexture(), transparent: true, opacity: LANTERN.poolStrength, depthWrite: false, blending: THREE.AdditiveBlending, fog: false }));
const poolGeometry = new THREE.PlaneGeometry(2, 2).rotateX(-Math.PI / 2);
export function Obelisk({ kind = "needle", k = 3, lit = true }) {
  const h = Math.min(k, OBELISKS.heights - 1);
  const stone = useMemo(() => buildObelisk(kind, h), [kind, h]);
  const glow = useMemo(() => buildLanternGlow(kind, h), [kind, h]);
  const at = useMemo(() => {
    if (!glow) return null;
    glow.computeBoundingBox();
    return glow.boundingBox.getCenter(new THREE.Vector3());
  }, [glow]);
  return (
    <group>
      <mesh geometry={stone} material={plaster} />
      {glow && <mesh geometry={glow} material={lit ? lamp : pane} />}
      {glow && lit && <pointLight position={at} color={LANTERN.color} intensity={LANTERN.power} distance={LANTERN.reach} decay={2} />}
      {glow && lit && <mesh geometry={poolGeometry} material={poolMaterial()} position-y={0.12} scale={LANTERN.pool} renderOrder={1} />}
    </group>
  );
}

// The bird itself, wings spread as built, held `lift` world units up in
// the air with its nose `pitch` degrees above level, gliding (on the
// ground it lay flopped). With `animate` its wings move as the game moves
// them (beat): a slow breathing bow in a glide, a real flap as `climb`
// goes 0 to 1. `variant` is one of the game's
// named looks (VARIANT_NAMES: base, clean, flecked, mottled, dusky,
// inkwing, brown, ...), and the three colors override that look's:
// `white` the feathers, `dark` the ink of the wash and wing tips, `beak`.
export function Bird({ variant = "base", white, dark, beak, lift = 4, pitch = 8, animate = true, climb = 0 }) {
  const { player, beat } = useMemo(() => {
    const A = withVariant(ALBATROSS, variant);
    if (white) A.colour.white = white;
    if (dark) A.colour.dark = dark;
    if (beak) A.colour.beak = beak;
    return buildAlbatross(A);
  }, [variant, white, dark, beak]);
  useFrame((_, dt) => { if (animate) beat(Math.min(dt, 0.05), climb); });
  return (
    <group position-y={lift} rotation-x={-THREE.MathUtils.degToRad(pitch)}>
      <primitive object={player} />
    </group>
  );
}

// A statue's head, stood on the ground: the stone and the dark eyes. In
// the game its neck is bent and stretched by a shader; here it is as built.
// `params` lays out like HEAD_PARAMS (skull, jaw, nose, mouth, eyes, ears,
// neck, each a bag of numbers) over DEFAULTS; `knobs` is the flat form the
// Controls panel uses, { "skull.width": 0.9, ... }, laid over that.
const headParamsOf = (params, knobs) => {
  const P = structuredClone(DEFAULTS);
  for (const [g, bag] of Object.entries(params ?? {})) Object.assign(P[g], bag);
  for (const [key, v] of Object.entries(knobs ?? {})) if (typeof v === "number") setKnob(P, key, v);
  return P;
};
const stood = (built) => {
  built.head.computeBoundingBox();
  const lift = -built.head.boundingBox.min.y;
  built.head.translate(0, lift, 0);
  built.eyes.translate(0, lift, 0);
  return built;
};
export function StatueHead({ params = null, knobs = null, scale = 1 }) {
  const { head, eyes } = useMemo(() => stood(buildHead(headParamsOf(params, knobs))), [params, knobs]);
  return (
    <group scale={scale}>
      <mesh geometry={head} material={plaster} />
      <mesh geometry={eyes} material={dark} />
    </group>
  );
}

// The Controls panel's knobs for a head: every knob in HEAD_PARAMS as a
// slider, keyed "group.name", with its label, range and default.
export const headArgTypes = Object.fromEntries(PARAMS.map((q) => [q.key, { name: q.label, description: q.note || undefined, control: { type: "range", min: q.min, max: q.max, step: (q.max - q.min) / 100 }, table: { category: q.group } }]));
export const headArgs = Object.fromEntries(PARAMS.map((q) => [q.key, q.def]));

// The field's heads, all VARIANTS of them, in a grid: each is the stock head
// with its own draw of the knobs (variantParams), the way the game's head
// grid lab lays them out.
export function HeadGrid({ columns = 6, spacing = 3.2 }) {
  const rows = Math.ceil(VARIANTS / columns);
  return Array.from({ length: VARIANTS }, (_, v) => (
    <group key={v} position={[((v % columns) - (columns - 1) / 2) * spacing, 0, (Math.floor(v / columns) - (rows - 1) / 2) * spacing]}>
      <StatueHead params={v ? variantParams(v) : null} />
    </group>
  ));
}

// A broken head, lying on its largest broken face: one of the field's
// statue heads (`variant` picks which of VARIANTS), broken by `breakHead`
// with a seed. The field tries seeds until a cut is at least `minCut`
// head units² to lie on; so does this.
const MIN_CUT = 0.25;
export function BrokenHead({ variant = 1, seed = 1 }) {
  const { head, eyes } = useMemo(() => {
    const P = variantParams(1 + (variant % (VARIANTS - 1)));
    let built, cut;
    for (let s = seed; ; s++) {
      built = breakHead(buildHead(P, { neck: false }), mulberry32(s));
      cut = built.cuts.reduce((a, b) => (b.area > a.area ? b : a));
      if (cut.area >= MIN_CUT || s > seed + 50) break;
    }
    // Turned so the cut faces down, then stood on it.
    const down = new THREE.Quaternion().setFromUnitVectors(cut.n, new THREE.Vector3(0, -1, 0));
    for (const g of [built.head, built.eyes]) g.applyQuaternion(down).translate(0, cut.d, 0);
    built.head.computeBoundingBox();
    const lift = -built.head.boundingBox.min.y;
    built.head.translate(0, lift, 0);
    built.eyes.translate(0, lift, 0);
    return built;
  }, [variant, seed]);
  return (
    <group>
      <mesh geometry={head} material={plaster} />
      <mesh geometry={eyes} material={dark} />
    </group>
  );
}

// An arm, hand in one of its poses (flat, reach, cup, fist), stood on the
// ground as the lone arms in the field do.
export function Arm({ pose = "flat" }) {
  const geometry = useMemo(() => grounded(buildArm(pose, 1)), [pose]);
  return <mesh geometry={geometry} material={plaster} />;
}

// A stretch of the albatross's sea: one see-through sheet at the water's
// level over the sand, matte so it never mirrors the sky, as the field
// builds it (its foam lace, cut by a shader keyed to the islands' shores,
// is left to the game). `size` is the sheet's width in world units.
const seaMat = new THREE.MeshStandardMaterial({ color: SEA_PALETTE.water, roughness: 1, metalness: 0, transparent: true, opacity: 0.7, depthWrite: false });
const sandMat = new THREE.MeshStandardMaterial({ color: SEA_PALETTE.sand ?? 0xd9c49a, roughness: 1 });
export function Ocean({ size = 40, depth = 1.2 }) {
  return (
    <group>
      {/* The seabed, a little under the water, and the water over it. */}
      <mesh rotation-x={-Math.PI / 2} position-y={-depth} receiveShadow material={sandMat}>
        <planeGeometry args={[size, size]} />
      </mesh>
      <mesh rotation-x={-Math.PI / 2} position-y={0.02} material={seaMat}>
        <planeGeometry args={[size, size]} />
      </mesh>
    </group>
  );
}

// The albatross's ground over the whole of the stage's disc, painted by
// the field's own shader (src/albatross/beach.js): on the grass side, the
// park's green with paint pentagons scattered over it; on the sand side,
// the azaleas' white with pebbles. The shader decides by a per-vertex
// "line" field (how far past the beach line a point lies), so the ground
// is all grass or all sand by what that field is set to.
const STAGE_R = 18; // the stage's ground disc (.storybook/stage.jsx), which this lies just over
function beachPatch(sand) {
  const g = new THREE.CircleGeometry(STAGE_R, 64).rotateX(-Math.PI / 2);
  const n = g.attributes.position.count;
  const grass = new THREE.Color(SEA_PALETTE.ground);
  g.setAttribute("color", new THREE.Float32BufferAttribute(Array.from({ length: n }, () => [grass.r, grass.g, grass.b]).flat(), 3));
  g.setAttribute("aLine", new THREE.Float32BufferAttribute(new Float32Array(n).fill(sand ? 1e3 : -1e3), 1));
  return g;
}
const beachUniforms = makeBeachUniforms(-1e3); // the water far below: the sand is dry everywhere
beachUniforms.uSand.value.set(SEA_PALETTE.sand);
beachUniforms.uSeabed.value.set(SEA_PALETTE.seabed);
beachUniforms.uSplotch.value.set(SEA_PALETTE.splotch);
beachUniforms.uSplotch2.value.set(SEA_PALETTE.splotch2);
const beachMat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 1 });
beachShader(beachMat, beachUniforms);
export function GroundPatch({ sand = false }) {
  const geometry = useMemo(() => beachPatch(sand), [sand]);
  return <mesh geometry={geometry} material={beachMat} receiveShadow position-y={0.01} />;
}
