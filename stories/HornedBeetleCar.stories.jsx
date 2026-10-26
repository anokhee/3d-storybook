// Horned beetle car: the roadster (see Car.stories.jsx) remade as a
// jewel beetle — a violet shell with two lilac bands over its rear, a
// dark head dome with headlight eyes and a pair of horns curving out to
// a point either side, the cockpit cut out of the shell's top and the
// wheels tucked under it (src/car/bugcar.js). See stories/helpers/beetle.jsx.
import { beetleStory } from "./helpers/beetle.jsx";
import { BUG_CAR_FRAME } from "./helpers/bugcar.jsx";
import { HORNEDBEETLE } from "../src/car/bugcar.js";

const story = beetleStory("Vehicles/Bug Cars/Horned Beetle", HORNEDBEETLE, ["horn", "bands", "shell", "band", "head", "trim", "wheel"], { head: "head & horns" });

export default { title: "Vehicles/Bug Cars/Horned Beetle", parameters: { stage: { frame: BUG_CAR_FRAME } }, argTypes: story.argTypes, args: story.args, render: story.render };

export const Default = {};
