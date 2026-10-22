// Chicken: the chicken from the Car project (and chickens3d before it), a
// blob torso under a scalloped icing cap, with bent-plate wings, walking
// on the spot (src/car/chicken.js). See stories/helpers/car.jsx.
import { Chicken } from "./helpers/car.jsx";

export default {
  title: "Characters/Chicken",
  argTypes: {
    walking: { control: "boolean" },
    wingRaise: { control: { type: "range", min: 0, max: 1, step: 0.05 }, name: "wings raised" },
  },
  args: { walking: true, wingRaise: 0.35 },
  render: (a) => <Chicken walking={a.walking} wingRaise={a.wingRaise} />,
};

export const Default = {};
