// Ranch Fence: the xylophone meadow's fence, posts with two flat rails
// between them, built here as the enclosure's "wooden" type (src/nouns/
// enclosure/objects.js) with the ranch fence's own numbers (src/xylophone/
// fence.js: post 0.34 wide and 1.9 tall, rails at 0.55 and 1.3) and its
// wood colors. So it rings a lot and is shaded like the other fences.
import Enclosure from "../src/nouns/enclosure/Enclosure.jsx";
import { solid } from "../src/world/palette.js";
import { COLOR_PALETTE } from "../src/xylophone/palette.js";
import { FENCE } from "../src/xylophone/fence.js";

const RANCH = {
  type: "wooden",
  strung: false,
  wooden: {
    height: FENCE.post.h,
    // two rails, the lower at 0.55 of the ground: `from` is that as a share
    // of the height, and the rails are spread evenly from there up
    rails: { count: FENCE.rails.length, from: FENCE.rails[0] / FENCE.post.h, radius: FENCE.rail.h / 2 },
    color: solid(COLOR_PALETTE.fenceRail),
    posts: {
      post: { sides: 4, taper: 1, baseRadius: FENCE.post.w / 2, color: solid(COLOR_PALETTE.fencePost) },
      cap: { shape: "cube", radius: FENCE.post.w / 2 * 0.9, light: { type: "unlit" } },
      capColor: solid(COLOR_PALETTE.fencePost),
    },
  },
};

export default {
  title: "Fixtures/Fences/Ranch Fence",
  component: Enclosure,
  argTypes: {
    width: { control: { type: "range", min: 4, max: 24, step: 1 } },
    length: { control: { type: "range", min: 4, max: 24, step: 1 } },
  },
  args: { width: 12, length: 12 },
  render: (a) => <Enclosure box={{ width: a.width, length: a.length }} top={0} config={RANCH} />,
};

export const Default = {};
