import { solid } from "../../world/palette.js";

// A TILE FLOOR: square tiles laid in rows over a bed of grout, the grid
// running out from the middle — one colour, or `checker`ed in two — and,
// if it has one, a MOSAIC set in the middle of every tile: a flat polygon
// (or a star), the way a curtain's dots and the couch's are drawn
// (pattern/Pattern.jsx's polygonOf), with a rim round it in a colour of its
// own; only in whole tiles, not the part ones cut off at the edges. The lot
// is painted onto one image laid over the slab (see TileFloor.jsx). It lies on the
// ground about the origin, `width` across (x) by `length` along (z), its
// top `thickness` up. In metres (the cafés lay them: Shopfronts/Shop Interior).
// As made, it is the UPSCALE CAFÉ TILE: cream tiles 0.23 across, each
// with a dark six-petalled flower in its middle (0.2 of the tile) inside a
// terracotta square outline 90% of the tile across and up.
//   tile     `size` (each square, grout and all), `color`, `alt` the second
//            colour of a checker; `layout` "grid" (all one) or "checker";
//            and on every whole tile, if `on`, an `outline` round its
//            mosaic: a square `scale` of the tile across and up, a line
//            `width` wide, in its `color`
//   grout    `width` of the lines between, `color`
//   mosaic   `on` or not: in each tile, a polygon of `sides` points, `radius`
//            across as a share of the tile's size (0.5 would reach the grout),
//            `inner` pinching every other point in to make a star (1 none),
//            `curve` rounding a star's points into petals (0 sharp … 1
//            full: a flower), `turn` in degrees, `color`; its `rim` that much wider all round
//            (a share of the tile too), in `rimColor`
export const TILE_FLOOR = {
  width: 4,
  length: 4,
  thickness: 0.015,
  tile: {
    size: 0.23, color: solid("#E9E2D6"), alt: solid("#2F2A36"), layout: "grid",
    outline: { on: true, scale: 0.9, width: 0.01, color: solid("#C9573F") },
  },
  grout: { width: 0.012, color: solid("#9A8F82") },
  mosaic: { on: true, sides: 6, radius: 0.2, inner: 0.28, curve: 1, turn: 0, color: solid("#2F2A36"), rim: 0, rimColor: solid("#C9573F") },
};

export const TILE_FLOOR_KNOBS = [
  { label: "width", path: "width", step: 0.1, min: 0.5, max: 10 },
  { label: "length", path: "length", step: 0.1, min: 0.5, max: 10 },
  { label: "tile size", path: "tile.size", step: 0.01, min: 0.08, max: 1 },
  { label: "layout", path: "tile.layout", options: ["grid", "checker"] },
  { label: "tile colour", path: "tile.color.hex", color: true },
  { label: "checker colour", path: "tile.alt.hex", color: true },
  { label: "tile outline", path: "tile.outline.on", bool: true },
  { label: "outline size", path: "tile.outline.scale", step: 0.01, min: 0.3, max: 1 },
  { label: "outline width", path: "tile.outline.width", step: 0.002, min: 0.002, max: 0.05 },
  { label: "outline colour", path: "tile.outline.color.hex", color: true },
  { label: "grout width", path: "grout.width", step: 0.002, min: 0, max: 0.05 },
  { label: "grout colour", path: "grout.color.hex", color: true },
  { label: "mosaic", path: "mosaic.on", bool: true },
  { label: "mosaic points", path: "mosaic.sides", step: 1, min: 3, max: 16 },
  { label: "mosaic star", path: "mosaic.inner", step: 0.05, min: 0.2, max: 1 },
  { label: "mosaic petals (rounded star)", path: "mosaic.curve", step: 0.05, min: 0, max: 1 },
  { label: "mosaic size (of the tile)", path: "mosaic.radius", step: 0.01, min: 0.05, max: 0.5 },
  { label: "mosaic turn", path: "mosaic.turn", step: 2.5, min: 0, max: 180 },
  { label: "mosaic colour", path: "mosaic.color.hex", color: true },
  { label: "mosaic rim (of the tile)", path: "mosaic.rim", step: 0.01, min: 0, max: 0.2 },
  { label: "rim colour", path: "mosaic.rimColor.hex", color: true },
];
