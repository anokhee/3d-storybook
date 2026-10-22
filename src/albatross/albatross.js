// The albatross: the bird you fly. Built here from smooth tubes and flat
// slabs (white body, long narrow wings with dark outer panels, pale pink
// beak), from the knobs in ALBATROSS. The field (main.field.js) builds it
// with buildAlbatross and beats its wings with bird.beat; the albatross lab
// (albatross.html, mountAlbatrossLab) shows one bird big, with a slider for
// each knob. What's set in the lab is saved in the browser ("albatross-lab")
// and the field flies it (loadSavedAlbatross); "copy albatross" gives the
// block to paste back here.
import * as THREE from "three";
// (flatlight.js, the global shader patch, is NOT imported here: the library applies that look per material, see adjectives/flat/material.js)
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { hull, el, fmt } from "./heads.js";

export const ALBATROSS = {
  size: 1, // the whole bird, times (1: a wingspan of about 4.5 world units)
  body: 1, // the body's length, of this bird's own (nose to tail root)
  girth: 1, // the body's width and depth, of its own
  head: 1, // how high the head and neck are carried, of its own
  beak: 1, // the beak's length, of its own
  tail: 1, // the tail fan's length, of its own
  wing: {
    inner: 1.05, // the white inner panel, shoulder to elbow, world units
    outer: 1.15, // the dark outer panel, elbow to tip, world units
    chord: 1, // the wings' width, front to back, of their own
    sweep: 0, // how far back past the trailing edge the dark tip sits, world units (0: a right angle, the trailing edge straight out)
    dihedral: 0.04, // how much the elbow sits above the shoulder, world units
    curve: 0.08, // how far forward the white panel arcs at mid-span, world units (0: straight; negative: back)
    curveBack: 0.5, // how much of that arc the trailing edge follows (1: as much as the leading edge, 0: straight)
    elbow: 1, // how the leading edge rounds off at the elbow into the tip: 0 a corner, 1 a quarter-ellipse leaving the elbow along the span
    tipChord: 0.06, // the dark tip's width, front to back, world units (0: a sharp point)
    thick: 0.06, // how thick the wing is at the shoulder, world units (half that at the elbow, a sliver at the tip)
    bow: 0.12, // radians the whole wing is held up in a glide
    tipBow: 0.18, // radians the outer panel bows up past that
  },
  flap: {
    glide: 0.06, // radians of wing beat while gliding (a slow breathing bow)
    climb: 0.5, // radians more at a full climb
    speed: 2.2, // beats a second while gliding (as a sine: radians a second)
    climbSpeed: 8, // beats a second more at a full climb
    tip: 0.6, // how much of the beat the outer panel adds on top
  },
  mesh: {
    segments: 12, // points round the body and beak (and wedges across the tail)
    rings: 16, // rings along the body and beak
    smooth: true, // smooth shading (false: every face its own flat facet)
  },
  stipple: {
    spacing: 0.06, // world units between the wing's dots (a jittered grid, one dot to a cell)
    size: 0.4, // a dot's radius, of that spacing, before its own variation (they grow out toward the tip)
    vary: 0.9, // how much the dots' sizes vary, 0 all alike to 1 from nothing to twice (most small, a few big)
    soft: 0.1, // how soft a dot's edge is, of its radius: low is crisp, high bleeds
    wobble: 0.45, // how far a dot's rim wanders from round
    from: 0.1, // where along the wing the dots begin, 0 the shoulder to 1 the wingtip
    solid: 0.5, // where the ink is solid from (about the elbow, so the outer panel is the dark tip)
    bend: 0.1, // how far the solid's edge bows toward the body at mid-chord, of the wing's length (negative: at the edges instead)
    warp: 0.1, // how far the solid's edge wanders, of the wing's length
    fade: 0.3, // how strong the first dots are, of the ink (they strengthen out to the solid tip): low, and they only tint the feathers near the body
  },
  bodyWash: {
    spacing: 0.13, // world units between the body's dots (a grid through the body, one dot to a cell)
    size: 0.35, // a dot's radius, of that spacing, before its own variation
    vary: 0.9, // how much the dots' sizes vary, 0 all alike to 1 from nothing to twice (most small, a few big)
    soft: 0.1, // how soft a dot's edge is, of its radius
    wobble: 0.45, // how far a dot's rim wanders from round
    amount: 0.22, // how many of the cells have a dot, 0 none to 1 all
    strength: 0.7, // how dark the dots are, of the ink
  },
  colour: {
    white: 0xf2f1ea, // the feathers
    dark: 0x33363c, // the ink: the wing's wash and solid tip, the body's wash
    beak: 0xe9b8a3,
  },
};

// A few birds: each a set of knobs laid over ALBATROSS (withVariant), so the
// bird is a different one each time the field starts (pickVariant). Mostly
// their markings: from nearly none to bold, wings or body or both; a little
// of their shape. Never the mesh: the segments, the rings and the shading are
// always the one set.
export const VARIANTS = {
  base: {}, // ALBATROSS as it is
  original: { original: true }, // the bird as it first was, before any of this: hulls and flat panels, flat-shaded, unmarked (buildOriginal); the knobs do nothing to it
  clean: {
    // almost unmarked: a crisp dark tip and no more, a plain body
    size: 0.95,
    beak: 0.9,
    colour: { white: 0xf6f4ee, dark: 0x3a3d44 },
    stipple: { from: 0.44, solid: 0.5, fade: 0.6, spacing: 0.05, size: 0.3 },
    bodyWash: { amount: 0.02, strength: 0.4 },
  },
  flecked: {
    // fine, faint flecks up the wing and a light dusting on the back
    colour: { white: 0xf3f1ea, dark: 0x45484e },
    stipple: { from: 0.1, solid: 0.5, fade: 0.2, spacing: 0.045, size: 0.3, vary: 0.9 },
    bodyWash: { amount: 0.18, strength: 0.4, spacing: 0.11, size: 0.3, vary: 0.9 },
  },
  mottled: {
    // a heavily splotched body, the wings quieter
    body: 1.05,
    girth: 1.06,
    colour: { white: 0xefece3, dark: 0x3d3833, beak: 0xe0b7a4 },
    stipple: { from: 0.3, solid: 0.52, fade: 0.4, spacing: 0.06, size: 0.4 },
    bodyWash: { amount: 0.7, strength: 0.55, spacing: 0.09, size: 0.45, vary: 0.7 },
  },
  dusky: {
    // ink all over, faint: a gray bird, its tips only a little darker
    girth: 0.95,
    colour: { white: 0xe6e4de, dark: 0x3a3c42 },
    stipple: { from: 0, solid: 0.4, fade: 0.45, spacing: 0.05, size: 0.45, vary: 0.8 },
    bodyWash: { amount: 0.6, strength: 0.3, spacing: 0.07, size: 0.5, vary: 0.8 },
  },
  inkwing: {
    // no marks at all but the black: the wings dark from well in toward the
    // body, along one rounded, wandering edge; a clean pale body
    size: 1.1,
    wing: { inner: 1.15, outer: 1.25, chord: 0.95 },
    colour: { white: 0xf5f3ed, dark: 0x24262b },
    stipple: { from: 0.3, solid: 0.3, bend: -0.14, warp: 0.1 }, // from at solid: no dots, only the solid; bend negative: the black reaches in at the edges, back mid-chord
    bodyWash: { amount: 0 },
  },
  brown: {
    // a young bird: brown ink, a short beak, a mottled back and brown-tipped wings
    size: 0.92,
    body: 0.92,
    girth: 1.08,
    head: 1.08,
    beak: 0.82,
    tail: 0.9,
    colour: { white: 0xf2ebdd, dark: 0x5b4a3c, beak: 0xe6c3b1 },
    stipple: { from: 0.2, solid: 0.55, fade: 0.35, spacing: 0.06, size: 0.4, vary: 0.8 },
    bodyWash: { amount: 0.45, strength: 0.45, spacing: 0.08, size: 0.45, vary: 0.8 },
  },
};
export const VARIANT_NAMES = Object.keys(VARIANTS);
// ALBATROSS (or any knobs) with a variant's knobs laid over, as a new object;
// the mesh is left as it is
export function withVariant(A, name) {
  const out = structuredClone(A);
  const lay = (into, from) => {
    for (const [k, v] of Object.entries(from ?? {})) {
      if (k === "mesh") continue;
      if (v && typeof v === "object" && into[k] && typeof into[k] === "object") lay(into[k], v);
      else into[k] = v;
    }
  };
  lay(out, VARIANTS[name] ?? {});
  return out;
}
// A variant's name, drawn by `rnd` (0 – 1): any of them, as likely as another,
// but never the original (that is for comparing, in the lab)
const PICKABLE = VARIANT_NAMES.filter((name) => name !== "original");
export const pickVariant = (rnd = Math.random) => PICKABLE[Math.min(PICKABLE.length - 1, Math.floor(rnd() * PICKABLE.length))];

