import { useEffect, useMemo } from "react";

import { merge } from "../../world/merge.js";
import { unlitMat } from "../../adjectives/unlit/material.js";
import { solid } from "../../world/palette.js";
import { CAKE, LOAF } from "./objects.js";
import { cakePartsOf, loafPartsOf } from "./parts.js";

function Parts({ parts }) {
  useEffect(() => () => parts.forEach((p) => p.geo.dispose()), [parts]);
  return parts.map((p, i) => (
    <mesh key={i} geometry={p.geo} position={p.at} scale={p.scale ?? [1, 1, 1]} material={unlitMat(solid(p.color))} castShadow receiveShadow />
  ));
}

// One iced cake (see CAKE), standing on y = 0. `config` overrides CAKE's fields.
export default function Cake({ config }) {
  const C = useMemo(() => merge(CAKE, config), [config]);
  const parts = useMemo(() => cakePartsOf(C), [C]);
  return <Parts parts={parts} />;
}

// One loaf (see LOAF), resting on y = 0. `config` overrides LOAF's fields.
export function Loaf({ config }) {
  const L = useMemo(() => merge(LOAF, config), [config]);
  const parts = useMemo(() => loafPartsOf(L), [L]);
  return <Parts parts={parts} />;
}
