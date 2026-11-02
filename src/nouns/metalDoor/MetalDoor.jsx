import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";

import { merge } from "../../world/merge.js";
import { unlitMat } from "../../adjectives/unlit/material.js";
import Molding from "../../interior/Molding.jsx";
import { METAL_DOOR } from "./objects.js";

// A doorway's outline into `path`, as a notch up from the foot of a wall:
// from (x0, 0) up the left jamb, over the head — a half-ellipse rising
// `curve` × half the width (as the dollies' archways, src/interior/
// Molding.jsx), flat at 0 — and down the right jamb to (x1, 0). For a
// wall's own outline, drawn left to right along its foot.
export function archOutline(path, x0, x1, height, curve) {
  const r = (x1 - x0) / 2, rise = r * Math.max(0, Math.min(1, curve));
  path.lineTo(x0, 0);
  path.lineTo(x0, height - rise);
  if (rise > 1e-3) path.absellipse((x0 + x1) / 2, height - rise, r, rise, Math.PI, 0, true);
  else path.lineTo(x1, height);
  path.lineTo(x1, 0);
  return path;
}

// The window's outline, centred on (cx, cy): a circle, or a square with
// its corners rounded
function windowShape(path, W, cx, cy, grow = 0) {
  const r = W.size / 2 + grow;
  if (W.shape === "square") {
    const c = Math.min(r * 0.35, 0.06 + grow);
    path.moveTo(cx - r + c, cy - r);
    path.lineTo(cx + r - c, cy - r); path.quadraticCurveTo(cx + r, cy - r, cx + r, cy - r + c);
    path.lineTo(cx + r, cy + r - c); path.quadraticCurveTo(cx + r, cy + r, cx + r - c, cy + r);
    path.lineTo(cx - r + c, cy + r); path.quadraticCurveTo(cx - r, cy + r, cx - r, cy + r - c);
    path.lineTo(cx - r, cy - r + c); path.quadraticCurveTo(cx - r, cy - r, cx - r + c, cy - r);
  } else {
    path.absarc(cx, cy, r, 0, Math.PI * 2, false);
  }
  return path;
}
const extrude = (shape, depth) => new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: false, curveSegments: 28 });

// THE METAL DOOR (see METAL_DOOR): `config` overrides any of its fields;
// `swing`, if given, a ref whose `current` (-1 to 1) it eases its `open` to
const SWUNG = 1.5; // wide open, in radians
export default function MetalDoor({ config, swing }) {
  const M = useMemo(() => merge(METAL_DOOR, config), [config]);
  const { width, height, curve, hinge, window: W } = M;
  const g = M.leaf.gap, t = M.leaf.thickness;
  // the leaf: the doorway less its gap all round, its head bowed to match
  const lw = width - 2 * g, lh = height - g;
  const geos = useMemo(() => {
    // its head the doorway's, `g` in, so the shoulders meet the same height
    const rise = (width / 2) * Math.max(0, Math.min(1, curve)), leafCurve = Math.max(0, Math.min(1, (rise - g) / (lw / 2)));
    const leaf = archOutline(new THREE.Shape().moveTo(lw / 2, 0), -lw / 2, lw / 2, lh, rise > 1e-3 ? leafCurve : 0);
    leaf.holes.push(windowShape(new THREE.Path(), W, 0, W.at));
    const body = extrude(leaf, t); body.translate(0, 0, -t / 2);
    const ringShape = windowShape(new THREE.Shape(), W, 0, W.at, W.ring);
    ringShape.holes.push(windowShape(new THREE.Path(), W, 0, W.at));
    const ring = extrude(ringShape, t + 0.024); ring.translate(0, 0, -(t + 0.024) / 2);
    const glass = new THREE.ShapeGeometry(windowShape(new THREE.Shape(), W, 0, W.at), 28);
    return { body, ring, glass };
  }, [lw, lh, t, curve, width, W]);
  useEffect(() => () => Object.values(geos).forEach((x) => x.dispose()), [geos]);
  // swung about its hinge, at the jamb on the `hinge` side
  const leaf = useRef();
  const angle = (o) => -hinge * SWUNG * THREE.MathUtils.clamp(o ?? 0, -1, 1);
  useFrame((_, dt) => {
    if (!leaf.current || !swing) return;
    leaf.current.rotation.y += (angle(swing.current) - leaf.current.rotation.y) * Math.min(1, dt * 7);
  });
  const plate = 0.006, side = -hinge; // the push plate on the side away from the hinge
  return (
    <group>
      {/* the moulding round the doorway, on both faces of the wall */}
      {M.frame && [1, -1].map((f) => (
        <group key={f} position-z={f * M.wall / 2} rotation-y={f > 0 ? 0 : Math.PI}>
          <Molding width={width} height={height} topCurve={curve} frame={M.frame} />
        </group>
      ))}
      <group ref={leaf} position-x={hinge * (lw / 2)} rotation-y={swing ? undefined : angle(M.open)}>
        <group position-x={-hinge * (lw / 2)}>
          <mesh geometry={geos.body} material={unlitMat(M.colors.steel)} castShadow receiveShadow />
          <mesh geometry={geos.ring} material={unlitMat(M.colors.ring)} />
          <mesh geometry={geos.glass}>
            <meshBasicMaterial color={M.colors.glass.hex} transparent opacity={0.4} depthWrite={false} side={THREE.DoubleSide} />
          </mesh>
          {[-1, 1].map((f) => (
            <group key={f}>
              {M.kick.height > 0 && (
                <mesh position={[0, M.kick.height / 2 + 0.02, f * (t / 2 + plate / 2)]} material={unlitMat(M.colors.kick)}>
                  <boxGeometry args={[lw - 0.06, M.kick.height, plate]} />
                </mesh>
              )}
              <mesh position={[side * (lw / 2 - 0.05 - M.push.width / 2), M.push.at, f * (t / 2 + plate / 2)]} material={unlitMat(M.colors.push)}>
                <boxGeometry args={[M.push.width, M.push.height, plate]} />
              </mesh>
            </group>
          ))}
        </group>
      </group>
    </group>
  );
}
