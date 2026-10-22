import * as THREE from "three";

import { TUBBED } from "./objects.js";

import { groundRadiusAt } from "../planet/ground.js";
import { poolBounds, poolDistance } from "./pools.js";

// The pool's sheet, shared by the water and the foam lying on it: a grid
// over the pool's bounds in its own frame, every point outside the water
// walked in onto its edge — down the field's slope, by its own distance,
// twice over, since the field is only nearly straight there — and every
// point then dropped onto the ground `lift` above it, measured straight
// down, the way the wade and the clearing measure the pool, so the three
// agree on where its edge is. The ground is the ball's curve where it is
// smooth, and on the planet its thumbed hollows too (see
// ../planet/ground.js): the sheet is draped over them, a film of water
// on the clay, rather than lying level across them with a gap under its
// bank. A cell with all four corners outside is left out, so the edge is
// not lined with slivers. Each point carries `inset`, how far in from
// the edge it lies, for the foam to thicken toward the bank by, and
// `tile`, where it lies in the pool's frame, for a tiled bed to be ruled
// by (see Basin.jsx).
//
// `lift` may be a function of (x, z) instead, for a sheet that lies at a
// different height across the pool — a bed as deep as each lobe is. And
// `level` lays the sheet on the ball's own curve, the hollows ignored: a
// swimming pool's water stands level in its tub.
const EPS = 0.01;
const _dir = new THREE.Vector3();
export function poolGeometry(pool, R, lift, stitch, level = false) {
  // How far the ground is from the ball's center along a world bearing.
  const groundAt =
    pool.body.name === "planet" && !level ?
      groundRadiusAt
    : () => pool.body.radius;
  const liftAt = typeof lift === "function" ? lift : () => lift;
  const { x: bx, z: bz } = poolBounds(pool);
  const nx = Math.max(4, Math.ceil((2 * bx) / stitch));
  const nz = Math.max(4, Math.ceil((2 * bz) / stitch));
  const positions = [];
  const insets = [];
  const tiles = [];
  const outside = [];
  const d = (x, z) => poolDistance(pool, x, z);
  for (let j = 0; j <= nz; j++)
    for (let i = 0; i <= nx; i++) {
      let x = -bx + (2 * bx * i) / nx;
      let z = -bz + (2 * bz * j) / nz;
      let dist = d(x, z);
      outside.push(dist > 0);
      for (let step = 0; step < 2 && dist > 0; step++) {
        const gx = (d(x + EPS, z) - d(x - EPS, z)) / (2 * EPS);
        const gz = (d(x, z + EPS) - d(x, z - EPS)) / (2 * EPS);
        const g = Math.hypot(gx, gz) || 1;
        x -= (gx / g) * dist;
        z -= (gz / g) * dist;
        dist = d(x, z);
      }
      // Onto the sphere `rim` out first, then along that bearing to the
      // ground there, `lift` above it. The ball's center is at (0, -R, 0)
      // in the pool's frame.
      const lift = liftAt(x, z);
      const rim = R + lift;
      const y = Math.sqrt(Math.max(0, rim * rim - x * x - z * z));
      _dir.set(x / rim, y / rim, z / rim);
      const k = groundAt(_dir.applyQuaternion(pool.frame)) + lift;
      positions.push((x * k) / rim, (y * k) / rim - R, (z * k) / rim);
      insets.push(Math.max(0, -dist));
      tiles.push(x, z);
    }
  const indices = [];
  const at = (i, j) => j * (nx + 1) + i;
  for (let j = 0; j < nz; j++)
    for (let i = 0; i < nx; i++) {
      const a = at(i, j),
        b = at(i + 1, j),
        c = at(i, j + 1),
        e = at(i + 1, j + 1);
      if (outside[a] && outside[b] && outside[c] && outside[e]) continue;
      // Wound to face +y, the ground's up.
      indices.push(a, c, b, b, c, e);
    }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  g.setAttribute("inset", new THREE.Float32BufferAttribute(insets, 1));
  g.setAttribute("tile", new THREE.Float32BufferAttribute(tiles, 2));
  g.setIndex(indices);
  g.computeVertexNormals();
  return g;
}

// Where a pool's water stands, above the ground: a pond's `lift` off it,
// draped over its hollows; a swimming pool's level, `waterline` under the
// border's top (see POOL); an above-ground pool's level too, up in its
// tub, `waterline` under the top of the wall (see TUB); a kiddie pool's
// under its top ring's crown (see KIDDIE). `level` is whether it lies
// level or follows the ground.
export function waterLevelOf(W) {
  if (W.kind === "pool")
    return { at: W.pool.lip - W.pool.waterline, level: true };
  if (TUBBED.includes(W.kind))
    return { at: W.tub.height - W.tub.waterline, level: true };
  if (W.kind === "kiddie") {
    const K = W.kiddie.rings;
    return {
      at: K.count * 2 * K.radius * K.squash - W.kiddie.waterline,
      level: true,
    };
  }
  return { at: W.lift, level: false };
}

// The pool's water sheet, `above` over where the water stands.
export function sheetGeometry(pool, above = 0) {
  const W = pool.W;
  const { at, level } = waterLevelOf(W);
  return poolGeometry(pool, pool.body.radius, at + above, W.stitch, level);
}
