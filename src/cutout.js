import * as THREE from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";

// Two ways to cut a small thing.
//
// A CARD is flat — a teardrop outline extruded a little, reading as a shape
// from the front and as cardboard from the side. Petals are cards.
//
// A STRAND is round — a tapered tube bent along a curve, like a length of
// spaghetti. Grass is strands. A flat card CANNOT read as grass: seen
// edge-on it vanishes, and its silhouette always comes to a blade-like edge,
// which is what makes a field of them look like spikes rather than fluff.

// ---------------------------------------------------------------- cards

// The outline runs base (x = 0) to tip (x = len). The BASE IS A STRAIGHT EDGE
// — the closing line of the path — so a card stood on it sits flush.
//
// `bow` is how far the sides swell on the way out: 1 runs them straight for a
// trapezoid, above 1 rounds them into the teardrop.
export function teardropOutline(base, tip, len, bow) {
  const b = base / 2;
  const a = tip / 2;
  const swell = Math.max(b, a) * bow;

  const s = new THREE.Shape();
  s.moveTo(0, b);
  s.quadraticCurveTo(len * 0.55, swell, len, a); // one side, bowed outward
  // A tip with any width gets rounded over. One tapered to nothing is left as
  // the sharp point the two sides already meet at.
  if (a > 1e-4) s.quadraticCurveTo(len + a * 1.3, 0, len, -a);
  s.quadraticCurveTo(len * 0.55, -swell, 0, -b); // the other side, back down
  s.closePath(); // <- the flat base
  return s;
}

// One geometry per DISTINCT card, shared by everything that matches it.
// Built inline instead, an eight-petal star hung on eight runs would
// triangulate the same outline sixty-four times at startup.
const cards = new Map();

// `upright` stands the card on its base with its length running +y, which is
// what anything GROWING out of a surface wants; left off, the card lies along
// +x, which is what anything radiating from a center wants.
export function cardGeometry({
  base,
  tip,
  length,
  depth,
  bow = 1.15,
  segments = 6,
  upright = false,
}) {
  const key = `${base}:${tip}:${length}:${depth}:${bow}:${segments}:${upright}`;
  if (!cards.has(key)) {
    const g = new THREE.ExtrudeGeometry(
      teardropOutline(base, tip, length, bow),
      { depth, bevelEnabled: false, curveSegments: segments },
    );
    // Extrude runs 0..depth, so this re-centers the card on its own face.
    g.translate(0, 0, -depth / 2);
    if (upright) g.rotateZ(Math.PI / 2); // length +x -> +y, base still at 0
    cards.set(key, g);
  }
  return cards.get(key);
}

// `count` cards round a ring, merged into one geometry: a flower's petals or
// a star's points. Each card runs from `inner` (the edge of a middle, or 0)
// out to `outer`, `width` across at its base and `taper` times that at its
// tip, lifted `pitch` degrees out of the flat about its base, then aimed
// round. The card is cut once and shared (above), so each copy is cloned
// before it is turned into place. Negative turn, so card 0 sits on +x and
// the rest step the same way the post ring does.
export function petalRing({
  count,
  inner,
  outer,
  width,
  taper,
  thickness,
  pitch = 0,
}) {
  const card = cardGeometry({
    base: width,
    tip: width * taper,
    length: outer - inner,
    depth: thickness,
  });
  const parts = Array.from({ length: count }, (_, i) => {
    const g = card.clone();
    // Extrude builds the card in xy with depth along +z; laid into the
    // ring's plane, set with its base against the middle, pitched up about
    // that base, then aimed round.
    g.rotateX(Math.PI / 2);
    g.translate(inner, 0, 0);
    g.rotateZ((pitch * Math.PI) / 180);
    g.rotateY(-(i / count) * Math.PI * 2);
    return g;
  });
  return mergeGeometries(parts, false);
}

// --------------------------------------------------------------- strands

