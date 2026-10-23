// Duck car: the roadster (see Car.stories.jsx) remade as a rubber
// ducky — a plump yellow hull with a round chest and a tail flicking
// up behind, a big round head with a wide orange bill, big eyes and
// rosy cheeks, a wing along each flank, the cockpit cut into its back
// between the head and the tail (src/car/duckcar.js). See
// stories/helpers/duckcar.jsx.
import { useMemo } from "react";
import { DuckCar } from "./helpers/duckcar.jsx";
import { DRIVERS } from "./helpers/driver.jsx";
import { DUCKCAR } from "../src/car/duckcar.js";

const hex = (n) => "#" + n.toString(16).padStart(6, "0");

function Story({ speed, driver, body, wing, bill, eye, pupil, cheek, cheeks, trim, wheel }) {
  const config = useMemo(
    () => ({ ...DUCKCAR, body, wing, bill, eye, pupil, cheek, cheeks, trim, wheel }),
    [body, wing, bill, eye, pupil, cheek, cheeks, trim, wheel],
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
    eye: { control: "color", name: "eyes" },
    pupil: { control: "color", name: "pupils" },
    cheek: { control: "color", name: "cheeks" },
    cheeks: { control: "boolean", name: "rosy cheeks" },
    trim: { control: "color", name: "seats & trim" },
    wheel: { control: "color", name: "wheels" },
  },
  args: {
    speed: 6,
    driver: "none",
    body: hex(DUCKCAR.body),
    wing: hex(DUCKCAR.wing),
    bill: hex(DUCKCAR.bill),
    eye: hex(DUCKCAR.eye),
    pupil: hex(DUCKCAR.pupil),
    cheek: hex(DUCKCAR.cheek),
    cheeks: DUCKCAR.cheeks,
    trim: hex(DUCKCAR.trim),
    wheel: hex(DUCKCAR.wheel),
  },
  render: (a) => <Story {...a} />,
};

export const Default = {};
