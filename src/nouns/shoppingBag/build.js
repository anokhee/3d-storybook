import * as THREE from "three";

import { toon } from "../../adjectives/unlit/toon.js";
import { ORANGE } from "../orange/objects.js";
import { buildOrange } from "../orange/build.js";
import { APPLE } from "../apple/objects.js";
import { buildApple } from "../apple/build.js";
import { BANANA } from "../banana/objects.js";
import { BAGUETTE } from "../baguette/objects.js";
import { buildBaguette } from "../baguette/build.js";
import { BROCCOLI } from "../broccoli/objects.js";
import { buildBroccoli } from "../broccoli/build.js";
import { buildBanana } from "../banana/build.js";

// THE SHOPPING BAG, built (see SHOPPING_BAG in ./objects.js for what each
// setting is): a THREE.Group whose origin is the top of its handle, where a
// hand grips it, the bag hanging down from there. Plain three.js, so the
// crowd can clone it into many hands (a clone shares the geometry and
// materials); `disposeShoppingBag` frees one built here.
const hexOf = (c) => c?.hex ?? c;
const mats = new Map();
const matOf = (hex, opacity = 1) => {
  const key = `${hex}|${opacity}`;
  if (!mats.has(key)) mats.set(key, toon(new THREE.Color(hex), { side: THREE.DoubleSide, ...(opacity < 1 ? { transparent: true, opacity } : {}) }));
  return mats.get(key);
};

// a soft, seeded crease field over the sack (u round it, v up it)
function creases(seed) {
  let s = seed * 9301 + 49297;
  const r = () => ((s = (s * 16807) % 2147483647) / 2147483647);
  const waves = Array.from({ length: 7 }, () => ({ a: 1 + Math.floor(r() * 6), b: 1 + r() * 5, p: r() * Math.PI * 2, q: r() * Math.PI * 2, w: 0.4 + r() * 0.6 }));
  const total = waves.reduce((t, w) => t + w.w, 0);
  return (u, v) => waves.reduce((t, w) => t + w.w * Math.sin(w.a * u + w.p) * Math.sin(w.b * v * Math.PI + w.q), 0) / total;
}

// the sack's surface: `v0`..`v1` of the way up it, `out` scaling it a hair
// outward (the printed band lies just over the plastic)
function sackGeometry(C, v0 = 0, v1 = 1, out = 1, rows = 22, round = 36) {
  const H = C.height, top = -C.handle.height, crease = creases(C.seed);
  const pos = [], idx = [];
  for (let i = 0; i <= rows; i++) {
    const v = v0 + ((v1 - v0) * i) / rows;
    // its outline up the side: closed round at the bottom, swelling out at
    // the middle, drawn in a little at the top
    const close = Math.sqrt(Math.min(1, v / 0.14));
    const swell = 1 + C.bulge * Math.sin(Math.PI * Math.min(1, v * 1.1));
    const draw = 1 - C.gather * Math.pow(v, 3);
    const k = close * swell * draw * out;
    for (let j = 0; j <= round; j++) {
      const u = (j / round) * Math.PI * 2, cu = Math.cos(u), su = Math.sin(u);
      // a soft box of a section (a superellipse): a bag is boxy, not round
      const e = 0.6, sx = Math.sign(cu) * Math.pow(Math.abs(cu), e), sz = Math.sign(su) * Math.pow(Math.abs(su), e);
      const c = 1 + (C.crumple / ((C.width + C.depth) / 4)) * crease(u, v) * close;
      pos.push(sx * (C.width / 2) * k * c, top - H + v * H + (v > 0.97 ? crease(u * 2, 0.3) * C.crumple * 0.8 : 0), sz * (C.depth / 2) * k * c);
    }
  }
  for (let i = 0; i < rows; i++)
    for (let j = 0; j < round; j++) {
      const a = i * (round + 1) + j, b = a + 1, c = a + round + 1, d = c + 1;
      idx.push(a, c, b, b, c, d);
    }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}

