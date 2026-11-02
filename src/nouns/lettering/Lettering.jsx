import { useEffect, useMemo, useState } from "react";
import * as THREE from "three";
import { Font } from "three/examples/jsm/loaders/FontLoader.js";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";

import { merge } from "../../world/merge.js";
import { mulberry32, noise3 } from "../../world/random.js";
import { unlitMat } from "../../adjectives/unlit/material.js";
import { GLYPH_OF, LETTERING } from "./objects.js";

// THE TYPEFACES: three's own (examples/fonts, the bold cut of each), each
// fetched the first time a word asks for it and kept, so a street of signs
// loads a font once and a page with none (or all in glyphs) loads none.
const FILES = {
  helvetiker: () => import("three/examples/fonts/helvetiker_bold.typeface.json"),
  optimer: () => import("three/examples/fonts/optimer_bold.typeface.json"),
  gentilis: () => import("three/examples/fonts/gentilis_bold.typeface.json"),
  "droid sans": () => import("three/examples/fonts/droid/droid_sans_bold.typeface.json"),
  "droid serif": () => import("three/examples/fonts/droid/droid_serif_bold.typeface.json"),
};
const fonts = new Map();
const fontOf = (name) => {
  const file = FILES[name] ?? FILES[LETTERING.font];
  if (!fonts.has(file)) fonts.set(file, file().then((m) => new Font(m.default ?? m)));
  return fonts.get(file);
};
// The font by name, or null until it has arrived (and null for no name).
export function useFont(name) {
  const [font, setFont] = useState(null);
  useEffect(() => {
    if (!name) return;
    let on = true;
    fontOf(name).then((f) => on && setFont(f));
    return () => { on = false; };
  }, [name]);
  return name ? font : null;
}

// THE GLYPHS, as shapes in a cell `size` square about the origin (the
// cell's q from -0.5 to 0.5, as wGlyph has it), their strokes `t` wide: a
// ring is a disc with a disc cut out, an n-gon one n-gon inside another
// (a point up), the strokes and the bar plain rectangles, the dot a disc.
const ring = (r) => new THREE.Shape().absarc(0, 0, r, 0, Math.PI * 2, false);
const gon = (n, R) => new THREE.Shape(Array.from({ length: n }, (_, i) => { const a = (i / n) * Math.PI * 2; return new THREE.Vector2(Math.sin(a) * R, Math.cos(a) * R); }));
const rect = (x0, x1, y0, y1) => new THREE.Shape([new THREE.Vector2(x0, y0), new THREE.Vector2(x1, y0), new THREE.Vector2(x1, y1), new THREE.Vector2(x0, y1)]);
const hollow = (outer, inner) => { outer.holes.push(inner); return outer; };
function glyphShapes(name, size, t) {
  const k = size, w = t * k;
  const stroke = (x) => rect(x * k - w / 2, x * k + w / 2, -0.3 * k, 0.3 * k);
  // (an n-gon's stroke, uniform, is its circumradius out and in by
  // t / 2cos(π/n), for a point-up polygon of circumradius R)
  const gonStroke = (n, R) => { const d = w / 2 / Math.cos(Math.PI / n); return [hollow(gon(n, R * k + d), gon(n, R * k - d))]; };
  switch (name) {
    case "ring": return [hollow(ring(0.28 * k + w / 2), ring(0.28 * k - w / 2))];
    case "triangle": return gonStroke(3, 0.3);
    case "square": return [hollow(rect(-0.25 * k - w / 2, 0.25 * k + w / 2, -0.25 * k - w / 2, 0.25 * k + w / 2), rect(-0.25 * k + w / 2, 0.25 * k - w / 2, -0.25 * k + w / 2, 0.25 * k - w / 2))];
    case "pentagon": return gonStroke(5, 0.27);
    case "bar": return [rect(-0.3 * k, 0.3 * k, -w / 2, w / 2)];
    case "I": return [stroke(0)];
    case "II": return [stroke(-0.11), stroke(0.11)];
    case "III": return [stroke(-0.2), stroke(0), stroke(0.2)];
    case "dot": return [ring(0.07 * k)];
    default: return [];
  }
}

// The word as letters, each its shapes about the pen and how far the pen
// moves on: in the glyph script one glyph a letter, a cell apart (a space
// moves it on without one); in a font the typeface's own glyphs and
// advances.
function lettersOf(C, font) {
  const size = C.size, out = [];
  for (const ch of [...C.say]) {
    if (C.script === "font") {
      const glyph = font.data.glyphs[ch] ?? font.data.glyphs["?"];
      const advance = (glyph?.ha ?? font.data.resolution * 0.3) * (size / font.data.resolution);
      out.push({ shapes: ch === " " || !glyph ? [] : font.generateShapes(ch, size), advance });
    } else {
      const G = C.glyphs;
      if (ch === " ") out.push({ shapes: [], advance: G.space * size });
      else out.push({ shapes: glyphShapes(GLYPH_OF(ch), size, G.stroke), advance: G.advance * size, cell: true });
    }
  }
  return out;
}

