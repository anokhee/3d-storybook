// Crocodile car: the roadster (see Car.stories.jsx) remade as a
// crocodile — a long low body studded with scutes, a flat head with
// yellow slit eyes on top and a long toothy snout with headlights for
// nostrils, stubby clawed legs by the wheels and a thick tail curling
// out behind, the cockpit cut into its back (src/car/croccar.js). See
// stories/helpers/croccar.jsx.
import { useMemo } from "react";
import { CrocCar } from "./helpers/croccar.jsx";
import { DRIVERS } from "./helpers/driver.jsx";
import { CROCCAR } from "../src/car/croccar.js";

const hex = (n) => "#" + n.toString(16).padStart(6, "0");

function Story({ speed, driver, skin, scute, belly, eye, mouth, trim, wheel }) {
  const config = useMemo(() => ({ ...CROCCAR, skin, scute, belly, eye, mouth, trim, wheel }), [skin, scute, belly, eye, mouth, trim, wheel]);
  return <CrocCar speed={speed} driver={driver} config={config} />;
}

export default {
  title: "Vehicles/Car/Crocodile",
  argTypes: {
    speed: { control: { type: "range", min: 0, max: 20, step: 0.5 }, name: "speed (the wheels)" },
    driver: { control: "select", options: DRIVERS },
    skin: { control: "color" },
    scute: { control: "color", name: "scutes" },
    belly: { control: "color" },
    eye: { control: "color" },
    mouth: { control: "color" },
    trim: { control: "color", name: "seats & trim" },
    wheel: { control: "color", name: "wheels" },
  },
  args: {
    speed: 6,
    driver: "none",
    skin: hex(CROCCAR.skin),
    scute: hex(CROCCAR.scute),
    belly: hex(CROCCAR.belly),
    eye: hex(CROCCAR.eye),
    mouth: hex(CROCCAR.mouth),
    trim: hex(CROCCAR.trim),
    wheel: hex(CROCCAR.wheel),
  },
  render: (a) => <Story {...a} />,
};

export const Default = {};
