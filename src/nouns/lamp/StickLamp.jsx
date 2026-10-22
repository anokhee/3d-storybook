import { useMemo } from "react";

import { merge } from "../../world/merge.js";
import { hue } from "../../world/palette.js";
import { LIGHT } from "../../adjectives/lit/objects.js";
import Primitive from "../primitive/Primitive.jsx";
import { STICK_LAMP } from "./objects.js";

// How tall the lamp stands off its ground, for the posts to clear: the
// top of the shade.
export function stickLampHeightOf(L) {
  return L.base.thickness + L.pole.height - L.shade.sink + L.shade.height;
}

// How far out from its middle it spreads, for the grass to keep back
// from: the base or the shade's flare, whichever is wider.
export function stickLampFootprintOf(L) {
  const r = Math.max(L.base.radius, L.shade.radius * L.shade.flare);
  return { x: r, z: r, round: true };
}

// One stick lamp, standing on the ground at y = 0. `config` overrides any
// of STICK_LAMP's fields for this one instance.
export default function StickLamp({ config }) {
  const L = useMemo(() => merge(STICK_LAMP, config), [config]);
  const B = L.base;
  const P = L.pole;
  const S = L.shade;
  const shadeFoot = B.thickness + P.height - S.sink;
  // A cylinder stands two radii tall; each is pressed to its own height,
  // and the shade's foot flared out (see FORM).
  const baseForm = useMemo(() => ({ tall: B.thickness / (2 * B.radius) }), [B]);
  const poleForm = useMemo(() => ({ tall: P.height / (2 * P.radius) }), [P]);
  const shadeForm = useMemo(
    () => ({
      tall: S.height / (2 * S.radius),
      bottom: { inflate: S.flare },
      feather: 1,
    }),
    [S],
  );
  return (
    <group>
      <group position-y={B.thickness / 2}>
        <Primitive
          shape="cylinder"
          radius={B.radius}
          detail={B.detail}
          form={baseForm}
          clay={B.clay}
          swatch={B.color}
          light={LIGHT}
        />
      </group>
      <group position-y={B.thickness + P.height / 2}>
        <Primitive
          shape="cylinder"
          radius={P.radius}
          detail={P.detail}
          form={poleForm}
          clay={P.clay}
          swatch={P.color}
          light={LIGHT}
        />
      </group>
      <group position-y={shadeFoot + S.height / 2}>
        <Primitive
          shape="cylinder"
          radius={S.radius}
          detail={S.detail}
          form={shadeForm}
          clay={S.clay}
          swatch={S.color}
          light={S.light}
        />
        {L.glow && (
          <pointLight
            color={hue(L.glow.color)}
            intensity={L.glow.intensity}
            distance={L.glow.distance}
            decay={2}
          />
        )}
      </group>
    </group>
  );
}
