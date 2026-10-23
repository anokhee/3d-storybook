import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";

import { merge } from "../../world/merge.js";
import { hue } from "../../world/palette.js";
import { toon } from "../../adjectives/unlit/toon.js";
import { buildSnailBody, shellGeo } from "../../car/snailcar.js";
import { SNAIL } from "./objects.js";

// The snail car is built about 3.7 long; this brings it to about a unit.
const SHRINK = 0.27;

// The snail, built in the car's units facing +x with its foot's sole
// `drop` above the ground (the car's foot rides up on its wheels).
function build(C) {
  const P = C.colors;
  const group = new THREE.Group();
  const add = (geo, swatch, x, y, z, extra, parent = group) => {
    const mesh = new THREE.Mesh(geo, toon(hue(swatch), extra));
    mesh.position.set(x, y, z);
    mesh.castShadow = mesh.receiveShadow = true;
    parent.add(mesh);
    return mesh;
  };
  add(shellGeo(), P.shell, 0, 0, 0);
  const stalks = buildSnailBody(group, add, {
    stripe: P.stripe,
    body: P.body,
    cheek: P.cheek,
    lamp: P.eye,
    dash: P.pupil,
    slime: P.slime,
    hasSlime: C.hasSlime,
  });
  // the sole's height, the slime (on the car's ground, the one see-through
  // thing) left out, and the slime then laid on the snail's ground
  const box = new THREE.Box3();
  let slime;
  group.children.forEach((o) => (o.material?.transparent ? (slime = o) : box.expandByObject(o)));
  const drop = box.min.y;
  if (slime) slime.position.y += drop;
  return { group, stalks, drop };
}

// How tall it stands off its ground, and how far it spreads from its
// middle across (x) and along (z), the slime left out.
export function snailHeightOf(C) {
  return 1.9 * SHRINK * C.size;
}
export function snailFootprintOf(C) {
  return { x: 1.0 * SHRINK * C.size, z: 1.8 * SHRINK * C.size };
}

// One snail, on the ground at y = 0 facing +z. `config` overrides any of
// SNAIL's fields for this one instance.
export default function Snail({ config }) {
  const C = useMemo(() => merge(SNAIL, config), [config]);
  const built = useMemo(() => build(C), [C]);
  useEffect(() => () => built.group.traverse((o) => o.geometry?.dispose?.()), [built]);

  // The eyestalks sway about their roots, each a little out of step with
  // the other, as much as `pace` says. The rest pose (pace 0, or the
  // first frame) is the snail as drawn.
  const clock = useRef(0);
  useFrame((_, delta) => {
    clock.current += Math.min(delta, 0.05);
    const t = clock.current;
    built.stalks.forEach((stalk, i) => {
      stalk.rotation.z = Math.sin(t * 1.3 + i * 1.7) * 0.12 * C.pace;
      stalk.rotation.x = Math.sin(t * 0.9 + i * 2.3) * 0.1 * C.pace;
    });
  });

  return (
    <group scale={C.size * SHRINK} rotation-y={-Math.PI / 2}>
      <primitive object={built.group} position-y={-built.drop} />
    </group>
  );
}
