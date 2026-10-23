// Ladybug car: the roadster (see Car.stories.jsx) remade as a ladybug —
// a black head dome with headlight eyes and antennae, the cockpit, and a
// red shell dome over the rear with a seam and black spots, the wheels
// tucked under it (src/car/bugcar.js). See stories/helpers/bugcar.jsx.
import { useMemo } from "react";
import { BugCar } from "./helpers/bugcar.jsx";
import { DRIVERS } from "./helpers/driver.jsx";
import { LADYBUG } from "../src/car/bugcar.js";

const hex = (n) => "#" + n.toString(16).padStart(6, "0");

function Story({ speed, driver, shell, spot, head, spots, trim, wheel }) {
  const config = useMemo(() => ({ ...LADYBUG, shell, spot, head, spots, trim, wheel }), [shell, spot, head, spots, trim, wheel]);
  return <BugCar speed={speed} driver={driver} config={config} />;
}

export default {
  title: "Vehicles/Car/Ladybug",
  argTypes: {
    speed: { control: { type: "range", min: 0, max: 20, step: 0.5 }, name: "speed (the wheels)" },
    driver: { control: "select", options: DRIVERS },
    spots: { control: { type: "range", min: 0, max: 8, step: 2 } },
    shell: { control: "color" },
    spot: { control: "color", name: "spots & seam" },
    head: { control: "color" },
    trim: { control: "color", name: "seats & trim" },
    wheel: { control: "color", name: "wheels" },
  },
  args: { speed: 6, driver: "none", spots: LADYBUG.spots, shell: hex(LADYBUG.shell), spot: hex(LADYBUG.spot), head: hex(LADYBUG.head), trim: hex(LADYBUG.trim), wheel: hex(LADYBUG.wheel) },
  render: (a) => <Story {...a} />,
};

export const Default = {};
