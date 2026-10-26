// Longhorn beetle car: the roadster (see Car.stories.jsx) remade as a
// longhorn beetle — a powder-blue spotted shell with a dark band, a dark
// head dome with headlight eyes and a pair of beaded antennae longer than
// the car, arcing up, out and back over its flanks, the cockpit cut out of
// the shell's top and the wheels tucked under it (src/car/bugcar.js). See
// stories/helpers/beetle.jsx.
import { beetleStory } from "./helpers/beetle.jsx";
import { BUG_CAR_FRAME } from "./helpers/bugcar.jsx";
import { LONGHORN } from "../src/car/bugcar.js";

const story = beetleStory("Vehicles/Bug Cars/Longhorn Beetle", LONGHORN, ["spots", "antennaLen", "antennaBeads", "bands", "shell", "spot", "band", "head", "trim", "wheel"], { head: "head & antennae" });

export default { title: "Vehicles/Bug Cars/Longhorn Beetle", parameters: { stage: { frame: BUG_CAR_FRAME } }, argTypes: story.argTypes, args: story.args, render: story.render };

export const Default = {};
