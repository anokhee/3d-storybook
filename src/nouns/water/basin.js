import * as THREE from "three";

import { poolBounds, poolDepthAt, poolDistance } from "./pools.js";
import { poolGeometry } from "./sheet.js";

// A swimming pool's tub — see POOL in objects.js. The water's edge is
// where the pool's field crosses zero (see pools.js); the tub is built
// off that line: the bed, a sheet of tile lying `depth` under the ground
// across the whole of the water; the walls, tile standing up from under
// the bed to the top of the border; the border's top, a flat ring of tile
// `border` wide out from the water's edge, `lip` above the ground; and
// the border's outer wall, dropping from that to `skirt` under the
// ground. Everything is knitted onto the ball's own curve the way the
// water's sheet is (see sheet.js), the ball's center at (0, -R, 0) in
// the pool's frame, so a wide pool bends with the ground it lies in.
//
// Two geometries come back: `tile` for the bed and the walls, `border`
// for the ring and its outer wall, each with `tile` on every point —
// where it lies on its own sheet, for the grout to be ruled by (see
// Basin.jsx): the bed and the ring by (x, z) in the pool's frame, the
// walls by (how far round the edge, how far down).

// The water's edge, as loops of points [x, z] in the pool's frame: the
// field's zero contour, marched over a grid `step` fine across the pool's
// bounds. Each cell's corners are sorted inside or out, the crossings on
// its edges found by where the field runs through zero, and the crossings
// joined up; the pieces are then chained edge to edge into closed loops.
// An island in the pool is a loop of its own.
export function poolContours(pool, step) {
  const { x: bx, z: bz } = poolBounds(pool);
  const nx = Math.max(4, Math.ceil((2 * (bx + step)) / step));
  const nz = Math.max(4, Math.ceil((2 * (bz + step)) / step));
  const x0 = -bx - step,
    z0 = -bz - step;
  const xAt = (i) => x0 + (2 * (bx + step) * i) / nx;
  const zAt = (j) => z0 + (2 * (bz + step) * j) / nz;
  const v = [];
  for (let j = 0; j <= nz; j++) {
    const row = [];
    for (let i = 0; i <= nx; i++) row.push(poolDistance(pool, xAt(i), zAt(j)));
    v.push(row);
  }
  // Where the field runs through zero along a cell's edge: the edge's
  // name, so two cells that share it share the point, and where that is.
  const cross = (a, b, i, j, horizontal) => {
    const t = a / (a - b);
    return horizontal ?
        { key: `H${i},${j}`, x: xAt(i) + (xAt(i + 1) - xAt(i)) * t, z: zAt(j) }
      : { key: `V${i},${j}`, x: xAt(i), z: zAt(j) + (zAt(j + 1) - zAt(j)) * t };
  };
  // The pieces: each a pair of crossings.
  const pieces = [];
  for (let j = 0; j < nz; j++)
    for (let i = 0; i < nx; i++) {
      const a = v[j][i],
        b = v[j][i + 1],
        c = v[j + 1][i + 1],
        d = v[j + 1][i];
      const bits =
        (a < 0 ? 1 : 0) | (b < 0 ? 2 : 0) | (c < 0 ? 4 : 0) | (d < 0 ? 8 : 0);
      if (bits === 0 || bits === 15) continue;
      // The four edges' crossings, by side: 0 bottom, 1 right, 2 top, 3 left.
      const side = [
        () => cross(a, b, i, j, true),
        () => cross(b, c, i + 1, j, false),
        () => cross(d, c, i, j + 1, true),
        () => cross(a, d, i, j, false),
      ];
      let pairs = SEGMENTS[bits];
      // A saddle — two corners in, across from each other — is joined the
      // way the cell's middle says.
      if (bits === 5 || bits === 10) {
        const middle = (a + b + c + d) / 4 < 0;
        pairs =
          bits === 5 ?
            middle ?
              [
                [0, 1],
                [2, 3],
              ]
            : [
                [3, 0],
                [1, 2],
              ]
          : middle ?
            [
              [3, 0],
              [1, 2],
            ]
          : [
              [0, 1],
              [2, 3],
            ];
      }
      for (const [p, q] of pairs) pieces.push([side[p](), side[q]()]);
    }
  // Chained into loops: each crossing is shared by exactly two pieces.
  const at = new Map();
  pieces.forEach((piece, k) => {
    for (const end of piece) {
      if (!at.has(end.key)) at.set(end.key, []);
      at.get(end.key).push(k);
    }
  });
  const used = new Set();
  const loops = [];
  for (let k = 0; k < pieces.length; k++) {
    if (used.has(k)) continue;
    const loop = [];
    let piece = k;
    let end = pieces[k][0];
    while (piece != null && !used.has(piece)) {
      used.add(piece);
      const [p, q] = pieces[piece];
      const from = p.key === end.key ? p : q;
      const to = p.key === end.key ? q : p;
      loop.push([from.x, from.z]);
      end = to;
      piece = (at.get(to.key) ?? []).find((n) => !used.has(n));
    }
    if (loop.length >= 3) loops.push(loop);
  }
  return loops;
}

