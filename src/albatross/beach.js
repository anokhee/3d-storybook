// The beach, shared by the scene lab (scene.js), where it is tuned, and
// the field (main.field.js), which wears it: the grass sits on the sand
// like a patty, a little raised with a rounded shoulder, and the sand
// runs on into the water. Two parts:
//  - the beach line: each island's lobes drawn as polygons (polygonLobes)
//    and melted together, so the edge of the grass runs in straight sides
//    that meet at corners (makeBeach: the line field, the land's height)
//  - the shader: the ground's material painted per pixel from the line
//    field and the world position: sand past the line, pebbles on it,
//    paint pentagons on the grass (beachShader, makeBeachUniforms)
// Every value here is a knob; the lab (scene.html) is where to try them.
import * as THREE from "three";
import { hash } from "./statues.js";

// The beach line: the edge of the grass, where the sand starts. It
// follows the island's edge, `at` world units out from it (in from it
// when negative, so the beach is wider), but drawn with straight sides
// (each lobe of the island as a polygon, `sides` of them) that meet at
// corners. The line's field is worked out per vertex of the ground and
// handed to the shader, which colors either side of it.
export const BEACH = {
  at: -3, // world units out from the grass's edge the line lies (negative = in: more beach)
  fade: 1.5, // world units the sand takes to blend into the grass, centered on the line: 0 = a crisp cut
  sides: [14, 20], // how many straight sides each lobe's run of line has, drawn per lobe
  uneven: 0.45, // how unevenly the corners are spaced round a lobe: 0 = a regular polygon, 1 = any side may be twice its neighbor
  stagger: 0.06, // how far each side sits in or out from the rest, of the lobe's radius
  wave: 0, // world units the line wanders in and out along the shore (0 keeps the sides straight)
  waveScale: 6, // world units along the shore between one wander and the next
  // The patty: inside the line the grass stands up off the sand, its top
  // rounding over like a quarter circle from the line in, so the edge
  // reads as a soft raised rim rather than a step
  lift: 1.2, // world units the grass stands above the sand: the patty's thickness (0 = flat on the sand)
  round: 3, // world units in from the line the top takes to round over to level: the shoulder's width (the field's ground is 2 units a cell, so under about 4 it stair-steps there)
};
// Paint on the grass, in the palette's splotch color: pentagons, big and
// small, each turned its own way, placed the way the sand's pebbles are
export const SPLOTCH = {
  ground: 0.9, // how solidly the pentagons lie on the grass: 0 = none, 1 = the color flat
  dotSize: 1.8, // world units of grass each pentagon has to itself (was 1.1, then 2.5: too big; everything scales with it)
  dotSpan: [0.2, 0.5], // how big a pentagon is, point to center, as a share of that: each draws its own from this range (0.5 fills its space)
  dotCover: 0.3, // how many of those spaces hold a pentagon (0 = none, 1 = all)
  // A second scatter of small ones, pebble-sized, among the big: the same
  // shapes, in cells of their own, in their own color (palette.js splotch2)
  smallSize: 0.8, // world units of grass each small pentagon has to itself (the sand's pebbles have SAND.pebbleSize, 0.8)
  smallCover: 0.15, // how many of those spaces hold one
};
// The sand's markings, painted per pixel the way the heads' weathering is:
// pebbles, small round dots in a gray of their own, fading out as the sand
// goes under the water
export const SAND = {
  pebbles: 0.9, // how clearly the pebbles show: 0 = none, 1 = in their full gray
  pebbleSize: 0.8, // world units of sand each pebble has to itself (the pebble is a third to two-thirds of that across)
  pebbleCover: 0.1, // how many of those spaces hold a pebble (0 = none, 1 = all)
  pebbleTone: [0.55, 1.2], // how dark or pale a pebble is, as a factor on the sand's color: each draws its own from this range
};

