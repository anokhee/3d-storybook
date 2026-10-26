// Pufferfish car: the fish car (see FishCar.stories.jsx) as a
// pufferfish — the same body and cockpit, sandy and spotted, bristling
// with spikes, its mouth a pursed pout (src/car/fishcar.js). See
// stories/helpers/fishcar.jsx.
import { useMemo } from "react";
import { FishCar } from "./helpers/fishcar.jsx";
import { DRIVERS } from "./helpers/driver.jsx";
import { PUFFERFISH } from "../src/car/fishcar.js";

const hex = (n) => "#" + n.toString(16).padStart(6, "0");

function Story({ speed, driver, body, belly, fin, spike, spot, lips, trim, wheel, spikes, spots }) {
  const config = useMemo(() => ({ ...PUFFERFISH, body, belly, fin, spike, spot, lips, trim, wheel, spikes, spots }), [body, belly, fin, spike, spot, lips, trim, wheel, spikes, spots]);
  return <FishCar speed={speed} driver={driver} config={config} />;
}

export default {
  title: "Vehicles/Fish Cars/Pufferfish",
  argTypes: {
    speed: { control: { type: "range", min: 0, max: 20, step: 0.5 }, name: "speed (the wheels)" },
    driver: { control: "select", options: DRIVERS },
    body: { control: "color" },
    belly: { control: "color" },
    fin: { control: "color", name: "fins" },
    spike: { control: "color", name: "spikes" },
    spot: { control: "color", name: "spots" },
    lips: { control: "color" },
    trim: { control: "color", name: "seats & trim" },
    wheel: { control: "color", name: "wheels" },
    spikes: { control: "boolean" },
    spots: { control: "boolean" },
  },
  args: {
    speed: 6,
    driver: "none",
    body: hex(PUFFERFISH.body),
    belly: hex(PUFFERFISH.belly),
    fin: hex(PUFFERFISH.fin),
    spike: hex(PUFFERFISH.spike),
    spot: hex(PUFFERFISH.spot),
    lips: hex(PUFFERFISH.lips),
    trim: hex(PUFFERFISH.trim),
    wheel: hex(PUFFERFISH.wheel),
    spikes: PUFFERFISH.spikes,
    spots: PUFFERFISH.spots,
  },
  render: (a) => <Story {...a} />,
};

export const Default = {};
