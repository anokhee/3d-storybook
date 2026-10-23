// Hot dog car: the roadster (see Car.stories.jsx) remade as a hot dog —
// a sausage lying in a split bun, the cockpit cut down into its middle
// with the two bucket seats, the steering wheel and the windshield in
// it, squiggles of mustard and ketchup ahead and behind, headlights on
// the bun's ends and four wheels under it (src/car/hotdogcar.js). See
// stories/helpers/hotdogcar.jsx.
import { useMemo } from "react";
import { HotDogCar } from "./helpers/hotdogcar.jsx";
import { DRIVERS } from "./helpers/driver.jsx";
import { HOTDOGCAR } from "../src/car/hotdogcar.js";

const hex = (n) => "#" + n.toString(16).padStart(6, "0");

function Story({ speed, driver, bun, sausage, trim, wheel, mustard, ketchup }) {
  const config = useMemo(() => ({ ...HOTDOGCAR, bun, sausage, trim, wheel, mustard, ketchup }), [bun, sausage, trim, wheel, mustard, ketchup]);
  return <HotDogCar speed={speed} driver={driver} config={config} />;
}

export default {
  title: "Vehicles/Car/Hot Dog",
  argTypes: {
    speed: { control: { type: "range", min: 0, max: 20, step: 0.5 }, name: "speed (the wheels)" },
    driver: { control: "select", options: DRIVERS },
    bun: { control: "color" },
    sausage: { control: "color" },
    trim: { control: "color", name: "seats & trim" },
    wheel: { control: "color", name: "wheels" },
    mustard: { control: "boolean" },
    ketchup: { control: "boolean" },
  },
  args: { speed: 6, driver: "none", bun: hex(HOTDOGCAR.bun), sausage: hex(HOTDOGCAR.sausage), trim: hex(HOTDOGCAR.trim), wheel: hex(HOTDOGCAR.wheel), mustard: true, ketchup: true },
  render: (a) => <Story {...a} />,
};

export const Default = {};
