// Snail car: the roadster (see Car.stories.jsx) remade as a snail — a
// big coiled shell with a raised spiral winding in on each flank, the
// cockpit cut down into its crown, over a soft foot that rises at the
// front into a smiling head with two short eyestalks, the eyeballs lit
// as the headlights, the wheels standing out either side of the foot
// (src/car/snailcar.js). See stories/helpers/snailcar.jsx.
import { useMemo } from "react";
import { SnailCar } from "./helpers/snailcar.jsx";
import { DRIVERS } from "./helpers/driver.jsx";
import { SNAILCAR } from "../src/car/snailcar.js";

const hex = (n) => "#" + n.toString(16).padStart(6, "0");

function Story({ speed, driver, shell, stripe, body, cheek, slime, trim, wheel, hasSlime }) {
  const config = useMemo(
    () => ({ ...SNAILCAR, shell, stripe, body, cheek, slime, trim, wheel, hasSlime }),
    [shell, stripe, body, cheek, slime, trim, wheel, hasSlime],
  );
  return <SnailCar speed={speed} driver={driver} config={config} />;
}

export default {
  title: "Vehicles/Car/Snail",
  argTypes: {
    speed: { control: { type: "range", min: 0, max: 20, step: 0.5 }, name: "speed (the wheels)" },
    driver: { control: "select", options: DRIVERS },
    shell: { control: "color" },
    stripe: { control: "color", name: "spiral" },
    body: { control: "color", name: "body & head" },
    cheek: { control: "color", name: "cheeks" },
    slime: { control: "color" },
    trim: { control: "color", name: "seats & trim" },
    wheel: { control: "color", name: "wheels" },
    hasSlime: { control: "boolean", name: "slime trail" },
  },
  args: {
    speed: 6,
    driver: "none",
    shell: hex(SNAILCAR.shell),
    stripe: hex(SNAILCAR.stripe),
    body: hex(SNAILCAR.body),
    cheek: hex(SNAILCAR.cheek),
    slime: hex(SNAILCAR.slime),
    trim: hex(SNAILCAR.trim),
    wheel: hex(SNAILCAR.wheel),
    hasSlime: SNAILCAR.hasSlime,
  },
  render: (a) => <Story {...a} />,
};

export const Default = {};
