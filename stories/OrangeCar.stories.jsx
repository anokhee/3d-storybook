// Orange car: the roadster (see Car.stories.jsx) remade as an orange,
// built like the ball cars — one round orange with its peel pocked all
// over, the one-seat cockpit cut into its top, the stem's button and a
// leaf behind it, and the wheels tucked under its belly
// (src/car/orangecar.js). See stories/helpers/orangecar.jsx.
import { useMemo } from "react";
import { OrangeCar } from "./helpers/orangecar.jsx";
import { DRIVERS } from "./helpers/driver.jsx";
import { ORANGECAR } from "../src/car/orangecar.js";

const hex = (n) => "#" + n.toString(16).padStart(6, "0");

function Story({ speed, driver, body, leaf, trim, wheel }) {
  const config = useMemo(() => ({ ...ORANGECAR, body, leaf, trim, wheel }), [body, leaf, trim, wheel]);
  return <OrangeCar speed={speed} driver={driver} config={config} />;
}

export default {
  title: "Vehicles/Food Cars/Orange",
  argTypes: {
    speed: { control: { type: "range", min: 0, max: 20, step: 0.5 }, name: "speed (the wheels)" },
    driver: { control: "select", options: DRIVERS },
    body: { control: "color", name: "orange" },
    leaf: { control: "color", name: "leaf" },
    trim: { control: "color", name: "seat & trim" },
    wheel: { control: "color", name: "wheels" },
  },
  args: { speed: 6, driver: "none", body: hex(ORANGECAR.body), leaf: hex(ORANGECAR.leaf), trim: hex(ORANGECAR.trim), wheel: hex(ORANGECAR.wheel) },
  render: (a) => <Story {...a} />,
};

export const Default = {};
