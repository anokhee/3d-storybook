// Shark car: the fish car (see FishCar.stories.jsx) as a shark — the same
// cockpit and wheels under a slate-gray body with a white belly, a pointed
// snout, a tall dorsal fin, a crescent tail, gill slits and a toothy grin
// (src/car/fishcar.js). See stories/helpers/fishcar.jsx.
import { useMemo } from "react";
import { FishCar } from "./helpers/fishcar.jsx";
import { DRIVERS } from "./helpers/driver.jsx";
import { SHARK } from "../src/car/fishcar.js";

const hex = (n) => "#" + n.toString(16).padStart(6, "0");

function Story({ speed, driver, body, belly, fin, trim, wheel, dorsal, gills, teeth }) {
  const config = useMemo(() => ({ ...SHARK, body, belly, fin, trim, wheel, dorsal, gills, teeth }), [body, belly, fin, trim, wheel, dorsal, gills, teeth]);
  return <FishCar speed={speed} driver={driver} config={config} />;
}

export default {
  title: "Vehicles/Fish Cars/Shark",
  argTypes: {
    speed: { control: { type: "range", min: 0, max: 20, step: 0.5 }, name: "speed (the wheels)" },
    driver: { control: "select", options: DRIVERS },
    body: { control: "color" },
    belly: { control: "color" },
    fin: { control: "color", name: "fins" },
    trim: { control: "color", name: "seats & trim" },
    wheel: { control: "color", name: "wheels" },
    dorsal: { control: { type: "range", min: 0.2, max: 1.2, step: 0.05 }, name: "dorsal fin height" },
    gills: { control: { type: "range", min: 0, max: 5, step: 1 }, name: "gill slits" },
    teeth: { control: "boolean" },
  },
  args: {
    speed: 6,
    driver: "none",
    body: hex(SHARK.body),
    belly: hex(SHARK.belly),
    fin: hex(SHARK.fin),
    trim: hex(SHARK.trim),
    wheel: hex(SHARK.wheel),
    dorsal: SHARK.dorsal,
    gills: SHARK.gills,
    teeth: SHARK.teeth,
  },
  render: (a) => <Story {...a} />,
};

export const Default = {};
