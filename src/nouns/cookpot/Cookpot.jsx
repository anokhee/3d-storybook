import { useEffect, useMemo } from "react";
import * as THREE from "three";

import { merge } from "../../world/merge.js";
import { unlitMat } from "../../adjectives/unlit/material.js";
import { COOKPOT } from "./objects.js";
import { buildCurry, buildNoodles, disposeFill } from "../../world/food/fill.js";

// How tall it stands: the lid's knob (or the rim, lidless).
export function cookpotHeightOf(C) {
  return C.height + (C.lid.on ? C.lid.rise + C.lid.knob * 1.6 : 0);
}

// One cookpot (see COOKPOT), standing on y = 0. `config` overrides any of
// COOKPOT's fields.
export default function Cookpot({ config }) {
  const C = useMemo(() => merge(COOKPOT, config), [config]);
  const r = C.radius, h = C.height, w = C.wall, L = C.lid, H = C.handles;

  // the pot, on a lathe: out across the bottom, up the side, over the rim
  // and back down the inside to its floor
  const pot = useMemo(() => new THREE.LatheGeometry([
    new THREE.Vector2(0, 0), new THREE.Vector2(r - 0.02, 0), new THREE.Vector2(r, 0.02),
    new THREE.Vector2(r, h), new THREE.Vector2(r - w, h), new THREE.Vector2(r - w, w), new THREE.Vector2(0, w),
  ], C.sides), [r, h, w, C.sides]);
  // the lid: a low dome on a brim just wider than the rim
  const lid = useMemo(() => {
    const pts = [new THREE.Vector2(r + 0.015, 0)];
    for (let i = 0; i <= 8; i++) { const t = i / 8; pts.push(new THREE.Vector2((r + 0.015) * Math.cos((t * Math.PI) / 2), 0.012 + L.rise * Math.sin((t * Math.PI) / 2))); }
    pts.push(new THREE.Vector2(0, 0.012 + L.rise));
    pts.unshift(new THREE.Vector2(0, 0));
    return new THREE.LatheGeometry(pts, C.sides);
  }, [r, L.rise, C.sides]);
  // a loop handle: half a torus standing out from the side
  const loop = useMemo(() => new THREE.TorusGeometry(H.span / 2, H.radius, 8, 12, Math.PI), [H.span, H.radius]);
  useEffect(() => () => [pot, lid, loop].forEach((g) => g.dispose()), [pot, lid, loop]);
  // what's in it, when the lid's off: the same curry (or noodles) as a
  // Bowl's, at `fill` of the way up the inside
  const inside = useMemo(() => {
    if (L.on || C.inside === "empty") return null;
    const f = C.inside === "noodles" ? buildNoodles(r - w, C.seed) : buildCurry(r - w, C.seed);
    f.position.y = w + Math.max(0, Math.min(1, C.fill)) * (h - w - 0.01);
    return f;
  }, [L.on, C.inside, C.fill, C.seed, r, w, h]);
  useEffect(() => () => inside && disposeFill(inside), [inside]);

  return (
    <group>
      <mesh geometry={pot} material={unlitMat(C.colors.pot)} castShadow receiveShadow />
      {inside && <primitive object={inside} />}
      {L.on && (
        <group position-y={h}>
          <mesh geometry={lid} material={unlitMat(C.colors.lid)} castShadow />
          <mesh position-y={0.012 + L.rise + L.knob * 0.7} material={unlitMat(C.colors.handle)} castShadow>
            <sphereGeometry args={[L.knob, 12, 8]} />
          </mesh>
        </group>
      )}
      {[-1, 1].map((e) => (
        // lying flat, its open side against the pot, its bend out past it
        <mesh key={e} geometry={loop} position={[e * (r - 0.01), h * 0.82, 0]} rotation={[Math.PI / 2, 0, e > 0 ? -Math.PI / 2 : Math.PI / 2]} material={unlitMat(C.colors.handle)} castShadow
          scale={[1, (H.reach + H.radius) / (H.span / 2), 1]} />
      ))}
    </group>
  );
}
