// MOUNTS: something for a part to be attached to, so it reads the way it
// does in use. A coin slot on its own is a small gray tile; on a panel it
// is a coin slot. Neither is a story: this folder is not matched by
// main.js's stories pattern.
//
//   WallPanel  a thickened plane standing upright, its front face at z = 0
//              so a part built "facing +z" (dial, slot, door, wall hanging)
//              sits flush on it. `center` is where the panel's middle is.
//   Slab       a thickened plane lying flat, its TOP face at y = 0, so
//              feet stand under it or a thing stands on it. Lift the whole
//              group to float it.
import { unlitMat } from "../../src/adjectives/unlit/material.js";
import { PALETTE } from "../../src/world/palette.js";

export function WallPanel({
  width = 2,
  height = 2,
  thickness = 0.3,
  center = [0, 0],
  swatch = PALETTE.vendingMachine.body,
  children,
}) {
  return (
    <>
      <mesh position={[center[0], center[1], -thickness / 2]} material={unlitMat(swatch)}>
        <boxGeometry args={[width, height, thickness]} />
      </mesh>
      {children}
    </>
  );
}

export function Slab({
  width = 2,
  depth = 2,
  thickness = 0.3,
  swatch = PALETTE.vendingMachine.body,
  children,
}) {
  return (
    <>
      <mesh position-y={-thickness / 2} material={unlitMat(swatch)}>
        <boxGeometry args={[width, thickness, depth]} />
      </mesh>
      {children}
    </>
  );
}
