// The statues: a head from heads.js on a pillar of a neck. Shared by the
// field (main.js) and the pillars lab (pillars.js), so what the lab shows is
// exactly what stands in the field.
//
//   variantHead(v)          head variant v (0 is the default head)
//   makeMaterials()         stone and eyes, with the neck bend and the
//                           weathering in their shaders
//   attachAttrs(g, count)   the per-statue attributes those shaders read
import * as THREE from "three";
import { buildHead, drawParams, DEFAULTS, STRETCH_FROM } from "./heads.js";

export const VARIANTS = 24; // each costs ~0.1 s to build at startup
// How different the variants are from one another. The knobs of every
// candidate head land somewhere in HEAD_RANGES and are then pushed toward
// the nearer end of their range by this much: 0 leaves them where they fell
// (so heads come out as shades of one middling head), 1 puts every knob at
// an end. Variant 0 is always the default head; see variantParams for how
// the rest are picked apart from it. The heads lab's "field" fill shows
// exactly these heads, with a slider for this.
export const VARIETY = 0.1; // (was 0.36)

// Every statue sprouts from a mound: it pushes up the earth around its foot,
// sized to the head, so the ground rises to meet the neck instead of the
// neck just being planted in flat grass. Mounds of neighbors add up. The
// field paints these into its terrain; the pillars lab shows them under
// each pillar, with a knob for every number here.
export const MOUND = {
  radius: [3.5, 2.2], // world units: a base, plus this much per unit of head scale
  height: [0.5, 0.55], // world units: a base, plus this much per unit of head scale
  shape: 1, // the profile: 1 = a smooth dome, higher = a steeper peak with a flatter skirt, lower = a plateau that drops at the rim
};
export const moundRadius = (s, M = MOUND) => M.radius[0] + M.radius[1] * s;
export const moundHeight = (s, M = MOUND) => M.height[0] + M.height[1] * s;
// The mound's height at t = 1 - distance / radius (1 at the center, 0 at the rim), as a fraction of its full height
export const moundRise = (t, M = MOUND) => Math.pow(t * t * (3 - 2 * t), M.shape);
export const HEAD_RANGES = {
  skull: {
    width: [0.7, 1.05],
    height: [0.9, 1.35],
    depth: [0.85, 1.2],
    sideFlat: [0.55, 0.86],
    cheekWidth: [0.22, 0.5],
    foreheadSlope: [0.1, 0.9],
    faceFlat: [0.78, 0.98],
  },
  jaw: {
    width: [0.45, 0.8],
    slope: [-0.85, -0.15],
    bevel: [0.25, 1.1],
    chinWidth: [0.05, 0.4],
    chinY: [-1.35, -0.95],
    chinFront: [0.62, 0.92],
    napeSlope: [-1.5, -0.5],
  },
  nose: {
    width: [0.6, 1.8],
    length: [0.6, 1.5],
    projection: [0.4, 1.8],
    y: [-0.15, 0.15],
  },
  mouth: {
    width: [0.5, 1.8],
    y: [-0.12, 0.12],
    lipFullness: [0.4, 2],
    upperLip: [0.4, 0.82], // capped: taller upper lips read wrong
    lowerLip: [0.4, 1.8],
  },
  eyes: {
    // as a share of the face: heads.js scales the eyes to the head's width at eye level, and fitEyes keeps them apart and on the front of the face
    spacing: [0.2, 0.3],
    y: [-0.12, 0.18],
    width: [0.75, 1.3],
    height: [0.8, 1.4],
    bulge: [2, 2], // no longer a knob (EYE_BULGE is fixed); the draw stays so the variants after it don't change
    tilt: [-0.35, 0.35],
  },
  ears: {
    size: [0.6, 1.6],
    y: [-0.2, 0.2],
    out: [-0.06, 0.12],
    back: [-0.15, 0.1],
  },
  neck: {
    filletReach: [0, 0.5],
    filletDrop: [0.1, 0.7],
  },
};