// Which crossings each cell joins, by which corners are in — 1 bottom
// left, 2 bottom right, 4 top right, 8 top left — but the two saddles,
// settled above.
const SEGMENTS = {
  1: [[3, 0]],
  2: [[0, 1]],
  3: [[3, 1]],
  4: [[1, 2]],
  6: [[0, 2]],
  7: [[3, 2]],
  8: [[2, 3]],
  9: [[0, 2]],
  11: [[1, 2]],
  12: [[1, 3]],
  13: [[0, 1]],
  14: [[3, 0]],
};

// The field's slope at (x, z), unit length: out of the water.
const EPS = 0.01;
export function gradientAt(pool, x, z) {
  const d = (x, z) => poolDistance(pool, x, z);
  const gx = (d(x + EPS, z) - d(x - EPS, z)) / (2 * EPS);
  const gz = (d(x, z + EPS) - d(x, z - EPS)) / (2 * EPS);
  const g = Math.hypot(gx, gz) || 1;
  return [gx / g, gz / g];
}

// A sheet of quads with its own `tile` on every point and a normal it is
// told — the triangles wound to face it.
class Sheet {
  constructor() {
    this.positions = [];
    this.normals = [];
    this.tiles = [];
    this.indices = [];
  }
  point(p, n, tile) {
    this.positions.push(p.x, p.y, p.z);
    this.normals.push(n.x, n.y, n.z);
    this.tiles.push(tile[0], tile[1]);
    return this.positions.length / 3 - 1;
  }
  // The quad a b c d, round its edge, faced the way its first point's
  // normal points.
  quad(a, b, c, d) {
    const P = this.positions,
      N = this.normals;
    const A = new THREE.Vector3(P[3 * a], P[3 * a + 1], P[3 * a + 2]);
    const B = new THREE.Vector3(P[3 * b], P[3 * b + 1], P[3 * b + 2]);
    const D = new THREE.Vector3(P[3 * d], P[3 * d + 1], P[3 * d + 2]);
    const n = new THREE.Vector3(N[3 * a], N[3 * a + 1], N[3 * a + 2]);
    const face = B.sub(A).cross(D.sub(A));
    if (face.dot(n) >= 0) this.indices.push(a, b, d, b, c, d);
    else this.indices.push(a, d, b, b, d, c);
  }
  geometry() {
    const g = new THREE.BufferGeometry();
    g.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(this.positions, 3),
    );
    g.setAttribute("normal", new THREE.Float32BufferAttribute(this.normals, 3));
    g.setAttribute("tile", new THREE.Float32BufferAttribute(this.tiles, 2));
    g.setIndex(this.indices);
    return g;
  }
}

