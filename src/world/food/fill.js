import * as THREE from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";

import { mulberry32 } from "../random.js";
import { fruitMat } from "../fruit/parts.js";
import { buildFriedEgg } from "../../nouns/fryingPan/egg.js";

// WHAT FILLS A ROUND DISH, built: a bowl's (Food/Kitchen/Bowl) or a
// cookpot's (Food/Kitchen/Cookpot), so the same curry is in both. Each is a
// THREE.Group lying on y = 0 (the filling's surface), `R` the dish's inside
// radius there; plain three.js, `disposeFill` frees one. `seed` deals where
// the bits lie.

export const FILL_COLORS = {
  curry: "#D98A2B",
  rice: "#FBF7EE",
  carrot: "#EE7B2E",
  potato: "#F2D27A",
  broth: "#E8B66A",
  noodle: "#F4DC94",
  white: "#FBF7EE",
  yolk: "#F2B92E",
};

const disc = (R, hex) => {
  const m = new THREE.Mesh(new THREE.CylinderGeometry(R, R, 0.006, 32), fruitMat(hex));
  m.position.y = -0.003;
  return m;
};

// Curry: a sauce to the brim of the fill, a mound of rice on one side,
// chunks of carrot and potato in the rest.
export function buildCurry(R, seed = 3, colors = FILL_COLORS) {
  const r = mulberry32(seed * 7919 + 1);
  const g = new THREE.Group();
  g.add(disc(R, colors.curry));
  const rice = new THREE.Mesh(new THREE.SphereGeometry(R * 0.55, 18, 10, 0, Math.PI * 2, 0, Math.PI / 2), fruitMat(colors.rice));
  rice.scale.y = 0.55;
  rice.position.set(-R * 0.38, -R * 0.04, R * 0.05);
  g.add(rice);
  for (let i = 0; i < 6; i++) {
    const s = R * (0.11 + r() * 0.05);
    const c = new THREE.Mesh(new THREE.BoxGeometry(s, s, s), fruitMat(i % 2 ? colors.potato : colors.carrot));
    const a = -1.2 + (i / 5) * 2.4 + (r() - 0.5) * 0.4, d = R * (0.25 + r() * 0.45);
    c.position.set(R * 0.2 + Math.cos(a) * d * 0.8, s * 0.15, Math.sin(a) * d);
    c.rotation.set(r() * 3, r() * 3, r() * 3);
    g.add(c);
  }
  return g;
}

// Noodles: a broth, and heaped in it a pile of long wavy noodles — each
// one folding back and forth across the pile a few times, lying over the
// ones before it, higher in the pile's middle — its ends rounded; and a
// fried egg (the Frying Pan's) in the room beside the pile.
export function buildNoodles(R, seed = 5, colors = FILL_COLORS) {
  const r = mulberry32(seed * 104729 + 3);
  const g = new THREE.Group();
  g.add(disc(R, colors.broth));
  const tube = R * 0.04;
  const px = -R * 0.3, L = R * 0.5, W = R * 0.45, ph = R * 0.16; // the pile: middle, half length, half width, height
  const count = 9, passes = 3, per = 40;
  const pieces = [], all = [];
  for (let k = 0; k < count; k++) {
    const turn = (r() - 0.5) * 1.2 + (k % 2 ? 0.5 : -0.5); // each lies its own way across
    const c = Math.cos(turn), sn = Math.sin(turn);
    const amp = tube * (2 + r() * 1.2), freq = 6 + r() * 3, phase = r() * 6.28;
    const lat0 = ((k + 0.5) / count - 0.5) * W * 1.6 + (r() - 0.5) * W * 0.2, gap = W * (0.18 + r() * 0.12) * (lat0 > 0 ? -1 : 1);
    const pts = [];
    for (let p = 0; p < passes; p++) {
      for (let i = 0; i <= per; i++) {
        const f = i / per, along = (p % 2 ? 1 - f : f) * 2 * L - L;
        const lat = Math.max(-W, Math.min(W, lat0 + gap * (p + f * 0.15))) + amp * Math.sin(along / L * freq + phase);
        const x = px + along * c - lat * sn, z = along * sn + lat * c;
        const mound = ph * Math.sqrt(Math.max(0, 1 - (along / (L * 1.1)) ** 2 - (lat / (W * 1.25)) ** 2));
        pts.push(new THREE.Vector3(x, tube * 0.8 + mound + k * tube * 0.25, z));
      }
    }
    all.push(...pts);
    pieces.push(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), pts.length * 3, tube, 7, false).toNonIndexed());
    // its ends rounded off
    for (const e of [pts[0], pts[pts.length - 1]]) pieces.push(new THREE.SphereGeometry(tube, 8, 6).translate(e.x, e.y, e.z).toNonIndexed());
  }
  g.add(new THREE.Mesh(mergeGeometries(pieces), fruitMat(colors.noodle)));
  pieces.forEach((x) => x.dispose());
  // the egg, lying flat in the room beside the pile: just past the
  // furthest the noodles reach across its width, as far as the bowl
  // allows; and over any noodle still under it, never through one
  const eggR = R * 0.36, turn = (r() - 0.5) * 0.4;
  let reach = -Infinity;
  for (const p of all) if (Math.abs(p.z) < eggR) reach = Math.max(reach, p.x + tube);
  const ex = Math.min(reach + eggR * 1.03, R * 0.97 - eggR);
  let lift = 0;
  for (const p of all) {
    const dx = p.x - ex, dz = p.z;
    if (Math.hypot(dx, dz / 0.85) < eggR + tube) lift = Math.max(lift, p.y + tube);
  }
  const egg = buildFriedEgg({ radius: eggR, yolk: eggR * 0.4, white: colors.white, yolkColor: colors.yolk });
  egg.position.set(ex, lift + 0.002, 0);
  egg.rotation.y = turn;
  g.add(egg);
  return g;
}

export function disposeFill(group) {
  group.traverse((o) => o.isMesh && o.geometry.dispose());
}
