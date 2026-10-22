// Stone Lantern: the albatross game's stone lanterns, one entry with a
// variant per kind (the kinds in src/albatross/scenery.js OBELISKS). Lit,
// its panes glow and it throws a warm light; unlit, they are dark glass.
// See stories/helpers/albatross.jsx.
import { Obelisk } from "./helpers/albatross.jsx";

// The kinds, as the game names them, under the names the catalog shows
const KINDS = { Stone: "lantern", "Light Box": "diamond", Fallen: "fallen", "Five-Sided": "pentago", Gas: "gaslamp", Globe: "tsuri" };

export default {
  title: "Lighting/Stone Lantern",
  argTypes: {
    kind: { control: "select", options: Object.keys(KINDS) },
    lit: { control: "boolean" },
    k: { control: { type: "range", min: 0, max: 7, step: 1 }, name: "height" },
  },
  args: { kind: "Stone", lit: true, k: 3 },
  render: (a) => <Obelisk kind={KINDS[a.kind]} k={a.k} lit={a.lit} />,
};

// VARIANTS: one per kind.
export const Stone = {};
export const LightBox = { name: "Light Box", args: { kind: "Light Box" } };
export const Fallen = { args: { kind: "Fallen" } };
export const FiveSided = { name: "Five-Sided", args: { kind: "Five-Sided" } };
export const Gas = { args: { kind: "Gas" } };
export const Globe = { args: { kind: "Globe" } };
