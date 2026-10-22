import { useEffect, useMemo } from "react";
import * as THREE from "three";

// What a body of water, or a patch of ground, puts in its lot: nothing to
// see — the pools are drawn all at once, since two that touch are one
// (see Water.jsx's Pools), and ground is just the ground — but a pad its
// own shape lying on the ground, unseen, for the edit view to press on
// and drag about the lot the way it does a bench (see
// level/EditView.jsx). A rounded rectangle, `width` by `length`, its
// corners `cornerRadius` round, no rounder than half the short side.
export default function Pad({ width, length, cornerRadius }) {
  const geometry = useMemo(() => {
    const g = new THREE.ShapeGeometry(
      roundedRect(width, length, cornerRadius),
      8,
    );
    // Drawn in x/y; laid flat on the ground, y up.
    g.rotateX(-Math.PI / 2);
    return g;
  }, [width, length, cornerRadius]);
  useEffect(() => () => geometry.dispose(), [geometry]);
  return (
    <mesh geometry={geometry} position-y={0.05} visible={false}>
      <meshBasicMaterial />
    </mesh>
  );
}

// The rounded rectangle itself, as a shape in x/y about `cx`, `cy` —
// the rug's too (see ../rug/Rug.jsx), and a counter's top and the basin
// sunk in it (see ../counter/Counter.jsx), which offsets one to cut the
// other out of it.
export function roundedRect(width, length, cornerRadius, cx = 0, cy = 0) {
  const hw = width / 2,
    hl = length / 2;
  const r = Math.max(0, Math.min(cornerRadius, hw, hl));
  const shape = new THREE.Shape();
  shape.moveTo(cx - hw + r, cy - hl);
  shape.lineTo(cx + hw - r, cy - hl);
  shape.absarc(cx + hw - r, cy - hl + r, r, -Math.PI / 2, 0, false);
  shape.lineTo(cx + hw, cy + hl - r);
  shape.absarc(cx + hw - r, cy + hl - r, r, 0, Math.PI / 2, false);
  shape.lineTo(cx - hw + r, cy + hl);
  shape.absarc(cx - hw + r, cy + hl - r, r, Math.PI / 2, Math.PI, false);
  shape.lineTo(cx - hw, cy - hl + r);
  shape.absarc(cx - hw + r, cy - hl + r, r, Math.PI, Math.PI * 1.5, false);
  return shape;
}
