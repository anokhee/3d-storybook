import { useMemo } from "react";

import { merge } from "../../world/merge.js";
import { unlitMat } from "../../adjectives/unlit/material.js";
import { litMat } from "../../adjectives/lit/material.js";
import Primitive from "../primitive/Primitive.jsx";
import { CONE_FORM } from "../primitive/objects.js";
import { PENDANT_LIGHT } from "./objects.js";

// One pendant light (see PENDANT_LIGHT), hanging from its origin: the cord
// down from the hook, the bulb glowing at its end — under a lit cone of a
// shade, if it has one — a point of light just under it. `config` overrides any of PENDANT_LIGHT's fields for this one.
export default function PendantLight({ config }) {
  const P = useMemo(() => merge(PENDANT_LIGHT, config), [config]);
  const { cord, bulb, glow, colors, shade } = P;
  // the shade (a Primitive's cone: as tall as it is wide, its middle a
  // radius down from its point) hangs point up off the cord's end; the
  // bulb sits up inside its mouth
  const sr = shade.radius, shaded = shade.on && sr > 0;
  const bulbY = shaded ? -cord.length - sr * 1.75 : -cord.length - bulb.radius * 0.9;
  const light = useMemo(() => ({ type: "lit", brightness: shade.brightness }), [shade.brightness]);
  return (
    <group>
      <mesh position-y={-cord.length / 2} material={unlitMat(colors.cord)}>
        <cylinderGeometry args={[cord.radius, cord.radius, cord.length, 6]} />
      </mesh>
      {shaded && (
        <group position-y={-cord.length - sr}>
          <Primitive shape="cylinder" radius={sr} form={CONE_FORM} swatch={colors.shade} light={light} />
        </group>
      )}
      <mesh position-y={bulbY} material={litMat(colors.bulb)}>
        <sphereGeometry args={[shaded ? Math.min(bulb.radius, sr * 0.45) : bulb.radius, 12, 10]} />
      </mesh>
      {glow.intensity > 0 && (
        <pointLight position-y={bulbY - bulb.radius * 1.3} color={colors.bulb.hex} intensity={glow.intensity} distance={glow.distance} decay={2} />
      )}
    </group>
  );
}
