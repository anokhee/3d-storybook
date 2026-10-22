// Ported from the xylophone project as an ES module: the original is a
// classic script sharing globals (THREE, COLOR_PALETTE, ...), so the imports
// and the export line below are the only changes.
import * as THREE from "three";
import { COLOR_PALETTE } from "./palette.js";

// ---------- the curtain: a red stage curtain behind the fence, for the piano ----------
// Loaded after palette.js, materials.js and fence.js, before script.js. A wall of tall vertical folds hanging
// from a rod, with a shorter valance of folds draped over the top and a fringe along its hem, standing where the
// trees do behind the fence. Toon shaded and inked like everything else. Its colors live in palette.js (curtain,
// curtainValance, curtainTrim). Which instrument shows it is each instrument's `backdrop` setting
const CURTAIN = {
  back: 2.5, // how far behind the fence the curtain hangs, world units
  width: 44, // how wide it is, centered behind the fence
  height: 9, // from the ground to the rod
  fold: 0.55, // radius of each vertical fold. The folds sit side by side, overlapping a little
  overlap: 0.3, // how much neighboring folds overlap, as a fraction of a fold's radius
  wave: 0.25, // alternate folds sit this much further back, so the front reads as a rippling surface
  valance: { height: 1.6, fold: 0.5, forward: 0.5 }, // the top drape: how far it hangs, its fold radius, how far in front of the main folds it hangs
  fringe: 0.18, // radius of the beads of fringe along the valance's hem. 0 = none
  rod: { r: 0.14, overhang: 0.6 }, // the rod across the top: radius, and how far it pokes out past each end
  colors: {
    curtain: COLOR_PALETTE.curtain,
    valance: COLOR_PALETTE.curtainValance,
    trim: COLOR_PALETTE.curtainTrim,
  },
};

// hangs the curtain into `scene`, CURTAIN.back behind the fence line that runs through (x, z) along the x axis.
// `toonMat` and `inked` come from script.js. Returns the group and nearCurtain(px, pz): whether a spot on the
// ground is under the curtain, for anything planted later
function buildCurtain(scene, { toonMat, inked }, x, z) {
  const K = CURTAIN;
  const curtain = new THREE.Group();
  curtain.name = "curtain";
  curtain.position.set(x, 0, z - K.back);
  scene.add(curtain);
  const curtainMat = toonMat(K.colors.curtain),
    valanceMat = toonMat(K.colors.valance),
    trimMat = toonMat(K.colors.trim);
  // a row of vertical folds: cylinders side by side, every other one set back a little
  function folds(radius, height, top, forward, mat) {
    const pitch = radius * 2 * (1 - K.overlap),
      n = Math.max(1, Math.round(K.width / pitch)),
      geo = new THREE.CylinderGeometry(radius, radius, height, 12).translate(
        0,
        top - height / 2,
        0,
      );
    for (let i = 0; i < n; i++) {
      const fold = inked(new THREE.Mesh(geo, mat));
      fold.position.set(
        (i - (n - 1) / 2) * pitch,
        0,
        forward - (i % 2) * K.wave,
      );
      curtain.add(fold);
    }
    return n * pitch;
  }
  const span = folds(K.fold, K.height, K.height, 0, curtainMat);
  const V = K.valance;
  folds(V.fold, V.height, K.height, V.forward, valanceMat);
  // fringe: a row of beads along the valance's hem
  if (K.fringe > 0) {
    const beadGeo = new THREE.SphereGeometry(K.fringe, 10, 8),
      pitch = K.fringe * 2.2,
      n = Math.round(span / pitch);
    for (let i = 0; i < n; i++) {
      const bead = inked(new THREE.Mesh(beadGeo, trimMat));
      bead.position.set(
        (i - (n - 1) / 2) * pitch,
        K.height - V.height - K.fringe * 0.6,
        V.forward + V.fold * 0.8,
      );
      curtain.add(bead);
    }
  }
  // the rod along the top, with a knob on each end
  const rodLen = span + K.rod.overhang * 2,
    rod = inked(
      new THREE.Mesh(
        new THREE.CylinderGeometry(K.rod.r, K.rod.r, rodLen, 10).rotateZ(
          Math.PI / 2,
        ),
        trimMat,
      ),
    );
  rod.position.set(0, K.height + K.rod.r, V.forward * 0.5);
  curtain.add(rod);
  [-1, 1].forEach((side) => {
    const knob = inked(
      new THREE.Mesh(new THREE.SphereGeometry(K.rod.r * 2.2, 12, 8), trimMat),
    );
    knob.position.set((side * rodLen) / 2, K.height + K.rod.r, V.forward * 0.5);
    curtain.add(knob);
  });
  const depth = K.fold + K.wave + V.forward + V.fold + 0.5;
  const nearCurtain = (px, pz) =>
    Math.abs(pz - curtain.position.z) < depth &&
    Math.abs(px - curtain.position.x) < span / 2 + K.fold;
  return { curtain, nearCurtain };
}


export { buildCurtain, CURTAIN };