const STORE_KEY = "albatross-lab";
const HEX_KEYS = new Set(["white", "dark", "beak"]);

// The lab's saved knobs, laid over ALBATROSS (what's set there is what the
// field flies); only what ALBATROSS knows is taken
export function loadSavedAlbatross(A = ALBATROSS) {
  const lay = (into, from) => {
    if (!from || typeof from !== "object") return;
    for (const key of Object.keys(into)) {
      if (!(key in from)) continue;
      const a = into[key],
        b = from[key];
      if (a && typeof a === "object") lay(a, b);
      else if (typeof b === typeof a) into[key] = b;
    }
  };
  try {
    lay(A, JSON.parse(localStorage.getItem(STORE_KEY) || "{}")?.A);
  } catch {
    /* no storage: the code's own */
  }
  return A;
}

// Uniform Catmull-Rom through a run of numbers, t in 0 – 1 along the run
function spline(vals, t) {
  const n = vals.length - 1,
    i = Math.min(n - 1, Math.floor(t * n)),
    u = t * n - i;
  const p0 = vals[Math.max(0, i - 1)],
    p1 = vals[i],
    p2 = vals[i + 1],
    p3 = vals[Math.min(n, i + 2)];
  return 0.5 * (2 * p1 + (-p0 + p2) * u + (2 * p0 - 5 * p1 + 4 * p2 - p3) * u * u + (-p0 + 3 * p1 - 3 * p2 + p3) * u * u * u);
}

// A tube along z through stations [z, c, rx, ry] (its center's height, half
// its width, half its height at that z; 0, 0 at the ends closes it):
// `rings` rings along it, `segments` points round each; an end that stays
// open is capped
function tube(stations, { segments, rings }) {
  const cols = [0, 1, 2, 3].map((k) => stations.map((s) => s[k]));
  const down = cols[0][0] > cols[0][cols[0].length - 1]; // the stations run nose to tail (z falling), as a body's, or the other way, as a beak's
  const pos = [],
    idx = [];
  for (let r = 0; r <= rings; r++) {
    const t = r / rings;
    const z = spline(cols[0], t),
      c = spline(cols[1], t),
      rx = Math.max(0, spline(cols[2], t)),
      ry = Math.max(0, spline(cols[3], t));
    for (let s = 0; s <= segments; s++) {
      const a = (s / segments) * Math.PI * 2;
      pos.push(Math.sin(a) * rx, c + Math.cos(a) * ry, z);
    }
  }
  for (let r = 0; r < rings; r++)
    for (let s = 0; s < segments; s++) {
      const a = r * (segments + 1) + s,
        b = a + segments + 1;
      if (down) idx.push(a, a + 1, b, a + 1, b + 1, b); // wound to face outward either way the stations run
      else idx.push(a, b, a + 1, a + 1, b, b + 1);
    }
  // An end left open (its station wider than nothing) gets a cap: a fan from
  // its center, facing out along z
  const cap = (r, outAlongZ) => {
    const [z, c, rx, ry] = [0, 1, 2, 3].map((k) => spline(cols[k], r / rings));
    if (rx < 1e-6 && ry < 1e-6) return;
    const c0 = pos.length / 3,
      first = r * (segments + 1);
    pos.push(0, c, z);
    for (let s = 0; s < segments; s++) idx.push(c0, first + s + (outAlongZ ? 1 : 0), first + s + (outAlongZ ? 0 : 1));
  };
  cap(0, down);
  cap(rings, !down);
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}

// The tube's profile at a z: [c, rx, ry] there (its stations' z must run one
// way, as a body's do, nose to tail)
function profileAt(stations, z) {
  const zs = stations.map((s) => s[0]),
    down = zs[0] > zs[zs.length - 1];
  let lo = 0,
    hi = 1;
  for (let i = 0; i < 40; i++) {
    const mid = (lo + hi) / 2;
    if (spline(zs, mid) > z === down) lo = mid;
    else hi = mid;
  }
  const t = (lo + hi) / 2;
  return [1, 2, 3].map((k) =>
    Math.max(
      0,
      spline(
        stations.map((s) => s[k]),
        t,
      ),
    ),
  );
}

