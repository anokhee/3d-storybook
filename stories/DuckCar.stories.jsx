// Duck car: the roadster (see Car.stories.jsx) remade as a rubber
// ducky — the fish car's plump body sweeping up into a broad tail, a
// big round head with a wide orange bill and domed eyes for headlights, a wing lying
// flat along each flank, the cockpit cut into its back
// between the head and the tail (src/car/duckcar.js). See
// stories/helpers/duckcar.jsx.
import { useMemo } from "react";
import { DuckCar } from "./helpers/duckcar.jsx";
import { DRIVERS } from "./helpers/driver.jsx";
import { DUCKCAR } from "../src/car/duckcar.js";

const hex = (n) => "#" + n.toString(16).padStart(6, "0");

function Story({ speed, driver, body, wing, bill, lamp, pupil, trim, wheel }) {
  const config = useMemo(
    () => ({ ...DUCKCAR, body, wing, bill, lamp, pupil, trim, wheel }),
    [body, wing, bill, lamp, pupil, trim, wheel],
  );
  return <DuckCar speed={speed} driver={driver} config={config} />;
}

export default {
  title: "Vehicles/Car/Rubber Duck",
  argTypes: {
    speed: { control: { type: "range", min: 0, max: 20, step: 0.5 }, name: "speed (the wheels)" },
    driver: { control: "select", options: DRIVERS },
    body: { control: "color", name: "duck" },
    wing: { control: "color", name: "wings" },
    bill: { control: "color" },
    lamp: { control: "color", name: "eyes (headlights)" },
    pupil: { control: "color", name: "pupils" },
    trim: { control: "color", name: "seats & trim" },
    wheel: { control: "color", name: "wheels" },
  },
  args: {
    speed: 6,
    driver: "none",
    body: hex(DUCKCAR.body),
    wing: hex(DUCKCAR.wing),
    bill: hex(DUCKCAR.bill),
    lamp: hex(DUCKCAR.lamp),
    pupil: hex(DUCKCAR.pupil),
    trim: hex(DUCKCAR.trim),
    wheel: hex(DUCKCAR.wheel),
  },
  render: (a) => <Story {...a} />,
};

export const Default = {};
