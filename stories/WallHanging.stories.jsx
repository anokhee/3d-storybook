// Wall hanging: a framed picture, its foot at y = 0 and facing +z, hung
// `hang` up the wall. Of a `kind`: a shape, a framed picture (a still
// life on a mat), a landscape, a big abstract canvas, or a gallery of three
// small frames hung together (WALL_HANGING_KINDS). Shown on a stretch of wall (stories/helpers/mounts.jsx)
// in the house's wall color, standing on the ground. The component takes its
// config as given, so the knobs are merged over the whole default object.
import WallHanging from "../src/nouns/wallHanging/WallHanging.jsx";
import { WALL_HANGING, WALL_HANGING_KNOBS, wallHangingOf } from "../src/nouns/wallHanging/objects.js";
import { WallPanel } from "./helpers/mounts.jsx";
import { PALETTE } from "../src/world/palette.js";
import { merge } from "../src/world/merge.js";
import { knobStory } from "./helpers/knobs.js";

const K = knobStory(WALL_HANGING, WALL_HANGING_KNOBS);

export default {
  title: "Furniture/Wall Decor/Wall Hanging",
  component: WallHanging,
  parameters: { stage: { view: "front" } },
  argTypes: K.argTypes,
  args: K.args,
  // On a piece of wall sized to it: as wide as it plus a margin, as tall as it hangs
  render: (a) => {
    const H = merge(wallHangingOf(a.kind), K.configOf(a)); // the kind's own colours, the knobs over them
    const wallTop = H.hang + H.height + 1;
    return (
      <WallPanel width={H.width + 2} height={wallTop} center={[0, wallTop / 2]} swatch={PALETTE.house.walls}>
        <WallHanging config={H} />
      </WallPanel>
    );
  },
};

export const Default = {};

// each kind at its own sizes and colours (WALL_HANGING_KINDS)
const kindArgs = (kind) => {
  const k = wallHangingOf(kind);
  return { kind, width: k.width, height: k.height, hang: 2, frameThickness: k.frame.thickness, frameColor: k.frame.color.hex, backingColor: k.backing.color.hex };
};
export const Picture = { name: "Framed Picture", args: kindArgs("picture") };
export const Landscape = { args: kindArgs("landscape") };
export const Abstract = { name: "Abstract Canvas", args: kindArgs("abstract") };
export const Gallery = { name: "Gallery Wall", args: kindArgs("gallery") };
