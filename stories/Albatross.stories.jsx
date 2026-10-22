// Albatross: the bird you fly in the albatross game, wings spread. The
// `variant` is one of the game's named looks; the color pickers override
// that look's feathers, ink and beak. See stories/helpers/albatross.jsx.
import { Bird } from "./helpers/albatross.jsx";
import { VARIANT_NAMES, ALBATROSS } from "../src/albatross/albatross.js";

const hex = (n) => "#" + n.toString(16).padStart(6, "0");

export default {
  title: "Animals/Birds/Albatross",
  argTypes: {
    variant: { control: "radio", options: VARIANT_NAMES },
    white: { control: "color", name: "feathers" },
    dark: { control: "color", name: "ink" },
    beak: { control: "color" },
    lift: { control: { type: "range", min: 0, max: 10, step: 0.5 }, name: "height off the ground" },
    pitch: { control: { type: "range", min: -20, max: 30, step: 1 }, name: "nose up" },
    animate: { control: "boolean" },
    climb: { control: { type: "range", min: 0, max: 1, step: 0.05 }, name: "flap (0 glides, 1 climbs)" },
  },
  args: {
    variant: "base",
    lift: 4,
    pitch: 8,
    animate: true,
    climb: 0,
    white: hex(ALBATROSS.colour.white),
    dark: hex(ALBATROSS.colour.dark),
    beak: hex(ALBATROSS.colour.beak),
  },
  render: (a) => <Bird variant={a.variant} white={a.white} dark={a.dark} beak={a.beak} lift={a.lift} pitch={a.pitch} animate={a.animate} climb={a.climb} />,
};

export const Default = {};
