import { useMemo } from "react";

import { merge } from "../../world/merge.js";
import Table from "../table/Table.jsx";
import Chair from "../chair/Chair.jsx";
import { CHAIR } from "../chair/objects.js";
import Umbrella from "../umbrella/Umbrella.jsx";
import { CAFE_TABLE } from "./objects.js";

// One café table set — see CAFE_TABLE: the library's Table, round on one
// leg; its Basic Chairs round it, each turned to face its middle; and its
// Umbrella (if it has one) stood up through the middle as a parasol: no
// crook on its handle — its pole runs straight down to the ground — and no
// beads on its rib tips.
// `seat`, if given, is called for each chair, `seat(i)`, and what it returns
// is set in that chair, in world units (the table's `scale` undone), its
// origin on the ground under the seat's middle, facing the chair's front
// (+z): for someone sat in it, the seat's top `cafeSeatTop` off the ground.
export const cafeSeatTop = (scale = CAFE_TABLE.scale) => (CHAIR.legs.height + CHAIR.seat.thickness) * scale;
export default function CafeTable({ config, seat }) {
  const T = useMemo(() => merge(CAFE_TABLE, config), [config]);
  const tb = T.table, ch = T.chairs, pa = T.parasol;
  const table = useMemo(() => ({
    top: { width: tb.width, length: tb.width, sides: tb.sides, thickness: tb.thickness, color: tb.top },
    legs: { count: 1, height: tb.height, radius: 0.16, color: tb.leg },
  }), [tb]);
  const chair = useMemo(() => ({ colors: { seat: ch.color, frame: ch.legColor } }), [ch]);
  const n = Math.max(0, Math.round(ch.count));
  return (
    <group>
      <group scale={T.scale}>
        <Table config={table} />
        {Array.from({ length: n }, (_, i) => {
          const a = ((ch.from + (i * 360) / n) * Math.PI) / 180;
          // the chair's front is +z: turned so it faces the table's middle
          return (
            <group key={i} position={[Math.cos(a) * ch.apart, 0, Math.sin(a) * ch.apart]} rotation-y={-Math.PI / 2 - a}>
              <Chair config={chair} />
              {seat && <group scale={1 / T.scale}>{seat(i)}</group>}
            </group>
          );
        })}
      </group>
      {pa.on && <Umbrella config={{ radius: pa.radius, height: pa.height, panels: pa.panels, colors: pa.colors, handle: { show: false }, tips: false }} />}
    </group>
  );
}
