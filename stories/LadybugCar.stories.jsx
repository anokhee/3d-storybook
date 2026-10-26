// Ladybug car: the roadster (see Car.stories.jsx) remade as a ladybug —
// a black head dome with headlight eyes and antennae, the cockpit, and a
// red shell dome over the rear with a seam and black spots, the wheels
// tucked under it (src/car/bugcar.js). See stories/helpers/beetle.jsx.
import { beetleStory } from "./helpers/beetle.jsx";
import { BUG_CAR_FRAME } from "./helpers/bugcar.jsx";
import { LADYBUG } from "../src/car/bugcar.js";

const story = beetleStory("Vehicles/Bug Cars/Ladybug", LADYBUG, ["spots", "antennaLen", "shell", "spot", "head", "trim", "wheel"], { head: "head & antennae" });

export default { title: "Vehicles/Bug Cars/Ladybug", parameters: { stage: { frame: BUG_CAR_FRAME } }, argTypes: story.argTypes, args: story.args, render: story.render };

export const Default = {};
