import { useEffect, useMemo } from "react";
import * as THREE from "three";

import { merge } from "../../world/merge.js";
import { unlitMat } from "../../adjectives/unlit/material.js";
import { TOWEL_RACK } from "./objects.js";

// The towel's side profile, about the bar's middle: an inverted U of
// cloth `t` thick over a bar of radius `r`, its front panel (toward +x
// here, +z once stood up) hanging `front` down and its back panel `back`,
// both hems rounded by `c`. Built from points, no two the same:
// ExtrudeGeometry's bevel vectors blow up at a repeated point.
function towelProfile(r, t, front, back, c) {
  const ri = r + 0.015;
  const ro = ri + t;
  c = Math.max(0, Math.min(c, t / 2));
  const pts = [];
  const arc = (ox, oy, rad, from, to, n) => {
    for (let i = 0; i <= n; i++) {
      const a = from + ((to - from) * i) / n;
      pts.push(new THREE.Vector2(ox + rad * Math.cos(a), oy + rad * Math.sin(a)));
    }
  };
  // up the inside of the front panel, over the bar, down the inside of the back
  arc(0, 0, ri, 0, Math.PI, 10);
  // the back hem, out to the back face
  arc(-ri - c, -back + c, c, 0, -Math.PI / 2, 3);
  arc(-ro + c, -back + c, c, -Math.PI / 2, -Math.PI, 3);
  // up the outside, over the bar, down the front face
  arc(0, 0, ro, Math.PI, 0, 10);
  // the front hem, back in to the inside face
  arc(ro - c, -front + c, c, 0, -Math.PI / 2, 3);
  arc(ri + c, -front + c, c, -Math.PI / 2, -Math.PI, 3);
  const out = pts.filter((p, i) => i === 0 || p.distanceTo(pts[i - 1]) > 1e-6);
  if (out[out.length - 1].distanceTo(out[0]) <= 1e-6) out.pop();
  return new THREE.Shape(out);
}

// How many bars, 1 or 2.
const barsOf = (C) => Math.max(1, Math.min(2, Math.round(C.bars)));

// How tall the rack reaches: the top of the cloth over the highest bar.
export function towelRackHeightOf(C) {
  return C.hang + (barsOf(C) - 1) * C.spacing + C.bar.radius + 0.015 + C.towel.thickness;
}

// How far out from its middle it spreads, across (x) and out from the
// wall (z): the bar's length, and the cloth hanging in front of it.
export function towelRackFootprintOf(C) {
  return { x: C.width / 2, z: C.bar.standoff + C.bar.radius + 0.015 + C.towel.thickness };
}

// One towel rack against a wall at z = 0, facing +z, its foot at y = 0.
// `config` overrides any of TOWEL_RACK's fields for this one instance.
export default function TowelRack({ config }) {
  const C = useMemo(() => merge(TOWEL_RACK, config), [config]);
  const R = C.bar;
  const K = C.bracket;
  const T = C.towel;
  const paint = C.colors;
  const bars = barsOf(C);
  const towelWidth = Math.max(0.2, Math.min(T.width, C.width - 2 * (K.inset + K.radius + 0.12)));
  const ro = R.radius + 0.015 + T.thickness;

  // The cloth: its profile extruded across the towel's width, then turned
  // so the extrusion runs along the bar (x) and the panels hang along z.
  const towel = useMemo(() => {
    const g = new THREE.ExtrudeGeometry(towelProfile(R.radius, T.thickness, T.front, T.back, T.corner), {
      depth: towelWidth,
      bevelEnabled: false,
      curveSegments: 10,
    });
    g.rotateY(-Math.PI / 2);
    g.translate(towelWidth / 2, 0, 0);
    return g;
  }, [R.radius, T, towelWidth]);
  useEffect(() => () => towel.dispose(), [towel]);

  const bracketX = C.width / 2 - K.inset;
  const stripe = T.stripe.height > 0;
  return (
    <group>
      {Array.from({ length: bars }, (_, i) => (
        <group key={i} position-y={C.hang + i * C.spacing}>
          {/* The two brackets: a plate on the wall and an arm out to the bar. */}
          {[-1, 1].map((x) => (
            <group key={x} position-x={x * bracketX}>
              <mesh castShadow receiveShadow position-z={0.02} rotation-x={Math.PI / 2} material={unlitMat(paint.rack)}>
                <cylinderGeometry args={[K.plate / 2, K.plate / 2, 0.04, 16]} />
              </mesh>
              <mesh castShadow receiveShadow position-z={R.standoff / 2} rotation-x={Math.PI / 2} material={unlitMat(paint.rack)}>
                <cylinderGeometry args={[K.radius, K.radius, R.standoff, 12]} />
              </mesh>
            </group>
          ))}
          {/* The bar between them. */}
          <mesh castShadow receiveShadow position-z={R.standoff} rotation-z={Math.PI / 2} material={unlitMat(paint.rack)}>
            <cylinderGeometry args={[R.radius, R.radius, C.width, 12]} />
          </mesh>
          {/* The towel over the bar, and its stripes above each hem: one on
              the front panel's face, one on the back panel where it shows
              below the shorter front. Each is sunk into the cloth with a hair
              standing proud, so its top edge is no sliver to alias on; a
              band that thin takes no shadow either. */}
          <group position-z={R.standoff}>
            <mesh castShadow receiveShadow geometry={towel} material={unlitMat(paint.towel)} />
            {stripe && (
              <>
                <mesh castShadow position={[0, -T.front + T.stripe.from, ro - 0.009]} material={unlitMat(paint.stripe)}>
                  <boxGeometry args={[towelWidth + 0.02, T.stripe.height, 0.03]} />
                </mesh>
                <mesh castShadow position={[0, -T.back + T.stripe.from, -R.radius - 0.015 - 0.009]} material={unlitMat(paint.stripe)}>
                  <boxGeometry args={[towelWidth + 0.02, T.stripe.height, 0.03]} />
                </mesh>
              </>
            )}
          </group>
        </group>
      ))}
    </group>
  );
}