// Smooth value noise over the ground, 0..1 (the field's hash on a grid,
// blended between the corners)
export const noise2 = (x, z, seed) => {
  const ix = Math.floor(x),
    iz = Math.floor(z),
    u = THREE.MathUtils.smoothstep(x - ix, 0, 1),
    v = THREE.MathUtils.smoothstep(z - iz, 0, 1);
  const h = (i, j) => hash(i, j, seed);
  return THREE.MathUtils.lerp(THREE.MathUtils.lerp(h(ix, iz), h(ix + 1, iz), u), THREE.MathUtils.lerp(h(ix, iz + 1), h(ix + 1, iz + 1), u), v);
};

// Each lobe of an island as a polygon too, for the beach line: its sides'
// outward normals, turned its own way, the corners unevenly spaced
// (BEACH.uneven) and each side set a little in or out (BEACH.stagger), so
// no two sides are alike. draw(i, n) is a hash in 0..1 for lobe i and draw n.
export function polygonLobes(lobes, draw) {
  for (const [i, l] of lobes.entries()) {
    const n = BEACH.sides[0] + Math.floor(draw(50 + i, 1) * (BEACH.sides[1] - BEACH.sides[0] + 1)),
      turn = draw(50 + i, 2) * Math.PI * 2;
    const flat = (1 + Math.cos(Math.PI / n)) / 2; // the sides sit this much of the radius out: midway between the polygon inscribed in the circle and the one about it
    const angles = Array.from({ length: n }, (_, k) => turn + ((k + (draw(60 + i, k) - 0.5) * BEACH.uneven) / n) * Math.PI * 2);
    l.sides = angles.map((a, k) => [Math.sin(a), Math.cos(a), flat * (1 + (draw(70 + i, k) - 0.5) * 2 * BEACH.stagger)]);
  }
  return lobes;
}

// The beach over a set of islands: lobesNear(x, z) gives the lobes that
// bear on a point (the lab's one island; the field's 3×3 cells about it,
// in a reused array), islandField(x, z) their round, melted edge (negative
// on the grass, 0 at its edge, growing out over the water), blend how
// wide the lobes melt into each other, shore how far the land takes to
// fall from the grass to the seabed and depth how far under the grass the
// seabed lies. Gives back:
//  - polyField: the islands' straight-sided edge, the same way
//  - lineField: the beach line's field: BEACH.at on the line, the grass
//    inside, the sand out (polyField, wandering if BEACH.wave asks)
//  - landHeight(x, z, g?): the land: the grass patty, BEACH.lift above
//    the sand with its rounded shoulder at the line, and the shore falling
//    to the seabed past the island's edge (g: the line field, if known)
//  - onGrass: inside the beach line
export function makeBeach({ lobesNear, islandField, blend, shore, depth }) {
  const { smoothstep } = THREE.MathUtils;
  // How far out past lobe l's furthest side (x, z) lies
  const polyDist = (l, x, z) => {
    let d = -Infinity;
    for (const [nx, nz, off] of l.sides) d = Math.max(d, (x - l.x) * nx + (z - l.z) * nz - l.r * off);
    return d;
  };
  // The lobes' smooth-minimum field, each lobe its polygon, so the runs
  // between corners are straight (the shore and the foam keep the round
  // lobes; the beach line takes this)
  const polyField = (x, z) => {
    const lobes = lobesNear(x, z);
    let m = Infinity;
    for (const l of lobes) m = Math.min(m, polyDist(l, x, z));
    if (m === Infinity) return 1e6;
    let sum = 0;
    for (const l of lobes) sum += Math.exp(-(polyDist(l, x, z) - m) / blend);
    return m - blend * Math.log(sum);
  };
  const lineField = (x, z) => {
    if (!BEACH.wave) return polyField(x, z);
    const S = BEACH.waveScale;
    const wander = (0.7 * noise2(x / S, z / S, 301) + 0.3 * noise2((x * 2.7) / S, (z * 2.7) / S, 302) - 0.5) * 2 * BEACH.wave;
    return polyField(x, z) - wander;
  };
  // The shore: the sand, level, falling from the island's edge to the seabed
  const shoreHeight = (x, z) => {
    const t = islandField(x, z) / shore;
    return t >= 1 ? -depth : -depth * smoothstep(t, 0, 1);
  };
  // The patty's shoulder: 0 at the line, 1 (the full lift) BEACH.round in,
  // rounding over like a quarter circle (steep at the line, level on top)
  const shoulder = (d) => (d <= 0 ? 0 : d >= BEACH.round ? 1 : Math.sqrt(1 - (1 - d / BEACH.round) ** 2));
  const landHeight = (x, z, g = lineField(x, z)) => shoreHeight(x, z) + BEACH.lift * shoulder(BEACH.at - g);
  const onGrass = (x, z) => lineField(x, z) < BEACH.at;
  return { polyField, lineField, shoreHeight, landHeight, onGrass };
}