// The tub: `{ tile, border }` geometries in the pool's frame.
export function basinGeometry(pool) {
  const W = pool.W;
  const P = W.pool;
  const R = pool.body.radius;
  // Onto the ball's curve: the point (x, z) on the pool's ground, `lift`
  // above it — and the ground's up there.
  const drop = (x, z, lift) => {
    const y = Math.sqrt(Math.max(0, R * R - x * x - z * z));
    const n = new THREE.Vector3(x / R, y / R, z / R);
    return {
      p: n
        .clone()
        .multiplyScalar(R + lift)
        .setY((y * (R + lift)) / R - R),
      n,
    };
  };
  const depthAt = (x, z) => poolDepthAt(pool, x, z);

  // The bed: the water's sheet, laid as deep as each lobe is.
  const bed = poolGeometry(pool, R, (x, z) => -depthAt(x, z), W.stitch, true);

  const tile = new Sheet();
  const border = new Sheet();
  const rim = P.lip;
  for (const loop of poolContours(pool, W.stitch)) {
    // How far round the edge each point lies, for the walls' tiles.
    let along = 0;
    const n = loop.length;
    const ring = loop.map(([x, z], k) => {
      if (k > 0) along += Math.hypot(x - loop[k - 1][0], z - loop[k - 1][1]);
      const [gx, gz] = gradientAt(pool, x, z);
      return { x, z, gx, gz, along };
    });
    // Each point's four corners: the wall's top and foot, the border's
    // outer top and foot — and the normals they face.
    const corners = ring.map(({ x, z, gx, gz, along }) => {
      const inward = new THREE.Vector3(-gx, 0, -gz);
      const outward = new THREE.Vector3(gx, 0, gz);
      const foot = -(depthAt(x, z) + P.skirt);
      const ox = x + gx * P.border,
        oz = z + gz * P.border;
      const top = drop(x, z, rim);
      const outer = drop(ox, oz, rim);
      return {
        wallTop: tile.point(top.p, inward, [along, rim]),
        wallFoot: tile.point(drop(x, z, foot).p, inward, [along, foot]),
        ringIn: border.point(top.p, top.n, [x, z]),
        ringOut: border.point(outer.p, outer.n, [ox, oz]),
        skirtTop: border.point(outer.p, outward, [along, rim]),
        skirtFoot: border.point(drop(ox, oz, -P.skirt).p, outward, [
          along,
          -P.skirt,
        ]),
      };
    });
    for (let k = 0; k < n; k++) {
      const a = corners[k],
        b = corners[(k + 1) % n];
      tile.quad(a.wallTop, b.wallTop, b.wallFoot, a.wallFoot);
      border.quad(a.ringIn, b.ringIn, b.ringOut, a.ringOut);
      border.quad(a.skirtTop, b.skirtTop, b.skirtFoot, a.skirtFoot);
    }
  }
  const walls = tile.geometry();
  const tiled = mergeGeometries([bed, walls]);
  bed.dispose();
  walls.dispose();
  return { tile: tiled, border: border.geometry() };
}

