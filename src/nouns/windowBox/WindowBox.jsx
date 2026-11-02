import { useEffect, useMemo } from "react";
import * as THREE from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";

import { merge } from "../../world/merge.js";
import { unlitMat } from "../../adjectives/unlit/material.js";
import Primitive from "../primitive/Primitive.jsx";
import Ornament, { ornamentOf } from "../ornament/Ornament.jsx";
import { eulerOf } from "../primitive/geometry.js";
import { FLOWER, FLOWER_TYPES } from "../flower/objects.js";
import { STAR, STAR_TYPES } from "../starPolygon/objects.js";
import { TIPS } from "../../parts/antennae.js";
import { WINDOW_BOX } from "./objects.js";

const LEAF_GEO = TIPS.leaf.geo; // the pot plant's blade

// One window box — see WINDOW_BOX: the trough, its lip and its soil, and a
// row of stems along it each tipped with its plant, the pot plant's kinds
// (../potPlant/PotPlant.jsx): a flower tipped toward the front, a clay
// ball of a bush, or a leaf blade.

// A flower or star that has a turn of its own (a tulip stood up), undone,
// so it sits upright on its stem — as the cupcake house's were.
function uprightOf(shape) {
  const type = FLOWER_TYPES[shape] ? FLOWER : STAR;
  const own = (FLOWER_TYPES[shape] ?? STAR_TYPES[shape])?.rotation;
  if (!own) return undefined;
  const pose = new THREE.Euler(...eulerOf({ ...type.rotation, ...own }));
  const back = new THREE.Euler().setFromRotationMatrix(new THREE.Matrix4().makeRotationFromEuler(pose).invert(), "XYZ");
  return { x: THREE.MathUtils.radToDeg(back.x), y: THREE.MathUtils.radToDeg(back.y), z: THREE.MathUtils.radToDeg(back.z) };
}

// IVY (see WINDOW_BOX.ivy): strands of stem, each a tube along a curve —
// from the soil near the front, up over the lip, out and down, hanging
// with a little sway — and a few over each end; leaves along them every
// `spacing`, turned alternately to either side and a little out, their
// faces to the front; and a low mound of leaves lying on the soil. The
// leaves are the pot plant's blade, rounder and short, all one instanced
// mesh (a street of window boxes is a lot of leaves); the stems one merged
// tube. In the box's own frame: its top at y = height, its front at +z.
const IVY_LEAF = { aspect: 1.15, flat: 0.25 };
const _m = new THREE.Matrix4(), _x = new THREE.Vector3(), _y = new THREE.Vector3(), _z = new THREE.Vector3(), _p = new THREE.Vector3(), _s = new THREE.Vector3();
function ivyOf(B, count) {
  const I = B.ivy, Fl = B.flowers, H = B.height, D = B.depth / 2, W = B.width / 2;
  let seed = I.seed + Math.round(B.width * 100) + count;
  const r = () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;
  const size = Fl.radius * I.leaf, stemR = Math.max(0.004, Fl.radius * 0.07);
  const strands = [];
  // over the front: spread along it
  const n = Math.max(2, Math.round(count * I.strands));
  for (let i = 0; i < n; i++) {
    const x = ((i + 0.5) / n - 0.5) * (B.width - 0.1) + (r() - 0.5) * 0.4 * (B.width / n);
    const drop = H * I.trail * (0.55 + r() * 0.6), sway = (r() - 0.5) * 2 * Math.min(0.25, drop * 0.3);
    strands.push([
      [x, H - 0.01, D - 0.1 * B.depth], [x, H + 0.03, D + 0.02], [x + sway * 0.2, H - 0.05, D + 0.07],
      [x + sway * 0.6, H - drop * 0.5, D + 0.06], [x + sway, H - drop, D + 0.05 + r() * 0.06],
    ]);
  }
  // over each end, shorter
  for (const e of [-1, 1]) {
    const z = (r() - 0.3) * D, drop = H * I.trail * (0.35 + r() * 0.3);
    strands.push([[e * (W - 0.08), H - 0.01, z], [e * (W + 0.02), H + 0.03, z], [e * (W + 0.06), H - 0.05, z + 0.02], [e * (W + 0.05), H - drop, z + 0.04]]);
  }
  const tubes = [], leaves = [];
  const leafAt = (at, along, face) => {
    _z.copy(along).normalize(); // the blade's length
    _y.copy(face).addScaledVector(_z, -face.dot(_z)).normalize(); // its face's normal
    _x.crossVectors(_y, _z);
    const k = size * (0.75 + r() * 0.45);
    _m.makeBasis(_x, _y, _z).scale(_s.set(k, k * IVY_LEAF.flat, k * IVY_LEAF.aspect)).setPosition(at);
    leaves.push({ matrix: _m.clone(), color: I.colors[Math.floor(r() * I.colors.length)] });
  };
  const front = new THREE.Vector3(0, 0, 1), down = new THREE.Vector3(0, -1, 0);
  for (const pts of strands) {
    const curve = new THREE.CatmullRomCurve3(pts.map((p) => new THREE.Vector3(...p)));
    tubes.push(new THREE.TubeGeometry(curve, 20, stemR, 5, false));
    const len = curve.getLength(), step = size * I.spacing * 1.6;
    let side = r() < 0.5 ? -1 : 1;
    for (let d = step * 0.6; d < len; d += step * (0.8 + r() * 0.4)) {
      const t = d / len, at = curve.getPointAt(t), tan = curve.getTangentAt(t);
      // out to one side, and down the way the strand hangs, a little toward the front
      const across = new THREE.Vector3().crossVectors(tan, front).normalize();
      if (across.lengthSq() < 0.1) across.set(1, 0, 0);
      const dir = across.multiplyScalar(side).addScaledVector(tan, 0.6).addScaledVector(down, 0.3).addScaledVector(front, 0.25);
      leafAt(at, dir, front);
      side = -side;
    }
    // and one at the tip, hanging straight on
    leafAt(curve.getPointAt(1), curve.getTangentAt(1), front);
  }
  // the mound: leaves lying on the soil, turned every which way, faces up
  const mound = Math.round(count * I.mound);
  for (let i = 0; i < mound; i++) {
    const a = r() * Math.PI * 2;
    _p.set((r() - 0.5) * (B.width - 0.15), H + 0.01 + r() * size * 0.5, (r() - 0.5) * (B.depth - 0.12));
    leafAt(_p.clone(), new THREE.Vector3(Math.cos(a), 0.25, Math.sin(a)), new THREE.Vector3(0, 1, 0.2));
  }
  const stems = mergeGeometries(tubes);
  tubes.forEach((g) => g.dispose());
  const mesh = new THREE.InstancedMesh(LEAF_GEO, unlitMat({ hex: "#FFFFFF" }), leaves.length);
  const c = new THREE.Color();
  leaves.forEach((l, i) => { mesh.setMatrixAt(i, l.matrix); mesh.setColorAt(i, c.set(l.color.hex ?? l.color)); });
  mesh.castShadow = true;
  mesh.instanceMatrix.needsUpdate = true;
  if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  return { stems, leaves: mesh };
}
function Ivy({ B, count }) {
  const ivy = useMemo(() => ivyOf(B, count), [B, count]);
  useEffect(() => () => { ivy.stems.dispose(); ivy.leaves.dispose(); }, [ivy]);
  return (
    <group>
      <mesh geometry={ivy.stems} material={unlitMat(B.ivy.stem)} castShadow />
      <primitive object={ivy.leaves} />
    </group>
  );
}

