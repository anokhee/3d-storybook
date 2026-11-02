import { useMemo } from "react";

import { merge } from "../../world/merge.js";
import { unlitMat } from "../../adjectives/unlit/material.js";
import Mug from "../mug/Mug.jsx";
import Plate from "../plate/Plate.jsx";
import Bowl from "../bowl/Bowl.jsx";
import Teacup from "../teacup/Teacup.jsx";
import Glass from "../glass/Glass.jsx";
import { Fork, Knife, Spoon } from "../cutlery/Cutlery.jsx";
import { solid } from "../../world/palette.js";
import { TABLE_SETTING, DRINK_HOLDS } from "./objects.js";

// ONE TABLE SETTING (see TABLE_SETTING), lying on the tabletop at y = 0,
// laid for someone at -z. `config` overrides any of its fields.
export default function TableSetting({ config }) {
  const C = useMemo(() => merge(TABLE_SETTING, config), [config]);
  const K = C.cutlery;
  const bowl = C.dish === "bowl";
  // the dish in the middle: the Plate with its food (unless it's empty),
  // or the Bowl with what's in it (nothing, if the food's off)
  const F = useMemo(() => ({ ...C.food, on: C.food.on && C.plate.contents !== "empty" }), [C.food, C.plate.contents]);
  const plate = useMemo(() => ({ ...C.plate, food: F }), [C.plate, F]);
  const bowlC = useMemo(() => (C.food.on ? C.bowl : { ...C.bowl, contents: "empty" }), [C.bowl, C.food.on]);
  const edge = bowl ? C.bowl.radius * (1 + C.bowl.flare * 0.25) : C.plate.radius;
  const side = edge + K.gap + 0.03, L = K.length;
  const tool = useMemo(() => ({ length: K.length, color: K.color }), [K.length, K.color]);
  const at = C.drinkAt ?? C.mugAt;
  // the drink, filled with what it holds (its colour), or empty
  const drink = useMemo(() => {
    const kind = C.drink, D = C[kind];
    if (!D) return null;
    const name = C.holds?.[kind], hex = DRINK_HOLDS[kind]?.[name];
    if (name === "empty") return { ...D, full: 0 };
    return hex ? { ...D, colors: { ...D.colors, drink: solid(hex) } } : D;
  }, [C]);
  const spoon = C.utensils === "spoon";
  return (
    <group>
      {bowl ? <Bowl config={bowlC} /> : <Plate config={plate} />}
      {/* the napkin on the left (+x), the fork on it */}
      {C.napkin && (
        <mesh position={[side, 0.006, 0]} material={unlitMat(C.napkin.color)}>
          <boxGeometry args={[0.2, 0.012, L * 0.9]} />
        </mesh>
      )}
      {/* the cutlery (Food/Utensils/Fork, Knife, Spoon): a fork on the left
          and a knife on the right, or a spoon on the right */}
      {!spoon && <group position={[side, C.napkin ? 0.012 : 0, 0]}><Fork config={tool} /></group>}
      {!spoon && <group position={[-side, 0, 0]}><Knife config={tool} /></group>}
      {spoon && <group position={[-side, 0, 0]}><Spoon config={tool} /></group>}
      {/* the drink, up beyond the right */}
      {C.drink !== "none" && drink && (
        <group position={[at[0], 0, at[1]]} rotation-y={-0.5}>
          {C.drink === "teacup" ? <Teacup config={drink} />
            : C.drink === "glass" ? <Glass config={drink} />
            : <Mug config={drink} />}
        </group>
      )}
    </group>
  );
}
