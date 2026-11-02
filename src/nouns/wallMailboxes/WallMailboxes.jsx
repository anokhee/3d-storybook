import { useMemo } from "react";

import { merge } from "../../world/merge.js";
import { unlitMat } from "../../adjectives/unlit/material.js";
import { WALL_MAILBOXES, wallMailboxesSizeOf } from "./objects.js";

// a small seeded random (which boxes have post in them)
const rngOf = (seed) => {
  let x = (Math.imul((seed | 0) ^ 0x9e3779b9, 2654435761) >>> 0) % 2147483646 + 1;
  return () => ((x = (x * 16807) % 2147483647) - 1) / 2147483646;
};

// A box `size` [x, y, z] with its middle `at`, in one swatch
function Box({ at, size, swatch }) {
  return (
    <mesh position={at} material={unlitMat(swatch)}>
      <boxGeometry args={size} />
    </mesh>
  );
}

// One wall of mailboxes (see WALL_MAILBOXES): the cabinet, and on its
// front a grid of little doors, each with its slot, its name card and its
// lock; here and there a letter poking up out of a slot. Its back at
// z = 0 facing +z, its foot at y = 0, lifted `hang` up.
export default function WallMailboxes({ config }) {
  const C = useMemo(() => merge(WALL_MAILBOXES, config), [config]);
  const { w, h } = wallMailboxesSizeOf(C);
  const B = C.box, K = C.colors;
  const doors = useMemo(() => {
    const r = rngOf(C.seed), out = [];
    for (let j = 0; j < C.rows; j++)
      for (let i = 0; i < C.cols; i++)
        out.push({
          x: -w / 2 + C.frame + B.width / 2 + i * (B.width + B.gap),
          y: C.frame + B.height / 2 + j * (B.height + B.gap),
          letter: r() < C.post,
          tilt: (r() - 0.5) * 0.3,
        });
    return out;
  }, [C, w, B]);
  const zf = C.depth + B.proud; // the doors' fronts
  return (
    <group position-y={C.hang}>
      <Box at={[0, h / 2, C.depth / 2]} size={[w, h, C.depth]} swatch={K.cabinet} />
      {doors.map((o, k) => (
        <group key={k} position={[o.x, o.y, 0]}>
          <Box at={[0, 0, C.depth + B.proud / 2]} size={[B.width, B.height, B.proud]} swatch={K.door} />
          <Box at={[0, (B.height / 2) * C.slot.up, zf + 0.004]} size={[B.width * C.slot.width, C.slot.height, 0.01]} swatch={K.slot} />
          <Box at={[0, -(B.height / 2) * C.label.down, zf + 0.004]} size={[B.width * C.label.width, C.label.height, 0.01]} swatch={K.label} />
          <mesh position={[B.width * 0.36, -B.height * 0.32, zf + 0.01]} rotation-x={Math.PI / 2} material={unlitMat(K.knob)}>
            <cylinderGeometry args={[C.knob.radius, C.knob.radius, 0.02, 10]} />
          </mesh>
          {o.letter && (
            <group position={[0, (B.height / 2) * C.slot.up, zf + 0.004]} rotation-z={o.tilt}>
              <Box at={[0, 0.06, 0]} size={[B.width * C.slot.width * 0.7, 0.14, 0.012]} swatch={K.letter} />
            </group>
          )}
        </group>
      ))}
    </group>
  );
}