export default function WindowBox({ config }) {
  const B = useMemo(() => merge(WINDOW_BOX, config), [config]);
  const Fl = B.flowers;
  const kind = Fl ? Fl.shape ?? Fl.kind : null; // (`shape`: the cupcake house's name for it, which wins)
  const bloom = useMemo(() => {
    if (!kind || kind === "bush" || kind === "leaf" || kind === "ivy") return null;
    const spec = { shape: kind, radius: Fl.radius };
    const upright = uprightOf(kind);
    if (upright) spec.rotation = upright;
    return ornamentOf(spec, "WINDOW_BOX.flowers");
  }, [kind, Fl?.radius]);
  const count = Fl ? Math.max(1, Math.round(Fl.count)) : 0;
  return (
    <group>
      <mesh position-y={B.height / 2} material={unlitMat(B.color)} castShadow receiveShadow>
        <boxGeometry args={[B.width, B.height, B.depth]} />
      </mesh>
      <mesh position-y={B.height - 0.03} material={unlitMat(B.color)} castShadow>
        <boxGeometry args={[B.width + 0.08, 0.07, B.depth + 0.08]} />
      </mesh>
      <mesh position-y={B.height - 0.005} material={unlitMat(B.soil)}>
        <boxGeometry args={[B.width - 0.06, 0.05, B.depth - 0.06]} />
      </mesh>
      {kind === "ivy" && <Ivy B={B} count={count} />}
      {kind !== "ivy" && Array.from({ length: count }, (_, i) => {
        const x = ((i + 0.5) / count - 0.5) * Math.max(0, B.width - 0.3);
        const color = Fl.colors[i % Fl.colors.length];
        return (
          <group key={i} position={[x, B.height, (Fl.forward ?? 0) * B.depth]}>
            <mesh position-y={Fl.stem / 2} material={unlitMat(Fl.stemColor)}>
              <cylinderGeometry args={[0.02, 0.02, Fl.stem, 5]} />
            </mesh>
            {bloom ? (
              <group position-y={Fl.stem} rotation-x={0.5}>
                <Ornament ornament={bloom} swatch={color} />
              </group>
            ) : kind === "leaf" ? (
              // a blade growing on up the stem, its broad face to the front
              <group position-y={Fl.stem * 0.7}>
                <group rotation-x={-Math.PI / 2}>
                  <mesh geometry={LEAF_GEO} material={unlitMat(color)} scale={[Fl.radius, Fl.radius * Fl.leaf.flat, Fl.radius * Fl.leaf.aspect]} />
                </group>
              </group>
            ) : (
              <group position-y={Fl.stem + Fl.radius * 0.6}>
                <Primitive shape="sphere" radius={Fl.radius} clay={Fl.clay} swatch={color} />
              </group>
            )}
          </group>
        );
      })}
    </group>
  );
}
