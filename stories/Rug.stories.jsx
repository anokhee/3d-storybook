// Rug: a rounded slab of wool with a pattern of dots raised on it
// (src/nouns/rug/Rug.jsx; its defaults in src/nouns/rug/objects.js, the
// pattern's in src/nouns/pattern/objects.js). The knobs are the rug's
// shape and color and its pattern: the layout, the spacing, and up to
// three dots dealt round in turn, each a polygon or, pinched, a star.
//
// VARIANTS. Every `export const` after Default is a preset: a named rug
// that shows in the sidebar under Rug (and as its own tile in the
// catalog) with a few args overridden. To add one, copy a preset and
// change its args; any knob left out keeps the Default's value. The args
// are the same numbers the interior editor shows for a rug, so a rug
// settled there can be written down here as a preset.
import { solid } from "../src/world/palette.js";
import Rug from "../src/nouns/rug/Rug.jsx";
import { RUG } from "../src/nouns/rug/objects.js";
import { DOT, LAYOUTS, PATTERN } from "../src/nouns/pattern/objects.js";
import { PALETTE } from "../src/world/palette.js";

const range = (min, max, step) => ({ control: { type: "range", min, max, step } });

export default {
  title: "Furniture/Floor Decor/Rug",
  component: Rug,
  argTypes: {
    color: { control: "color", name: "wool" },
    width: range(2, 14, 0.5),
    length: range(2, 14, 0.5),
    cornerRadius: { ...range(0, 3, 0.1), name: "corner radius" },
    layout: { control: "select", options: LAYOUTS },
    spacing: range(0.3, 3, 0.05),
    inset: range(0, 2, 0.05),
    dots: { ...range(1, 3, 1), name: "dots (colors dealt round)" },
    sides: { ...range(3, 12, 1), name: "dot sides" },
    radius: { ...range(0.05, 0.6, 0.01), name: "dot radius" },
    inner: { ...range(0.2, 1, 0.05), name: "dot pinch (under 1: a star)" },
    turn: { ...range(0, 180, 5), name: "dot turn" },
    dot1: { control: "color", name: "first dot" },
    dot2: { control: "color", name: "second dot" },
    dot3: { control: "color", name: "third dot" },
  },
  // The rug exactly as it was made: RUG's and PATTERN's defaults, the three
  // dot colors the palette's.
  args: {
    color: RUG.color.hex,
    width: RUG.width,
    length: RUG.length,
    cornerRadius: RUG.cornerRadius,
    layout: PATTERN.layout,
    spacing: PATTERN.spacing,
    inset: PATTERN.inset,
    dots: PATTERN.dots.length,
    sides: DOT.sides,
    radius: DOT.radius,
    inner: DOT.inner,
    turn: DOT.turn,
    dot1: PALETTE.rug.dots[0].hex,
    dot2: PALETTE.rug.dots[1].hex,
    dot3: PALETTE.rug.dots[2].hex,
  },
  // The rug takes its config whole (no merge over defaults), so the whole
  // of RUG is spread first and the knobs laid over it.
  render: (a) => (
    <Rug
      config={{
        ...RUG,
        width: a.width,
        length: a.length,
        cornerRadius: a.cornerRadius,
        color: solid(a.color),
        pattern: {
          ...PATTERN,
          layout: a.layout,
          spacing: a.spacing,
          inset: a.inset,
          dots: [a.dot1, a.dot2, a.dot3].slice(0, a.dots).map((hex) => ({ ...DOT, sides: a.sides, radius: a.radius, inner: a.inner, turn: a.turn, color: solid(hex) })),
        },
      }}
    />
  ),
};

// PRESETS: each a named rug in the sidebar. An empty one is the defaults.
export const Default = {};
// A long runner with a ring of stars just inside its edge.
export const Runner = { args: { width: 10, length: 3, cornerRadius: 1.4, layout: "border", spacing: 0.9, sides: 10, inner: 0.5, radius: 0.24 } };
// Rings of small round dots, in to the middle.
export const Rings = { args: { layout: "rings", spacing: 0.7, inset: 0.4, sides: 12, radius: 0.14, dots: 2 } };
// A plain rug, no pattern.
export const Plain = { args: { layout: "none", color: "#8FA3C4" } };
