import { solid } from "../../world/palette.js";

// A CAFÉ TABLE: a small round table on one leg with chairs round it facing
// in, and, as an UMBRELLA TABLE, a parasol up through its middle — made of the library's own Table
// (Furniture/Surfaces/Table), Basic Chair (Furniture/Seating) and
// Umbrella. Stood on the ground with the table's
// middle on the origin.
//
//   scale    the table and chairs are built in the library's furniture
//            units and shrunk by this to sit beside the characters (a
//            tabletop near their waist, a seat at their knee)
//   table    `width` across its round top (`sides` round it), `thickness`,
//            `height` of its one leg; `top` and `leg` colours
//   chairs   `count` of them round it, `apart` from its middle (furniture
//            units), the first at `from` degrees round from +x; `color`
//            the seat, `legColor` the legs and back
//   parasol  `on` or not (off: a café table; on: an umbrella table); in world units (it is not shrunk): `radius`,
//            `height`, `panels`, and its two `colors`
export const CAFE_TABLE = {
  scale: 0.27,
  table: { width: 2.2, sides: 18, thickness: 0.2, height: 2, top: solid("#F2E9DC"), leg: solid("#2F2A36") },
  chairs: { count: 2, apart: 2.2, from: 0, color: solid("#B07A45"), legColor: solid("#2F2A36") },
  parasol: { on: false, radius: 0.9, height: 2.0, panels: 8, colors: { canopyA: solid("#2F6B4F"), canopyB: solid("#F2E9DC") } },
};

export const CAFE_TABLE_KNOBS = {
  chairs: { path: "chairs.count", range: [0, 6, 1] },
  parasol: { path: "parasol.on", bool: true },
  parasolColor: { path: "parasol.colors.canopyA.hex", color: true, name: "parasol color" },
  parasolStripe: { path: "parasol.colors.canopyB.hex", color: true, name: "parasol stripe" },
  topColor: { path: "table.top.hex", color: true, name: "table top color" },
  chairColor: { path: "chairs.color.hex", color: true, name: "chair color" },
};
