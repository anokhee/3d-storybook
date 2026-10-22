// Hand: an arm up out of the ground, as the lone arms in the field stand,
// with the hand in one of its poses: reach (fingers for the sky), flat,
// cup, or fist. From the albatross game; see stories/helpers/albatross.jsx.
import { Arm } from "./helpers/albatross.jsx";

export default {
  title: "Monuments/Hand",
  argTypes: {
    pose: { control: "radio", options: ["reach", "flat", "cup", "fist"] },
  },
  args: { pose: "reach" },
  render: (a) => <Arm pose={a.pose} />,
};

export const Default = {};