// An above-ground pool's tub — see TUB in objects.js: `{ liner, panel,
// rim }` geometries in the pool's frame. The liner is the bed, a sheet of
// tile lying `bed` off the ground across the water, and the wall's inner
// face up from under it to the top; the panel is the wall's outer face,
// `thickness` out from the water's edge, from `skirt` under the ground
// to the top; the rim a flat ring across the top of the wall, `rim.in`
// over the water and `rim.out` past the panel, `rim.thickness` thick, a
// lip down each side. Knitted onto the ball's curve like the basin.
export function tubGeometry(pool) {
  const W = pool.W;
  const T = W.tub;
  const R = pool.body.radius;
  const drop = (x, z, lift) => {
    const y = Math.sqrt(Math.max(0, R * R - x * x - z * z));
    const n = new THREE.Vector3(x / R, y / R, z / R);
    return {
      p: n
        .clone()
        .multiplyScalar(R + lift)
        .setY((y * (R + lift)) / R - R),
      n,
    };
  };
  const bed = poolGeometry(pool, R, T.bed, W.stitch, true);
  const liner = new Sheet();
  const panel = new Sheet();
  const rim = new Sheet();
  const top = T.height;
  const crown = top + T.rim.thickness;
  for (const loop of poolContours(pool, W.stitch)) {
    let along = 0;
    const n = loop.length;
    const corners = loop.map(([x, z], k) => {
      if (k > 0) along += Math.hypot(x - loop[k - 1][0], z - loop[k - 1][1]);
      const [gx, gz] = gradientAt(pool, x, z);
      const inward = new THREE.Vector3(-gx, 0, -gz);
      const outward = new THREE.Vector3(gx, 0, gz);
      const out = (d) => [x + gx * d, z + gz * d];
      const [ox, oz] = out(T.thickness);
      const [ix, iz] = out(-T.rim.in);
      const [rx, rz] = out(T.thickness + T.rim.out);
      const up = drop(x, z, crown).n;
      return {
        wallTop: liner.point(drop(x, z, top).p, inward, [along, top]),
        wallFoot: liner.point(drop(x, z, T.bed - 0.1).p, inward, [
          along,
          T.bed - 0.1,
        ]),
        panelTop: panel.point(drop(ox, oz, top).p, outward, [along, top]),
        panelFoot: panel.point(drop(ox, oz, -T.skirt).p, outward, [
          along,
          -T.skirt,
        ]),
        // The rim: its top across, and a lip down each side.
        rimIn: rim.point(drop(ix, iz, crown).p, up, [ix, iz]),
        rimOut: rim.point(drop(rx, rz, crown).p, up, [rx, rz]),
        lipInTop: rim.point(drop(ix, iz, crown).p, inward, [along, crown]),
        lipInFoot: rim.point(drop(ix, iz, top).p, inward, [along, top]),
        lipOutTop: rim.point(drop(rx, rz, crown).p, outward, [along, crown]),
        lipOutFoot: rim.point(drop(rx, rz, top).p, outward, [along, top]),
        underIn: rim.point(drop(ix, iz, top).p, inward, [ix, iz]),
        underWall: rim.point(drop(x, z, top).p, inward, [x, z]),
      };
    });
    for (let k = 0; k < n; k++) {
      const a = corners[k],
        b = corners[(k + 1) % n];
      liner.quad(a.wallTop, b.wallTop, b.wallFoot, a.wallFoot);
      panel.quad(a.panelTop, b.panelTop, b.panelFoot, a.panelFoot);
      rim.quad(a.rimIn, b.rimIn, b.rimOut, a.rimOut);
      rim.quad(a.lipInTop, b.lipInTop, b.lipInFoot, a.lipInFoot);
      rim.quad(a.lipOutTop, b.lipOutTop, b.lipOutFoot, a.lipOutFoot);
      // The overhang's underside, seen from the water.
      rim.quad(a.underIn, b.underIn, b.underWall, a.underWall);
    }
  }
  const walls = liner.geometry();
  const lined = mergeGeometries([bed, walls]);
  bed.dispose();
  walls.dispose();
  return { liner: lined, panel: panel.geometry(), rim: rim.geometry() };
}

