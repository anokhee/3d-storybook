// Anglerfish car: the fish car (see FishCar.stories.jsx) as an anglerfish —
// the same cockpit and wheels under a round, dark purple body with a wide
// toothy grin, and a glowing lure hung on a stalk over its snout, its
// headlight (src/car/fishcar.js). See stories/helpers/fishcar.jsx.
import { useMemo } from "react";
import { FishCar } from "./helpers/fishcar.jsx";
import { DRIVERS } from "./helpers/driver.jsx";
import { ANGLERFISH } from "../src/car/fishcar.js";

const hex = (n) => "#" + n.toString(16).padStart(6, "0");

function Story({ speed, driver, body, belly, fin, trim, wheel, lureColor, lure, teeth }) {
  const config = useMemo(() => ({ ...ANGLERFISH, body, belly, fin, trim, wheel, lureColor, lure, teeth }), [body, belly, fin, trim, wheel, lureColor, lure, teeth]);
  return <FishCar speed={speed} driver={driver} config={config} />;
}

export default {
  title: "Vehicles/Fish Cars/Anglerfish",
  argTypes: {
    speed: { control: { type: "range", min: 0, max: 20, step: 0.5 }, name: "speed (the wheels)" },
    driver: { control: "select", options: DRIVERS },
    body: { control: "color" },
    belly: { control: "color" },
    fin: { control: "color", name: "fins" },
    trim: { control: "color", name: "seats & trim" },
    wheel: { control: "color", name: "wheels" },
    lureColor: { control: "color", name: "lure" },
    lure: { control: "boolean" },
    teeth: { control: "boolean" },
  },
  args: {
    speed: 6,
    driver: "none",
    body: hex(ANGLERFISH.body),
    belly: hex(ANGLERFISH.belly),
    fin: hex(ANGLERFISH.fin),
    trim: hex(ANGLERFISH.trim),
    wheel: hex(ANGLERFISH.wheel),
    lureColor: hex(ANGLERFISH.lureColor),
    lure: ANGLERFISH.lure,
    teeth: ANGLERFISH.teeth,
  },
  render: (a) => <Story {...a} />,
};

export const Default = {};