// A noodle standing on the ground: round in section, fatter at the root than
// the tip, and arcing over rather than standing to attention.
//
//   stiff  how far up the strand runs dead straight before it starts to
//          curl. This is the whole difference between grass with a bit of
//          spring in it and cooked spaghetti lying over — high is stiff.
//   bend   how far the tip finishes from over the root.
//   shade  darkens the root, leaves the tip bright. Depth in a mass of grass
//          comes from the field being dark UNDERNEATH; without this it reads
//          as a flat green mat however many strands there are.
//   soft   leans every normal toward straight up, so the field lights as one
//          soft carpet rather than thousands of separately-lit tubes
//          twinkling at you as the camera moves. The single biggest lever on
//          whether it looks painted or plastic.
//   tip    how white the very tip is, 0 none to 1 pure white, coming in
//          from `tipFrom` of the way up. Not a color the vertex colors can
//          carry — those only darken — so it rides in a `frost` attribute
//          the material mixes toward white (see frostShader).
const strands = new Map();
export function strandGeometry({
  length,
  radius,
  taper = 0.9,
  cap = 1.15,
  bend = 0.4,
  stiff = 0.6,
  shaft = 2,
  dome = 4,
  radial = 5,
  shade = 1,
  soft = 0,
  tip = 0,
  tipFrom = 0.6,
}) {
  const key = `${length}:${radius}:${taper}:${cap}:${bend}:${stiff}:${shaft}:${dome}:${radial}:${shade}:${soft}:${tip}:${tipFrom}`;
  if (strands.has(key)) return strands.get(key);

  // A LATHE, the way the dolly parts are turned: state the radius at each
  // height and spin it. The cap is part of that same profile rather than a
  // separate ball stuck on the end — which is what was deforming, because a
  // sphere is aligned to the world while the end of a bent tube is aligned to
  // its own tangent, so the two never met cleanly.
  const neck = radius * taper; // width where the shaft meets the cap
  const domeH = neck * cap; // how tall the dome is
  const shaftH = Math.max(1e-4, length - domeH);

  const profile = [];
  // The shaft: root out at `radius`, narrowing (or swelling, if taper > 1) to
  // the neck.
  for (let i = 0; i <= shaft; i++) {
    const u = i / shaft;
    profile.push(new THREE.Vector2(radius + (neck - radius) * u, shaftH * u));
  }
  // The cap: a quarter circle, so the radius closes to nothing exactly as the
  // height reaches the top. `cap` at 1 is a true hemisphere; above it the
  // dome draws out taller and more bulbous, below it squashes down.
  for (let i = 1; i <= dome; i++) {
    const a = ((i / dome) * Math.PI) / 2;
    profile.push(
      new THREE.Vector2(neck * Math.cos(a), shaftH + domeH * Math.sin(a)),
    );
  }

  const g = new THREE.LatheGeometry(profile, radial);

  // Bent AFTER turning: every vertex at a given height shifts by the same
  // amount, so the strand keeps its round section and only its spine curves.
  //
  // The exponent is `stiff`: at 1 the strand leans like a ramp straight from
  // the root, and the higher it goes the longer the strand holds vertical
  // before the curl gathers at the top.
  const p = 1 + stiff * 5;
  const pos = g.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const t = Math.min(1, Math.max(0, pos.getY(i) / length));
    pos.setZ(i, pos.getZ(i) + bend * length * Math.pow(t, p));
  }
  pos.needsUpdate = true;
  g.computeVertexNormals(); // the bend sheared them, so redo them properly

  // Root-to-tip shading and softened normals, in one pass.
  const n = g.attributes.normal;
  const col = new Float32Array(pos.count * 3);
  const up = new THREE.Vector3(0, 1, 0);
  const nv = new THREE.Vector3();
  for (let i = 0; i < pos.count; i++) {
    const t = Math.min(1, Math.max(0, pos.getY(i) / length));
    nv.set(n.getX(i), n.getY(i), n.getZ(i)).lerp(up, soft).normalize();
    n.setXYZ(i, nv.x, nv.y, nv.z);
    const lit = shade + (1 - shade) * t;
    col[i * 3] = col[i * 3 + 1] = col[i * 3 + 2] = lit;
  }
  n.needsUpdate = true;
  g.setAttribute("color", new THREE.BufferAttribute(col, 3));
  if (tip > 0) {
    const frost = new Float32Array(pos.count);
    for (let i = 0; i < pos.count; i++) {
      const t = Math.min(1, Math.max(0, pos.getY(i) / length));
      const u = Math.min(1, Math.max(0, (t - tipFrom) / (1 - tipFrom)));
      frost[i] = tip * u * u * (3 - 2 * u);
    }
    g.setAttribute("frost", new THREE.BufferAttribute(frost, 1));
  }

  strands.set(key, g);
  return g;
}

// The material's side of `frost`: mixed toward white after the vertex and
// instance colors have had their say, so a frosted tip is white whatever
// block the tuft was pinched from. Handed to a material as its
// onBeforeCompile, with frostKey as its customProgramCacheKey so it does
// not share a program with the unfrosted.
export function frostShader(shader) {
  shader.vertexShader = shader.vertexShader
    .replace(
      "#include <common>",
      "#include <common>\nattribute float frost;\nvarying float vFrost;",
    )
    .replace(
      "#include <color_vertex>",
      "#include <color_vertex>\nvFrost = frost;",
    );
  shader.fragmentShader = shader.fragmentShader
    .replace("#include <common>", "#include <common>\nvarying float vFrost;")
    .replace(
      "#include <color_fragment>",
      "#include <color_fragment>\ndiffuseColor.rgb = mix(diffuseColor.rgb, vec3(1.0), vFrost);",
    );
}
export const frostKey = () => "frost";
