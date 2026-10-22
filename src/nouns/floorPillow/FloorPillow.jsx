import { useEffect, useMemo } from "react";
import * as THREE from "three";

import { merge } from "../../world/merge.js";
import { unlitMat } from "../../adjectives/unlit/material.js";
import { FLOOR_PILLOW } from "./objects.js";

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

// How tall the pillow lies off the ground.
export function floorPillowHeightOf(C) {
  return C.thickness;
}

// How far out from its middle it spreads, across (x) and along (z).
export function floorPillowFootprintOf(C) {
  return { x: C.size / 2, z: C.size / 2 };
}

// One floor pillow, lying on the ground at y = 0. `config` overrides any
// of FLOOR_PILLOW's fields for this one instance.
export default function FloorPillow({ config }) {
  const C = useMemo(() => merge(FLOOR_PILLOW, config), [config]);
  const round = C.shape === "round";
  const size = C.size;
  const h = C.thickness;
  const paint = C.colors;

  // The square cushion: a rounded square extruded to the thickness with a
  // generous bevel, so its edges round over like a stuffed cushion. The
  // bevel grows the outline, so the shape is drawn that much smaller to
  // come out `size` across; the waist is where the bevel is widest.
  const bevel = Math.min(h * C.dome, size * 0.3);
  const cushion = useMemo(() => {
    if (round) return null;
    const g = new THREE.ExtrudeGeometry(roundedRect(size - 2 * bevel, size - 2 * bevel, C.corner), {
      depth: Math.max(0.01, h - 2 * bevel),
      bevelEnabled: true,
      bevelThickness: bevel,
      bevelSize: bevel,
      bevelSegments: 5,
      curveSegments: 8,
    });
    g.rotateX(-Math.PI / 2);
    g.translate(0, bevel, 0);
    return g;
  }, [round, size, h, bevel, C.corner]);
  useEffect(() => () => cushion?.dispose(), [cushion]);

  // The piping follows the cushion's waist: the rounded square's outline
  // at its widest, as a tube on a closed curve.
  const piping = useMemo(() => {
    if (round) return null;
    const pts = roundedRect(size, size, C.corner + bevel)
      .getSpacedPoints(96)
      .map((p) => new THREE.Vector3(p.x, 0, p.y));
    const curve = new THREE.CatmullRomCurve3(pts, true, "catmullrom", 0.1);
    return new THREE.TubeGeometry(curve, 96, C.piping.radius, 8, true);
  }, [round, size, bevel, C.corner, C.piping.radius]);
  useEffect(() => () => piping?.dispose(), [piping]);

  const tuftY = h - C.tuft.radius * C.tuft.sink;
  return (
    <group>
      {round ? (
        <>
          <mesh castShadow receiveShadow position-y={h / 2} scale={[1, h / size, 1]} material={unlitMat(paint.body)}>
            <sphereGeometry args={[size / 2, 24, 16]} />
          </mesh>
          <mesh castShadow receiveShadow position-y={h / 2} rotation-x={Math.PI / 2} material={unlitMat(paint.piping)}>
            <torusGeometry args={[size / 2, C.piping.radius, 8, 48]} />
          </mesh>
        </>
      ) : (
        <>
          <mesh castShadow receiveShadow geometry={cushion} material={unlitMat(paint.body)} />
          <mesh castShadow receiveShadow geometry={piping} position-y={h / 2} material={unlitMat(paint.piping)} />
        </>
      )}
      {/* The button, tufted into the top. */}
      <mesh castShadow receiveShadow position-y={tuftY} material={unlitMat(paint.piping)}>
        <sphereGeometry args={[C.tuft.radius, 16, 12]} />
      </mesh>
    </group>
  );
}
