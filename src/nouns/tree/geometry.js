import * as THREE from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";

import { merge } from "../../world/merge.js";
import { mulberry32 } from "../../world/random.js";
import { primitiveGeometry } from "../primitive/geometry.js";
import { flowerHead } from "../flower/Flower.jsx";
import { TREE, TREE_KINDS } from "./objects.js";

// A tree's geometry, in its own space — +y up, the foot of the trunk set
// `sink` under the ground at y = 0 — as bodies, `trunk` (the trunk, and a
// dead tree's branches), `canopy` (null for a dead tree) and `blooms`
// (null but for a flowering tree), so each can be painted its own color;
// with `top`, how high the crown stands, and `reach`, how far out from
// the axis it spreads. Separate bodies rather than one so the ground
// cover can instance each in its own color (see
// ../groundCover/GroundCover.jsx). Cached by config, since a wood is one
// tree drawn many times.
const cache = new Map();
export function treeGeometry(config) {
  const T = merge(TREE, config);
  const key = JSON.stringify(T);
  if (cache.has(key)) return cache.get(key);
  const built = build(T);
  cache.set(key, built);
  return built;
}

// A part moved into place: the primitive is built about its own middle.
const _m = new THREE.Matrix4();
const placed = (g, { x = 0, y = 0, z = 0 }, rotation) => {
  const out = g.clone();
  _m.compose(
    new THREE.Vector3(x, y, z),
    rotation ?? new THREE.Quaternion(),
    new THREE.Vector3(1, 1, 1),
  );
  out.applyMatrix4(_m);
  return out;
};
// Merged into one body: whatever attributes the parts do not share are
// dropped, and each is unindexed, since merging wants them alike.
const joined = (parts) =>
  mergeGeometries(
    parts.map((g) => {
      const p = g.index ? g.toNonIndexed() : g;
      Object.keys(p.attributes).forEach((k) => {
        if (k !== "position" && k !== "normal") p.deleteAttribute(k);
      });
      return p;
    }),
    false,
  );
const extentOf = (g) => {
  if (!g.boundingBox) g.computeBoundingBox();
  return g.boundingBox;
};

// A tapered clay cylinder standing on y = 0, `h` tall, `r` at the foot
// and `r * taper` at the crown.
function stalk(r, h, taper, sides, clay) {
  const g = primitiveGeometry(
    "cylinder",
    r,
    sides,
    1,
    { tall: h / (2 * r), top: { inflate: taper } },
    undefined,
    clay,
  );
  return placed(g, { y: -extentOf(g).min.y });
}

function build(T) {
  const K = T.trunk;
  const trunkH = K.height;
  const parts = [
    placed(stalk(K.radius, trunkH, K.taper, K.sides, K.clay), { y: -T.sink }),
  ];
  let canopy = null;
  let blooms = null;
  let top = trunkH - T.sink;
  let reach = K.radius;

  if (T.kind === "deciduous" || T.kind === "flowering") {
    const D = T.deciduous;
    const lobes = [];
    const crown = trunkH - T.sink;
    // In bloom: flower heads scattered over each lobe as it is placed —
    // the flower noun's own head (see flowerHead: laid flat, face up),
    // with its middle as a ball, the pair turned to face out of the lobe.
    const B = T.kind === "flowering" ? T.blooms : null;
    const rand = B && mulberry32(B.seed);
    const buds = [];
    const head = B && flowerHead(B.type, B.radius, B.shape);
    const pistil = B && new THREE.SphereGeometry(head.pistilRadius, 8, 6);
    const faceUp = new THREE.Vector3(0, 1, 0);
    for (let i = 0; i < D.lobes; i++) {
      const r = i === 0 ? D.radius : D.radius * D.shrink;
      const ball = primitiveGeometry(
        "sphere",
        r,
        undefined,
        1,
        undefined,
        undefined,
        {
          ...D.clay,
          seed: D.clay.seed + i,
        },
      );
      const a = ((i - 1) / Math.max(1, D.lobes - 1)) * Math.PI * 2 + 0.7;
      const out = i === 0 ? 0 : D.radius * D.spread;
      const at = {
        x: Math.cos(a) * out,
        y: crown + D.radius * 0.6 - (i === 0 ? 0 : D.radius * D.drop),
        z: Math.sin(a) * out,
      };
      lobes.push(placed(ball, at));
      top = Math.max(top, at.y + r);
      reach = Math.max(reach, out + r);
      if (B)
        for (let k = 0; k < B.count; k++) {
          // A bearing off the lobe's middle, even over the part of it
          // above `above`, and the bud sat on the skin there, sunk in.
          const y = B.above + rand() * (1 - B.above);
          const flat = Math.sqrt(Math.max(0, 1 - y * y));
          const a = rand() * Math.PI * 2;
          const dir = new THREE.Vector3(
            Math.cos(a) * flat,
            y,
            Math.sin(a) * flat,
          );
          const d = r - B.radius * B.sink;
          const on = {
            x: at.x + dir.x * d,
            y: at.y + dir.y * d,
            z: at.z + dir.z * d,
          };
          const q = new THREE.Quaternion().setFromUnitVectors(faceUp, dir);
          buds.push(placed(head.petals, on, q), placed(pistil, on, q));
          top = Math.max(top, on.y + B.radius);
          reach = Math.max(reach, Math.hypot(on.x, on.z) + B.radius);
        }
    }
    canopy = joined(lobes);
    if (B) blooms = joined(buds);
  } else if (T.kind === "conifer") {
    const C = T.conifer;
    const tiers = [];
    let base = C.from * trunkH - T.sink;
    let r = C.radius,
      h = C.height;
    for (let i = 0; i < C.tiers; i++) {
      const cone = primitiveGeometry(
        "cylinder",
        r,
        undefined,
        1,
        { tall: h / (2 * r), top: { inflate: 0 } },
        undefined,
        { ...C.clay, seed: C.clay.seed + i },
      );
      const lift = -extentOf(cone).min.y;
      tiers.push(placed(cone, { y: base + lift }));
      top = Math.max(top, base + h);
      reach = Math.max(reach, r);
      base += h * (1 - C.overlap);
      r *= C.step;
      h *= C.step;
    }
    canopy = joined(tiers);
  } else if (T.kind === "dead") {
    const D = T.dead;
    for (let i = 0; i < D.count; i++) {
      const branch = stalk(D.radius, D.length, 0.35, 5, {
        ...K.clay,
        seed: K.clay.seed + 1 + i,
      });
      // Thrown out of the trunk: tipped `rise` up from level, then turned
      // round it.
      const q = new THREE.Quaternion()
        .setFromAxisAngle(
          new THREE.Vector3(0, 1, 0),
          THREE.MathUtils.degToRad(D.turn * i),
        )
        .multiply(
          new THREE.Quaternion().setFromAxisAngle(
            new THREE.Vector3(0, 0, 1),
            -THREE.MathUtils.degToRad(90 - D.rise),
          ),
        );
      const y = (D.from + D.spacing * i) * trunkH - T.sink;
      parts.push(placed(branch, { y }, q));
      const flat = Math.cos(THREE.MathUtils.degToRad(D.rise)) * D.length;
      const up = Math.sin(THREE.MathUtils.degToRad(D.rise)) * D.length;
      top = Math.max(top, y + up);
      reach = Math.max(reach, flat + K.radius);
    }
  } else
    throw new Error(
      `TREE kind must be one of ${TREE_KINDS.map((k) => `"${k}"`).join(", ")}, got ${JSON.stringify(T.kind)}`,
    );

  return { trunk: joined(parts), canopy, blooms, top, reach };
}
