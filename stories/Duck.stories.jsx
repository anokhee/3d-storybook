// Duck: a toy duck standing on the ground facing +z, a mallard as made,
// bobbing its head and waggling its tail. Its code lives in
// src/nouns/duck/ (Duck.jsx, defaults and knobs in objects.js). The kind
// shapes the duck, and picking one paints it that kind's way (PAINT,
// below): one entry for all three, not a story each.
import { useArgs, useEffect, useRef } from "storybook/preview-api";
import Duck from "../src/nouns/duck/Duck.jsx";
import { DUCK, DUCK_KNOBS } from "../src/nouns/duck/objects.js";
import { knobStory } from "./helpers/knobs.js";
import { Mounted, RIDERS } from "./helpers/rider.jsx";

const K = knobStory(DUCK, DUCK_KNOBS, {}, {});

// Each kind's own colours, laid over the knobs when it is picked: a farm
// duck cream all over with an orange bill, a bath toy bright yellow (and,
// by its kind, legless and sitting flat on its belly). The colours can
// still be changed after.
const PAINT = {
  mallard: { colorsBody: K.args.colorsBody, colorsHead: K.args.colorsHead, colorsBill: K.args.colorsBill },
  white: { colorsBody: "#F2E9DC", colorsHead: "#F2E9DC", colorsBill: "#F08A3C" },
  rubber: { colorsBody: "#F4D46A", colorsHead: "#F4D46A", colorsBill: "#F08A3C" },
};

// A rider astride its back, as on the four-legged animals (rider.jsx);
// the duck does not trot, it keeps its own bob.
function render({ rider, seat, ...a }) {
  const [, updateArgs] = useArgs();
  const kind = useRef(a.kind);
  useEffect(() => {
    if (kind.current !== a.kind && PAINT[a.kind]) updateArgs(PAINT[a.kind]);
    kind.current = a.kind;
  }, [a.kind]);
  return (
    <Mounted rider={rider} forward={seat}>
      <Duck config={K.configOf(a)} />
    </Mounted>
  );
}

export default {
  title: "Animals/Birds/Duck",
  component: Duck,
  tags: ["mountable"],
  argTypes: {
    rider: { control: "select", options: RIDERS },
    seat: { control: { type: "range", min: -0.4, max: 0.4, step: 0.02 }, name: "seat (back to front)" },
    ...K.argTypes,
  },
  args: { rider: "none", seat: 0, ...K.args },
  render,
};

export const Default = {};
