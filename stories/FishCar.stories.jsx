// Fish car: the roadster (see Car.stories.jsx) remade as a fish — one
// plump fish body on wheels, head first, its eyes the headlights, a
// forked tail, a dorsal fin and pectorals, a lighter belly and stripes,
// and the cockpit cut into its back behind the head, with the seats,
// steering wheel and windshield in it (src/car/fishcar.js). See
// stories/helpers/fishcar.jsx.
import { useMemo } from "react";
import { FishCar } from "./helpers/fishcar.jsx";
import { DRIVERS } from "./helpers/driver.jsx";
import { FISHCAR } from "../src/car/fishcar.js";

const hex = (n) => "#" + n.toString(16).padStart(6, "0");

function Story({ speed, driver, body, belly, fin, trim, wheel, stripes }) {
  const config = useMemo(() => ({ ...FISHCAR, body, belly, fin, trim, wheel, stripes }), [body, belly, fin, trim, wheel, stripes]);
  return <FishCar speed={speed} driver={driver} config={config} />;
}

export default {
  title: "Vehicles/Fish Cars/Fish",
  argTypes: {
    speed: { control: { type: "range", min: 0, max: 20, step: 0.5 }, name: "speed (the wheels)" },
    driver: { control: "select", options: DRIVERS },
    body: { control: "color" },
    belly: { control: "color" },
    fin: { control: "color", name: "fins" },
    trim: { control: "color", name: "seats & trim" },
    wheel: { control: "color", name: "wheels" },
    stripes: { control: "boolean" },
  },
  args: { speed: 6, driver: "none", body: hex(FISHCAR.body), belly: hex(FISHCAR.belly), fin: hex(FISHCAR.fin), trim: hex(FISHCAR.trim), wheel: hex(FISHCAR.wheel), stripes: FISHCAR.stripes },
  render: (a) => <Story {...a} />,
};

export const Default = {};
