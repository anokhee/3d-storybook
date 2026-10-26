// Cat car: the roadster (see Car.stories.jsx) remade as a cat sitting
// in a loaf — a round head with pointed ears, green slit eyes, a pink
// nose, whiskers and a collar with a bell, two paws ahead with
// headlights in their fronts, tabby stripes over the back and a ringed
// tail curling along one flank, the cockpit cut into the loaf's back
// (src/car/catcar.js). See stories/helpers/catcar.jsx.
import { useMemo } from "react";
import { CatCar } from "./helpers/catcar.jsx";
import { DRIVERS } from "./helpers/driver.jsx";
import { CATCAR } from "../src/car/catcar.js";

const hex = (n) => "#" + n.toString(16).padStart(6, "0");

function Story({ speed, driver, fur, stripe, cream, eye, collar, trim, wheel }) {
  const config = useMemo(() => ({ ...CATCAR, fur, stripe, cream, eye, collar, trim, wheel }), [fur, stripe, cream, eye, collar, trim, wheel]);
  return <CatCar speed={speed} driver={driver} config={config} />;
}

export default {
  title: "Vehicles/Car/Cat",
  argTypes: {
    speed: { control: { type: "range", min: 0, max: 20, step: 0.5 }, name: "speed (the wheels)" },
    driver: { control: "select", options: DRIVERS },
    fur: { control: "color" },
    stripe: { control: "color", name: "stripes" },
    cream: { control: "color", name: "belly & muzzle" },
    eye: { control: "color", name: "eyes" },
    collar: { control: "color" },
    trim: { control: "color", name: "seats & trim" },
    wheel: { control: "color", name: "wheels" },
  },
  args: {
    speed: 6,
    driver: "none",
    fur: hex(CATCAR.fur),
    stripe: hex(CATCAR.stripe),
    cream: hex(CATCAR.cream),
    eye: hex(CATCAR.eye),
    collar: hex(CATCAR.collar),
    trim: hex(CATCAR.trim),
    wheel: hex(CATCAR.wheel),
  },
  render: (a) => <Story {...a} />,
};

export const Default = {};