// The heads lab's ranges (heads.html, kept in localStorage as it saves
// them: a {vary, lo, hi, fixed} per knob, keyed group.name, and its
// variety) take over HEAD_RANGES and VARIETY here, so the field and the
// labs stand up the heads the lab shows. Nothing saved (or no storage: the
// node harness) leaves HEAD_RANGES as written above. Done before KNOBS is
// read off the ranges, below
const HEADS_LAB_KEY = "heads-lab-v2";
let savedVariety = null;
(function loadSavedHeadRanges() {
  let saved = null;
  try {
    saved = typeof localStorage === "undefined" ? null : JSON.parse(localStorage.getItem(HEADS_LAB_KEY) || "null");
  } catch {
    saved = null;
  }
  if (!saved?.ranges) return;
  for (const [key, r] of Object.entries(saved.ranges)) {
    const [g, n] = key.split(".");
    if (!g || !n || !(g in DEFAULTS) || !(n in DEFAULTS[g])) continue;
    (HEAD_RANGES[g] ??= {})[n] = r.vary ? [r.lo, r.hi] : r.fixed;
  }
  if (typeof saved.variety === "number") savedVariety = saved.variety;
})();
// Head variant v: variant 0 is the default head; the rest are picked
// deterministically from HEAD_RANGES, so the field looks the same every visit.
// Picked to differ: a pool of candidate heads is drawn (each knob pushed
// toward an end of its range by `variety`, see VARIETY), and the variants are
// taken from it one at a time, each the candidate furthest from every head
// picked so far, measured over all the knobs with each knob's range as the
// unit. Ten draws in a row would mostly land near the middle of every range
// and read as one head with small differences; this spreads them out.
const DEFAULT_HEAD = buildHead(DEFAULTS);
const VARIANT_POOL = 256; // candidates the variants are picked from
const KNOBS = Object.entries(HEAD_RANGES).flatMap(([g, knobs]) =>
  Object.keys(knobs)
    .filter((n) => HEAD_RANGES[g][n][1] > HEAD_RANGES[g][n][0])
    .map((n) => [g, n]),
);
const knobVec = (P) => KNOBS.map(([g, n]) => (P[g][n] - HEAD_RANGES[g][n][0]) / (HEAD_RANGES[g][n][1] - HEAD_RANGES[g][n][0]));
const variantSets = new Map(); // variety → the VARIANTS heads' params
export function variantParams(v, variety = savedVariety ?? VARIETY) {
  let set = variantSets.get(variety);
  if (!set) {
    const pool = Array.from({ length: VARIANT_POOL }, (_, c) => {
      let k = 0;
      const rnd = () => hash(c + 1, ++k, 5);
      const P = drawParams(rnd, HEAD_RANGES);
      for (const [g, n] of KNOBS) {
        const [lo, hi] = HEAD_RANGES[g][n],
          t = (P[g][n] - lo) / (hi - lo);
        P[g][n] = lo + (t + (Math.round(t) - t) * variety) * (hi - lo);
      }
      return { P, vec: knobVec(P), far: Infinity }; // far: how close the nearest picked head is
    });
    set = [DEFAULTS];
    let last = knobVec(DEFAULTS);
    while (set.length < VARIANTS) {
      let best = null;
      for (const c of pool) {
        c.far = Math.min(c.far, Math.sqrt(c.vec.reduce((s, x, i) => s + (x - last[i]) ** 2, 0)));
        if (c.far >= 0 && (!best || c.far > best.far)) best = c;
      }
      set.push(best.P);
      last = best.vec;
      best.far = -1; // picked: out of the running
    }
    variantSets.set(variety, set);
  }
  return set[v];
}
export function variantHead(v) {
  return v === 0 ? DEFAULT_HEAD : buildHead(variantParams(v));
}
// The bend pivots around the center of the neck's cross-section. The shader
// bakes in one pivot for every variant — the default head's — and the other
// necks differ from it by a few hundredths at most.
const ringC = DEFAULT_HEAD.ring
  .reduce((c, p) => c.add(p), new THREE.Vector3())
  .divideScalar(DEFAULT_HEAD.ring.length);
// How far the foot of every neck is sunk below the land (world units), so
// no base ever shows however the terrain slopes. On top of that, the mound
// each statue sprouts from (MOUND) heaps up around the foot, burying it
// aMound world units deeper. Anything measured "from the ground" (the soil
// stain) counts from the visible surface, the mound top,
// (BURY + aMound) / scale head units above the foot.
export const BURY = 2;
// The shader's neck numbers for a statue: aStretch, the straight zone's
// length in head units, and the mound lane, how far below the visible ground
// the foot sits past BURY. The zone is never shorter than MIN_STRETCH: a big
// head with its chin on the ground would otherwise ask for a zone of nothing
// (or less), and every height measured along it would blow up. Flooring it
// sinks the foot a little deeper instead, so the lane reports the true depth.
export const MIN_STRETCH = 0.2;
export function neckStretch(neckLen, mound, s) {
  const stretch = Math.max(MIN_STRETCH, (neckLen + mound + BURY) / s + STRETCH_FROM);
  return { stretch, bury: (stretch - STRETCH_FROM) * s - neckLen - BURY };
}
export const RCX = 0,
  RCZ = ringC.z; // symmetric in x