// A kiddie pool — see KIDDIE in objects.js: `{ floor, rings }` in the
// pool's frame. The floor is the bed, `bed` off the ground across the
// water, a thin wall up from it to the top ring at the water's edge, for
// the water to meet, and the base: the vinyl carried out under the rings
// and down from the bottom one's outer edge to `skirt` under the ground,
// so its curve is closed underneath; the rings are tubes swept round the edge, each
// `radius` thick and `squash` of that tall, stacked, each one's inner
// side touching the wall at its middle. One geometry per ring, so each
// is its own color.
const ROUND = 10;
export function kiddieGeometry(pool) {
  const W = pool.W;
  const K = W.kiddie;
  const G = K.rings;
  const R = pool.body.radius;
  const drop = (x, z, lift) => {
    const y = Math.sqrt(Math.max(0, R * R - x * x - z * z));
    const n = new THREE.Vector3(x / R, y / R, z / R);
    return n
      .clone()
      .multiplyScalar(R + lift)
      .setY((y * (R + lift)) / R - R);
  };
  const tall = 2 * G.radius * G.squash;
  const top = G.count * tall;
  const bed = poolGeometry(pool, R, K.bed, W.stitch, true);
  const wall = new Sheet();
  const rings = Array.from({ length: G.count }, () => new Sheet());
  for (const loop of poolContours(pool, W.stitch)) {
    let along = 0;
    const n = loop.length;
    const corners = loop.map(([x, z], k) => {
      if (k > 0) along += Math.hypot(x - loop[k - 1][0], z - loop[k - 1][1]);
      const [gx, gz] = gradientAt(pool, x, z);
      const inward = new THREE.Vector3(-gx, 0, -gz);
      const outward = new THREE.Vector3(gx, 0, gz);
      // The base's outer edge: under the bottom ring's widest, its outer
      // side, straight down.
      const ox = x + gx * 2 * G.radius;
      const oz = z + gz * 2 * G.radius;
      const c = {
        wallTop: wall.point(drop(x, z, top), inward, [along, top]),
        wallFoot: wall.point(drop(x, z, K.bed - 0.1), inward, [
          along,
          K.bed - 0.1,
        ]),
        skirtTop: wall.point(drop(ox, oz, tall / 2), outward, [
          along,
          tall / 2,
        ]),
        skirtFoot: wall.point(drop(ox, oz, -K.skirt), outward, [
          along,
          -K.skirt,
        ]),
        rings: [],
      };
      // Round each ring's tube: ROUND points, from its inner side.
      for (let r = 0; r < G.count; r++) {
        const yc = r * tall + tall / 2;
        const pts = [];
        for (let i = 0; i < ROUND; i++) {
          const a = Math.PI + (i / ROUND) * Math.PI * 2;
          const d = G.radius + G.radius * Math.cos(a);
          const y = yc + (tall / 2) * Math.sin(a);
          const normal = new THREE.Vector3(
            gx * Math.cos(a),
            Math.sin(a) / G.squash,
            gz * Math.cos(a),
          ).normalize();
          pts.push(
            rings[r].point(drop(x + gx * d, z + gz * d, y), normal, [along, y]),
          );
        }
        c.rings.push(pts);
      }
      return c;
    });
    for (let k = 0; k < n; k++) {
      const a = corners[k],
        b = corners[(k + 1) % n];
      wall.quad(a.wallTop, b.wallTop, b.wallFoot, a.wallFoot);
      wall.quad(a.skirtTop, b.skirtTop, b.skirtFoot, a.skirtFoot);
      for (let r = 0; r < G.count; r++)
        for (let i = 0; i < ROUND; i++) {
          const j = (i + 1) % ROUND;
          rings[r].quad(
            a.rings[r][i],
            b.rings[r][i],
            b.rings[r][j],
            a.rings[r][j],
          );
        }
    }
  }
  const walls = wall.geometry();
  const floor = mergeGeometries([bed, walls]);
  bed.dispose();
  walls.dispose();
  return { floor, rings: rings.map((s) => s.geometry()) };
}

// The mask that cuts the tub into the ground: the water's opening, at the
// border's top.
export function basinMaskGeometry(pool) {
  const W = pool.W;
  return poolGeometry(pool, pool.body.radius, W.pool.lip, W.stitch, true);
}

// Several geometries as one, sharing the attributes they all have.
function mergeGeometries(geometries) {
  const names = ["position", "normal", "tile"];
  const arrays = Object.fromEntries(names.map((n) => [n, []]));
  const indices = [];
  let offset = 0;
  for (const g of geometries) {
    for (const n of names) {
      const attr = g.getAttribute(n);
      for (let i = 0; i < attr.array.length; i++) arrays[n].push(attr.array[i]);
    }
    const idx = g.getIndex().array;
    for (let i = 0; i < idx.length; i++) indices.push(idx[i] + offset);
    offset += g.getAttribute("position").count;
  }
  const out = new THREE.BufferGeometry();
  out.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(arrays.position, 3),
  );
  out.setAttribute(
    "normal",
    new THREE.Float32BufferAttribute(arrays.normal, 3),
  );
  out.setAttribute("tile", new THREE.Float32BufferAttribute(arrays.tile, 2));
  out.setIndex(indices);
  return out;
}
