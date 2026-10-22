// Ported from the xylophone project as an ES module: the original is a
// classic script sharing globals (THREE, COLOR_PALETTE, ...), so the imports
// and the export line below are the only changes.
import * as THREE from "three";
import { COLOR_PALETTE } from "./palette.js";

// ---------- the blocks: giant toy blocks behind the fence, for the toy xylophone ----------
// Loaded after palette.js, materials.js and fence.js, before script.js. Colored cubes scattered through the
// same band of ground behind the fence that the trees use, at random sizes and turns, some with a smaller
// block stacked on top. Toon shaded and inked like everything else. Their colors live in palette.js
// (blockColors).
const BLOCKS = {
  count: 22, // how many piles to place
  gap: 1.2, // clear ground between the fence and the nearest block
  depth: 8, // how far back from there the band runs
  spread: 44, // how wide the band is, centered behind the fence
  size: [1.4, 3.2], // edge length of a pile's bottom block, world units
  stack: 0.45, // the chance a pile gets a second block on top (and that again for a third)
  shrink: [0.55, 0.8], // a stacked block's size relative to the one under it
  spacing: 1.1, // piles keep at least this many times their combined half-widths apart
  tries: 60, // attempts to find a clear spot for each pile before giving up on it
  colors: COLOR_PALETTE.blockColors,
};

// places the blocks into `scene`, behind the fence line that runs through (x, z) along the x axis. `toonMat` and
// `inked` come from script.js. Returns the group and nearBlocks(px, pz): whether a spot on the ground is under a
// pile, for anything planted later
function buildBlocks(scene, { toonMat, inked }, x, z) {
  const B = BLOCKS;
  const blocks = new THREE.Group();
  blocks.name = "blocks";
  blocks.position.set(x, 0, z);
  scene.add(blocks);
  const spots = [], // { x, z, r } of every pile, relative to the group
    mats = B.colors.map(toonMat),
    cube = new THREE.BoxGeometry(1, 1, 1),
    between = ([a, b]) => a + Math.random() * (b - a),
    pick = (not) => {
      let m;
      do m = mats[Math.floor(Math.random() * mats.length)];
      while (m === not && mats.length > 1);
      return m;
    };
  for (let n = 0; n < B.count; n++) {
    const s = between(B.size),
      r = (s / 2) * Math.SQRT2; // half the diagonal: clear of it whichever way it turns
    let px, pz, ok = false;
    for (let k = 0; k < B.tries && !ok; k++) {
      px = (Math.random() - 0.5) * B.spread;
      pz = -(B.gap + r + Math.random() * B.depth);
      ok = spots.every((o) => Math.hypot(o.x - px, o.z - pz) >= (o.r + r) * B.spacing);
    }
    if (!ok) continue;
    spots.push({ x: px, z: pz, r });
    // the pile: a block, then maybe smaller ones on top, each turned a little differently and in its own color
    let y = 0,
      size = s,
      mat = null;
    do {
      mat = pick(mat);
      const block = inked(new THREE.Mesh(cube, mat));
      block.scale.setScalar(size);
      block.position.set(px, y + size / 2, pz);
      block.rotation.y = Math.random() * Math.PI;
      blocks.add(block);
      y += size;
      size *= between(B.shrink);
    } while (Math.random() < B.stack && y < 7);
  }
  const nearBlocks = (px, pz) => spots.some((o) => Math.hypot(o.x + x - px, o.z + z - pz) < o.r);
  return { blocks, nearBlocks };
}


export { buildBlocks, BLOCKS };