// The neck's mean radius about that center (head units)
export const RING_R = DEFAULT_HEAD.ring.reduce((sum, p) => sum + Math.hypot(p.x - ringC.x, p.z - ringC.z), 0) / DEFAULT_HEAD.ring.length;
export function hash(x, z, seed) {
  let h =
    Math.imul(x, 374761393) ^
    Math.imul(z, 668265263) ^
    Math.imul(seed, 1442695041);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

// Per-statue neck length, curl and fade-in ride along as instanced attributes
// (fade: how far each statue has faded in, 0 = still invisible, 1 = fully there).
// Every mesh (a variant's head, its eyes, an arm) is filled
// in its own order each frame, so each gets its own set of attributes
export function attachAttrs(g, count) {
  // Stretch, curl and mound share one vec4 (aNeck), and fade, twist and
  // taper another (aPose), to keep the attribute count down. Each lane still reads
  // and writes like an attribute of its own (setX, needsUpdate).
  const vec4 = (x, y, z, w) => {
    const at = new THREE.InstancedBufferAttribute(new Float32Array(count * 4), 4);
    for (let i = 0; i < count; i++) at.setXYZW(i, x, y, z, w);
    return at;
  };
  const lane = (at, c) => ({
    setX: (i, v) => at.setComponent(i, c, v),
    getX: (i) => at.getComponent(i, c),
    set needsUpdate(v) {
      at.needsUpdate = v;
    },
  });
  const neck = vec4(1, 0, 0, 0),
    pose = vec4(1, 0, 0, 0);
  const a = {
    stretch: lane(neck, 0), curl: lane(neck, 1), mound: lane(neck, 2),
    fade: lane(pose, 0), twist: lane(pose, 1), taper: lane(pose, 2),
    slopeX: lane(neck, 3), slopeZ: lane(pose, 3), // (the land's slope, no longer read; neck.w is now the arm's bend cap:)
    elbow: lane(pose, 3), // an arm's fixed elbow lean, the tangent of its angle (hands.js HANDS.elbowLean); 0 = straight
    bendCap: lane(neck, 3), // an arm's: the most its bend takes up, arm units (hands.js WRIST_B); 0 = as a neck bends
    neck, pose,
  };
  g.setAttribute("aNeck", neck);
  g.setAttribute("aPose", pose);
  // aId: a statue's identity for the shaders' per-statue hashes (its stone
  // tint, its weathering). 0 (the
  // default) hashes the instance's position instead, which is fine for
  // anything that stands still; anything that MOVES (the field's arms, a
  // follower) must set a nonzero id (small numbers, say 1 – 1000, are
  // best for the hashes) or its stains slide as it goes.
  a.id = new THREE.InstancedBufferAttribute(new Float32Array(count), 1);
  g.setAttribute("aId", a.id);
  // aNeck: x the stretch (shader units, the buried foot included); y the
  // curl; z how deep the mound buries the foot below the visible ground
  // (world units); w the land's slope along the statue's own x
  // aPose: x how far faded in; y radians the head is turned away from the
  // foot, wrung up the neck; z how far the foot is pinched toward the axis
  // (1 = to a point); w the land's slope along the statue's own z
  // (the slopes: rise per unit run, in the statue's frame; the lab's land is flat)
  return a;
}

// How long the curved part of the neck is, in head units, for a given stretch
// (never longer than the stretched zone itself, or the base of a short neck
// would lift out of the ground)
export const bendLen = (stretch, most = 6) => THREE.MathUtils.clamp(stretch * 0.5, Math.min(0.8, stretch), most); // most: the bend's length at most (head units); a statue's own, by a negative bendCap lane

// The same bend, on the CPU, for aiming: where the curve ends and which way it points
const SPINE = `
  float sy = 0.0; float sz = 0.0;
  for (int i = 0; i < 8; i++) {
    float u = (float(i) + 0.5) / 8.0 * t;
    float ph = aCurl * u * u;
    sy += cos(ph); sz += sin(ph);
  }
  sy *= B * t / 8.0; sz *= B * t / 8.0;`;
export function spineEnd(curl, B, t = 1) {
  let sy = 0,
    sz = 0;
  for (let i = 0; i < 8; i++) {
    const u = ((i + 0.5) / 8) * t;
    const ph = curl * u * u;
    sy += Math.cos(ph);
    sz += Math.sin(ph);
  }
  return { up: (sy * B * t) / 8, fwd: (sz * B * t) / 8 };
}

// The deformation: stretch the straight zone, then bend its top length B along a
// curve whose lean grows with height squared (straight at the bottom of the bend,
// fully leaned at the top). Everything above the neck — the head — moves rigidly
// to the curve's end, rotated by the full curl, so face and neck stay one piece.
// Twist and taper, applied to a point in the geometry's frame before the
// bend. Both work up the shaft from its foot (f = 0, buried) to the head
// (f = 1, and the head itself): the twist turns the section about the shaft's
// axis by aTwist * f, so the head faces aTwist away from the foot with the
// neck wrung between; the taper pinches the section toward the axis by
// aTaper at the foot, easing to nothing at the head (1 = to a point).
const twistTaperChunk = (varName) => `
  {
    float f = clamp(${varName}.y - ${(STRETCH_FROM - 1).toFixed(2)}, 0.0, 1.0);
    vec2 o = ${varName}.xz - vec2(${RCX.toFixed(3)}, ${RCZ.toFixed(3)});
    o *= 1.0 - aTaper * (1.0 - f);
    ${varName}.xz = vec2(${RCX.toFixed(3)}, ${RCZ.toFixed(3)}) + o;
  }`;
// The twist at a height `yExpr` (geometry frame): the whole bend and the
// head turn by the full aTwist, as one piece, so the fold still goes where
// the head faces; below the bend the straight shaft wrings from nothing at
// the foot up to the full turn where the bend starts. (Wringing through the
// bend as well made the neck corkscrew: the head turned on its axis while
// the fold kept the planted direction.)
// An arm (aBendCap > 0) turns its hand alone, about the wrist: the column
// below never wrings
const twistAt = (yExpr) => `(aBendCap > 0.0 ? aTwist * smoothstep(${(STRETCH_FROM - 0.06).toFixed(2)}, ${STRETCH_FROM.toFixed(2)}, ${yExpr})
    : ${yExpr} >= ${STRETCH_FROM.toFixed(2)} ? aTwist
    : aTwist * clamp((${yExpr} - ${(STRETCH_FROM - 1).toFixed(2)}) * aStretch / max(aStretch - BEND_LEN, 0.01), 0.0, 1.0))`;
// Turn a point about the neck's axis by tw (the same turn the CPU mirrors in headSpot)
const turnChunk = (varName, tw) => `
  {
    float c = cos(${tw}), s = sin(${tw});
    vec2 o = ${varName}.xz - vec2(${RCX.toFixed(3)}, ${RCZ.toFixed(3)});
    ${varName}.xz = vec2(${RCX.toFixed(3)}, ${RCZ.toFixed(3)}) + vec2(o.x * c - o.y * s, o.x * s + o.y * c);
  }`;
const ELBOW_DOWN = 2.2; // head units under an arm's joint (the wrist) its elbow stands: a little past the built forearm (hands.js ELBOW_DOWN)
function bendChunk(varName) {
  return `
  ${twistTaperChunk(varName)}
  {
    float y0 = ${varName}.y;
    float B = BEND_LEN;
    if (y0 >= ${STRETCH_FROM.toFixed(2)}) {
      float t = 1.0;
      ${SPINE}
      vec3 rel = ${varName} - vec3(${RCX.toFixed(3)}, ${STRETCH_FROM.toFixed(2)}, ${RCZ.toFixed(3)});
      float c = cos(aCurl), s = sin(aCurl);
      rel = vec3(rel.x, rel.y * c - rel.z * s, rel.y * s + rel.z * c);
      ${varName} = vec3(${RCX.toFixed(3)}, ${STRETCH_FROM.toFixed(2)} - B + sy, ${RCZ.toFixed(3)} + sz) + rel;
    } else {
      float y = ${STRETCH_FROM.toFixed(2)} + (y0 - ${STRETCH_FROM.toFixed(2)}) * aStretch;
      float d = ${STRETCH_FROM.toFixed(2)} - y;
      if (d < B) {
        float t = (B - d) / B;
        ${SPINE}
        float ph = aCurl * t * t;
        float c = cos(ph), s = sin(ph);
        vec3 o = vec3(${varName}.x - ${RCX.toFixed(3)}, 0.0, ${varName}.z - ${RCZ.toFixed(3)});
        ${varName} = vec3(${RCX.toFixed(3)}, ${STRETCH_FROM.toFixed(2)} - B + sy, ${RCZ.toFixed(3)} + sz)
          + vec3(o.x, -o.z * s, o.z * c);
      } else {
        ${varName}.y = y;
      }
    }
    float tw = ${twistAt("y0")};
    ${turnChunk(varName, "tw")}
    // An arm's elbow (aElbow, the tangent of its lean; 0 for a neck): the
    // ELBOW_DOWN under the joint (the built forearm) leans along the arm's
    // own z (its rest: the hand's turn, above, never swings it round),
    // everything above it carried along: a slight, fixed bend
    if (aElbow != 0.0) {
      float dj = y0 >= ${STRETCH_FROM.toFixed(2)} ? 0.0 : (${STRETCH_FROM.toFixed(2)} - y0) * aStretch; // how far under the joint, stretched
      ${varName}.z += aElbow * max(0.0, ${ELBOW_DOWN.toFixed(2)} - dj);
    }
  }`;
}
// How far the surface has leaned at height `yExpr` (in head space): the full
// curl above the neck, easing to nothing down the bend
const phaseChunk = (yExpr, out) => `
    float ${out};
    {
      float B = BEND_LEN;
      float py = ${yExpr};
      if (py >= ${STRETCH_FROM.toFixed(2)}) {
        ${out} = aCurl;
      } else {
        float y = ${STRETCH_FROM.toFixed(2)} + (py - ${STRETCH_FROM.toFixed(2)}) * aStretch;
        float d = ${STRETCH_FROM.toFixed(2)} - y;
        float t = max(0.0, (B - d) / B);
        ${out} = aCurl * t * t;
      }
    }`;
// The lighting normal turns with the surface it belongs to
const normalChunk = (yExpr) => `
  {
    ${phaseChunk(yExpr, "ph")}
    float c = cos(ph), s = sin(ph);
    objectNormal = vec3(objectNormal.x, objectNormal.y * c - objectNormal.z * s, objectNormal.y * s + objectNormal.z * c);
    float tw = ${twistAt(yExpr)};
    float tc = cos(tw), ts = sin(tw);
    objectNormal.xz = vec2(objectNormal.x * tc - objectNormal.z * ts, objectNormal.x * ts + objectNormal.z * tc);
  }`;
// The bend, injected into any material's shader (inside onBeforeCompile):
// the per-statue lanes declared, the normal turned with the surface, and
// `transformed` stretched, bent and wrung AFTER begin_vertex (at the
// displacementmap_vertex token, which is kept), so anything that moves
// `transformed` in begin_vertex first (the shell moss's offset) is bent
// with it. The fade-in goes in the fragment (depth: whether it draws yet).
// It reads only the per-instance lanes (aNeck, aPose, aId) and the
// instance matrix: nothing per material.
export function injectBend(shader, depth = false) {
  shader.vertexShader =
    "attribute vec4 aNeck;\n" +
    "#define aStretch aNeck.x\n" +
    "#define aCurl aNeck.y\n" +
    "#define aMound aNeck.z\n" +
    "#define aBendCap aNeck.w\n" + // an arm's: the most its bend takes up (0 = as a neck bends)
    "#define BEND_LEN (aBendCap > 0.0 ? min(clamp(aStretch * 0.5, min(0.8, aStretch), 6.0), aBendCap) : clamp(aStretch * 0.5, min(0.8, aStretch), aBendCap < 0.0 ? -aBendCap : 6.0))\n" + // a negative cap lengthens the bend instead (bendLen's most)
    "attribute vec4 aPose;\n" +
    "attribute float aId;\n" +
    "#define statueXZ (aId != 0.0 ? vec2(aId * 0.7317, aId * 0.3931) : instanceMatrix[3].xz)\n" +
    "#define aFade aPose.x\n" +
    "#define aTwist aPose.y\n" +
    "#define aTaper aPose.z\n" +
    "#define aElbow aPose.w\n" + // an arm's fixed elbow lean (the tangent of its angle); 0 for a neck
    "varying float vFade;\n" +
    shader.vertexShader
      .replace("#include <beginnormal_vertex>", "#include <beginnormal_vertex>" + normalChunk("position.y"))
      .replace("#include <displacementmap_vertex>", "#include <displacementmap_vertex>\n  vFade = aFade;" + bendChunk("transformed"));
  // Fading in: the lit pass blends the finished color up from the fog
  // color, so a new statue condenses out of the haze. The shadow pass has
  // no color to blend, and dithering fragments away there left the shadows
  // full of holes, so instead the shadow simply arrives once the statue has
  // mostly condensed.
  shader.fragmentShader =
    "varying float vFade;\n" +
    (depth
      ? shader.fragmentShader.replace("#include <clipping_planes_fragment>", `#include <clipping_planes_fragment>
        if (vFade < 0.6) discard;`)
      : shader.fragmentShader.replace("#include <fog_fragment>", `#include <fog_fragment>
        #ifdef USE_FOG
        gl_FragColor.rgb = mix(fogColor, gl_FragColor.rgb, vFade);
        #endif`));
}
function patchBend(material) {
  material.customProgramCacheKey = () => "bend";
  material.onBeforeCompile = (shader) => injectBend(shader, !!material.isMeshDepthMaterial);
}

// Weathering: the stone is not one clean cream. Broad patches have faded pale
// or dulled gray, dirt has settled on the upward faces and run down the sides
// in streaks, the foot is stained with soil, and here and there the surface has
// tarnished to rust-ochre with clusters of dark lichen specks. All of it is
// noise sampled per pixel in head space, before the neck stretches or bends,
// so it stays glued to the surface while the statue moves. Each statue gets
// its own offset into the noise, so the stains never repeat.
const WEATHER = {
  fade: { amount: 0.45, scale: 0.9 }, // broad light/dark drift; scale ≈ patches per head
  grime: { amount: 0.6, scale: 2.2 }, // settled dirt + run-off streaks
  soil: { amount: 0.55, height: 1.4 }, // darkening up from the ground (head units)
  tarnish: { amount: 0.55, scale: 3.0, cover: 0.62 }, // rust patches; higher cover = rarer
  lichen: 0.76, // where the dark lichen specks start (of their noise, 0 – 1): lower = more of them
};
const weatherVert = `
  {
    float wy = position.y < ${STRETCH_FROM.toFixed(2)}
      ? ${STRETCH_FROM.toFixed(2)} + (position.y - ${STRETCH_FROM.toFixed(2)}) * aStretch
      : position.y;
    vWeatherP = vec3(position.x, wy, position.z);
    vWeatherH = wy + 1.5 + aStretch - (${BURY.toFixed(1)} + aMound) / length(instanceMatrix[0].xyz); // height above the visible ground, the mound top (head units)
    vWeatherN = normal;                            // as the statue stood, upright
    float s1 = fract(sin(dot(statueXZ, vec2(27.163, 91.731))) * 43758.5453);
    float s2 = fract(sin(dot(statueXZ, vec2(63.719, 17.293))) * 43758.5453);
    vWeatherOff = vec3(s1 * 37.0, s2 * 53.0, (s1 + s2) * 29.0);
    vWeatherStone = tStone(statueXZ);
    vBand = aBand;
  }`;
// Tints: no two stones are quite the same gray. Each statue draws its own
// from where it stands, so its head and neck agree. The stone keeps its hue:
// only how gray and how light it is moves. Every value is a ± fraction:
// saturation 0.3 means the color's saturation is scaled by anything from
// 0.7 to 1.3.
const TINT = {
  stone: { saturation: 0.3, lightness: 0.07 },
};
const tintDecl = `
float tHash(vec2 xz, vec2 k) { return fract(sin(dot(xz, k)) * 43758.5453) * 2.0 - 1.0; } // -1..1
vec3 tSat(vec3 c, float k) { float l = dot(c, vec3(0.299, 0.587, 0.114)); return mix(vec3(l), c, k); }
// The stone's tint for the statue at xz: (saturation scale, lightness scale)
vec2 tStone(vec2 xz) {
  return vec2(1.0 + tHash(xz, vec2(41.37, 19.83)) * ${TINT.stone.saturation.toFixed(2)},
              1.0 + tHash(xz, vec2(9.29, 67.51)) * ${TINT.stone.lightness.toFixed(2)});
}
vec3 tApplyStone(vec3 c, vec2 t) { return tSat(c, t.x) * t.y; }`;
const weatherDecl = `
varying vec3 vBand; // an obelisk's inscription band (aBand: from, to, a symbol's cell); none for a statue
varying vec2 vWeatherStone; // this statue's stone tint (tStone)
varying vec3 vWeatherP;
varying vec3 vWeatherN;
varying vec3 vWeatherOff;
varying float vWeatherH;
float wHash(vec3 p) {
  p = fract(p * 0.3183099 + vec3(0.1, 0.2, 0.3));
  p *= 17.0;
  return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
}
float wNoise(vec3 x) {
  vec3 i = floor(x), f = fract(x);
  f = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(mix(wHash(i), wHash(i + vec3(1, 0, 0)), f.x), mix(wHash(i + vec3(0, 1, 0)), wHash(i + vec3(1, 1, 0)), f.x), f.y),
    mix(mix(wHash(i + vec3(0, 0, 1)), wHash(i + vec3(1, 0, 1)), f.x), mix(wHash(i + vec3(0, 1, 1)), wHash(i + vec3(1, 1, 1)), f.x), f.y),
    f.z);
}
float wFbm(vec3 p) {
  return (0.5 * wNoise(p) + 0.25 * wNoise(p * 2.03 + 5.2) + 0.125 * wNoise(p * 4.01 + 1.7)) / 0.875;
}
// An inscription's symbols, in a cell's own square (q from -0.5 to 0.5):
// how far from the stroke (or inside, for the dot). A regular n-gon's edge,
// a point up
float wGon(vec2 q, float n, float r) {
  float a = atan(q.x, q.y), seg = 6.2831853 / n;
  return cos(floor(0.5 + a / seg) * seg - a) * length(q) - r;
}
float wStroke(vec2 q, float x) { return max(abs(q.x - x), abs(q.y) - 0.3); } // a stroke up the cell at x
float wGlyph(float id, vec2 q) {
  if (id < 1.0) return abs(length(q) - 0.28); // ring
  if (id < 2.0) return abs(wGon(q, 3.0, 0.17)); // triangle
  if (id < 3.0) return abs(max(abs(q.x), abs(q.y)) - 0.25); // square
  if (id < 4.0) return abs(wGon(q, 5.0, 0.22)); // pentagon
  if (id < 5.0) return max(abs(q.y), abs(q.x) - 0.3); // a bar
  if (id < 6.0) return wStroke(q, 0.0); // I
  if (id < 7.0) return min(wStroke(q, -0.11), wStroke(q, 0.11)); // II
  if (id < 8.0) return min(min(wStroke(q, -0.2), wStroke(q, 0.0)), wStroke(q, 0.2)); // III
  if (id < 9.0) return length(q) - 0.02; // a dot (drawn as a stroke round a point)
  return 1.0; // a gap
}
`;
const weatherFrag = `
  float wGrime = 0.0;
  {
    vec3 p = vWeatherP + vWeatherOff;
    vec3 col = tApplyStone(diffuseColor.rgb, vWeatherStone); // this statue's own gray
    float up = clamp(vWeatherN.y, 0.0, 1.0);
    float low = 1.0 - smoothstep(0.0, 3.0, vWeatherH);   // the lower reaches catch more of everything

    // Fade: sun-bleached warm cream in places, dull cool gray in others
    float tone = wFbm(p * ${WEATHER.fade.scale.toFixed(2)}) - 0.5;
    float t = clamp(0.5 + tone * 2.2, 0.0, 1.0);
    vec3 fadeTint = mix(vec3(0.70, 0.70, 0.73), vec3(1.07, 1.05, 1.0), t);
    col *= mix(vec3(1.0), fadeTint, ${WEATHER.fade.amount.toFixed(2)});

    // Grime: settled on the tops, streaked down the sides, thicker near the ground
    float gs = ${WEATHER.grime.scale.toFixed(2)};
    float dirt = wFbm(p * gs + 11.0);
    float streak = wFbm(vec3(p.x * 1.7, p.y * 0.22, p.z * 1.7) * gs + 23.0);
    wGrime = smoothstep(0.42, 0.75, dirt) * (0.3 + 0.7 * up + 0.4 * low)
           + smoothstep(0.52, 0.8, streak) * (1.0 - up) * (0.55 + 0.4 * low);
    wGrime = clamp(wGrime, 0.0, 1.0) * ${WEATHER.grime.amount.toFixed(2)};
    col = mix(col, vec3(0.30, 0.27, 0.23), wGrime);

    // Soil: the foot has stood in wet earth
    float soil = 1.0 - smoothstep(0.0, ${WEATHER.soil.height.toFixed(2)}, vWeatherH + 0.7 * (dirt - 0.5));
    col = mix(col, vec3(0.34, 0.29, 0.22), soil * ${WEATHER.soil.amount.toFixed(2)});

    // Tarnish: sparse rust-ochre blooms with dark lichen specks clustered on them
    float rustN = wFbm(p * ${WEATHER.tarnish.scale.toFixed(2)} + 7.0);
    float cut = ${WEATHER.tarnish.cover.toFixed(2)};
    float rust = smoothstep(cut, cut + 0.14, rustN);
    col = mix(col, vec3(0.56, 0.37, 0.20), rust * ${WEATHER.tarnish.amount.toFixed(2)});
    float specN = wNoise(p * ${WEATHER.tarnish.scale.toFixed(2)} * 3.7 + 3.0);
    float spec = smoothstep(${WEATHER.lichen.toFixed(2)}, ${(WEATHER.lichen + 0.14).toFixed(2)}, specN) * smoothstep(cut - 0.2, cut, rustN);
    col = mix(col, vec3(0.20, 0.18, 0.16), spec * ${WEATHER.tarnish.amount.toFixed(2)} * 0.85);

    // An obelisk's inscription: a column of symbols carved up the middle of
    // a side face, within its band, a cell each (rings, triangles,
    // squares, pentagons, a bar, I, II, III, a dot, or a gap), each face
    // its own run of them (from the obelisk's own offset), some faces
    // bare; the grooves darkened, a little worn
    float inscribeAA = fwidth(vWeatherP.y) * 1.2 / max(vBand.z, 1e-3); // a pixel, in a cell's units: taken here, outside the branches, where the slopes are sure
    if (vBand.y > vBand.x + vBand.z) {
      vec3 n = normalize(vWeatherN);
      float c = vBand.z, y = vWeatherP.y;
      if (abs(n.y) < 0.6 && y > vBand.x && y < vBand.y) {
        float u = dot(vWeatherP.xz, normalize(vec2(-n.z, n.x))); // across the face
        float face = floor(mod(atan(n.z, n.x) / 6.2831853 * 8.0 + 0.5, 8.0));
        vec3 seed = vWeatherOff + vec3(face * 7.13, 0.0, 0.0);
        float rows = floor((vBand.y - vBand.x) / c),
          run = floor(rows * (0.35 + 0.65 * wHash(seed + 4.1))); // how far up it runs
        float row = floor((y - vBand.x) / c);
        if (wHash(seed + 9.7) < 0.7 && row < run && abs(u) < c * 0.5) {
          vec2 q = vec2(u / c, fract((y - vBand.x) / c) - 0.5);
          float id = floor(wHash(seed + vec3(0.0, row * 3.71, 1.3)) * 10.0);
          float d = wGlyph(id, q), aa = inscribeAA;
          float m = 1.0 - smoothstep(0.055 - aa, 0.055 + aa, d);
          m *= 0.6 + 0.4 * wNoise(p * 6.0); // worn
          col = mix(col, col * 0.45, m);
        }
      }
    }

    diffuseColor.rgb = col;
  }`;
// Layered onto a material that patchBend has already set up: the earlier
// hooks run first, then the weathering slots in after them.
function patchWeather(material) {
  const prevKey = material.customProgramCacheKey.bind(material);
  const prevCompile = material.onBeforeCompile;
  material.customProgramCacheKey = () => prevKey() + "-weather";
  material.onBeforeCompile = (shader) => {
    prevCompile(shader);
    shader.vertexShader =
      "attribute vec3 aBand;\n" + // an obelisk's (scenery.js buildObelisk); unset, it reads 0: no inscription
      tintDecl +
      weatherDecl +
      shader.vertexShader.replace(
        "#include <begin_vertex>",
        "#include <begin_vertex>" + weatherVert,
      );
    shader.fragmentShader =
      tintDecl +
      weatherDecl +
      shader.fragmentShader
        .replace(
          "#include <color_fragment>",
          "#include <color_fragment>" + weatherFrag,
        )
        // damp, dirty stone is a touch less chalky than clean stone
        .replace(
          "#include <roughnessmap_fragment>",
          "#include <roughnessmap_fragment>\n  roughnessFactor = mix(roughnessFactor, 0.72, wGrime);",
        );
  };
}

// The statue materials, each with the neck bend (and the stone's weathering)
// patched into its shaders.
export function makeMaterials() {
  // Eyes: carved from the same stone, several shades deeper so they read
  // Okunoin stone: cool gray granite, damp. (The old cream was 0xe0dac9 with
  // eyes 0x6e6656, if the field ever wants its plaster back.)
  const dark = new THREE.MeshStandardMaterial({
    color: 0x55534d,
    roughness: 1,
  });
  const plaster = new THREE.MeshStandardMaterial({
    color: 0xa7a59c,
    roughness: 0.95,
  });
  patchBend(plaster);
  patchBend(dark); // the eyes stay clean
  patchWeather(plaster);

  // The shadow pass draws with its own depth material, so it gets the same neck
  // bend as the lit pass or the shadows would show every statue standing straight
  const headDepth = new THREE.MeshDepthMaterial({
    depthPacking: THREE.RGBADepthPacking,
  });
  patchBend(headDepth);
  return { plaster, dark, headDepth };
}

export const MAX_CURL = 1.75; // just past face-straight-down, for looming right over you

// How far a head can pitch before it meets the ground. The head swings rigidly
// around the end of the bend (which itself sinks a little as the neck curls);
// the chin touches down first when it looks down, the back of the skull when it
// looks up. Found once per statue by bisection on the CPU spine.
export const CHIN_DEPTH = 1.15; // how far the chin hangs below the head's origin (head units)
export const CLEARANCE = 0.3; // what the lowest point keeps above the ground (world units)
// The two low points, relative to the bend pivot (head units)
const CHIN = { y: -CHIN_DEPTH - STRETCH_FROM, z: 0.8 - RCZ };
const BACK = { y: -0.5 - STRETCH_FROM, z: -1.0 - RCZ };
export function lowestPoint(h, curl) {
  const { stretch } = neckStretch(h.neckLen, h.mound ?? 0, h.s);
  const B = bendLen(stretch, h.bendMost);
  const pivotY = STRETCH_FROM - B + spineEnd(curl, B).up;
  const c = Math.cos(curl),
    s = Math.sin(curl);
  const y = Math.min(CHIN.y * c - CHIN.z * s, BACK.y * c - BACK.z * s); // the shader's rotation
  return h.neckLen + (pivotY + y) * h.s;
}
// The furthest curl toward `limit` (from 0) that keeps the head clear of the ground
export function curlLimit(h, limit) {
  const clear = (curl) => lowestPoint(h, curl) >= CLEARANCE - 1e-6;
  if (clear(limit)) return limit;
  let lo = 0,
    hi = limit;
  for (let i = 0; i < 14; i++) {
    const m = (lo + hi) / 2;
    if (clear(m)) lo = m;
    else hi = m;
  }
  return lo;
}
