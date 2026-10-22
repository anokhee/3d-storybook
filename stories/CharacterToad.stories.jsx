// Toad: the walking toad from the Car project, the chicken's torso with the
// xylophone toad's face, warts and splayed hands, walking on the spot
// (src/car/frog.js). See stories/helpers/car.jsx.
import { Toad } from "./helpers/car.jsx";

export default {
  title: "Characters/Toad",
  argTypes: { walking: { control: "boolean" } },
  args: { walking: true },
  render: (a) => <Toad walking={a.walking} />,
};

export const Default = {};
