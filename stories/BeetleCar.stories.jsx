// Beetle car: the roadster (see Car.stories.jsx) remade as a horned
// beetle — a dark head dome with headlight eyes and a great forked horn
// sweeping up out of it, the cockpit, and a dark shell dome over the
// rear with a seam, the wheels tucked under it (src/car/bugcar.js). See
// stories/helpers/bugcar.jsx.
import { useMemo } from "react";
import { BugCar } from "./helpers/bugcar.jsx";
import { DRIVERS } from "./helpers/driver.jsx";
import { BEETLE } from "../src/car/bugcar.js";

const hex = (n) => "#" + n.toString(16).padStart(6, "0");

function Story({ speed, driver, horn, shell, head, trim, wheel }) {
  const config = useMemo(() => ({ ...BEETLE, horn, shell, head, trim, wheel }), [horn, shell, head, trim, wheel]);
  return <BugCar speed={speed} driver={driver} config={config} />;
}

export default {
  title: "Vehicles/Car/Beetle",
  argTypes: {
    speed: { control: { type: "range", min: 0, max: 20, step: 0.5 }, name: "speed (the wheels)" },
    driver: { control: "select", options: DRIVERS },
    horn: { control: { type: "range", min: 0, max: 1.6, step: 0.1 }, name: "horn length" },
    shell: { control: "color" },
    head: { control: "color", name: "head & horn" },
    trim: { control: "color", name: "seats & trim" },
    wheel: { control: "color", name: "wheels" },
  },
  args: { speed: 6, driver: "none", horn: BEETLE.horn, shell: hex(BEETLE.shell), head: hex(BEETLE.head), trim: hex(BEETLE.trim), wheel: hex(BEETLE.wheel) },
  render: (a) => <Story {...a} />,
};

export const Default = {};