// A flat fan: a strip from its root edge (half-width, height, z) out to its
// rim (half-width, height, z), the rim bowed `round` further back at its
// middle, in `segments` wedges across
function fan(root, rim, round, segments) {
  const pos = [],
    idx = [];
  for (let s = 0; s <= segments; s++) {
    const u = (s / segments) * 2 - 1;
    pos.push(root[0] * u, root[1], root[2]);
    pos.push(rim[0] * u, rim[1], rim[2] - round * Math.sqrt(1 - u * u));
  }
  for (let s = 0; s < segments; s++) {
    const a = s * 2;
    idx.push(a, a + 2, a + 1, a + 2, a + 3, a + 1); // wound to face up (it is lit both sides anyway)
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}

// A wing panel as a slab: an elliptical cross-section (its chord across, its
// thickness up) at the root and at the tip, `segments` points round, skinned
// between in `along` rings and capped at both ends. Roots and tips are
// [x, y, z] pairs: the leading and trailing edge; thickness in world units.
// `bow` arcs the panel: mid-span the leading edge slides forward by this much
// (world units; none at the ends) and the trailing edge by `bowBack` of it,
// so both edges curve the same way, the trailing one as gently as that says.
// `frontPath` maps the span fraction to how far the leading edge's z has got
// from root to tip (u: a straight edge; starting flat and steepening rounds it).
function slab(rootF, rootB, tipF, tipB, tRoot, tTip, segments, along = 1, bow = 0, bowBack = 1, frontPath = (u) => u) {
  const pos = [],
    idx = [];
  const mix = (a, b, u) => a + (b - a) * u;
  for (let r = 0; r <= along; r++) {
    const u = r / along,
      t = mix(tRoot, tTip, u),
      arc = Math.sin(Math.PI * u),
      swellF = bow * arc, // the leading edge's slide forward
      swellB = bow * bowBack * arc; // the trailing edge's
    const F = rootF.map((v, k) => mix(v, tipF[k], k === 2 ? frontPath(u) : u)), // the leading edge's z on its own path
      B = rootB.map((v, k) => mix(v, tipB[k], u));
    let hx = (F[0] - B[0]) / 2,
      hy = (F[1] - B[1]) / 2,
      hz = (F[2] - B[2]) / 2;
    const half = Math.hypot(hx, hy, hz) || 1;
    // Each edge slides forward along the chord by its swell: the chord's
    // middle moves by their mean, its half-length grows by half their difference
    const shift = (swellF + swellB) / 2,
      grow = (half + (swellF - swellB) / 2) / half;
    const cx = (F[0] + B[0]) / 2 + (hx / half) * shift,
      cy = (F[1] + B[1]) / 2 + (hy / half) * shift,
      cz = (F[2] + B[2]) / 2 + (hz / half) * shift;
    hx *= grow;
    hy *= grow;
    hz *= grow;
    for (let s = 0; s <= segments; s++) {
      const a = (s / segments) * Math.PI * 2,
        c = Math.cos(a),
        up = Math.sin(a) * (t / 2);
      pos.push(cx + hx * c, cy + hy * c + up, cz + hz * c);
    }
  }
  for (let r = 0; r < along; r++)
    for (let s = 0; s < segments; s++) {
      const a = r * (segments + 1) + s,
        b = a + segments + 1;
      idx.push(a, b, a + 1, a + 1, b, b + 1);
    }
  // the caps: a fan from each end's center, wound the skin's way
  const centre = (F, B) => F.map((v, k) => (v + B[k]) / 2);
  const cRoot = centre(rootF, rootB),
    cTip = centre(tipF, tipB);
  const r0 = pos.length / 3;
  pos.push(...cRoot);
  for (let s = 0; s < segments; s++) idx.push(r0, s, s + 1);
  const t0 = pos.length / 3,
    last = along * (segments + 1);
  pos.push(...cTip);
  for (let s = 0; s < segments; s++) idx.push(t0, last + s + 1, last + s);
  // As wound, every face looks outward when the span runs against the ring's
  // own axis (the chord crossed with up); a wing on the other side is reversed
  const hx = (rootF[0] - rootB[0]) / 2,
    hz = (rootF[2] - rootB[2]) / 2; // chord × up = (-hz, 0, hx)
  const span = [cTip[0] - cRoot[0], cTip[1] - cRoot[1], cTip[2] - cRoot[2]];
  if (span[0] * -hz + span[2] * hx > 0) for (let i = 0; i < idx.length; i += 3) [idx[i + 1], idx[i + 2]] = [idx[i + 2], idx[i + 1]];
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}

// Painterly dots, in GLSL: what the wing's and the body's washes share. A dot
// is a flat blob of the ink at its own opacity, its rim wandering, laid over
// the others like glazes, so where they overlap they darken.
const WASH_GLSL = `
uniform vec3 uInk;
uniform float uSpacing, uSize, uVary, uSoft, uWobble;
float washHash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float washHash3(vec3 p) { return fract(sin(dot(p, vec3(127.1, 311.7, 74.7))) * 43758.5453); }
float washNoise(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(mix(washHash(i), washHash(i + vec2(1.0, 0.0)), f.x), mix(washHash(i + vec2(0.0, 1.0)), washHash(i + vec2(1.0, 1.0)), f.x), f.y);
}
float washNoise3(vec3 p) {
  vec3 i = floor(p), f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  float x00 = mix(washHash3(i), washHash3(i + vec3(1.0, 0.0, 0.0)), f.x);
  float x10 = mix(washHash3(i + vec3(0.0, 1.0, 0.0)), washHash3(i + vec3(1.0, 1.0, 0.0)), f.x);
  float x01 = mix(washHash3(i + vec3(0.0, 0.0, 1.0)), washHash3(i + vec3(1.0, 0.0, 1.0)), f.x);
  float x11 = mix(washHash3(i + vec3(0.0, 1.0, 1.0)), washHash3(i + vec3(1.0, 1.0, 1.0)), f.x);
  return mix(mix(x00, x10, f.y), mix(x01, x11, f.y), f.z);
}
// One dot's cover at a point: d is how far out the point is, of the dot's
// radius, after its rim has wandered. Flat: one value inside, soft only at
// the edge (uSoft, of the radius)
float washDot(float d) { return 1.0 - smoothstep(1.0 - uSoft, 1.0 + 0.3 * uSoft, d); }`;

// The wing's surface design, one field over both panels: painterly dots of
// the dark color over the wing's own surface (local x along the span, z
// along the chord; the outer panel's x offset by the inner's length, so the
// field runs on across the elbow). The dots sit in a jittered grid, each its
// own size and strength; more of them and bigger the further out, until past
// A.stipple.solid the ink is solid, along an edge that bows toward the body
// mid-chord and wanders.
function stippled(material, A, offset) {
  const S = A.stipple;
  material.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, {
      uOffset: { value: offset },
      uTotal: { value: A.wing.inner + A.wing.outer },
      uChord: { value: 0.2 * A.wing.chord }, // about half the chord, to place a point across it
      uSpacing: { value: S.spacing },
      uSize: { value: S.size },
      uVary: { value: S.vary },
      uSoft: { value: S.soft },
      uWobble: { value: S.wobble },
      uFrom: { value: S.from },
      uSolid: { value: S.solid },
      uBend: { value: S.bend },
      uWarp: { value: S.warp },
      uFade: { value: S.fade },
      uInk: { value: new THREE.Color(A.colour.dark) },
    });
    shader.vertexShader = shader.vertexShader.replace("#include <common>", "#include <common>\nvarying vec3 vLocal;").replace("#include <begin_vertex>", "#include <begin_vertex>\nvLocal = position;");
    shader.fragmentShader = shader.fragmentShader
      .replace(
        "#include <common>",
        `#include <common>
varying vec3 vLocal;
uniform float uOffset, uTotal, uChord, uFrom, uSolid, uBend, uWarp, uFade;
${WASH_GLSL}
// How thick the ink is at a place along the wing: 0 before uFrom, 1 at uSolid
float washThick(float along) { return smoothstep(uFrom, max(uSolid, uFrom + 0.001), along); }`,
      )
      .replace(
        "#include <color_fragment>",
        `#include <color_fragment>
{
  vec2 wing = vec2(uOffset + abs(vLocal.x), vLocal.z); // on the wing: out along the span, across the chord
  vec2 g = wing / uSpacing; // in dot-grid units
  float across = clamp(vLocal.z / uChord, -1.0, 1.0); // -1 the trailing edge, 1 the leading
  // The solid tip: its edge bows toward the body mid-chord (uBend) and wanders (uWarp)
  float here = wing.x / uTotal + uBend * (1.0 - across * across) + uWarp * (washNoise(g * 0.35 + 3.3) - 0.5);
  float clear = 1.0 - smoothstep(uSolid - 0.02, uSolid, here); // the light left through the glazes
  // The dots: one to a cell, jittered about, each its own size and strength;
  // a big one reaches into the cells round it, so look two out each way
  vec2 cellHere = floor(g);
  for (int i = -2; i <= 2; i++)
    for (int j = -2; j <= 2; j++) {
      vec2 cell = cellHere + vec2(float(i), float(j));
      float h1 = washHash(cell), h2 = washHash(cell + 19.3), h3 = washHash(cell + 7.7), h4 = washHash(cell + 3.1);
      vec2 centre = cell + 0.5 + 0.7 * (vec2(h1, h2) - 0.5);
      float thick = washThick(centre.x * uSpacing / uTotal); // the dot's own place along the wing
      float on = step(h3, thick); // the thicker, the more dots
      float r = uSize * mix(1.0 - uVary, 1.0 + uVary, h4 * h4 * h4) * mix(1.0, 1.8, thick); // its size: its own (most small, a few big), and bigger out toward the tip
      vec2 off = g - centre;
      float d = length(off) / max(r, 0.001);
      d *= 1.0 + uWobble * (washNoise(g * 2.6 + 50.0 * h1) - 0.5) * 2.0; // the rim wanders
      float alpha = on * washDot(d) * mix(0.35, 1.0, washHash(cell + 11.1)) * mix(uFade, 1.0, thick); // its opacity: its own, fainter toward the body
      clear *= 1.0 - alpha;
    }
  diffuseColor.rgb = mix(diffuseColor.rgb, uInk, clamp(1.0 - clear, 0.0, 1.0));
}`,
      );
  };
  material.customProgramCacheKey = () => `wash ${offset} ${Object.values(S).join(" ")}`;
  return material;
}

