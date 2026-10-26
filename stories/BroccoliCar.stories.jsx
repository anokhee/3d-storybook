// Broccoli car: the roadster (see Car.stories.jsx) remade as a broccoli
// floret — a big bumpy crown of green florets with the cockpit cut into
// its top, a pale stalk underneath at the front, and the wheels hanging
// from it (src/car/broccolicar.js). See stories/helpers/broccolicar.jsx.
import { useMemo } from "react";
import { BroccoliCar } from "./helpers/broccolicar.jsx";
import { DRIVERS } from "./helpers/driver.jsx";
import { BROCCOLICAR } from "../src/car/broccolicar.js";

const hex = (n) => "#" + n.toString(16).padStart(6, "0");

function Story({ speed, driver, floret, stalk, trim, wheel }) {
  const config = useMemo(() => ({ ...BROCCOLICAR, floret, stalk, trim, wheel }), [floret, stalk, trim, wheel]);
  return <BroccoliCar speed={speed} driver={driver} config={config} />;
}

export default {
  title: "Vehicles/Food Cars/Broccoli",
  argTypes: {
    speed: { control: { type: "range", min: 0, max: 20, step: 0.5 }, name: "speed (the wheels)" },
    driver: { control: "select", options: DRIVERS },
    floret: { control: "color", name: "florets" },
    stalk: { control: "color", name: "stalk" },
    trim: { control: "color", name: "seats & trim" },
    wheel: { control: "color", name: "wheels" },
  },
  args: { speed: 6, driver: "none", floret: hex(BROCCOLICAR.floret), stalk: hex(BROCCOLICAR.stalk), trim: hex(BROCCOLICAR.trim), wheel: hex(BROCCOLICAR.wheel) },
  render: (a) => <Story {...a} />,
};

export const Default = {};
