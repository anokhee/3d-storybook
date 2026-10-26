// Apple car: the roadster (see Car.stories.jsx) remade as an apple — one
// plump red apple with the cockpit cut into its top, the stem and leaf
// behind it, a bite out of its flank with a worm looking out of it, and
// the wheels under its belly (src/car/applecar.js). See
// stories/helpers/applecar.jsx.
import { useMemo } from "react";
import { AppleCar } from "./helpers/applecar.jsx";
import { DRIVERS } from "./helpers/driver.jsx";
import { APPLECAR } from "../src/car/applecar.js";

const hex = (n) => "#" + n.toString(16).padStart(6, "0");

function Story({ speed, driver, skin, leaf, trim, wheel }) {
  const config = useMemo(() => ({ ...APPLECAR, skin, leaf, trim, wheel }), [skin, leaf, trim, wheel]);
  return <AppleCar speed={speed} driver={driver} config={config} />;
}

export default {
  title: "Vehicles/Food Cars/Apple",
  argTypes: {
    speed: { control: { type: "range", min: 0, max: 20, step: 0.5 }, name: "speed (the wheels)" },
    driver: { control: "select", options: DRIVERS },
    skin: { control: "color", name: "apple" },
    leaf: { control: "color", name: "leaf" },
    trim: { control: "color", name: "seats & trim" },
    wheel: { control: "color", name: "wheels" },
  },
  args: { speed: 6, driver: "none", skin: hex(APPLECAR.skin), leaf: hex(APPLECAR.leaf), trim: hex(APPLECAR.trim), wheel: hex(APPLECAR.wheel) },
  render: (a) => <Story {...a} />,
};

export const Default = {};
