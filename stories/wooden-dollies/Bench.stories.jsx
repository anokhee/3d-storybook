// A STORY FILE. One of these per object. Storybook finds every file whose
// name ends in .stories.jsx (see .storybook/main.js) and turns it into a
// sidebar entry with the named variants under it.
//
// The shape is always the same:
//   1. import the component and its defaults
//   2. `export default` describes the object: its title, which knobs the
//      Controls panel shows (argTypes), their starting values (args), and
//      how to turn those knobs into the component's props (render)
//   3. every other `export const` is a preset: a named variant that shows
//      up in the sidebar and overrides a few args

// `solid()` makes a colour the way the palette does: { hex, vary }. The
// colour picker gives back a plain "#rrggbb" string, so we wrap it.
import { solid } from "@world/palette.js";
// The component and the parameter file that sits next to it in the project.
import Bench from "@dollies/refactored/nouns/bench/Bench.jsx";
import { BENCH } from "@dollies/refactored/nouns/bench/objects.js";

export default {
  // Slashes make folders in the sidebar: Wooden Dollies ▸ Furniture ▸ Bench.
  title: "Wooden Dollies/Furniture/Bench",
  component: Bench,

  // The knobs. The key is the arg name; `control` is the widget.
  //   "color"              → colour picker
  //   { type: "range" }    → slider, with min/max/step
  //   "radio" / "select"   → pick one of `options`
  //   "boolean"            → toggle
  // `name` is just the label shown in the panel.
  argTypes: {
    seatColor: { control: "color", name: "seat colour" },
    legColor: { control: "color", name: "leg colour" },
    backColor: { control: "color", name: "back colour" },
    width: { control: { type: "range", min: 2, max: 14, step: 0.5 } },
    legHeight: { control: { type: "range", min: 0.5, max: 5, step: 0.1 } },
    slats: { control: { type: "range", min: 1, max: 6, step: 1 } },
    backSlats: { control: { type: "range", min: 1, max: 6, step: 1 } },
  },

  // Starting values, read straight from the project's defaults so the
  // Default story looks exactly like the object does in the game.
  args: {
    seatColor: BENCH.seat.color.hex,
    legColor: BENCH.legs.color.hex,
    backColor: BENCH.back.color.hex,
    width: BENCH.seat.width,
    legHeight: BENCH.legs.height,
    slats: BENCH.seat.count,
    backSlats: BENCH.back.count,
  },

  // Turns the flat knobs back into the nested `config` the component wants.
  // Only the fields named here are passed; everything else falls through to
  // BENCH's defaults, because the component deep-merges config over them.
  render: ({ seatColor, legColor, backColor, width, legHeight, slats, backSlats }) => (
    <Bench
      config={{
        legs: { color: solid(legColor), height: legHeight },
        seat: { color: solid(seatColor), width, count: slats },
        backFrame: { color: solid(legColor) },
        back: { color: solid(backColor), count: backSlats },
        armrests: { color: solid(legColor) },
      }}
    />
  ),
};

// PRESETS. An empty object means "all the defaults". Anything in `args`
// overrides the defaults above, and only for that preset.
export const Default = {};

export const Tall = { args: { legHeight: 3.4, width: 5 } };

export const Pink = {
  args: { seatColor: "#F4A7C3", backColor: "#F8C6D3", legColor: "#7C56BE" },
};

export const Slatted = { args: { slats: 5, backSlats: 5, width: 11 } };

// To add a preset: copy one of the lines above, rename it, change the args.
// To add a knob: add it to argTypes, give it a start value in args, and use
// it in render. All three, or the panel shows a knob that does nothing.
