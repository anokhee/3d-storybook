import { useEffect, useMemo } from "react";
import * as THREE from "three";

import { merge } from "../../world/merge.js";
import { unlitMat } from "../../adjectives/unlit/material.js";
import { SUITCASE } from "./objects.js";

// A rectangle `w` by `h` centred on the origin, its corners rounded `r`.
function roundedRect(w, h, r) {
  const rr = Math.max(0, Math.min(r, w / 2, h / 2));
  const x = -w / 2, y = -h / 2;
  const s = new THREE.Shape();
  s.moveTo(x + rr, y);
  s.lineTo(x + w - rr, y);
  s.quadraticCurveTo(x + w, y, x + w, y + rr);
  s.lineTo(x + w, y + h - rr);
  s.quadraticCurveTo(x + w, y + h, x + w - rr, y + h);
  s.lineTo(x + rr, y + h);
  s.quadraticCurveTo(x, y + h, x, y + h - rr);
  s.lineTo(x, y + rr);
  s.quadraticCurveTo(x, y, x + rr, y);
  return s;
}

// A ring of that outline, `band` wide, pushed `depth` along z and centred.
function ringGeometry(w, h, r, band, depth) {
  const s = roundedRect(w + 2 * band, h + 2 * band, r + band);
  s.holes.push(roundedRect(w, h, r));
  const g = new THREE.ExtrudeGeometry(s, { depth, bevelEnabled: false, curveSegments: 6 });
  g.translate(0, 0, -depth / 2);
  return g;
}

// The body: the big face's outline pushed through the depth with a small
// bevel on both edges, so the whole is exactly `w` by `h` by `d`.
function bodyGeometry(w, h, d, corner, bevel) {
  const b = Math.min(bevel, d / 3);
  const g = new THREE.ExtrudeGeometry(roundedRect(w - 2 * b, h - 2 * b, corner - b), {
    depth: d - 2 * b,
    bevelEnabled: true,
    bevelThickness: b,
    bevelSize: b,
    bevelSegments: 2,
    curveSegments: 6,
  });
  g.translate(0, 0, -(d - 2 * b) / 2);
  return g;
}

// The hand luggage's handle: a tube along a squared-off arch `half` wide
// to either side, `rise` tall, its feet on y = 0.
function archGeometry(half, rise, tube) {
  const rc = Math.min(0.08, rise * 0.7);
  const pts = [new THREE.Vector3(-half, -0.03, 0), new THREE.Vector3(-half, rise - rc, 0)];
  for (let i = 1; i < 6; i++) {
    const a = Math.PI + (Math.PI / 2) * (i / 6);
    pts.push(new THREE.Vector3(-half + rc + rc * Math.cos(a), rise - rc + rc * Math.sin(a), 0));
  }
  pts.push(new THREE.Vector3(-half + rc, rise, 0), new THREE.Vector3(half - rc, rise, 0));
  for (let i = 1; i < 6; i++) {
    const a = Math.PI / 2 - (Math.PI / 2) * (i / 6);
    pts.push(new THREE.Vector3(half - rc + rc * Math.cos(a), rise - rc + rc * Math.sin(a), 0));
  }
  pts.push(new THREE.Vector3(half, rise - rc, 0), new THREE.Vector3(half, -0.03, 0));
  const curve = new THREE.CatmullRomCurve3(pts, false, "centripetal");
  return new THREE.TubeGeometry(curve, 36, tube, 8, false);
}

const WHEEL_SINK = 0.04; // how far the wheels tuck up into the body
const CAP = 0.12; // a corner cap's side
const PROUD = 0.012; // how far the caps stand off the body

// How far the body's bottom edge is off the ground.
const liftOf = (C) => (C.kind === "rolling" ? 2 * C.wheels.radius - WHEEL_SINK : PROUD);

// How far the telescoping handle's rods stand above the body.
const rodsOf = (C) => 0.1 + Math.min(1, Math.max(0, C.handle)) * C.height * 0.55;

// How tall it stands: the top of whichever handle is highest, or, lying
// flat, its depth and what stands proud of its face.
export function suitcaseHeightOf(C) {
  if (C.pose === "flat") return C.depth + 2 * PROUD + 0.05;
  const top = liftOf(C) + C.height;
  if (C.kind === "rolling") return top + rodsOf(C) + 0.09;
  return top + C.height * 0.16 + 0.04;
}

// How far it spreads from its middle, across (x) and along (z).
export function suitcaseFootprintOf(C) {
  if (C.pose === "flat") return { x: C.width / 2 + 0.15, z: C.height / 2 + 0.2 };
  return { x: C.width / 2 + 0.15, z: C.depth / 2 + PROUD };
}

