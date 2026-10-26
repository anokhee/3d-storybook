// Banana car: the roadster (see Car.stories.jsx) remade as a banana — one
// banana lying on its back, curving up at both ends, with the cockpit cut
// into its top, a stem at the front, a dark tip at the back, and the
// wheels under its belly (src/car/bananacar.js). See
// stories/helpers/bananacar.jsx.
import { useMemo } from "react";
import { BananaCar } from "./helpers/bananacar.jsx";
import { DRIVERS } from "./helpers/driver.jsx";
import { BANANACAR } from "../src/car/bananacar.js";

const hex = (n) => "#" + n.toString(16).padStart(6, "0");

function Story({ speed, driver, speckles, bend, peel, trim, wheel }) {
  const config = useMemo(() => ({ ...BANANACAR, speckles, bend, peel, trim, wheel }), [speckles, bend, peel, trim, wheel]);
  return <BananaCar speed={speed} driver={driver} config={config} />;
}

export default {
  title: "Vehicles/Food Cars/Banana",
  argTypes: {
    speed: { control: { type: "range", min: 0, max: 20, step: 0.5 }, name: "speed (the wheels)" },
    driver: { control: "select", options: DRIVERS },
    speckles: { control: { type: "range", min: 0, max: 24, step: 1 }, name: "ripeness (speckles)" },
    bend: { control: { type: "range", min: 0.1, max: 0.45, step: 0.01 }, name: "bend (the ends' curve)" },
    peel: { control: "color", name: "peel" },
    trim: { control: "color", name: "seats & trim" },
    wheel: { control: "color", name: "wheels" },
  },
  args: { speed: 6, driver: "none", speckles: BANANACAR.speckles, bend: BANANACAR.bend, peel: hex(BANANACAR.peel), trim: hex(BANANACAR.trim), wheel: hex(BANANACAR.wheel) },
  render: (a) => <Story {...a} />,
};

export const Default = {};
