import { solid } from "../../world/palette.js";
import { MUG } from "../mug/objects.js";
import { PLATE } from "../plate/objects.js";
import { BOWL, BOWL_CONTENTS } from "../bowl/objects.js";
import { BOWL_DESIGNS } from "../bowl/designs.js";
import { TEACUP } from "../teacup/objects.js";
import { GLASS, GLASS_DRINKS } from "../glass/objects.js";

// A TABLE SETTING: one place laid at a table, lying on the tabletop at
// y = 0 — a dish in the middle (a Plate or a Bowl, and what's on or in
// it), cutlery either side (a Fork on the left and a Knife on the right,
// or a Spoon on the right), and a drink (a Mug, a Teacup or a Glass, and
// what's in it) up beyond them. Laid for someone sat at -z looking +z (as
// a chair's front faces): their left +x, their right -x. In the library's
// own units, as the Mug is (the café sets them at its tables' scale).
// Each piece is its own entry under Food/Kitchen.
//   dish      "plate" or "bowl" (TABLE_SETTING_DISHES)
//   plate     the Plate's config (Food/Kitchen/Plate) but its food, and
//             `contents`: "food" or "empty" (PLATE_HOLDS)
//   food      the heap on the plate: `on` or not, `radius`, `color`
//   bowl      the Bowl's config (Food/Kitchen/Bowl), at a place's size,
//             its `contents` one of BOWL_CONTENTS
//   utensils  "fork and knife" or "spoon" (TABLE_SETTING_UTENSILS)
//   cutlery   their `length`, `gap` from the dish's edge, `color`
//   drink     "mug", "teacup", "glass" or "none" (TABLE_SETTING_DRINKS)
//   holds     what's in each drink: `mug`, `teacup`, `glass`, each a name
//             from DRINK_HOLDS (its colour) or "empty"
//   mug       the Mug's config; `teacup`, `glass` theirs
//   drinkAt   [x, z] where the drink stands
//   napkin    folded under the fork: `color`, or null for none
export const PLATE_HOLDS = ["food", "empty"];
export const DRINK_HOLDS = {
  mug: { coffee: "#5B3A29", tea: "#B5652B", "hot chocolate": "#7A4A33", empty: null },
  teacup: { tea: "#B5652B", "green tea": "#A9B84A", coffee: "#5B3A29", empty: null },
  glass: { ...GLASS_DRINKS, empty: null },
};
export const TABLE_SETTING = {
  dish: "plate",
  plate: { radius: PLATE.radius, rim: PLATE.rim, height: PLATE.height, color: PLATE.color, contents: "food" },
  food: PLATE.food,
  bowl: { ...BOWL, radius: 0.26, depth: 0.19, contents: "noodles", fruit: { count: 3, radius: 0.075 } },
  utensils: "fork and knife",
  cutlery: { length: 0.5, gap: 0.06, color: solid("#BFC5CB") },
  drink: "mug",
  holds: { mug: "coffee", teacup: "tea", glass: "juice" },
  mug: { ...MUG, full: MUG.full },
  teacup: TEACUP,
  glass: GLASS,
  drinkAt: [-0.5, 0.42],
  napkin: { color: solid("#E07A6B") },
};

export const TABLE_SETTING_DISHES = ["plate", "bowl"];
export const TABLE_SETTING_UTENSILS = ["fork and knife", "spoon"];
export const TABLE_SETTING_DRINKS = ["mug", "teacup", "glass", "none"];

// One dropdown for each choice, and under it the ones that choice opens:
// what's on the plate or in the bowl, what's in the mug, teacup or glass.
export const TABLE_SETTING_KNOBS = [
  { label: "dinnerware", path: "dish", options: TABLE_SETTING_DISHES },
  { label: "on the plate", path: "plate.contents", options: PLATE_HOLDS, if: { arg: "dish", eq: "plate" } },
  { label: "in the bowl", path: "bowl.contents", options: BOWL_CONTENTS, if: { arg: "dish", eq: "bowl" } },
  { label: "bowl design", path: "bowl.design", options: BOWL_DESIGNS, if: { arg: "dish", eq: "bowl" } },
  { label: "utensils", path: "utensils", options: TABLE_SETTING_UTENSILS },
  { label: "drink", path: "drink", options: TABLE_SETTING_DRINKS },
  { label: "in the mug", path: "holds.mug", options: Object.keys(DRINK_HOLDS.mug), if: { arg: "drink", eq: "mug" } },
  { label: "in the teacup", path: "holds.teacup", options: Object.keys(DRINK_HOLDS.teacup), if: { arg: "drink", eq: "teacup" } },
  { label: "in the glass", path: "holds.glass", options: Object.keys(DRINK_HOLDS.glass), if: { arg: "drink", eq: "glass" } },
  { label: "food colour", path: "food.color.hex", color: true, if: { arg: "dish", eq: "plate" } },
  { label: "plate colour", path: "plate.color.hex", color: true, if: { arg: "dish", eq: "plate" } },
  { label: "bowl colour", path: "bowl.colors.bowl.hex", color: true, if: { arg: "dish", eq: "bowl" } },
  { label: "mug colour", path: "mug.colors.mug.hex", color: true, if: { arg: "drink", eq: "mug" } },
  { label: "teacup colour", path: "teacup.colors.cup.hex", color: true, if: { arg: "drink", eq: "teacup" } },
  { label: "napkin colour", path: "napkin.color.hex", color: true },
];