// ---- the shader -------------------------------------------------------------
// The uniforms the beach's shader reads, at the knobs' values; the colors
// are left for the caller to set (the lab from its palette, the field from
// its constants). waterY: where the sea's surface lies.
export function makeBeachUniforms(waterY) {
  return {
    uSand: { value: new THREE.Color() },
    uSeabed: { value: new THREE.Color() },
    uSplotch: { value: new THREE.Color() },
    uSplotch2: { value: new THREE.Color() }, // the small ones' color
    uWaterY: { value: waterY },
    uBeachAt: { value: BEACH.at },
    uFade: { value: BEACH.fade },
    uSplotchGround: { value: SPLOTCH.ground },
    uDotSize: { value: SPLOTCH.dotSize },
    uDotCover: { value: SPLOTCH.dotCover },
    uSmallSize: { value: SPLOTCH.smallSize },
    uSmallCover: { value: SPLOTCH.smallCover },
    uDotSpan: { value: new THREE.Vector2(...SPLOTCH.dotSpan) },
    uPebbles: { value: SAND.pebbles },
    uPebbleSize: { value: SAND.pebbleSize },
    uPebbleCover: { value: SAND.pebbleCover },
    uPebbleTone: { value: new THREE.Vector2(...SAND.pebbleTone) },
  };
}
// The beach, in a ground material's shader (a vertex-colored
// MeshStandardMaterial): the vertices carry the grass (and the mounds'
// earth) as color and the beach line's field (aLine). Past the line the
// pixel is sand instead, pebbled, darkening to seabed with the depth under
// the water; the grass wears paint pentagons. Laid over whatever the
// material's onBeforeCompile did already (the field's rim sink), which
// runs first.
export function beachShader(material, uniforms) {
  const prevCompile = material.onBeforeCompile,
    prevKey = material.customProgramCacheKey.bind(material);
  material.customProgramCacheKey = () => prevKey() + "|beach";
  material.onBeforeCompile = (shader, renderer) => {
    if (prevCompile) prevCompile.call(material, shader, renderer);
    Object.assign(shader.uniforms, uniforms);
    shader.vertexShader =
      "attribute float aLine;\nvarying float vLine;\nvarying vec3 vBeachPos;\n" +
      shader.vertexShader.replace("#include <begin_vertex>", "#include <begin_vertex>\n  vLine = aLine;\n  vBeachPos = (modelMatrix * vec4(transformed, 1.0)).xyz;");
    shader.fragmentShader =
      `uniform vec3 uSand, uSeabed, uSplotch, uSplotch2;\nuniform float uWaterY, uBeachAt, uFade, uSplotchGround, uDotSize, uDotCover, uSmallSize, uSmallCover, uPebbles, uPebbleSize, uPebbleCover;\nuniform vec2 uPebbleTone, uDotSpan;\nvarying float vLine;\nvarying vec3 vBeachPos;\nfloat rockHash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float rockNoise(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(mix(rockHash(i), rockHash(i + vec2(1.0, 0.0)), f.x), mix(rockHash(i + vec2(0.0, 1.0)), rockHash(i + vec2(1.0, 1.0)), f.x), f.y);
}
// A round dot: g is the surface in cells, one dot to a cell if the cell's
// draw falls under cover, sitting a little off the cell's center, a third
// to two-thirds of the cell across, edged over a pixel. id comes back as
// the cell's own draw, for whatever is dotted to color itself by
float dotAt(vec2 g, float cover, out float id) {
  vec2 cell = floor(g);
  vec2 centre = cell + 0.5 + (vec2(rockHash(cell + 3.1), rockHash(cell + 9.4)) - 0.5) * 0.4;
  float r = 0.15 + 0.15 * rockHash(cell + 1.3), d = length(g - centre), aa = fwidth(d);
  id = rockHash(cell + 5.5);
  return (1.0 - smoothstep(r - aa, r + aa, d)) * step(rockHash(cell + 0.7), cover);
}
// A pentagon: g is the grass in cells, one pentagon to a cell if the
// cell's draw falls under cover, its size (point to center) drawn from
// uDotSpan of the cell, turned its own way, and set off the cell's center
// as far as its size leaves room for, edged over a pixel
float pentagonAt(vec2 g, float cover) {
  vec2 cell = floor(g);
  float r = mix(uDotSpan.x, uDotSpan.y, rockHash(cell + 1.3) * rockHash(cell + 6.1)); // two draws, so the small ones are the common ones
  vec2 centre = cell + 0.5 + (vec2(rockHash(cell + 3.1), rockHash(cell + 9.4)) - 0.5) * 2.0 * max(0.5 - r, 0.0);
  vec2 off = g - centre;
  float seg = 6.2831853 / 5.0;
  float a = atan(off.y, off.x) + rockHash(cell + 2.2) * seg;
  float d = cos(floor(0.5 + a / seg) * seg - a) * length(off); // how far out toward the nearest side
  float aa = fwidth(d);
  float apothem = r * cos(0.5 * seg);
  return (1.0 - smoothstep(apothem - aa, apothem + aa, d)) * step(rockHash(cell + 0.7), cover);
}
` +
      shader.fragmentShader.replace(
        "#include <color_fragment>",
        `#include <color_fragment>
  {
    float wet = clamp((uWaterY - vBeachPos.y) / 1.5, 0.0, 1.0);
    vec3 sand = mix(uSand, uSeabed, wet);
    // The sand's markings (SAND): pebbles, the sand in cells uPebbleSize
    // across, each with its own draw against the cover, a round dot a
    // little off the cell's center, in its own gray, edged over a pixel
    vec2 q = vBeachPos.xz;
    float pebbleId;
    float pebble = dotAt(q / uPebbleSize, uPebbleCover, pebbleId);
    float tone = mix(uPebbleTone.x, uPebbleTone.y, pebbleId);
    sand = mix(sand, sand * tone, pebble * uPebbles * (1.0 - wet));
    // Pentagons of paint over the grass, in cells uDotSize across, and
    // small ones among them in cells uSmallSize across, in a color of
    // their own (drawn over the big ones where they meet)
    vec3 grass = mix(diffuseColor.rgb, uSplotch, pentagonAt(q / uDotSize + 50.0, uDotCover) * uSplotchGround);
    grass = mix(grass, uSplotch2, pentagonAt(q / uSmallSize + 130.0, uSmallCover) * uSplotchGround);
    // Sand into grass over uFade either side of the line (never sharper than a pixel)
    float reach = max(0.5 * uFade, fwidth(vLine));
    vec3 c = mix(grass, sand, smoothstep(uBeachAt - reach, uBeachAt + reach, vLine));
    diffuseColor.rgb = c;
  }`,
      );
  };
}