// The body's own wash, apart from the wing's: painterly dots scattered over
// the body (and the tail), one to a cell of a grid through the body's own
// space, so they wrap round it, cut by it at every size. A.bodyWash says how
// big, how varied, how soft, how many and how strong.
function bodyWashed(material, A) {
  const B = A.bodyWash;
  material.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, {
      uSpacing: { value: B.spacing },
      uSize: { value: B.size },
      uVary: { value: B.vary },
      uSoft: { value: B.soft },
      uWobble: { value: B.wobble },
      uAmount: { value: B.amount },
      uStrength: { value: B.strength },
      uInk: { value: new THREE.Color(A.colour.dark) },
    });
    shader.vertexShader = shader.vertexShader.replace("#include <common>", "#include <common>\nvarying vec3 vLocal;").replace("#include <begin_vertex>", "#include <begin_vertex>\nvLocal = position;");
    shader.fragmentShader = shader.fragmentShader
      .replace(
        "#include <common>",
        `#include <common>
varying vec3 vLocal;
uniform float uAmount, uStrength;
${WASH_GLSL}`,
      )
      .replace(
        "#include <color_fragment>",
        `#include <color_fragment>
{
  vec3 g = vLocal / uSpacing; // in dot-grid units
  vec3 cellHere = floor(g);
  float clear = 1.0; // the light left through the glazes
  for (int i = -1; i <= 1; i++)
    for (int j = -1; j <= 1; j++)
      for (int k = -1; k <= 1; k++) {
        vec3 cell = cellHere + vec3(float(i), float(j), float(k));
        float h1 = washHash3(cell), h2 = washHash3(cell + 19.3), h3 = washHash3(cell + 7.7), h4 = washHash3(cell + 3.1);
        vec3 centre = cell + 0.5 + 0.7 * (vec3(h1, h2, washHash3(cell + 5.9)) - 0.5);
        float on = step(h3, uAmount);
        float r = uSize * mix(1.0 - uVary, 1.0 + uVary, h4 * h4 * h4); // its size: its own, most small, a few big
        float d = length(g - centre) / max(r, 0.001);
        d *= 1.0 + uWobble * (washNoise3(g * 2.6 + 50.0 * h1) - 0.5) * 2.0; // the rim wanders
        float alpha = on * washDot(d) * mix(0.35, 1.0, washHash3(cell + 11.1)) * uStrength; // its opacity: its own
        clear *= 1.0 - alpha;
      }
  diffuseColor.rgb = mix(diffuseColor.rgb, uInk, clamp(1.0 - clear, 0.0, 1.0));
}`,
      );
  };
  material.customProgramCacheKey = () => `bodywash ${Object.values(B).join(" ")}`;
  return material;
}

// The bird as it first was (the "original" variant), kept for comparing: a
// few convex hulls and flat panels, flat-shaded, in its first colors; the
// knobs leave it alone, the wing beat is the same as the knobs' own then
function buildOriginal(A) {
  const player = new THREE.Group();
  const body = new THREE.Group();
  player.add(body);
  const featherWhite = new THREE.MeshStandardMaterial({ color: 0xf2f1ea, roughness: 0.9, flatShading: true });
  const featherDark = new THREE.MeshStandardMaterial({ color: 0x33363c, roughness: 0.9, flatShading: true, side: THREE.DoubleSide });
  const beakPink = new THREE.MeshStandardMaterial({ color: 0xe9b8a3, roughness: 0.7, flatShading: true });
  // Body + head as one hull (albatross: thick chest, slim tail, head carried high)
  body.add(new THREE.Mesh(hull([[0, 0.1, 0.62], [0.09, 0.16, 0.5], [-0.09, 0.16, 0.5], [0, 0.24, 0.42], [0.16, 0.02, 0.2], [-0.16, 0.02, 0.2], [0, 0.2, 0.05], [0, -0.18, 0.18], [0.1, 0.04, -0.35], [-0.1, 0.04, -0.35], [0, 0.05, -0.8]]), featherWhite));
  // Beak: long, with a little downward hook at the tip
  body.add(new THREE.Mesh(hull([[0.035, 0.13, 0.58], [-0.035, 0.13, 0.58], [0, 0.16, 0.56], [0, 0.05, 0.6], [0.018, 0.1, 0.92], [-0.018, 0.1, 0.92], [0, 0.04, 0.95]]), beakPink));
  // Tail: a thin fan
  body.add(new THREE.Mesh(hull([[0.04, 0.06, -0.7], [-0.04, 0.06, -0.7], [0.03, 0.03, -0.7], [-0.03, 0.03, -0.7], [0.16, 0.05, -1.05], [-0.16, 0.05, -1.05], [0, 0.04, -1.12]]), featherWhite));
  // Wings: an inner panel (white) and an outer panel (dark) hinged partway out
  const panel = (rootA, rootB, tipA, tipB, material) => {
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute([...rootA, ...tipA, ...tipB, ...rootA, ...tipB, ...rootB], 3));
    g.computeVertexNormals();
    return new THREE.Mesh(g, material);
  };
  const wings = [];
  for (const side of [1, -1]) {
    const shoulder = new THREE.Group();
    shoulder.position.set(0.12 * side, 0.16, 0.18);
    body.add(shoulder);
    shoulder.add(panel([0, 0, 0.22], [0, 0, -0.18], [1.05 * side, 0.04, 0.1], [1.05 * side, 0.04, -0.16], new THREE.MeshStandardMaterial({ color: 0xf2f1ea, roughness: 0.9, flatShading: true, side: THREE.DoubleSide })));
    const elbow = new THREE.Group();
    elbow.position.set(1.05 * side, 0.04, 0);
    shoulder.add(elbow);
    elbow.add(panel([0, 0, 0.1], [0, 0, -0.16], [1.15 * side, 0, -0.12], [1.15 * side, 0, -0.28], featherDark));
    wings.push({ shoulder, elbow, side });
  }
  player.traverse((o) => {
    if (o.isMesh) o.castShadow = true;
  });
  let phase = 0;
  const beat = (delta, climb = 0) => {
    const up = Math.max(0, climb);
    phase += delta * (2.2 + up * 8);
    const flap = Math.sin(phase) * (0.06 + up * 0.5);
    for (const w of wings) {
      w.shoulder.rotation.z = (0.12 + flap) * -w.side;
      w.elbow.rotation.z = (0.18 + flap * 0.6) * -w.side;
    }
  };
  beat(0);
  const dispose = () => {
    player.traverse((o) => {
      if (!o.isMesh) return;
      o.geometry.dispose();
      o.material.dispose();
    });
  };
  return { player, body, wings, beat, dispose };
}

