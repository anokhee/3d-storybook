// Strawberry car: the roadster (see Car.stories.jsx) remade as a
// strawberry — one big berry lying tip-first, dotted with seeds, its
// calyx of green sepals and its stem at the back, the cockpit cut into
// its top, and the wheels under its belly (src/car/strawberrycar.js).
// See stories/helpers/strawberrycar.jsx.
import { useMemo } from "react";
import { StrawberryCar } from "./helpers/strawberrycar.jsx";
import { DRIVERS } from "./helpers/driver.jsx";
import { STRAWBERRYCAR } from "../src/car/strawberrycar.js";

const hex = (n) => "#" + n.toString(16).padStart(6, "0");

function Story({ speed, driver, berry, seed, leaf, trim, wheel }) {
  const config = useMemo(() => ({ ...STRAWBERRYCAR, berry, seed, leaf, trim, wheel }), [berry, seed, leaf, trim, wheel]);
  return <StrawberryCar speed={speed} driver={driver} config={config} />;
}

export default {
  title: "Vehicles/Food Cars/Strawberry",
  argTypes: {
    speed: { control: { type: "range", min: 0, max: 20, step: 0.5 }, name: "speed (the wheels)" },
    driver: { control: "select", options: DRIVERS },
    berry: { control: "color", name: "berry" },
    seed: { control: "color", name: "seeds" },
    leaf: { control: "color", name: "leaves" },
    trim: { control: "color", name: "seats & trim" },
    wheel: { control: "color", name: "wheels" },
  },
  args: { speed: 6, driver: "none", berry: hex(STRAWBERRYCAR.berry), seed: hex(STRAWBERRYCAR.seed), leaf: hex(STRAWBERRYCAR.leaf), trim: hex(STRAWBERRYCAR.trim), wheel: hex(STRAWBERRYCAR.wheel) },
  render: (a) => <Story {...a} />,
};

export const Default = {};
