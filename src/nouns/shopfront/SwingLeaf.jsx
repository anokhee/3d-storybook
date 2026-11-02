import { useRef } from "react";
import { useFrame } from "@react-three/fiber";

// A DOOR'S LEAF ON ITS HINGE, the shop's front door's (the street's
// Shopfront and the Shop Interior's alike): `children` the door as made,
// its middle at the group's origin, `width` across; hung at its `hinge`
// side (-1 left, 1 right, looking at it from the street), opening inward
// (away from the street) — `wide` radians at most. `swing`, if given, a ref
// whose `current` (0 shut … 1 wide open) it eases to each frame, `speed` how
// fast; otherwise it stands at `open` (0 … 1).
export default function SwingLeaf({ hinge, width, swing, open = 0, wide = 1.8, speed = 7, children }) {
  const leaf = useRef();
  useFrame((_, dt) => {
    if (!leaf.current || !swing) return;
    const to = -hinge * wide * Math.max(0, Math.min(1, swing.current ?? 0));
    leaf.current.rotation.y += (to - leaf.current.rotation.y) * Math.min(1, Math.min(dt, 0.1) * speed);
  });
  return (
    <group position-x={hinge * width / 2}>
      <group ref={leaf} rotation-y={swing ? 0 : -hinge * wide * open}>
        <group position-x={-hinge * width / 2}>{children}</group>
      </group>
    </group>
  );
}
