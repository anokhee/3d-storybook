import { useEffect, useMemo } from "react";
import * as THREE from "three";

import { merge } from "../../world/merge.js";
import { unlitMat } from "../../adjectives/unlit/material.js";
import { CUTLERY } from "./objects.js";

// The handle: a flat bar from the far end (-z) to `to`, a little wider at
// its end, with a rounded butt.
function Handle({ C, from, to }) {
  const steel = unlitMat(C.color);
  const len = to - from;
  return (
    <group>
      <mesh position={[0, C.thick / 2, from + len / 2]} material={steel}>
        <boxGeometry args={[C.width, C.thick, len]} />
      </mesh>
      <mesh position={[0, C.thick / 2, from]} material={steel}>
        <cylinderGeometry args={[C.width * 0.7, C.width * 0.7, C.thick, 14]} />
      </mesh>
    </group>
  );
}

// A FORK (see CUTLERY): a handle, a neck widening to a head, its tines out
// toward +z. `config` overrides CUTLERY's fields.
export function Fork({ config }) {
  const C = useMemo(() => merge(CUTLERY, config), [config]);
  const L = C.length, steel = unlitMat(C.color);
  const head = C.width * 2.1, n = Math.max(2, Math.round(C.tines));
  const tine = (head / n) * 0.55;
  return (
    <group>
      <Handle C={C} from={-L / 2 + C.width * 0.7} to={L * 0.1} />
      {/* the head the tines spring from */}
      <mesh position={[0, C.thick / 2, L * 0.16]} material={steel}>
        <boxGeometry args={[head, C.thick, L * 0.12]} />
      </mesh>
      {Array.from({ length: n }, (_, i) => (
        <mesh key={i} position={[(i - (n - 1) / 2) * (head - tine) / (n - 1), C.thick / 2, L * 0.335]} material={steel}>
          <boxGeometry args={[tine, C.thick, L * 0.23]} />
        </mesh>
      ))}
    </group>
  );
}

// A KNIFE (see CUTLERY): a handle and a broader, thinner blade toward +z,
// its tip rounded.
export function Knife({ config }) {
  const C = useMemo(() => merge(CUTLERY, config), [config]);
  const L = C.length, steel = unlitMat(C.color);
  const bw = L * C.blade * 0.9, bl = L * 0.5;
  return (
    <group>
      <Handle C={C} from={-L / 2 + C.width * 0.7} to={0} />
      <mesh position={[0, C.thick * 0.3, bl / 2 - bw / 2]} material={steel}>
        <boxGeometry args={[bw, C.thick * 0.6, bl - bw]} />
      </mesh>
      <mesh position={[0, C.thick * 0.3, bl - bw]} material={steel}>
        <cylinderGeometry args={[bw / 2, bw / 2, C.thick * 0.6, 16, 1, false, -Math.PI / 2, Math.PI]} />
      </mesh>
    </group>
  );
}

// A SPOON (see CUTLERY): a handle and a shallow oval bowl toward +z.
export function Spoon({ config }) {
  const C = useMemo(() => merge(CUTLERY, config), [config]);
  const L = C.length, steel = unlitMat(C.color);
  const bw = L * C.bowl;
  return (
    <group>
      <Handle C={C} from={-L / 2 + C.width * 0.7} to={L * 0.18} />
      {/* the bowl: a flattened oval */}
      <mesh position={[0, C.thick, L / 2 - bw * 0.68]} scale={[bw / 2, C.thick * 1.1, bw * 0.68]} material={steel}>
        <sphereGeometry args={[1, 18, 10]} />
      </mesh>
    </group>
  );
}

// A SHARP KNIFE (see CUTLERY's `sharp`): a kitchen knife, longer, its
// handle dark with two rivets in it and a steel bolster where the blade
// begins; the blade's spine straight and its edge sweeping up to the
// point, along the spine's side. Lying flat, the point toward +z.
export function SharpKnife({ config }) {
  const C = useMemo(() => merge(CUTLERY, config), [config]);
  const K = C.sharp, L = C.length * K.scale, steel = unlitMat(C.color), wood = unlitMat(K.handle);
  const hl = L * 0.38, bl = L * 0.6, bw = L * K.blade, hw = C.width * 1.3, t = C.thick;
  const blade = useMemo(() => {
    // in the shape's plane: x across, y along (to become z)
    const s = new THREE.Shape();
    s.moveTo(bw / 2, 0);
    s.lineTo(bw / 2, bl * 0.72);
    s.quadraticCurveTo(bw / 2, bl * 0.92, bw * 0.3, bl);
    s.quadraticCurveTo(-bw * 0.5, bl * 0.7, -bw / 2, bl * 0.45);
    s.lineTo(-bw / 2, 0);
    s.closePath();
    const g = new THREE.ExtrudeGeometry(s, { depth: t * 0.5, bevelEnabled: false, curveSegments: 12 });
    g.rotateX(Math.PI / 2); // its length along +z, its thickness down from y = 0
    g.translate(0, t * 0.5, 0);
    return g;
  }, [bw, bl, t]);
  useEffect(() => () => blade.dispose(), [blade]);
  const z0 = -L / 2 + hl; // where the blade begins
  return (
    <group>
      <mesh position={[0, t * 0.7, z0 - hl / 2]} material={wood}>
        <boxGeometry args={[hw, t * 1.4, hl]} />
      </mesh>
      {[0.3, 0.7].map((f) => (
        <mesh key={f} position={[0, t * 1.42, z0 - hl * f]} material={steel}>
          <cylinderGeometry args={[hw * 0.18, hw * 0.18, t * 0.1, 10]} />
        </mesh>
      ))}
      <mesh position={[0, t * 0.7, z0 + t]} material={steel}>
        <boxGeometry args={[Math.max(hw, bw) * 1.02, t * 1.4, t * 2]} />
      </mesh>
      <mesh geometry={blade} position-z={z0 + t * 2} material={steel} />
    </group>
  );
}

// One of the four by `kind` (CUTLERY_KINDS).
export default function Cutlery({ kind = "fork", config }) {
  return kind === "knife" ? <Knife config={config} />
    : kind === "spoon" ? <Spoon config={config} />
    : kind === "sharp knife" ? <SharpKnife config={config} />
    : <Fork config={config} />;
}
