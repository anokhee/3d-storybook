import { useEffect, useMemo } from "react";
import * as THREE from "three";

import { merge } from "../../world/merge.js";
import { displayOf } from "../shopfront/display.js";
import { SHELVING, GOODS_PALETTES } from "./objects.js";
import { crockery, kitchenware, CROCKERY_SCALE } from "./crockery.js";
import Crockery from "./Crockery.jsx";
import { rngOf } from "../shopInterior/objects.js";

// The goods are their own colour at any hour (vertex colours, unlit), so
// they glow on their shelves as they do behind a shop's glass.
const goodsMat = new THREE.MeshBasicMaterial({ vertexColors: true });

// Shelves of goods (see SHELVING), one merged geometry; but for "cafe", the
// bare boards with the library's own Mugs, Teapots and Bowls set out on
// them, as a café's are (see crockery.js). `config` overrides any of
// SHELVING's fields for this one instance.
export default function Shelving({ config }) {
  const S = useMemo(() => merge(SHELVING, config), [config]);
  const cafe = S.style === "cafe" || S.style === "kitchen";
  const { geo, pieces } = useMemo(() => {
    const n = Math.max(1, Math.round(S.shelves.count));
    const shelves = Array.from({ length: n }, (_, i) => S.shelves.from + i * S.shelves.every);
    const colors = S.colors.goods ?? GOODS_PALETTES[S.style] ?? GOODS_PALETTES.boxes;
    const geo = displayOf({
      x0: -S.width / 2, x1: S.width / 2, z: 0, depth: S.depth, shelves,
      style: cafe ? "none" : S.style, colors, wood: S.colors.wood.hex, seed: S.seed, legs: S.mount !== "wall",
    });
    const pieces = S.style === "kitchen" ? kitchenware({ x0: -S.width / 2 + 0.06, x1: S.width / 2 - 0.06, ys: shelves, z: -S.depth / 2, S: CROCKERY_SCALE, r: rngOf(S.seed), colors })
      : cafe ? crockery({ x0: -S.width / 2 + 0.06, x1: S.width / 2 - 0.06, ys: shelves, z: -S.depth / 2, S: CROCKERY_SCALE, r: rngOf(S.seed), colors, teapots: Math.max(1, Math.round(n * 0.75)) }) : [];
    return { geo, pieces };
  }, [S, cafe]);
  useEffect(() => () => geo.dispose(), [geo]);
  return (
    <group>
      <mesh geometry={geo} material={goodsMat} castShadow receiveShadow />
      {cafe && <Crockery pieces={pieces} S={CROCKERY_SCALE} />}
    </group>
  );
}
