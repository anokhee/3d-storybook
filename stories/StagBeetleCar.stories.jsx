// Stag beetle car: the roadster (see Car.stories.jsx) remade as a stag
// beetle — a dark head dome with headlight eyes and a great forked horn
// sweeping up out of it, the cockpit, and a dark shell dome over the
// rear with a seam, the wheels tucked under it (src/car/bugcar.js). See
// stories/helpers/beetle.jsx.
import { beetleStory } from "./helpers/beetle.jsx";
import { BUG_CAR_FRAME } from "./helpers/bugcar.jsx";
import { STAGBEETLE } from "../src/car/bugcar.js";

const story = beetleStory("Vehicles/Bug Cars/Stag Beetle", STAGBEETLE, ["horn", "shell", "head", "trim", "wheel"], { head: "head & horn" });

export default { title: "Vehicles/Bug Cars/Stag Beetle", parameters: { stage: { frame: BUG_CAR_FRAME } }, argTypes: story.argTypes, args: story.args, render: story.render };

export const Default = {};
