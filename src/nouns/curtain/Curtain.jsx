import { useEffect, useMemo } from "react";
import * as THREE from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";

import { merge } from "../../world/merge.js";
import { unlitMat } from "../../adjectives/unlit/material.js";
import { spotsOf, polygonOf } from "../pattern/Pattern.jsx";
import { CURTAIN } from "./objects.js";

// One panel's cloth, laid out: `flat` the cloth's own width, gathered into
// `spread` across, `n` folds, `A` deep; its top at y = 0 hanging `drop`.
// x runs 0..spread from the end it is gathered toward. Where a point of the
// flat cloth u (0..flat) lands across, and how far out (z) the fold stands
// there, and its slope.
function panelOf({ flat, spread, n, A, drop }) {
  const k = (2 * Math.PI * n) / spread;
  const at = (u) => (u / flat) * spread;
  const z = (x) => A * (0.5 - 0.5 * Math.cos(k * x));
  const dz = (x) => A * 0.5 * k * Math.sin(k * x);
  const segs = Math.max(8, n * 8);
  const geo = new THREE.PlaneGeometry(spread, drop, segs, 1);
  geo.translate(spread / 2, -drop / 2, 0);
  const p = geo.attributes.position;
  for (let i = 0; i < p.count; i++) p.setZ(i, z(p.getX(i)));
  geo.computeVertexNormals();
  return { geo, at, z, dz };
}

// ONE CURTAIN (see CURTAIN): `config` overrides any of its fields
export default function Curtain({ config }) {
  const C = useMemo(() => merge(CURTAIN, config), [config]);
  const half = C.width / 2 - C.rod.knob * 1.5; // each panel's reach, from the middle to near the knob
  const parts = useMemo(() => {
    const flat = half * C.fullness;
    const open = THREE.MathUtils.clamp(C.open, 0, 1);
    const spread = Math.max(0.06, half * (1 - 0.82 * open)); // drawn back toward the end
    const n = Math.max(2, Math.round(flat * C.pleats));
    // gathered tighter, the folds stand out deeper
    const A = C.depth * Math.sqrt(half / spread);
    const P = panelOf({ flat, spread, n, A, drop: C.length });
    // the pattern, laid out on the flat cloth and carried onto the folds
    let dots = null;
    if (C.pattern.layout !== "none") {
      const spots = spotsOf({ width: flat, length: C.length, cornerRadius: 0 }, C.pattern);
      const outline = polygonOf(merge({ sides: 8, radius: 0.02, inner: 1, turn: 0 }, C.dot));
      const list = spots.map(({ x, z: y }) => {
        const ax = P.at(x + flat / 2);
        const g = new THREE.ExtrudeGeometry(outline, { depth: C.pattern.raise, bevelEnabled: false });
        g.rotateY(-Math.atan(P.dz(ax)));
        g.translate(ax, -C.length / 2 - y, P.z(ax) + 0.001);
        return g;
      });
      dots = list.length ? mergeGeometries(list, false) : null;
      list.forEach((g) => g.dispose());
    }
    return { cloth: P.geo, dots };
  }, [half, C.fullness, C.open, C.pleats, C.depth, C.length, C.pattern, C.dot]);
  useEffect(() => () => { parts.cloth.dispose(); parts.dots?.dispose(); }, [parts]);
  const R = C.rod, top = -R.radius * 2.2;
  const ringsAt = useMemo(() => {
    // a ring on the rod at the top of every other fold, each panel's
    const spread = Math.max(0.06, half * (1 - 0.82 * THREE.MathUtils.clamp(C.open, 0, 1)));
    const n = Math.max(2, Math.round(half * C.fullness * C.pleats));
    return Array.from({ length: Math.floor(n / 2) + 1 }, (_, i) => (i * 2 * spread) / n);
  }, [half, C.open, C.fullness, C.pleats]);
  return (
    <group>
      {/* the rod, and a knob at each end */}
      <mesh rotation-z={Math.PI / 2} material={unlitMat(R.color)} castShadow>
        <cylinderGeometry args={[R.radius, R.radius, C.width, 10]} />
      </mesh>
      {[-1, 1].map((e) => (
        <mesh key={e} position-x={e * C.width / 2} material={unlitMat(R.color)}>
          <sphereGeometry args={[R.knob, 12, 10]} />
        </mesh>
      ))}
      {/* the two panels, each gathered from its end of the rod toward the middle */}
      {[-1, 1].map((e) => (
        <group key={`p${e}`} position={[e * half, top, 0]} scale={[-e, 1, 1]}>
          <mesh geometry={parts.cloth} material={unlitMat(C.color)} castShadow receiveShadow />
          {parts.dots && <mesh geometry={parts.dots} material={unlitMat(C.dot.color)} />}
          {R.rings && ringsAt.map((x, i) => (
            <mesh key={i} position={[x, -top, 0]} rotation-y={Math.PI / 2} material={unlitMat(R.color)}>
              <torusGeometry args={[R.radius * 1.7, R.radius * 0.35, 6, 12]} />
            </mesh>
          ))}
        </group>
      ))}
    </group>
  );
}
