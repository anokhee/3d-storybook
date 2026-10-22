import { useEffect, useMemo } from "react";
import * as THREE from "three";

import { merge } from "../../world/merge.js";
import { unlitMat } from "../../adjectives/unlit/material.js";
import { MAILBOX } from "./objects.js";

// The box's end-on outline: a rectangle with a half circle on top, its
// foot on the x axis. The roof's radius is half the width.
function tunnelOf(width, height) {
  const r = width / 2;
  const wall = Math.max(0.01, height - r);
  const s = new THREE.Shape();
  s.moveTo(-r, 0);
  s.lineTo(-r, wall);
  s.absarc(0, wall, r, Math.PI, 0, true);
  s.lineTo(r, 0);
  s.closePath();
  return s;
}

// That outline pushed `depth` along z, centred on z = 0.
function tunnelGeometry(width, height, depth) {
  const g = new THREE.ExtrudeGeometry(tunnelOf(width, height), { depth, bevelEnabled: false, curveSegments: 10 });
  g.translate(0, 0, -depth / 2);
  return g;
}

// How tall it stands: the box's roof, or the knob on the dome.
export function mailboxHeightOf(C) {
  if (C.style === "pillar") return C.pillar.height + 0.06;
  return C.post.height + C.box.height;
}

// How far it spreads from the post, across (x) and along (z): the box
// and its flag, or the pillar's lip.
export function mailboxFootprintOf(C) {
  if (C.style === "pillar") {
    const r = C.pillar.radius * 1.15;
    return { x: r, z: r };
  }
  return { x: C.box.width / 2 + 0.14, z: C.box.length / 2 + C.box.forward };
}

// The roadside box on its post.
function PostBox({ C }) {
  const P = C.post;
  const B = C.box;
  const D = C.door;
  const F = C.flag;
  const paint = C.colors;
  const doorWidth = B.width - 2 * D.inset;
  const doorHeight = B.height - 2 * D.inset;
  const parts = useMemo(
    () => ({
      box: tunnelGeometry(B.width, B.height, B.length),
      door: tunnelGeometry(doorWidth, doorHeight, D.proud),
    }),
    [B.width, B.height, B.length, doorWidth, doorHeight, D.proud],
  );
  useEffect(
    () => () => {
      parts.box.dispose();
      parts.door.dispose();
    },
    [parts],
  );
  const front = B.forward + B.length / 2;
  const wall = B.height - B.width / 2;
  // the flag's pivot: on the right side, forward of the middle, a little
  // below the roof line, so the arm clears the roof when it is up
  const pivot = [B.width / 2 + 0.03, P.height + wall * 0.55, B.forward + B.length * 0.28];
  return (
    <group>
      <mesh position-y={P.height / 2 - P.plank.thickness / 2} material={unlitMat(paint.post)} castShadow receiveShadow>
        <boxGeometry args={[P.width, P.height - P.plank.thickness, P.width]} />
      </mesh>
      <mesh position={[0, P.height - P.plank.thickness / 2, B.forward]} material={unlitMat(paint.post)} castShadow receiveShadow>
        <boxGeometry args={[P.plank.width, P.plank.thickness, P.plank.length]} />
      </mesh>
      <mesh geometry={parts.box} position={[0, P.height, B.forward]} material={unlitMat(paint.box)} castShadow receiveShadow />
      <mesh
        geometry={parts.door}
        position={[0, P.height + D.inset, front - 0.01 + D.proud / 2]}
        material={unlitMat(paint.door)}
        castShadow
        receiveShadow
      />
      <mesh
        position={[0, P.height + D.inset + doorHeight - 0.14, front + D.proud + 0.02]}
        material={unlitMat(paint.dark)}
        castShadow
        receiveShadow
      >
        <boxGeometry args={[0.12, 0.09, 0.06]} />
      </mesh>
      <group position={pivot}>
        <mesh rotation-z={Math.PI / 2} material={unlitMat(paint.dark)} castShadow receiveShadow>
          <cylinderGeometry args={[0.05, 0.05, 0.08, 10]} />
        </mesh>
        <group rotation-x={F.up ? 0 : -Math.PI / 2 - 0.12}>
          <mesh position-y={F.length / 2} material={unlitMat(paint.flag)} castShadow receiveShadow>
            <boxGeometry args={[0.04, F.length, 0.07]} />
          </mesh>
          <mesh position-y={F.length + F.paddle.length / 2 - 0.02} material={unlitMat(paint.flag)} castShadow receiveShadow>
            <boxGeometry args={[0.04, F.paddle.length, F.paddle.width]} />
          </mesh>
        </group>
      </group>
    </group>
  );
}

// The round pillar box.
function PillarBox({ C }) {
  const Q = C.pillar;
  const paint = C.colors;
  const R = Q.radius;
  const domeFoot = Q.height - R;
  const lipFoot = domeFoot - Q.lip;
  const column = lipFoot - Q.base;
  return (
    <group>
      <mesh position-y={Q.base / 2} material={unlitMat(paint.dark)} castShadow receiveShadow>
        <cylinderGeometry args={[R * 1.12, R * 1.12, Q.base, 24]} />
      </mesh>
      <mesh position-y={Q.base + column / 2} material={unlitMat(paint.box)} castShadow receiveShadow>
        <cylinderGeometry args={[R, R, column, 24]} />
      </mesh>
      <mesh position-y={lipFoot + Q.lip / 2} material={unlitMat(paint.box)} castShadow receiveShadow>
        <cylinderGeometry args={[R * 1.14, R * 1.14, Q.lip, 24]} />
      </mesh>
      <mesh position-y={domeFoot} material={unlitMat(paint.box)} castShadow receiveShadow>
        <sphereGeometry args={[R, 24, 10, 0, Math.PI * 2, 0, Math.PI / 2]} />
      </mesh>
      <mesh position-y={Q.height} material={unlitMat(paint.dark)} castShadow receiveShadow>
        <sphereGeometry args={[0.07, 10, 8]} />
      </mesh>
      <mesh position={[0, lipFoot - 0.3, R - 0.01]} material={unlitMat(paint.dark)} castShadow receiveShadow>
        <boxGeometry args={[R * 1.1, 0.09, 0.08]} />
      </mesh>
      <mesh position={[0, lipFoot - 0.75, R - 0.01]} material={unlitMat(paint.door)} castShadow receiveShadow>
        <boxGeometry args={[R * 0.9, 0.5, 0.05]} />
      </mesh>
    </group>
  );
}

// One mailbox, standing on the ground at the origin and facing +z.
// `config` overrides any of MAILBOX's fields for this one instance.
export default function Mailbox({ config }) {
  const C = useMemo(() => merge(MAILBOX, config), [config]);
  return C.style === "pillar" ? <PillarBox C={C} /> : <PostBox C={C} />;
}