// An outline walked again at an even `step`, so the wobble has points
// enough to bend between the shape's own few: a straight stem is two
// points and would stay straight however it was pushed.
function resample(pts, step) {
  if (pts.length > 1 && pts[0].distanceToSquared(pts[pts.length - 1]) < 1e-12) pts = pts.slice(0, -1);
  const out = [];
  for (let i = 0; i < pts.length; i++) {
    const a = pts[i], b = pts[(i + 1) % pts.length];
    const n = Math.max(1, Math.ceil(a.distanceTo(b) / step));
    for (let k = 0; k < n; k++) out.push(a.clone().lerp(b, k / n));
  }
  return out;
}

// The letters set down and got wrong: each at the pen (its spacing
// drifted) — a glyph centred on its cell, a font's letter at its own
// origin — then by its own rolls grown, squeezed, tilted about its
// middle and bobbed off the line, then every outline point pushed by the
// noise, and the lot sheared by `slant`. The noise is read at the point's
// place in the letter, not where it ends up, so it stays smooth along the
// outline however the letter was moved first.
function shapesOf(letters, C) {
  const W = C.wrong, size = C.size;
  const rand = mulberry32((W.seed * 7919 + 17) >>> 0), roll = () => rand() * 2 - 1;
  const step = size / 28, amp = W.wobble * size * 0.1, f = W.grain / size;
  const tan = Math.tan((W.slant * Math.PI) / 180);
  const shapes = [];
  let pen = 0;
  letters.forEach(({ shapes: raw, advance, cell }, i) => {
    const x0 = pen + (cell ? advance / 2 : 0) + W.drift * size * roll();
    pen += advance;
    if (!raw.length) return;
    const bb = new THREE.Box2();
    raw.forEach((s) => s.getPoints(4).forEach((p) => bb.expandByPoint(p)));
    const cx = (bb.min.x + bb.max.x) / 2, cy = (bb.min.y + bb.max.y) / 2;
    const grow = 1 + W.grow * roll(), sx = 1 + W.squeeze * roll();
    const tilt = (W.tilt * roll() * Math.PI) / 180, c = Math.cos(tilt), s = Math.sin(tilt);
    const bob = W.bob * size * roll();
    const wrong = (p) => {
      const lx = (p.x - cx) * grow * sx, ly = (p.y - cy) * grow;
      let x = lx * c - ly * s + cx + x0, y = lx * s + ly * c + cy + bob;
      x += noise3(p.x * f, p.y * f, i * 3.7, W.seed) * amp;
      y += noise3(p.x * f + 11.3, p.y * f + 5.1, i * 3.7, W.seed + 101) * amp;
      return new THREE.Vector2(x + y * tan, y);
    };
    for (const shape of raw) {
      const { shape: outer, holes } = shape.extractPoints(8);
      const out = new THREE.Shape(resample(outer, step).map(wrong));
      out.holes = holes.map((h) => new THREE.Path(resample(h, step).map(wrong)));
      shapes.push(out);
    }
  });
  return shapes;
}

// The word, built: every letter extruded `thick` and bevelled, joined
// into one geometry, its face to +z (it lies from -thick/2 to +thick/2,
// as the Numeral does) and its middle brought to x = 0. `anchor` says
// where it stands on y: "foot" (the default: the bottom of the word on
// y = 0, standing on the ground as the Numeral does) or "middle" (centred,
// for the Sign to set on the middle of its board). `fit`, if given as
// { width, height }, scales the whole word down (or up) to lie inside
// that much, for a board of a known size; without it, `size` rules.
export default function Lettering({ config, fit, anchor = "foot" }) {
  const C = useMemo(() => merge(LETTERING, config), [config]);
  const font = useFont(C.script === "font" ? C.font : null);
  const built = useMemo(() => {
    if (!C.say || (C.script === "font" && !font)) return null;
    const shapes = shapesOf(lettersOf(C, font), C);
    if (!shapes.length) return null;
    const bevel = Math.min(C.bevel, C.thick / 2 - 1e-3);
    const parts = shapes.map((shape) => new THREE.ExtrudeGeometry(shape, {
      depth: C.thick,
      bevelEnabled: bevel > 0,
      bevelSize: bevel,
      bevelThickness: bevel,
      bevelSegments: 2,
      curveSegments: 1,
    }));
    const g = mergeGeometries(parts, false);
    parts.forEach((p) => p.dispose());
    g.computeBoundingBox();
    const b = g.boundingBox, w = b.max.x - b.min.x, h = b.max.y - b.min.y;
    g.translate(-(b.min.x + b.max.x) / 2, -(b.min.y + b.max.y) / 2, -(b.min.z + b.max.z) / 2);
    return { geometry: g, width: w, height: h };
  }, [font, C]);
  useEffect(() => () => built?.geometry.dispose(), [built]);
  if (!built) return null;
  const k = fit ? Math.min(fit.width / built.width, fit.height / built.height) : 1;
  return <mesh geometry={built.geometry} material={unlitMat(C.color)} scale={k} position-y={anchor === "foot" ? (built.height * k) / 2 : 0} castShadow />;
}
