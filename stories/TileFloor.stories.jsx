// Tile Floor: square tiles in rows over a bed of grout — one colour or
// checkered — with a mosaic set in the middle of each tile: a flat polygon
// or star (as the curtains' and couch's dots are drawn) with a rim round it. The tile,
// the grout and the mosaic each take a colour. Its defaults are TILE_FLOOR in
// src/nouns/tileFloor/objects.js. The cafés are floored with these
// (Shopfronts/Shop Interior), each style its own.
import TileFloor from "../src/nouns/tileFloor/TileFloor.jsx";
import { TILE_FLOOR, TILE_FLOOR_KNOBS } from "../src/nouns/tileFloor/objects.js";
import { knobStory } from "./helpers/knobs.js";

const K = knobStory(TILE_FLOOR, TILE_FLOOR_KNOBS, {}, {});

export default {
  title: "Flooring/Tile Floor",
  component: TileFloor,
  parameters: { stage: { view: "top" } },
  argTypes: K.argTypes,
  args: K.args,
  render: (a) => <TileFloor config={K.configOf(a)} />,
};

// the tile as made: a six-petalled flower in each, inside a square outline
export const Default = { name: "Upscale Café Tile" };
// the same flower's points left sharp: a star
export const Star = { args: { mosaicCurve: 0, mosaicInner: 0.55 } };
export const Checker = { args: { tileLayout: "checker", tileColor: "#F7F4EE", tileAlt: "#2F2A36", mosaicOn: false, tileOutlineOn: false } };
export const Sunburst = { args: { tileOutlineOn: false, tileSize: 0.3, mosaicRadius: 0.3, mosaicRim: 0.05, tileColor: "#FFF4D6", groutColor: "#E3C9A0", mosaicSides: 12, mosaicInner: 0.45, mosaicCurve: 0, mosaicColor: "#F2C94C", mosaicRimColor: "#E8A93B", mosaicTurn: 0 } };
export const Hexagon = { args: { tileOutlineOn: false, tileSize: 0.3, mosaicRadius: 0.3, mosaicRim: 0.05, tileColor: "#F4F6F5", groutColor: "#C9D3D8", mosaicSides: 6, mosaicInner: 1, mosaicTurn: 30, mosaicColor: "#7FA7C9", mosaicRimColor: "#F7F4EE" } };
