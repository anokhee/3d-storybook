import { useEffect, useMemo } from "react";
import * as THREE from "three";

import { merge } from "../../world/merge.js";
import { unlitMat } from "../../adjectives/unlit/material.js";
import { BED } from "./objects.js";

// The outline of a rectangle `w` by `h` about the origin with its corners
// rounded by `r`, each corner `segs` straight pieces. Built from points,
// no two the same: ExtrudeGeometry bevels a repeated point (even one a
// rounding error away, which absarc after lineTo can leave) into a spike.
function roundedRect(w, h, r, segs = 6) {
  r = Math.max(0, Math.min(r, w / 2, h / 2));
  const cx = w / 2 - r;
  const cy = h / 2 - r;
  const corners = [
    [cx, -cy, -Math.PI / 2],
    [cx, cy, 0],
    [-cx, cy, Math.PI / 2],
    [-cx, -cy, Math.PI],
  ];
  const pts = [];
  for (const [ox, oy, from] of corners)
    for (let i = 0; i <= segs; i++) {
      const a = from + (i / segs) * (Math.PI / 2);
      pts.push(new THREE.Vector2(ox + r * Math.cos(a), oy + r * Math.sin(a)));
    }
  return new THREE.Shape(distinct(pts));
}

// The points with any repeat of its neighbour dropped, round the loop.
function distinct(pts) {
  const out = pts.filter((p, i) => i === 0 || p.distanceTo(pts[i - 1]) > 1e-6);
  if (out.length > 1 && out[out.length - 1].distanceTo(out[0]) <= 1e-6) out.pop();
  return out;
}

// A soft slab: a rounded rectangle `w` across by `l` along, pressed
// `h` thick with its edges bevelled by `bevel`, lying flat with its
// underside at y = 0 and its middle on the axis.
function slabOf(w, l, h, corner, bevel) {
  const b = Math.max(0, Math.min(bevel, h / 2 - 0.005, w / 4, l / 4));
  const g = new THREE.ExtrudeGeometry(roundedRect(w - 2 * b, l - 2 * b, corner), {
    depth: h - 2 * b,
    bevelEnabled: b > 0,
    bevelThickness: b,
    bevelSize: b,
    bevelSegments: 2,
    curveSegments: 6,
  });
  g.rotateX(-Math.PI / 2);
  g.translate(0, b, 0);
  return g;
}

// A board `w` wide standing `h` tall from y = 0 with its top corners
// rounded by `r`, `t` thick toward +z from z = 0.
function boardOf(w, h, r, t) {
  r = Math.max(0, Math.min(r, w / 2, h));
  const s = new THREE.Shape();
  s.moveTo(-w / 2, 0);
  s.lineTo(w / 2, 0);
  s.lineTo(w / 2, h - r);
  s.absarc(w / 2 - r, h - r, r, 0, Math.PI / 2, false);
  s.lineTo(-w / 2 + r, h);
  s.absarc(-w / 2 + r, h - r, r, Math.PI / 2, Math.PI, false);
  s.closePath();
  return new THREE.ExtrudeGeometry(s, { depth: t, bevelEnabled: false, curveSegments: 10 });
}

// Where the frame's top is, off the ground.
const frameTopOf = (C) => C.frame.legHeight + C.frame.height;

// How tall the bed stands: the top of the headboard.
export function bedHeightOf(C) {
  return frameTopOf(C) + C.headboard.height;
}

// How far out from its middle it spreads, across (x) and along (z): the
// frame, and the boards past its ends.
export function bedFootprintOf(C) {
  const boards = Math.max(C.headboard.thickness, C.footboard.on ? C.footboard.thickness : 0);
  return { x: C.width / 2 + C.duvet.overhang, z: C.length / 2 + boards };
}