// The bird: `player` carries its place and heading, `body` its bank and pitch,
// `wings` each side's shoulder and elbow hinges. beat(delta, climb) moves the
// wings on: a slow bow in a glide, a real flap at a climb (climb in 0 – 1).
export function buildAlbatross(A = ALBATROSS) {
  if (A.original) return buildOriginal(A);
  const player = new THREE.Group();
  const body = new THREE.Group();
  player.add(body);
  player.scale.setScalar(A.size);

  const flatShading = !A.mesh.smooth;
  const feather = (extra = {}) => new THREE.MeshStandardMaterial({ color: A.colour.white, roughness: 0.9, flatShading, ...extra });
  const featherWhite = bodyWashed(feather(), A); // the body: splotched (its own wash, apart from the wing's)
  // The wing panels: one surface design over both, dots thickening to the
  // solid dark tip (stippled); the outer panel's field carries on from the inner's
  const wingInner = stippled(feather(), A, 0),
    wingOuter = stippled(feather(), A, A.wing.inner);
  const beakPink = new THREE.MeshStandardMaterial({ color: A.colour.beak, roughness: 0.7, flatShading });

  // Body + head as one tube (albatross: thick chest, slim tail, head carried
  // high): rings along a profile, each an ellipse (c: its center's height,
  // rx: half its width, ry: half its height), the profile a smooth curve
  // through these stations. The head's stations lift with A.head.
  const g = A.girth,
    L = A.body,
    H = A.head;
  const stations = [
    [0.62 * L, 0.1 * H, 0, 0], // the nose, where the beak leaves the head
    [0.52 * L, 0.12 * H, 0.085 * g, 0.09 * g], // head
    [0.42 * L, 0.12 * H, 0.1 * g, 0.12 * g], // crown
    [0.3 * L, 0.06 * H, 0.14 * g, 0.16 * g], // neck into chest
    [0.18 * L, 0.01, 0.16 * g, 0.19 * g], // chest
    [0.05 * L, 0.03, 0.15 * g, 0.17 * g], // back, belly
    [-0.35 * L, 0.04, 0.1 * g, 0.07 * g], // hips
    [-0.8 * L, 0.05, 0, 0], // tail root
  ];
  body.add(new THREE.Mesh(tube(stations, A.mesh), featherWhite));

  // Beak: long, with a little downward hook at the tip, from the head's front;
  // it starts inside the head, so its base is buried whatever the head's shape
  const bz = 0.58 * L, // where it leaves the head
    by = 0.1 * H, // the head's height there
    bl = 0.34 * A.beak; // its length
  body.add(
    new THREE.Mesh(
      tube(
        [
          [0.46 * L, by + 0.005, 0.035, 0.055], // inside the head
          [bz, by + 0.005, 0.035, 0.055],
          [bz + bl * 0.6, by + 0.005, 0.025, 0.035],
          [bz + bl, by - 0.005, 0.018, 0.025],
          [bz + bl + 0.03, by - 0.05, 0, 0], // the hook
        ],
        A.mesh,
      ),
      beakPink,
    ),
  );

  // Tail: a thin fan lying over the tail root, as wide there as the body is
  // and on top of it (the body's tip runs on under it), its trailing edge rounded
  const tz = -0.7 * L,
    tl = 0.35 * A.tail,
    [tc, tw, th] = profileAt(stations, tz),
    ty = tc + th; // the body's top there
  body.add(new THREE.Mesh(fan([tw, ty, tz], [0.16, ty, tz - tl], 0.07, A.mesh.segments), bodyWashed(feather({ side: THREE.DoubleSide }), A)));

  // Wings: albatross wings are long and narrow. Each is an inner panel (white)
  // and an outer panel (dark) hinged partway out, so they can flap and hold a
  // glide bow. Each panel is a slab, thickest at the shoulder and thinning to
  // the tip; the shoulder sits inside the chest, so the root is buried in it.
  const W = A.wing,
    c = W.chord,
    tk = W.thick;
  const wings = [];
  for (const side of [1, -1]) {
    const shoulder = new THREE.Group();
    shoulder.position.set(0.06 * g * side, 0.12, 0.18 * L);
    body.add(shoulder);
    // Inner panel: shoulder to elbow, arced forward at mid-span
    shoulder.add(
      new THREE.Mesh(
        slab(
          [0, 0, 0.22 * c],
          [0, 0, -0.18 * c],
          [W.inner * side, W.dihedral, 0.1 * c],
          [W.inner * side, W.dihedral, -0.16 * c],
          tk,
          tk * 0.5,
          A.mesh.segments,
          A.mesh.rings,
          W.curve * c,
          W.curveBack,
        ),
        wingInner,
      ),
    );
    // Outer panel: elbow to the dark tip, a right triangle: the elbow's chord
    // one leg, the trailing edge straight out the other, the leading edge
    // sweeping back to meet it at the tip, blunted W.tipChord wide (W.sweep
    // carries the tip further back)
    const elbow = new THREE.Group();
    elbow.position.set(W.inner * side, W.dihedral, 0);
    shoulder.add(elbow);
    const tipB = [W.outer * side, 0, -0.16 * c - W.sweep],
      tipF = [W.outer * side, 0, -0.16 * c - W.sweep + W.tipChord]; // a short flat end, W.tipChord wide, blunting the point
    // Its leading edge leaves the elbow along the span and curves back to the
    // tip (W.elbow: 0 the straight line, a corner at the elbow; 1 a quarter-ellipse)
    const round = (u) => u + (1 - Math.cos((u * Math.PI) / 2) - u) * W.elbow;
    elbow.add(new THREE.Mesh(slab([0, 0, 0.1 * c], [0, 0, -0.16 * c], tipF, tipB, tk * 0.5, tk * 0.15, A.mesh.segments, A.mesh.rings, 0, 1, round), wingOuter));
    wings.push({ shoulder, elbow, side });
  }

  player.traverse((o) => {
    if (o.isMesh) o.castShadow = true;
  });

  let phase = 0;
  const beat = (delta, climb = 0) => {
    const up = Math.max(0, climb);
    phase += delta * (A.flap.speed + up * A.flap.climbSpeed);
    const flap = Math.sin(phase) * (A.flap.glide + up * A.flap.climb);
    for (const w of wings) {
      w.shoulder.rotation.z = (W.bow + flap) * -w.side; // the whole wing beats
      w.elbow.rotation.z = (W.tipBow + flap * A.flap.tip) * -w.side; // the tips bow upward
    }
  };
  beat(0);

  const dispose = () => {
    player.traverse((o) => {
      if (!o.isMesh) return;
      o.geometry.dispose();
      o.material.dispose();
    });
  };
  return { player, body, wings, beat, dispose };
}

// The ALBATROSS block as source, colors in hex
const toSource = (v, key = "", indent = "") => {
  if (typeof v === "number" && HEX_KEYS.has(key)) return "0x" + v.toString(16).padStart(6, "0");
  if (typeof v !== "object") return JSON.stringify(typeof v === "number" ? +v.toFixed(3) : v);
  const lines = Object.entries(v).map(([k, x]) => `${indent}  ${k}: ${toSource(x, k, indent + "  ")},`);
  return `{\n${lines.join("\n")}\n${indent}}`;
};

