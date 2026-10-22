import { useMemo } from "react";

import { merge } from "../../world/merge.js";
import { TIPS } from "../../parts/antennae.js";
import { LIGHT, lightOf } from "../../adjectives/lit/objects.js";
import Primitive, { paintOf } from "../primitive/Primitive.jsx";
import Ornament, { ornamentOf } from "../ornament/Ornament.jsx";
import { POT_PLANT } from "./objects.js";

// The claybabies' head leaf: a blade a unit long in +Z, a unit across in
// X and a unit thick in Y, its base at the origin.
const LEAF_GEO = TIPS.leaf.geo;

// How far past a stem's tip what is on it reaches: a blade its length,
// anything else its full height.
const reachOf = (K) =>
  K.kind === "leaf" ? K.size * K.leaf.aspect : 2 * K.size;

// How tall the plant stands off its ground, for the posts to clear: the
// top of whatever tips the tallest stem.
export function potPlantHeightOf(P) {
  return P.pot.height - P.soil.depth + P.stems.height + reachOf(P.plant);
}

// How far out from its middle it spreads, for the grass to keep back
// from: the pot, or the stems' tips and what is on them, whichever is
// wider.
export function potPlantFootprintOf(P) {
  const r = Math.max(
    P.pot.radius,
    P.stems.spread * P.pot.radius + reachOf(P.plant),
  );
  return { x: r, z: r, round: true };
}

// One pot plant, standing on the ground at y = 0. `config` overrides any
// of POT_PLANT's fields for this one instance.
export default function PotPlant({ config }) {
  const P = useMemo(() => merge(POT_PLANT, config), [config]);
  const T = P.pot;
  const S = P.stems;
  const K = P.plant;
  const soilTop = T.height - P.soil.depth;
  // The pot: a cylinder pressed to its height with its foot drawn in
  // (see FORM); the soil a thin coin just under its rim.
  const potForm = useMemo(
    () => ({
      tall: T.height / (2 * T.radius),
      bottom: { inflate: T.flare },
      feather: 1,
    }),
    [T],
  );
  const soilForm = useMemo(
    () => ({ tall: 0.05 / (2 * T.radius * 0.92) }),
    [T.radius],
  );
  // Each stem: a cylinder `length` long, tilted out from the pot's
  // middle by `tilt` and turned to its own bearing round the pot, its
  // foot in the soil — and what tips it, at its far end, tilted with it.
  const n = Math.max(1, Math.round(S.count));
  const out = S.spread * T.radius;
  const length = Math.hypot(S.height, n === 1 ? 0 : out);
  const tilt = n === 1 ? 0 : Math.atan2(out, S.height);
  const stemForm = useMemo(
    () => ({ tall: length / (2 * S.radius) }),
    [length, S.radius],
  );
  const bloom = useMemo(
    () =>
      K.kind === "bush" || K.kind === "leaf" ?
        null
      : ornamentOf({ shape: K.kind, radius: K.size }, "POT_PLANT.plant"),
    [K.kind, K.size],
  );
  return (
    <group>
      <group position-y={T.height / 2}>
        <Primitive
          shape="cylinder"
          radius={T.radius}
          detail={T.detail}
          form={potForm}
          clay={T.clay}
          swatch={T.color}
          light={LIGHT}
        />
      </group>
      <group position-y={soilTop}>
        <Primitive
          shape="cylinder"
          radius={T.radius * 0.92}
          form={soilForm}
          swatch={P.soil.color}
          light={LIGHT}
        />
      </group>
      {Array.from({ length: n }, (_, i) => (
        <group key={i} position-y={soilTop} rotation-y={(i * 2 * Math.PI) / n}>
          <group rotation-z={-tilt}>
            <group position-y={length / 2}>
              <Primitive
                shape="cylinder"
                radius={S.radius}
                form={stemForm}
                swatch={S.color}
                light={LIGHT}
              />
            </group>
            <group
              position-y={
                length + (bloom || K.kind === "leaf" ? 0 : K.size * 0.6)
              }
            >
              {bloom ?
                <Ornament ornament={bloom} swatch={K.color} />
              : K.kind === "leaf" ?
                // The blade grows on up the stem, its broad face turned
                // out from the pot: stood up so its length runs +y, then
                // turned so its width lies across the stem's lean.
                <group rotation-y={Math.PI / 2}>
                  <group rotation-x={-Math.PI / 2}>
                    <mesh
                      geometry={LEAF_GEO}
                      material={paintOf(K.color, lightOf(LIGHT))}
                      scale={[
                        K.size,
                        K.size * K.leaf.flat,
                        K.size * K.leaf.aspect,
                      ]}
                    />
                  </group>
                </group>
              : <Primitive
                  shape="sphere"
                  radius={K.size}
                  clay={K.clay}
                  swatch={K.color}
                  light={LIGHT}
                />
              }
            </group>
          </group>
        </group>
      ))}
    </group>
  );
}
