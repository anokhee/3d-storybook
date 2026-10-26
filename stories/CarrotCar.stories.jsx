// Carrot car: the roadster (see Car.stories.jsx) remade as a carrot — one
// big carrot lying along the car, fat at the back and tapering to a point
// at the front, ringed with ridges, a tuft of green fronds at the back,
// the cockpit cut into its top, and the wheels under its belly
// (src/car/carrotcar.js). See stories/helpers/carrotcar.jsx.
import { useMemo } from "react";
import { CarrotCar } from "./helpers/carrotcar.jsx";
import { DRIVERS } from "./helpers/driver.jsx";
import { CARROTCAR } from "../src/car/carrotcar.js";

const hex = (n) => "#" + n.toString(16).padStart(6, "0");

function Story({ speed, driver, carrot, leaf, trim, wheel }) {
  const config = useMemo(() => ({ ...CARROTCAR, carrot, leaf, trim, wheel }), [carrot, leaf, trim, wheel]);
  return <CarrotCar speed={speed} driver={driver} config={config} />;
}

export default {
  title: "Vehicles/Food Cars/Carrot",
  argTypes: {
    speed: { control: { type: "range", min: 0, max: 20, step: 0.5 }, name: "speed (the wheels)" },
    driver: { control: "select", options: DRIVERS },
    carrot: { control: "color", name: "carrot" },
    leaf: { control: "color", name: "leaves" },
    trim: { control: "color", name: "seats & trim" },
    wheel: { control: "color", name: "wheels" },
  },
  args: { speed: 6, driver: "none", carrot: hex(CARROTCAR.carrot), leaf: hex(CARROTCAR.leaf), trim: hex(CARROTCAR.trim), wheel: hex(CARROTCAR.wheel) },
  render: (a) => <Story {...a} />,
};

export const Default = {};