// =====================================================================
// The lab
// =====================================================================
// The lab's ring of variants: tuned for a good picture
const RING = {
  radius: 5, // world units from the ring's middle to each bird (a bird spans about 4.5; at 5 the nearest wingtips of neighbors keep 0.8 apart, measured)
  yaw: 0.45, // radians each bird is turned off facing straight out: the front one shows a three-quarter view
  camera: [2.2, 1.5, 8.5], // where the camera starts, from the front bird: low, in front, a little to the side
  fog: [10, 24], // world units from the camera the fog starts and is complete: the far side of the ring fades
  faded: 0.22, // how solid the birds away from the front are (1: as solid as the front one)
  ease: 3, // how quickly the ring turns to a new front bird (higher, quicker)
  bob: 0.18, // world units each bird rises and falls
  driftEvery: 4, // seconds between turns when the ring drifts
};
export function mountAlbatrossLab(root) {
  const DEFAULTS = structuredClone(ALBATROSS); // the code's own, for "reset"
  const A = loadSavedAlbatross();
  const save = () => {
    try {
      localStorage.setItem(STORE_KEY, JSON.stringify({ A }));
    } catch {
      /* private mode: the lab still works, it just forgets */
    }
  };

  // ---- the page ------------------------------------------------------
  const panel = el("aside", { id: "lab-panel" });
  const view = el("div", { id: "lab-view" });
  const toast = el("div", { id: "lab-toast", hidden: "" });
  root.append(panel, view);
  view.append(toast);
  let toastTimer = 0;
  const say = (msg) => {
    toast.textContent = msg;
    toast.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => (toast.hidden = true), 1400);
  };
  const heading = (text) => el("h3", { class: "lab-group" }, [el("span", { text })]);
  const rows = [];
  // A slider with its number, in the labs' markup
  const knob = ({ label, min, max, step, note }, get, set) => {
    const st = step ?? (max - min > 1 ? 0.01 : 0.001);
    const box = el("input", { type: "number", min, max, step: st });
    const slider = el("input", { type: "range", class: "fixed", min, max, step: st });
    const sync = () => {
      slider.value = get();
      box.value = fmt(get());
    };
    const take = (v) => {
      set(THREE.MathUtils.clamp(+v || 0, min, max));
      sync();
    };
    slider.oninput = (e) => take(e.target.value);
    box.onchange = (e) => take(e.target.value);
    sync();
    rows.push(sync);
    return el("div", { class: "prow flower-row", title: note ?? "" }, [
      el("div", { class: "prow-head" }, [
        el("span", { class: "name", text: label }),
        el("span", { class: "boxes" }, [el("input", { type: "number" }), el("span", { class: "dash" }), el("input", { type: "number" }), box]),
      ]),
      el("div", { class: "prow-slider" }, [el("div", { class: "single" }, [slider])]),
    ]);
  };
  // A color, as a swatch to click
  const swatch = (label, key, note) => {
    const pick = el("input", { type: "color", value: "#" + A.colour[key].toString(16).padStart(6, "0"), title: note });
    pick.oninput = (e) => {
      A.colour[key] = parseInt(e.target.value.slice(1), 16);
      changed();
    };
    return el("label", { class: "lab-check", title: note }, [pick, el("span", { text: label })]);
  };

  // ---- the scene -----------------------------------------------------
  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  view.append(renderer.domElement);
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0xf3ecd8);
  const camera = new THREE.PerspectiveCamera(35, 1, 0.05, 200);
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.12;
  scene.add(new THREE.HemisphereLight(0x8fa4cc, 0x2c3448, 1.0));
  const sun = new THREE.DirectionalLight(0xf4ecd6, 2.5);
  sun.position.set(6, 12, 4);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.bias = -0.0006;
  sun.shadow.normalBias = 0.05;
  for (const k of ["left", "bottom"]) sun.shadow.camera[k] = -14; // the whole ring
  for (const k of ["right", "top"]) sun.shadow.camera[k] = 14;
  const rim = new THREE.DirectionalLight(0x6f8cc4, 0.8);
  rim.position.set(-5, 6, -8);
  scene.add(sun, sun.target, rim);
  // The ground, a way below: the bird hangs in the air, its shadow under it
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(200, 200).rotateX(-Math.PI / 2), new THREE.MeshStandardMaterial({ roughness: 1 }));
  ground.position.y = -2.5;
  ground.receiveShadow = true;
  scene.add(ground);
  // The backdrop, day, dusk or night (the view bar's button steps through
  // them): the sky and the ground under the bird nearly one color (night: a
  // navy night sky, the ground a shade under it; day: white, so the bird
  // reads against nothing but its shadow; dusk: a dusty mid blue, away from
  // both the white body and the dark ink, so both read at once)
  const BACKDROPS = {
    day: { sky: 0xf6f5f1, ground: 0xecebe6 },
    dusk: { sky: 0x7f97b2, ground: 0x6c8299 },
    night: { sky: 0x141d33, ground: 0x0f1628 },
  };
  const BACKDROP_NAMES = Object.keys(BACKDROPS);
  scene.fog = new THREE.Fog(0x000000, RING.fog[0], RING.fog[1]);
  let backdrop = "night",
    skyBtn = null;
  try {
    if (BACKDROPS[localStorage.getItem("albatross-lab-backdrop")]) backdrop = localStorage.getItem("albatross-lab-backdrop");
  } catch {
    /* private mode: night */
  }
  const setBackdrop = (name) => {
    backdrop = name;
    scene.background.set(BACKDROPS[name].sky);
    scene.fog.color.set(BACKDROPS[name].sky); // the far birds fade into the sky
    if (skyBtn) skyBtn.textContent = name;
    ground.material.color.set(BACKDROPS[name].ground);
    try {
      localStorage.setItem("albatross-lab-backdrop", name);
    } catch {
      /* the lab just forgets */
    }
  };
  setBackdrop(backdrop);

  // The ring: every variant gliding on one ring, facing out and turned a
  // little (RING.yaw) so the bird at the front shows the camera a three-
  // quarter view, wings spread across the frame. The ring turns to bring
  // a bird to the front (‹ ›, the arrow keys, a click, or the dropdown);
  // the rest recede behind it into the fog
  const ring = new THREE.Group();
  scene.add(ring);
  let birds = []; // { name, bird, holder, mats, meshes }
  let front = 0; // index of the bird at the front
  let ringAngle = 0; // radians the ring is turned now (eases to -front's angle)
  const step = (Math.PI * 2) / VARIANT_NAMES.length;
  const build = () => {
    for (const b of birds) {
      ring.remove(b.holder);
      b.bird.dispose();
    }
    birds = VARIANT_NAMES.map((name, i) => {
      const bird = buildAlbatross(withVariant(A, name));
      bird.beat(i * 0.37, 0); // each its own place in the beat
      const holder = new THREE.Group(); // the bird's place on the ring
      const a = i * step;
      holder.position.set(Math.sin(a) * RING.radius, 0, Math.cos(a) * RING.radius);
      holder.rotation.y = a + RING.yaw; // facing out (+z is the nose), turned a little
      holder.add(bird.player);
      ring.add(holder);
      // Its materials and meshes, to fade it when it's away from the front
      const mats = new Set(),
        meshes = [];
      bird.player.traverse((o) => {
        if (!o.isMesh) return;
        meshes.push(o);
        for (const m of [o.material].flat()) {
          m.transparent = true;
          mats.add(m);
        }
      });
      return { name, bird, holder, mats: [...mats], meshes };
    });
  };
  build();
  const changed = () => {
    build();
    save();
  };
  const tuned = () => save(); // a flight knob: the bird as built reads it live

  // ---- the knobs -----------------------------------------------------
  let climb = 0; // the lab's own: how hard the bird is climbing, for the wing beat
  let variantSel = null,
    nameOut = null;
  // Bring bird i to the front of the ring (the shortest way round)
  const bringToFront = (i) => {
    const n = VARIANT_NAMES.length;
    front = ((i % n) + n) % n;
    if (variantSel) variantSel.value = VARIANT_NAMES[front];
    if (nameOut) nameOut.textContent = VARIANT_NAMES[front];
  };
  panel.append(
    el("div", { class: "lab-row" }, [
      el("label", { text: "variant" }),
      (variantSel = el(
        "select",
        { title: "one of the birds the field may start with (its knobs laid over these; the mesh stays): turns the ring to it", onchange: (e) => bringToFront(VARIANT_NAMES.indexOf(e.target.value)) },
        VARIANT_NAMES.map((name) => el("option", { value: name, text: name })),
      )),
    ]),
  );
  panel.append(heading("Mesh"));
  panel.append(
    knob(
      { label: "segments", min: 3, max: 48, step: 1, note: "points round the body and beak, and wedges across the tail" },
      () => A.mesh.segments,
      (v) => ((A.mesh.segments = Math.round(v)), changed()),
    ),
    knob(
      { label: "rings", min: 2, max: 64, step: 1, note: "rings along the body and beak" },
      () => A.mesh.rings,
      (v) => ((A.mesh.rings = Math.round(v)), changed()),
    ),
    el("div", { class: "lab-row" }, [
      el("label", { class: "lab-check", title: "smooth shading; off, every face is its own flat facet" }, [
        el("input", { type: "checkbox", ...(A.mesh.smooth ? { checked: "" } : {}), onchange: (e) => ((A.mesh.smooth = e.target.checked), changed()) }),
        el("span", { text: "smooth" }),
      ]),
    ]),
  );
  panel.append(heading("Body"));
  panel.append(
    knob(
      { label: "size", min: 0.3, max: 3, note: "the whole bird, times" },
      () => A.size,
      (v) => ((A.size = v), changed()),
    ),
    knob(
      { label: "length", min: 0.5, max: 2, note: "the body, nose to tail root, of its own" },
      () => A.body,
      (v) => ((A.body = v), changed()),
    ),
    knob(
      { label: "girth", min: 0.5, max: 2, note: "the body's width and depth, of its own" },
      () => A.girth,
      (v) => ((A.girth = v), changed()),
    ),
    knob(
      { label: "head", min: 0.5, max: 2, note: "how high the head and neck are carried, of its own" },
      () => A.head,
      (v) => ((A.head = v), changed()),
    ),
    knob(
      { label: "beak", min: 0.3, max: 2.5, note: "the beak's length, of its own" },
      () => A.beak,
      (v) => ((A.beak = v), changed()),
    ),
    knob(
      { label: "tail", min: 0.3, max: 2.5, note: "the tail fan's length, of its own" },
      () => A.tail,
      (v) => ((A.tail = v), changed()),
    ),
  );
  panel.append(heading("Wings"));
  panel.append(
    knob(
      { label: "inner", min: 0.3, max: 3, note: "the white inner panel, shoulder to elbow, world units" },
      () => A.wing.inner,
      (v) => ((A.wing.inner = v), changed()),
    ),
    knob(
      { label: "outer", min: 0.3, max: 3, note: "the dark outer panel, elbow to tip, world units" },
      () => A.wing.outer,
      (v) => ((A.wing.outer = v), changed()),
    ),
    knob(
      { label: "chord", min: 0.4, max: 2.5, note: "the wings' width, front to back, of their own" },
      () => A.wing.chord,
      (v) => ((A.wing.chord = v), changed()),
    ),
    knob(
      { label: "sweep", min: -0.3, max: 1, note: "how far back past the trailing edge the dark tip sits, world units; 0 is a right angle, the trailing edge straight out" },
      () => A.wing.sweep,
      (v) => ((A.wing.sweep = v), changed()),
    ),
    knob(
      { label: "curve", min: -0.4, max: 0.4, note: "how far forward the white panel arcs at mid-span, world units; 0 is straight, negative arcs it back" },
      () => A.wing.curve,
      (v) => ((A.wing.curve = v), changed()),
    ),
    knob(
      { label: "curve back", min: 0, max: 1, note: "how much of that arc the trailing edge follows; 1 is as much as the leading edge, 0 leaves it straight" },
      () => A.wing.curveBack,
      (v) => ((A.wing.curveBack = v), changed()),
    ),
    knob({ label: "elbow", min: 0, max: 1, note: "how the leading edge rounds off at the elbow into the tip; 0 is a corner, 1 a quarter-ellipse leaving the elbow along the span" }, () => A.wing.elbow, (v) => ((A.wing.elbow = v), changed())),
    knob(
      { label: "tip width", min: 0, max: 0.3, note: "the dark tip's width, front to back, world units; 0 is a sharp point" },
      () => A.wing.tipChord,
      (v) => ((A.wing.tipChord = v), changed()),
    ),
    knob(
      { label: "thick", min: 0.005, max: 0.3, note: "how thick the wing is at the shoulder, world units; half that at the elbow, a sliver at the tip" },
      () => A.wing.thick,
      (v) => ((A.wing.thick = v), changed()),
    ),
    knob(
      { label: "dihedral", min: -0.3, max: 0.5, note: "how much the elbow sits above the shoulder, world units" },
      () => A.wing.dihedral,
      (v) => ((A.wing.dihedral = v), changed()),
    ),
    knob(
      { label: "bow", min: -0.5, max: 1, note: "radians the whole wing is held up in a glide" },
      () => A.wing.bow,
      (v) => ((A.wing.bow = v), tuned()),
    ),
    knob(
      { label: "tip bow", min: -0.5, max: 1.2, note: "radians the outer panel bows up past that" },
      () => A.wing.tipBow,
      (v) => ((A.wing.tipBow = v), tuned()),
    ),
  );
  panel.append(heading("Beat"));
  panel.append(
    knob(
      { label: "glide", min: 0, max: 0.5, note: "radians of wing beat while gliding" },
      () => A.flap.glide,
      (v) => ((A.flap.glide = v), tuned()),
    ),
    knob(
      { label: "climb", min: 0, max: 1.5, note: "radians more at a full climb" },
      () => A.flap.climb,
      (v) => ((A.flap.climb = v), tuned()),
    ),
    knob(
      { label: "speed", min: 0, max: 8, note: "the beat while gliding, radians a second" },
      () => A.flap.speed,
      (v) => ((A.flap.speed = v), tuned()),
    ),
    knob(
      { label: "climb speed", min: 0, max: 20, note: "radians a second more at a full climb" },
      () => A.flap.climbSpeed,
      (v) => ((A.flap.climbSpeed = v), tuned()),
    ),
    knob(
      { label: "tip", min: 0, max: 2, note: "how much of the beat the outer panel adds on top" },
      () => A.flap.tip,
      (v) => ((A.flap.tip = v), tuned()),
    ),
    knob(
      { label: "climbing", min: 0, max: 1, note: "the lab's own: how hard the bird is climbing here (W in the field), to see the beat" },
      () => climb,
      (v) => (climb = v),
    ),
  );
  panel.append(heading("Wing wash"));
  const Sw = A.stipple;
  panel.append(
    knob({ label: "spacing", min: 0.01, max: 0.3, note: "world units between the wing's dots" }, () => Sw.spacing, (v) => ((Sw.spacing = v), changed())),
    knob({ label: "size", min: 0, max: 1, note: "a dot's radius, of that spacing, before its own variation; they grow out toward the tip" }, () => Sw.size, (v) => ((Sw.size = v), changed())),
    knob({ label: "vary", min: 0, max: 1, note: "how much the dots' sizes vary; 0 all alike, 1 from nothing to twice" }, () => Sw.vary, (v) => ((Sw.vary = v), changed())),
    knob({ label: "soft", min: 0, max: 1, note: "how soft a dot's edge is, of its radius; low is crisp, high bleeds" }, () => Sw.soft, (v) => ((Sw.soft = v), changed())),
    knob({ label: "wobble", min: 0, max: 1, note: "how far a dot's rim wanders from round" }, () => Sw.wobble, (v) => ((Sw.wobble = v), changed())),
    knob({ label: "from", min: 0, max: 1, note: "where along the wing the dots begin, 0 the shoulder to 1 the wingtip" }, () => Sw.from, (v) => ((Sw.from = Math.min(v, Sw.solid)), changed())),
    knob({ label: "solid", min: 0, max: 1, note: "where the ink is solid from; about 0.48 is the elbow, so the whole outer panel is dark" }, () => Sw.solid, (v) => ((Sw.solid = Math.max(v, Sw.from)), changed())),
    knob({ label: "bend", min: -0.3, max: 0.3, note: "how far the solid's edge bows toward the body at mid-chord, of the wing's length; negative bows it at the edges instead" }, () => Sw.bend, (v) => ((Sw.bend = v), changed())),
    knob({ label: "warp", min: 0, max: 0.3, note: "how far the solid's edge wanders, of the wing's length" }, () => Sw.warp, (v) => ((Sw.warp = v), changed())),
    knob({ label: "fade", min: 0, max: 1, note: "how strong the first dots are, of the ink; they strengthen out to the solid tip, so low only tints the feathers near the body" }, () => Sw.fade, (v) => ((Sw.fade = v), changed())),
  );
  panel.append(heading("Body wash"));
  const Bw = A.bodyWash;
  panel.append(
    knob({ label: "spacing", min: 0.01, max: 0.4, note: "world units between the body's dots" }, () => Bw.spacing, (v) => ((Bw.spacing = v), changed())),
    knob({ label: "size", min: 0, max: 1, note: "a dot's radius, of that spacing, before its own variation" }, () => Bw.size, (v) => ((Bw.size = v), changed())),
    knob({ label: "vary", min: 0, max: 1, note: "how much the dots' sizes vary; 0 all alike, 1 from nothing to twice" }, () => Bw.vary, (v) => ((Bw.vary = v), changed())),
    knob({ label: "soft", min: 0, max: 1, note: "how soft a dot's edge is, of its radius" }, () => Bw.soft, (v) => ((Bw.soft = v), changed())),
    knob({ label: "wobble", min: 0, max: 1, note: "how far a dot's rim wanders from round" }, () => Bw.wobble, (v) => ((Bw.wobble = v), changed())),
    knob({ label: "amount", min: 0, max: 1, note: "how many of the cells have a dot, 0 none to 1 all" }, () => Bw.amount, (v) => ((Bw.amount = v), changed())),
    knob({ label: "strength", min: 0, max: 1, note: "how dark the dots are, of the ink" }, () => Bw.strength, (v) => ((Bw.strength = v), changed())),
  );
  panel.append(heading("Colour"));
  panel.append(el("div", { class: "lab-row" }, [swatch("feathers", "white", "the body and inner wings"), swatch("ink", "dark", "the washes, and the wing's solid tip"), swatch("beak", "beak", "the beak")]));
  panel.append(
    el("div", { class: "lab-row" }, [
      el("button", {
        text: "copy albatross",
        title: "an ALBATROSS block, ready to paste into albatross.js",
        onclick: async () => {
          const src = `export const ALBATROSS = ${toSource(A)};`;
          try {
            await navigator.clipboard.writeText(src);
            say("albatross copied");
          } catch {
            console.log(src);
            say("clipboard blocked — printed to the console");
          }
        },
      }),
      el("button", {
        text: "reset",
        title: "every knob back to what albatross.js has",
        onclick: () => {
          Object.assign(A, structuredClone(DEFAULTS));
          save();
          location.reload();
        },
      }),
    ]),
  );

  // ---- the view bar: turn the ring, let it drift, or carry the camera round ----
  let drift = false;
  const driftBox = el("input", { type: "checkbox", onchange: (e) => (drift = e.target.checked) });
  // "pan" carries the camera slowly round the ring's front (the controls'
  // own auto-rotate, about the orbit target; dragging still works meanwhile)
  controls.autoRotateSpeed = 0.6; // degrees per frame at 60 fps: a lap in a minute
  const panBox = el("input", { type: "checkbox", onchange: (e) => (controls.autoRotate = e.target.checked) });
  nameOut = el("span", { class: "lab-seed", text: VARIANT_NAMES[front] });
  view.append(
    el("div", { id: "lab-viewbar" }, [
      el("button", { text: "‹", title: "the bird before (←)", onclick: () => bringToFront(front - 1) }),
      nameOut,
      el("button", { text: "›", title: "the next bird (→)", onclick: () => bringToFront(front + 1) }),
      el("label", { class: "lab-check", title: "the ring turns slowly on its own, a bird at a time" }, [driftBox, el("span", { text: "drift" })]),
      el("label", { class: "lab-check", title: "carry the camera slowly round" }, [panBox, el("span", { text: "pan" })]),
      (skyBtn = el("button", {
        text: backdrop,
        title: "day, dusk or night behind the birds",
        onclick: () => setBackdrop(BACKDROP_NAMES[(BACKDROP_NAMES.indexOf(backdrop) + 1) % BACKDROP_NAMES.length]),
      })),
      el("span", { class: "lab-hint", text: "click a bird to bring it front · drag to orbit · double-click to refit" }),
    ]),
  );
  addEventListener("keydown", (e) => {
    if (e.target.closest?.("input, select, textarea")) return;
    if (e.key === "ArrowLeft") bringToFront(front - 1);
    if (e.key === "ArrowRight") bringToFront(front + 1);
  });
  // A click (not a drag) on a bird brings it to the front
  const ray = new THREE.Raycaster(),
    pointer = new THREE.Vector2();
  let down = null;
  renderer.domElement.addEventListener("pointerdown", (e) => (down = [e.clientX, e.clientY]));
  renderer.domElement.addEventListener("pointerup", (e) => {
    if (!down || Math.hypot(e.clientX - down[0], e.clientY - down[1]) > 4) return;
    const r = renderer.domElement.getBoundingClientRect();
    pointer.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    ray.setFromCamera(pointer, camera);
    const hit = ray.intersectObjects(birds.map((b) => b.holder), true)[0];
    if (!hit) return;
    let o = hit.object; // up from the mesh hit to the bird's place on the ring
    while (o && !birds.some((b) => b.holder === o)) o = o.parent;
    const i = birds.findIndex((b) => b.holder === o);
    if (i >= 0) bringToFront(i);
  });

  // ---- run ------------------------------------------------------------
  // In front of the ring and a little above it, the front bird large,
  // the ring receding behind it
  const fitCamera = () => {
    camera.position.set(RING.camera[0], RING.camera[1], RING.radius + RING.camera[2]);
    controls.target.set(0, -0.2, RING.radius - 1.2);
    controls.update();
  };
  view.addEventListener("dblclick", fitCamera);
  const resize = () => {
    const w = view.clientWidth,
      h = view.clientHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / Math.max(1, h);
    camera.updateProjectionMatrix();
  };
  addEventListener("resize", resize);
  resize();
  fitCamera();
  const clock = new THREE.Clock();
  let lastDrift = 0;
  renderer.setAnimationLoop(() => {
    const delta = Math.min(clock.getDelta(), 0.1);
    const t = clock.elapsedTime;
    if (drift && t - lastDrift > RING.driftEvery) {
      lastDrift = t;
      bringToFront(front + 1);
    }
    // The ring eases round to the front bird, the shortest way
    let goal = -front * step;
    goal += Math.round((ringAngle - goal) / (Math.PI * 2)) * Math.PI * 2;
    ringAngle += (goal - ringAngle) * (1 - Math.exp(-delta * RING.ease));
    ring.rotation.y = ringAngle;
    birds.forEach(({ bird, holder, mats, meshes }, i) => {
      // How far round from the front it stands now, in steps: solid at the
      // front, fading to RING.faded a step away; no shadow while faded
      const off = Math.abs(Math.atan2(Math.sin(i * step + ringAngle), Math.cos(i * step + ringAngle))) / step;
      const solid = THREE.MathUtils.lerp(1, RING.faded, THREE.MathUtils.smoothstep(off, 0, 1));
      for (const m of mats) m.opacity = solid;
      for (const o of meshes) o.castShadow = solid > 0.6;
      bird.beat(delta, climb);
      bird.body.rotation.x = -climb * 0.45 * 0.7; // the nose follows the climb, as in the field
      holder.position.y = Math.sin(t * 0.7 + i * 1.3) * RING.bob; // each its own gentle rise and fall
    });
    controls.update();
    renderer.render(scene, camera);
  });
}
