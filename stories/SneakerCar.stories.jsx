// Sneaker car: the roadster (see Car.stories.jsx) remade as a chunky
// trainer — a thick white sole with tread lugs and a toe bumper, a bright
// upper with a toe cap, heel counter and a wavy side stripe, the tongue
// and criss-cross laces over the instep, and the cockpit cut down into
// the ankle opening inside a padded collar with a pull tab at the heel,
// the wheels standing out either side (src/car/sneakercar.js). See
// stories/helpers/sneakercar.jsx.
import { useMemo } from "react";
import { SneakerCar } from "./helpers/sneakercar.jsx";
import { DRIVERS } from "./helpers/driver.jsx";
import { SNEAKERCAR } from "../src/car/sneakercar.js";

const hex = (n) => "#" + n.toString(16).padStart(6, "0");

function Story({ speed, driver, upper, tongue, overlay, collar, stripe, laces, sole, outsole, trim, wheel }) {
  const config = useMemo(
    () => ({ ...SNEAKERCAR, upper, tongue, overlay, collar, stripe, laces, sole, outsole, trim, wheel }),
    [upper, tongue, overlay, collar, stripe, laces, sole, outsole, trim, wheel],
  );
  return <SneakerCar speed={speed} driver={driver} config={config} />;
}

export default {
  title: "Vehicles/Car/Sneaker",
  argTypes: {
    speed: { control: { type: "range", min: 0, max: 20, step: 0.5 }, name: "speed (the wheels)" },
    driver: { control: "select", options: DRIVERS },
    upper: { control: "color" },
    tongue: { control: "color" },
    overlay: { control: "color", name: "toe cap & heel" },
    collar: { control: "color", name: "collar & pull tab" },
    stripe: { control: "color" },
    laces: { control: "color" },
    sole: { control: "color", name: "midsole" },
    outsole: { control: "color" },
    trim: { control: "color", name: "seats & trim" },
    wheel: { control: "color", name: "wheels" },
  },
  args: {
    speed: 6,
    driver: "none",
    upper: hex(SNEAKERCAR.upper),
    tongue: hex(SNEAKERCAR.tongue),
    overlay: hex(SNEAKERCAR.overlay),
    collar: hex(SNEAKERCAR.collar),
    stripe: hex(SNEAKERCAR.stripe),
    laces: hex(SNEAKERCAR.laces),
    sole: hex(SNEAKERCAR.sole),
    outsole: hex(SNEAKERCAR.outsole),
    trim: hex(SNEAKERCAR.trim),
    wheel: hex(SNEAKERCAR.wheel),
  },
  render: (a) => <Story {...a} />,
};

export const Default = {};
