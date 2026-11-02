import { solid } from "../../world/palette.js";
import { GOODS_STYLES } from "../shopfront/display.js";

// SHELVING: shelves of goods — the shop windows' own display (see
// shopfront/display.js), stood on its own: boards between two uprights,
// goods of one `style` set out along each. Its front faces +z at z = 0,
// its foot on y = 0, centred on x = 0, the boards running back along -z.
//   width    across the front
//   depth    how deep the boards are
//   shelves  the boards: `count` of them, the lowest `from` up off the
//            ground, one every `every` above it
//   style    what is on them, one of GOODS_STYLES: "boxes", "cakes",
//            "flowers", "books", "bottles", "cafe" (the library's Mugs,
//            Teapots and Bowls, as a café's shelves have them: see crockery.js)
//   mount    "floor", stood on its uprights; or "wall", put up on a wall,
//            the uprights cut off just under the lowest board (no legs)
//   seed     for the goods' scatter
//   colors   `wood` the boards and uprights; `goods` the goods, a list of
//            hexes dealt along the shelves — or null for the style's own
//            (GOODS_PALETTES: the shops' goods colours, Shopfront's)
export const GOODS_PALETTES = {
  kitchen: ["#F2E9DC", "#6FA8C9", "#E07A6B", "#2F2A36"],
  boxes: ["#E07A6B", "#F2C94C", "#6FA35A", "#A9B8E0", "#F2E9DC"],
  cakes: ["#F6E3C8", "#F2A7C3", "#FFF4EA", "#8A5A3C", "#F2C94C"],
  flowers: ["#F2A7C3", "#E5484D", "#F2C94C", "#FFFFFF", "#C4A3D9"],
  cafe: ["#F2E9DC", "#2F2A36", "#C9573F", "#F2C94C"],
  books: ["#B8433B", "#3E5C76", "#F2E9DC", "#4F7A4A", "#F2C94C", "#2F2A36"],
};
export const SHELVING = {
  width: 2.0,
  depth: 0.28,
  shelves: { count: 4, from: 0.3, every: 0.45 },
  style: "boxes",
  mount: "floor",
  seed: 3,
  colors: { wood: solid("#8A5A3C"), goods: null },
};
export const SHELVING_STYLES = [...GOODS_STYLES, "cafe", "kitchen"];

export const SHELVING_KNOBS = {
  style: { path: "style", options: SHELVING_STYLES },
  mount: { path: "mount", options: ["floor", "wall"] },
  width: { path: "width", range: [0.4, 6, 0.1] },
  depth: { path: "depth", range: [0.15, 0.6, 0.01] },
  shelves: { path: "shelves.count", range: [1, 8, 1] },
  from: { path: "shelves.from", range: [0.05, 1.5, 0.05], name: "lowest shelf" },
  every: { path: "shelves.every", range: [0.2, 1, 0.01], name: "shelf spacing" },
  seed: { path: "seed", range: [1, 60, 1] },
  wood: { path: "colors.wood.hex", color: true, name: "wood color" },
};
