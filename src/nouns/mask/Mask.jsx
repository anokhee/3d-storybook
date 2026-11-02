import { useMemo, useRef, useState, useEffect } from "react";
import { useFrame } from "@react-three/fiber";

import { merge } from "../../world/merge.js";
import Anthro from "../anthro/Anthro.jsx";
import ShadowSpirit, { framesOf, maskFor, Mask as WornMask } from "../anthro/ShadowSpirit.jsx";
import { HUMAN, SHADOW_SPIRIT } from "../anthro/objects.js";
import { MASK, MASK_STYLES, HEADDRESSES, maskWall } from "./objects.js";

// The mask as a prop (Props/Mask): one of MASK_STYLES, built onto the
// Human's face — a figure drawn out of sight only for its face to be
// measured — and shown on its own, face on, `scale` times its size; or, `worn`,
// on a Shadow Spirit walking.
const STILL_HUMAN = { ...HUMAN, pose: "t-pose", animate: false };
// The face, once measured, kept: the storybook remounts the prop on every
// knob change, and measuring it again (building the figure) is the slow part.
let measured = null;

export default function MaskProp({ config }) {
  const K = useMemo(() => merge(MASK, config), [config]);
  // the style, its paints and headdress (ears, tendrils or horns) as the knobs set them, and the
  // shell's colour: the style's own, unless the mask colour knob is moved
  const extra = useMemo(() => {
    const st = MASK_STYLES[K.style] ?? {};
    const hex = (c) => c?.hex ?? c;
    const hd = HEADDRESSES[K.headdress] ?? {};
    return { pattern: K.pattern && K.pattern !== "none" ? K.pattern : undefined, patternShade: K.patternShade, ...(K.eyes ? { eyes: K.eyes } : {}), ears: hd.ears, tendrils: +K.tendrils || 0, horns: hd.horns ? { ...MASK_STYLES.horned.horns, ...K.horn, type: hd.horns, show: true, color: hex(K.horn.color) } : undefined, ...(K.nose ? { nose: K.nose === "none" ? undefined : K.nose } : {}), ...("paints" in st || "markings" in st ? { paints: K.paint && K.paint !== "none" ? [K.paint] : [], markings: undefined, markColor: hex(K.markColor), underEyeLines: K.underEyeLines } : {}), ...(K.color && hex(K.color) !== MASK.color ? { color: hex(K.color) } : {}) };
  }, [K]);
  const look = useMemo(() => ({ ...SHADOW_SPIRIT.spirit, mask: K.color?.hex ?? K.color, holes: K.ink?.hex ?? K.ink, maskStyle: K.style, maskExtra: extra }), [K, extra]);
  const face = useRef();
  const [walk, setWalk] = useState(measured);
  useFrame(() => {
    if (walk || K.worn) return;
    const root = face.current?.children[0];
    const w = root && framesOf(root, look);
    if (w) setWalk((measured = { frames: w.frames, face: w.face, lump: w.lump }));
  });
  const mask = useMemo(() => (walk ? maskFor(walk, look, K.style, { ...extra, band: false }) : null), [walk, look, K.style, extra]);
  useEffect(() => () => mask?.parts.forEach((p) => { if (!p.shared) p.geometry.dispose(); }), [mask]);
  if (K.worn) return <ShadowSpirit config={{ spirit: look }} />;
  const f = walk?.face ?? [0, 1.15, 0.17];
  return (
    <group>
      {!walk && <group ref={face} visible={false}><Anthro config={STILL_HUMAN} /></group>}
      {mask && (
        // stood up off the ground, its middle at its own height
        <group position-y={K.scale * 0.18} scale={K.scale}>
          <group position={[-f[0], -f[1], -f[2]]}>
            <WornMask mask={mask} />
          </group>
        </group>
      )}
    </group>
  );
}

// A WALL OF MASKS (Props/Mask, "a grid of them"): maskWall's designs (the
// plain and the horned, then the rest dealt from a seed), hung face on in
// `columns` across, `scale` times life size. `roll` reseeds the lot (0: the
// same wall every time — the one the street's spirits wear).
export function MaskGrid({ roll = 0, count = 24, columns = 6, scale = 8, spacing = 3.6 }) {
  const look = SHADOW_SPIRIT.spirit;
  const face = useRef();
  const [walk, setWalk] = useState(measured);
  useFrame(() => {
    if (walk) return;
    const root = face.current?.children[0];
    const w = root && framesOf(root, look);
    if (w) setWalk((measured = { frames: w.frames, face: w.face, lump: w.lump }));
  });
  const masks = useMemo(() => {
    if (!walk) return null;
    return maskWall(count, roll).map((d) => maskFor(walk, look, d.style, { ...d.extra, band: false }));
  }, [walk, roll, count, look]);
  useEffect(() => () => masks?.forEach((m) => m.parts.forEach((p) => { if (!p.shared) p.geometry.dispose(); })), [masks]);
  const f = walk?.face ?? [0, 1.15, 0.17];
  const rows = Math.ceil(count / columns);
  return (
    <group>
      {!walk && <group ref={face} visible={false}><Anthro config={STILL_HUMAN} /></group>}
      {masks?.map((mask, i) => (
        // top row first, the bottom row a little off the ground
        <group key={`${roll}-${i}`} position={[((i % columns) - (columns - 1) / 2) * spacing, spacing * 0.6 + (rows - 1 - Math.floor(i / columns)) * spacing, 0]} scale={scale}>
          <group position={[-f[0], -f[1], -f[2]]}>
            <WornMask mask={mask} />
          </group>
        </group>
      ))}
    </group>
  );
}
