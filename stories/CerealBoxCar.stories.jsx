// Cereal box car: the roadster (see Car.stories.jsx) remade as a cereal
// box — a rounded cardboard box lying long-ways with the cockpit cut into
// its lid, the flaps folded at the opening, the cereal print along its
// sides, and the wheels under it (src/car/cerealcar.js). See
// stories/helpers/cerealcar.jsx.
import { useMemo } from "react";
import { CerealCar } from "./helpers/cerealcar.jsx";
import { DRIVERS } from "./helpers/driver.jsx";
import { CEREALCAR } from "../src/car/cerealcar.js";

const hex = (n) => "#" + n.toString(16).padStart(6, "0");

function Story({ speed, driver, box, band, ring, trim, wheel }) {
  const config = useMemo(() => ({ ...CEREALCAR, box, band, ring, trim, wheel }), [box, band, ring, trim, wheel]);
  return <CerealCar speed={speed} driver={driver} config={config} />;
}

export default {
  title: "Vehicles/Food Cars/Cereal Box",
  argTypes: {
    speed: { control: { type: "range", min: 0, max: 20, step: 0.5 }, name: "speed (the wheels)" },
    driver: { control: "select", options: DRIVERS },
    box: { control: "color", name: "box" },
    band: { control: "color", name: "band" },
    ring: { control: "color", name: "rings" },
    trim: { control: "color", name: "seats & trim" },
    wheel: { control: "color", name: "wheels" },
  },
  args: { speed: 6, driver: "none", box: hex(CEREALCAR.box), band: hex(CEREALCAR.band), ring: hex(CEREALCAR.ring), trim: hex(CEREALCAR.trim), wheel: hex(CEREALCAR.wheel) },
  render: (a) => <Story {...a} />,
};

export const Default = {};
