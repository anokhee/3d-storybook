// Swordfish car: the fish car (see FishCar.stories.jsx) as a swordfish — the
// same cockpit and wheels under a sleek dark-blue body with a pale belly, a
// tall sail of a dorsal fin, a crescent tail and a long sword out of its
// snout (src/car/fishcar.js). See stories/helpers/fishcar.jsx.
import { useMemo } from "react";
import { FishCar } from "./helpers/fishcar.jsx";
import { DRIVERS } from "./helpers/driver.jsx";
import { SWORDFISH } from "../src/car/fishcar.js";

const hex = (n) => "#" + n.toString(16).padStart(6, "0");

function Story({ speed, driver, body, belly, fin, trim, wheel, dorsal, bill, billColor }) {
  const config = useMemo(() => ({ ...SWORDFISH, body, belly, fin, trim, wheel, dorsal, bill, billColor }), [body, belly, fin, trim, wheel, dorsal, bill, billColor]);
  return <FishCar speed={speed} driver={driver} config={config} />;
}

export default {
  title: "Vehicles/Fish Cars/Swordfish",
  argTypes: {
    speed: { control: { type: "range", min: 0, max: 20, step: 0.5 }, name: "speed (the wheels)" },
    driver: { control: "select", options: DRIVERS },
    body: { control: "color" },
    belly: { control: "color" },
    fin: { control: "color", name: "fins" },
    trim: { control: "color", name: "seats & trim" },
    wheel: { control: "color", name: "wheels" },
    dorsal: { control: { type: "range", min: 0.2, max: 1.2, step: 0.05 }, name: "dorsal fin height" },
    bill: { control: { type: "range", min: 0, max: 2.5, step: 0.05 }, name: "sword length" },
    billColor: { control: "color", name: "sword" },
  },
  args: {
    speed: 6,
    driver: "none",
    body: hex(SWORDFISH.body),
    belly: hex(SWORDFISH.belly),
    fin: hex(SWORDFISH.fin),
    trim: hex(SWORDFISH.trim),
    wheel: hex(SWORDFISH.wheel),
    dorsal: SWORDFISH.dorsal,
    bill: SWORDFISH.bill,
    billColor: hex(SWORDFISH.billColor),
  },
  render: (a) => <Story {...a} />,
};

export const Default = {};