// One bed, standing on the ground at y = 0 with its foot toward +z.
// `config` overrides any of BED's fields for this one instance.
export default function Bed({ config }) {
  const C = useMemo(() => merge(BED, config), [config]);
  const F = C.frame;
  const M = C.mattress;
  const H = C.headboard;
  const B = C.footboard;
  const P = C.pillows;
  const D = C.duvet;
  const paint = C.colors;

  const frameTop = frameTopOf(C);
  const mw = C.width - 2 * M.inset;
  const ml = C.length - 2 * M.inset;
  const mattressTop = frameTop + M.height;
  const count = Math.max(1, Math.min(2, Math.round(P.count)));
  const pillowWidth = Math.min(P.width, (mw - 0.2 - P.gap * (count - 1)) / count);
  const duvetDepth = ml * D.cover;
  const duvetWidth = mw + 2 * D.overhang;

  const mattress = useMemo(() => slabOf(mw, ml, M.height, M.corner, M.bevel), [mw, ml, M]);
  const pillow = useMemo(
    () => slabOf(pillowWidth, P.depth, P.thickness, 0.12, P.thickness * 0.4),
    [pillowWidth, P],
  );
  const headboard = useMemo(
    () => boardOf(C.width, frameTop + H.height, H.corner, H.thickness),
    [C.width, frameTop, H],
  );
  const footboard = useMemo(
    () => boardOf(C.width, frameTop + B.height, B.corner, B.thickness),
    [C.width, frameTop, B],
  );
  useEffect(() => () => mattress.dispose(), [mattress]);
  useEffect(() => () => pillow.dispose(), [pillow]);
  useEffect(() => () => headboard.dispose(), [headboard]);
  useEffect(() => () => footboard.dispose(), [footboard]);

  const pillowXs = count === 1 ? [0] : [-(pillowWidth + P.gap) / 2, (pillowWidth + P.gap) / 2];
  const legX = C.width / 2 - F.inset;
  const legZ = C.length / 2 - F.inset;
  return (
    <group>
      {/* The four legs, under the frame's corners. */}
      {[-1, 1].map((x) =>
        [-1, 1].map((z) => (
          <mesh
            key={`${x}${z}`}
            castShadow
            receiveShadow
            position={[x * legX, F.legHeight / 2, z * legZ]}
            material={unlitMat(paint.frame)}
          >
            <cylinderGeometry args={[F.legRadius, F.legRadius, F.legHeight, 12]} />
          </mesh>
        )),
      )}
      {/* The frame, a low box on the legs. */}
      <mesh castShadow receiveShadow position-y={F.legHeight + F.height / 2} material={unlitMat(paint.frame)}>
        <boxGeometry args={[C.width, F.height, C.length]} />
      </mesh>
      {/* The mattress, in the sheet's color, set a little in from the frame's edges. */}
      <mesh castShadow receiveShadow geometry={mattress} position-y={frameTop} material={unlitMat(paint.sheet)} />
      {/* The headboard behind, and the footboard ahead, standing from the ground. */}
      <mesh
        castShadow
        receiveShadow
        geometry={headboard}
        position-z={-C.length / 2 - H.thickness}
        material={unlitMat(paint.frame)}
      />
      {B.on && (
        <mesh castShadow receiveShadow geometry={footboard} position-z={C.length / 2} material={unlitMat(paint.frame)} />
      )}
      {/* The pillows at the head. */}
      {pillowXs.map((x, i) => (
        <mesh
          key={i}
          castShadow
          receiveShadow
          geometry={pillow}
          position={[x, mattressTop, -ml / 2 + P.back + P.depth / 2]}
          material={unlitMat(paint.pillow)}
        />
      ))}
      {/* The duvet over the foot end, its head edge folded back to show the sheet. */}
      <mesh
        castShadow
        receiveShadow
        position={[0, mattressTop - M.bevel + D.thickness / 2, ml / 2 - duvetDepth / 2]}
        material={unlitMat(paint.duvet)}
      >
        <boxGeometry args={[duvetWidth, D.thickness, duvetDepth]} />
      </mesh>
      <mesh
        castShadow
        receiveShadow
        position={[0, mattressTop - M.bevel + D.thickness + 0.03, ml / 2 - duvetDepth + D.fold / 2]}
        material={unlitMat(paint.sheet)}
      >
        <boxGeometry args={[duvetWidth + 0.02, 0.06, D.fold]} />
      </mesh>
    </group>
  );
}
