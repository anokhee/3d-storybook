// Shelving: shelves of goods between two uprights — the shop windows' own
// display (Shopfronts/Shop Window has it behind the glass), stood on its
// own, as the shop interiors line their walls with it. Its defaults are
// SHELVING in src/nouns/shelving/objects.js; each style of goods is an
// entry below.
import Shelving from "../src/nouns/shelving/Shelving.jsx";
import { SHELVING, SHELVING_KNOBS } from "../src/nouns/shelving/objects.js";
import { knobStory } from "./helpers/knobs.js";

const K = knobStory(SHELVING, SHELVING_KNOBS, {}, {});

export default {
  title: "Furniture/Storage/Shelving",
  component: Shelving,
  argTypes: K.argTypes,
  args: K.args,
  render: (a) => <Shelving config={K.configOf(a)} />,
};

export const Default = {};
export const Cakes = { args: { style: "cakes", shelves: 3 } };
export const Flowers = { args: { style: "flowers", shelves: 3 } };
// the café's crockery: mugs (some with coffee), a few teapots tall and
// short, bowls with fruit in or empty (Food/Kitchen)
export const Cafe = { args: { style: "cafe" } };
// a kitchen's: oil, vinegar, salt and pepper, empty mugs, bowls and
// glasses, stacks of plates (Food/Condiments, Food/Kitchen)
export const Kitchen = { args: { style: "kitchen", mount: "wall", shelves: 4, from: 1.2, every: 0.35, width: 1.4, depth: 0.2 } };
export const Books = { args: { style: "books", shelves: 5, every: 0.4 } };
// HALF HEIGHT: put up on a wall over a counter, the top half of the wall
// only, its uprights cut off under the lowest board — as the café kitchen's
// is (Shopfronts/Shop Interior)
export const HalfHeight = { name: "Half Height", args: { style: "cafe", mount: "wall", shelves: 4, from: 1.2, every: 0.35, width: 1.4, depth: 0.2 } };