export function buildShoppingBag(C) {
  const group = new THREE.Group();
  const plastic = hexOf(C.colors.plastic), band = hexOf(C.colors.band);
  const skin = matOf(plastic, C.opacity);
  const sack = new THREE.Mesh(sackGeometry(C), skin);
  sack.castShadow = true;
  group.add(sack);
  // a printed band round it, if it has one
  if (band && band.toLowerCase() !== plastic.toLowerCase()) group.add(new THREE.Mesh(sackGeometry(C, 0.52, 0.64, 1.006, 4), matOf(band, Math.min(1, C.opacity + 0.08))));
  // the handle: one loop from the top of each side up to the grip and down
  // the other, front layer and back (a carrier bag's two sides)
  const top = -C.handle.height, a = (C.width / 2) * C.handle.spread * (1 - C.gather);
  // a baguette stood between the two layers pushes them apart, out to the
  // walls, and they stay apart further up before meeting at the grip
  const loaf = C.contents === "baguette";
  const [z0, z1, z2] = loaf ? [0.29, 0.9, 0.5] : [0.12, 0.6, 0.2];
  for (const z of [-1, 1]) {
    const zz = z * C.depth * z0;
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-a, top - 0.01, zz), new THREE.Vector3(-a * 0.75, top + C.handle.height * 0.55, zz * z1),
      new THREE.Vector3(-a * 0.3, -C.handle.tube, zz * z2), new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(a * 0.3, -C.handle.tube, zz * z2), new THREE.Vector3(a * 0.75, top + C.handle.height * 0.55, zz * z1),
      new THREE.Vector3(a, top - 0.01, zz),
    ]);
    group.add(new THREE.Mesh(new THREE.TubeGeometry(curve, 40, C.handle.tube, 6, false), skin));
  }
  // what peeks out of the top
  const lean = ((C.seed * 37) % 7) / 7 - 0.5, at = top - 0.02;
  if (C.contents === "baguette") {
    // a fat loaf (Food/Baked/Baguette), stood in the middle of the sack
    // between the handle's two layers (spread apart for it, above),
    // leaning out to one side, its slashes facing out
    const b = buildBaguette(BAGUETTE);
    b.position.set(C.width * 0.12, at - 0.04, 0);
    b.rotation.set(0.05 * lean, 0, -0.3 - 0.1 * lean);
    group.add(b);
  }
  // a head of broccoli (Food/Produce/Broccoli), its crown out of the
  // top, leaning a little ("greens", as the bag has always called it)
  if (C.contents === "broccoli" || C.contents === "greens") {
    const head = buildBroccoli(BROCCOLI);
    head.position.set(-C.width * 0.04, at - 0.07, 0);
    head.rotation.z = 0.12 + 0.1 * lean;
    group.add(head);
  }
  // fruit (Food/Produce): three oranges or apples heaped at the top, or a
  // bunch of bananas stood up in it, leaning out
  if (C.contents === "oranges" || C.contents === "apples") {
    const make = C.contents === "oranges" ? () => buildOrange(ORANGE) : (i) => buildApple({ ...APPLE, leaf: i === 2 ? APPLE.leaf : null });
    [[-0.045, 0.0], [0.035, 0.012], [-0.002, 0.03]].forEach(([x, y], i) => {
      const m = make(i);
      m.position.set(x * (C.width / 0.26), at + y - 0.015 - 0.038, (i - 1) * C.depth * 0.12);
      m.rotation.y = i * 2.1;
      group.add(m);
    });
  }
  if (C.contents === "bananas") {
    const bunch = buildBanana({ ...BANANA, count: 3 });
    bunch.rotation.set(0.1, 0.3, Math.PI / 2 - 0.35 - 0.15 * lean);
    bunch.position.set(C.width * 0.15, at + 0.03, 0);
    group.add(bunch);
  }
  group.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.geometry.deleteAttribute?.("uv"); } });
  return group;
}

export function disposeShoppingBag(group) {
  group.traverse((o) => o.isMesh && o.geometry.dispose());
}
