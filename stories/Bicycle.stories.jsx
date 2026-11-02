// Bicycle: a little town bike, built round the characters so one rides
// it at their own size (see src/nouns/bicycle/objects.js). Mountable:
// `rider` sits one of the characters on it in the "cycle" pose, and
// `pedalling` turns the cranks with their feet on the pedals and rolls
// the wheels. Its code is src/nouns/bicycle/Bicycle.jsx; the rider is
// put on by stories/helpers/cyclist.jsx.
import Bicycle from "../src/nouns/bicycle/Bicycle.jsx";
import { BICYCLE, BICYCLE_KNOBS } from "../src/nouns/bicycle/objects.js";
import { knobStory } from "./helpers/knobs.js";
import { Cyclist } from "./helpers/cyclist.jsx";
import { RIDERS } from "./helpers/rider.jsx";

const K = knobStory(BICYCLE, BICYCLE_KNOBS, {}, {});

export default {
  title: "Vehicles/Bicycle",
  tags: ["mountable"],
  component: Bicycle,
  argTypes: {
    rider: { control: "select", options: RIDERS },
    pedalling: { control: "boolean" },
    stopped: { control: "boolean", name: "stopped (a foot down)" },
    ...K.argTypes,
  },
  args: { rider: "none", pedalling: true, stopped: false, ...K.args },
  render: ({ rider, pedalling, stopped, ...a }) => <Cyclist rider={rider} pedalling={pedalling} stopped={stopped} config={K.configOf(a)} />,
};

export const Default = {};
export const Ridden = { args: { rider: "human" } };
// waiting at a crossing: the left foot down on the road, the right up on
// its pedal ready to push off
export const Stopped = { args: { rider: "human", stopped: true } };
