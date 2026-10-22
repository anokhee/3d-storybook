// Hot Air Balloon: stood on the ground on its basket, the striped
// envelope swaying gently on its ropes over the lit burner. Its code is
// in src/nouns/hotAirBalloon/ (HotAirBalloon.jsx, HOT_AIR_BALLOON and
// HOT_AIR_BALLOON_KNOBS in objects.js). Striped Narrow is a slimmer
// envelope in more, finer gores.
import HotAirBalloon from "../src/nouns/hotAirBalloon/HotAirBalloon.jsx";
import { HOT_AIR_BALLOON, HOT_AIR_BALLOON_KNOBS } from "../src/nouns/hotAirBalloon/objects.js";
import { knobStory } from "./helpers/knobs.js";

const K = knobStory(HOT_AIR_BALLOON, HOT_AIR_BALLOON_KNOBS, {}, {});

export default {
  title: "Vehicles/Hot Air Balloon",
  component: HotAirBalloon,
  argTypes: K.argTypes,
  args: K.args,
  render: (a) => <HotAirBalloon config={K.configOf(a)} />,
};

export const Default = {};
