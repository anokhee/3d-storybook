import { useEffect, useMemo } from "react";
import * as THREE from "three";

import { merge } from "../../world/merge.js";
import { unlitMat } from "../../adjectives/unlit/material.js";
import { TOILET } from "./objects.js";

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

// A lathe of the profile, faceted: flat normals, so the folds in the
// profile (the rim turned in, the foot flared out) read as folds rather
// than smearing the shading across them.
function facetedLathe(pts, segments) {
  const smooth = new THREE.LatheGeometry(pts, segments);
  const g = smooth.toNonIndexed();
  g.computeVertexNormals();
  smooth.dispose();
  return g;
}

// Where things stand, unscaled: the bowl's top, the tank's bottom and top.
function layoutOf(C) {
  const bowlTop = C.pedestal.height + C.bowl.height;
  const tankBottom = bowlTop - C.tank.drop;
  const tankTop = tankBottom + C.tank.height + C.tank.slab;
  // The bowl's middle sits ahead of the tank's front by its stretched radius,
  // so its back just touches the tank.
  const tankFront = -C.bowl.radius * C.bowl.stretch + C.pedestal.forward + 0.1;
  return { bowlTop, tankBottom, tankTop, tankFront, bowlZ: C.pedestal.forward + 0.1 };
}

// How tall the toilet stands: the flush button on the tank's lid, or the
// raised lid if it reaches higher.
export function toiletHeightOf(C) {
  const L = layoutOf(C);
  const lidTop = L.bowlTop + C.seat.thickness + C.lid * 2 * C.bowl.radius * C.bowl.stretch;
  return C.size * Math.max(L.tankTop + 0.05, lidTop);
}

// How far out from its middle it spreads, across (x) and along (z): the
// tank's width and the bowl's front to the tank's back.
export function toiletFootprintOf(C) {
  const L = layoutOf(C);
  return {
    x: (C.size * C.tank.width) / 2,
    z: C.size * Math.max(L.bowlZ + C.bowl.radius * C.bowl.stretch, -L.tankFront + C.tank.depth),
  };
}

// One toilet, standing on the ground at y = 0 facing +z. `config`
// overrides any of TOILET's fields for this one instance.
export default function Toilet({ config }) {
  const C = useMemo(() => merge(TOILET, config), [config]);
  const P = C.pedestal;
  const B = C.bowl;
  const T = C.tank;
  const paint = C.colors;
  const L = layoutOf(C);
  const lid = Math.max(0, Math.min(1, C.lid));

  // The pedestal: a lathe flaring out to its foot, in at the waist, and out
  // again to meet the bowl's underside.
  const pedestal = useMemo(() => {
    const top = B.radius * 0.78;
    const pts = [
      [P.foot, 0],
      [P.foot + 0.01, 0.1],
      [P.foot * 0.84, 0.3],
      [P.waist * 1.05, 0.55],
      [P.waist, P.height * 0.8],
      [top * 0.9, P.height * 0.95],
      [top, P.height],
    ].map(([r, y]) => new THREE.Vector2(r, y));
    return facetedLathe(pts, 24);
  }, [P, B.radius]);
  // The bowl: a lathe closed at the bottom, bellying out to the rim, then
  // turned in over it and down inside to the water, stretched along z.
  const bowl = useMemo(() => {
    const r = B.radius;
    const h = B.height;
    const pts = [
      [0, 0],
      [r * 0.78, 0],
      [r * 0.93, h * 0.3],
      [r, h * 0.7],
      [r, h * 0.9],
      [r * 0.95, h],
      [r * 0.72, h],
      [r * 0.68, h - B.water * 0.3],
      [r * 0.62, h - B.water],
      [r * 0.45, h - B.water - 0.12],
    ].map(([x, y]) => new THREE.Vector2(x, y));
    return facetedLathe(pts, 24);
  }, [B]);
  // The tank: a rounded rectangle seen from the front, extruded back.
  const tank = useMemo(() => {
    const g = new THREE.ExtrudeGeometry(roundedRect(T.width, T.height, T.corner), {
      depth: T.depth,
      bevelEnabled: false,
      curveSegments: 6,
    });
    g.translate(0, 0, -T.depth);
    return g;
  }, [T]);
  useEffect(() => () => pedestal.dispose(), [pedestal]);
  useEffect(() => () => bowl.dispose(), [bowl]);
  useEffect(() => () => tank.dispose(), [tank]);

  const seatTop = L.bowlTop + C.seat.thickness;
  const lidR = B.radius * 1.03;
  const lidDepth = lidR * B.stretch;
  const hingeZ = L.tankFront + C.lidDisc.thickness / 2 + 0.01;
  const ringR = B.radius * 0.78;
  const tubeR = B.radius - ringR;
  return (
    <group scale={C.size}>
      <mesh castShadow receiveShadow geometry={pedestal} position-z={P.forward} material={unlitMat(paint.porcelain)} />
      {/* The back of the base, joining the pedestal to the tank above. */}
      <mesh
        castShadow
        receiveShadow
        position={[0, L.tankBottom / 2 + 0.03, (L.tankFront - T.depth + 0.05 + L.bowlZ) / 2]}
        material={unlitMat(paint.porcelain)}
      >
        <boxGeometry args={[T.width * 0.7, L.tankBottom + 0.06, L.bowlZ - (L.tankFront - T.depth + 0.05)]} />
      </mesh>
      <group position={[0, P.height, L.bowlZ]} scale={[1, 1, B.stretch]}>
        <mesh castShadow receiveShadow geometry={bowl} material={unlitMat(paint.porcelain)} />
        {/* The water, a disc lying below the rim inside the bowl. */}
        <mesh receiveShadow position-y={B.height - B.water} rotation-x={-Math.PI / 2} material={unlitMat(paint.water)}>
          <circleGeometry args={[B.radius * 0.63, 24]} />
        </mesh>
        {/* The seat: a flattened ring on the rim. */}
        <mesh castShadow receiveShadow position-y={B.height + C.seat.thickness / 2} rotation-x={Math.PI / 2} scale={[1, 1, C.seat.thickness / (2 * tubeR)]} material={unlitMat(paint.seat)}>
          <torusGeometry args={[ringR, tubeR, 10, 32]} />
        </mesh>
      </group>
      {/* The lid: an oval disc hinged at the back, swinging up against the tank. */}
      <group position={[0, seatTop + C.lidDisc.thickness / 2, hingeZ]} rotation-x={-lid * (Math.PI / 2)}>
        <mesh castShadow receiveShadow position-z={lidDepth} scale={[1, 1, B.stretch]} material={unlitMat(paint.seat)}>
          <cylinderGeometry args={[lidR, lidR, C.lidDisc.thickness, 32]} />
        </mesh>
      </group>
      {/* The tank, its lid slab and the flush button. */}
      <mesh
        castShadow
        receiveShadow
        geometry={tank}
        position={[0, L.tankBottom + T.height / 2, L.tankFront]}
        material={unlitMat(paint.porcelain)}
      />
      <mesh
        castShadow
        receiveShadow
        position={[0, L.tankBottom + T.height + T.slab / 2, L.tankFront - T.depth / 2]}
        material={unlitMat(paint.porcelain)}
      >
        <boxGeometry args={[T.width + 0.08, T.slab, T.depth + 0.08]} />
      </mesh>
      <mesh
        castShadow
        receiveShadow
        position={[T.width / 2 - 0.25, L.tankTop + 0.025, L.tankFront - T.depth / 2]}
        material={unlitMat(paint.lever)}
      >
        <cylinderGeometry args={[T.button, T.button, 0.05, 16]} />
      </mesh>
    </group>
  );
}
