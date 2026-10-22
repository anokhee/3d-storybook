// Ported from the xylophone project as an ES module: the original is a
// classic script sharing globals (THREE, COLOR_PALETTE, ...), so the imports
// and the export line below are the only changes.
import * as THREE from "three";
import { COLOR_PALETTE } from "./palette.js";

// ---------- the trees: a stand of conifers behind the fence ----------
// Loaded after palette.js, materials.js and fence.js, before script.js. Each tree is a trunk with a few stacked
// cones of foliage, scattered at random through a band of ground behind the fence line, at random sizes.
// Toon shaded and inked like everything else. Their colors live in palette.js (treeColors, treeTrunk).
const TREES = {
  enabled: true,
  count: 26, // how many trees to plant
  gap: 1.2, // clear ground between the fence and the nearest tree's foliage, world units
  depth: 8, // how far back from there the band of trees runs. The ground ends about 22 behind the middle of the scene
  spread: 44, // how wide the band is, centered behind the fence
  trunk: { r: 0.22, h: 1.2 }, // trunk radius and how much of it shows below the foliage
  tiers: 3, // stacked cones of foliage per tree
  crown: { r: 1.7, h: 4.0 }, // the foliage as a whole: radius of the bottom tier and total height, before the per-tree scale
  taper: 0.74, // each tier's radius relative to the one below it
  overlap: 0.4, // how far each tier drops into the one below, as a fraction of a tier's height
  sides: 9, // faces round each cone. Fewer = chunkier
  scale: [0.65, 1.2], // random per-tree size multiplier
  lean: 0.04, // how far a tree may tilt from upright, radians
  spacing: 0.75, // trees keep at least this fraction of their combined crown radii apart. 1 = crowns never touch
  tries: 60, // attempts to find a clear spot for each tree before giving up on it
  colors: COLOR_PALETTE.treeColors,
  trunkColor: COLOR_PALETTE.treeTrunk,
};

// plants the trees into `scene`, behind the fence line that runs through (x, z) along the x axis. `toonMat` and
// `inked` come from script.js. `around` is { x, z, r } footprints in world space for the trees to keep clear of
// (the toad they stand round). Returns the group and nearTrees(px, pz): whether a spot on the ground is
// under a tree's foliage, for anything planted later
function buildTrees(scene, { toonMat, inked }, x, z, around = []) {
  const T = TREES;
  const trees = new THREE.Group();
  trees.name = "trees";
  trees.position.set(x, 0, z);
  scene.add(trees);
  const spots = []; // { x, z, r } of every tree, relative to the group
  if (T.enabled) {
    const trunkMat = toonMat(T.trunkColor),
      leafMats = T.colors.map(toonMat),
      between = ([a, b]) => a + Math.random() * (b - a);
    // one tree, standing at the origin: the trunk, then the tiers of foliage climbing it
    const tierH = T.crown.h / (1 + (T.tiers - 1) * (1 - T.overlap));
    const trunkGeo = new THREE.CylinderGeometry(
      T.trunk.r * 0.8,
      T.trunk.r,
      T.trunk.h + tierH * 0.5,
      8,
    ).translate(0, (T.trunk.h + tierH * 0.5) / 2, 0);
    const tierGeos = [];
    for (let i = 0; i < T.tiers; i++) {
      const r = T.crown.r * Math.pow(T.taper, i),
        base = T.trunk.h + i * tierH * (1 - T.overlap);
      // open-ended: no bottom cap, so the ink hull has no disc to push down and draw as a rim under each
      // tier. The camera never gets low enough to look up into the cones, so the missing cap never shows
      tierGeos.push(
        new THREE.ConeGeometry(r, tierH, T.sides, 1, true).translate(
          0,
          base + tierH / 2,
          0,
        ),
      );
    }
    for (let n = 0; n < T.count; n++) {
      const s = between(T.scale),
        r = T.crown.r * s;
      // a clear spot: inside the band and not crowding a tree already planted
      let px, pz, ok = false;
      for (let k = 0; k < T.tries && !ok; k++) {
        px = (Math.random() - 0.5) * T.spread;
        pz = -(T.gap + r + Math.random() * T.depth);
        ok =
          spots.every(
            (o) => Math.hypot(o.x - px, o.z - pz) >= (o.r + r) * T.spacing,
          ) &&
          around.every(
            (o) => Math.hypot(o.x - x - px, o.z - z - pz) >= (o.r + r) * 0.85,
          );
      }
      if (!ok) continue;
      spots.push({ x: px, z: pz, r });
      const tree = new THREE.Group();
      tree.add(inked(new THREE.Mesh(trunkGeo, trunkMat)));
      const leaf = leafMats[Math.floor(Math.random() * leafMats.length)];
      tierGeos.forEach((g) => tree.add(inked(new THREE.Mesh(g, leaf))));
      tree.position.set(px, 0, pz);
      tree.scale.setScalar(s);
      tree.rotation.set(
        (Math.random() - 0.5) * 2 * T.lean,
        Math.random() * Math.PI * 2,
        (Math.random() - 0.5) * 2 * T.lean,
      );
      trees.add(tree);
    }
  }
  const nearTrees = (px, pz) =>
    spots.some((o) => Math.hypot(o.x + x - px, o.z + z - pz) < o.r);
  return { trees, nearTrees };
}


export { buildTrees, TREES };