// The rolling case's fittings, around a body `w` by `h` by `d` centred on
// the group's origin.
function RollingParts({ C, w, h, d }) {
  const paint = C.colors;
  const rods = rodsOf(C);
  const rodX = Math.min(0.28, w * 0.26);
  const rodZ = -d / 2 + 0.1;
  const W = C.wheels;
  return (
    <>
      {[0.18, -0.18].map((f) => (
        <mesh key={f} position={[0, h * f, d / 2 + 0.015]} material={unlitMat(paint.trim)} castShadow receiveShadow>
          <boxGeometry args={[w * 0.8, 0.08, 0.04]} />
        </mesh>
      ))}
      {[-rodX, rodX].map((x) => (
        <group key={x} position={[x, h / 2, rodZ]}>
          <mesh position-y={0.06} material={unlitMat(paint.trim)} castShadow receiveShadow>
            <cylinderGeometry args={[0.05, 0.05, 0.12, 10]} />
          </mesh>
          <mesh position-y={rods / 2} material={unlitMat(paint.wheels)} castShadow receiveShadow>
            <cylinderGeometry args={[0.03, 0.03, rods, 8]} />
          </mesh>
        </group>
      ))}
      <mesh position={[0, h / 2 + rods + 0.045, rodZ]} material={unlitMat(paint.trim)} castShadow receiveShadow>
        <boxGeometry args={[2 * rodX + 0.1, 0.09, 0.1]} />
      </mesh>
      <group position={[0, h / 2, d / 2 - 0.12]}>
        <mesh position-y={0.1} material={unlitMat(paint.trim)} castShadow receiveShadow>
          <boxGeometry args={[0.36, 0.06, 0.1]} />
        </mesh>
        {[-0.14, 0.14].map((x) => (
          <mesh key={x} position={[x, 0.04, 0]} material={unlitMat(paint.trim)} castShadow receiveShadow>
            <boxGeometry args={[0.08, 0.08, 0.08]} />
          </mesh>
        ))}
      </group>
      <group position={[w / 2, 0, 0]}>
        <mesh position-x={0.1} material={unlitMat(paint.trim)} castShadow receiveShadow>
          <boxGeometry args={[0.06, 0.36, 0.1]} />
        </mesh>
        {[-0.14, 0.14].map((y) => (
          <mesh key={y} position={[0.04, y, 0]} material={unlitMat(paint.trim)} castShadow receiveShadow>
            <boxGeometry args={[0.08, 0.08, 0.08]} />
          </mesh>
        ))}
      </group>
      {[-1, 1].map((sx) =>
        [-1, 1].map((sz) => (
          <mesh
            key={`${sx}${sz}`}
            position={[sx * (w / 2 - W.radius - 0.04), -h / 2 - W.radius + WHEEL_SINK, sz * (d / 2 - W.width)]}
            rotation-z={Math.PI / 2}
            material={unlitMat(paint.wheels)}
            castShadow
            receiveShadow
          >
            <cylinderGeometry args={[W.radius, W.radius, W.width, 12]} />
          </mesh>
        )),
      )}
    </>
  );
}

// The hand luggage's fittings, around the same body: the straps go right
// round it, and the clasps sit on them at the front like buckles.
function HandParts({ C, w, h, d, arch, strap }) {
  const paint = C.colors;
  const half = Math.min(0.2, w * 0.18);
  return (
    <>
      <mesh geometry={arch} position-y={h / 2} material={unlitMat(paint.trim)} castShadow receiveShadow />
      {[-half, half].map((x) => (
        <mesh key={x} position={[x, h / 2 + 0.02, 0]} material={unlitMat(paint.trim)} castShadow receiveShadow>
          <boxGeometry args={[0.12, 0.05, 0.12]} />
        </mesh>
      ))}
      {[-0.3, 0.3].map((f) => (
        <mesh key={f} geometry={strap} position-x={w * f} material={unlitMat(paint.trim)} castShadow receiveShadow />
      ))}
      {[-0.3, 0.3].map((f) => (
        <mesh key={f} position={[w * f, h / 2 - 0.16, d / 2 + 0.045]} material={unlitMat(paint.clasp)} castShadow receiveShadow>
          <boxGeometry args={[0.14, 0.11, 0.05]} />
        </mesh>
      ))}
      {[-1, 1].map((sx) =>
        [-1, 1].map((sy) => (
          <mesh
            key={`${sx}${sy}`}
            position={[sx * (w / 2 - CAP / 2 + PROUD), sy * (h / 2 - CAP / 2 + PROUD), 0]}
            material={unlitMat(paint.trim)}
            castShadow
            receiveShadow
          >
            <boxGeometry args={[CAP, CAP, d + 2 * PROUD]} />
          </mesh>
        )),
      )}
    </>
  );
}

// One suitcase, standing on the ground at the origin with its big face
// toward +z. `config` overrides any of SUITCASE's fields for this one.
export default function Suitcase({ config }) {
  const C = useMemo(() => merge(SUITCASE, config), [config]);
  const w = C.width, h = C.height, d = C.depth;
  const hand = C.kind === "hand";
  const parts = useMemo(() => {
    const seamZ = hand ? d / 2 - 0.1 : 0;
    const body = bodyGeometry(w, h, d, C.corner, C.bevel);
    const seam = ringGeometry(w, h, C.corner, 0.012, 0.04);
    seam.translate(0, 0, seamZ);
    const arch = hand ? archGeometry(Math.min(0.2, w * 0.18), h * 0.16, 0.035) : null;
    let strap = null;
    if (hand) {
      strap = ringGeometry(d, h, C.bevel, 0.025, 0.1);
      strap.rotateY(Math.PI / 2);
    }
    return { body, seam, arch, strap };
  }, [w, h, d, C.corner, C.bevel, hand]);
  useEffect(
    () => () => {
      parts.body.dispose();
      parts.seam.dispose();
      parts.arch?.dispose();
      parts.strap?.dispose();
    },
    [parts],
  );
  const flat = C.pose === "flat";
  const paint = C.colors;
  const body = (
    <group position-y={liftOf(C) + h / 2}>
      <mesh geometry={parts.body} material={unlitMat(paint.shell)} castShadow receiveShadow />
      <mesh geometry={parts.seam} material={unlitMat(paint.trim)} castShadow receiveShadow />
      {hand ? <HandParts C={C} w={w} h={h} d={d} arch={parts.arch} strap={parts.strap} /> : <RollingParts C={C} w={w} h={h} d={d} />}
    </group>
  );
  if (!flat) return body;
  // lying on its back: the front face up, the handle edge toward +z
  const lift = liftOf(C);
  return (
    <group rotation-y={Math.PI} position-z={-(h + lift) / 2}>
      <group rotation-x={-Math.PI / 2} position-y={d / 2 + 2 * PROUD}>
        {body}
      </group>
    </group>
  );
}
