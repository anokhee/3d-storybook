// Pool Ball car: the roadster remade as a pool ball (src/car/ballcar.js), the black eight ball, its white spot and 8 on each flank, in the
// stage's toon, its one-seat cockpit cut into the top with room for a driver, its
// wheels turning as if driving at `speed`. See stories/helpers/ballcar.jsx.
import { useMemo } from "react";
import { BallCar } from "./helpers/ballcar.jsx";
import { DRIVERS } from "./helpers/driver.jsx";
import { POOLBALL } from "../src/car/ballcar.js";

const hex = (n) => "#" + n.toString(16).padStart(6, "0");

function Story({ speed, driver, body, seam, trim, wheel }) {
  const config = useMemo(() => ({ ...POOLBALL, body, seam, trim, wheel }), [body, seam, trim, wheel]);
  return <BallCar speed={speed} driver={driver} config={config} />;
}

export default {
  title: "Vehicles/Ball Cars/Pool Ball",
  argTypes: {
    speed: { control: { type: "range", min: 0, max: 20, step: 0.5 }, name: "speed (the wheels)" },
    driver: { control: "select", options: DRIVERS },
    body: { control: "color", name: "ball" },
    seam: { control: "color", name: "spot" },
    trim: { control: "color", name: "seat & trim" },
    wheel: { control: "color", name: "wheels" },
  },
  args: {
    speed: 6,
    driver: "none",
    body: hex(POOLBALL.body),
    seam: hex(POOLBALL.seam),
    trim: hex(POOLBALL.trim),
    wheel: hex(POOLBALL.wheel),
  },
  render: (a) => <Story {...a} />,
};

export const Default = {};
