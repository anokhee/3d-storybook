// Cricket Ball car: the roadster remade as a cricket ball (src/car/ballcar.js), red leather, a raised seam stitched round its belt, in the
// stage's toon, its one-seat cockpit cut into the top with room for a driver, its
// wheels turning as if driving at `speed`. See stories/helpers/ballcar.jsx.
import { useMemo } from "react";
import { BallCar } from "./helpers/ballcar.jsx";
import { DRIVERS } from "./helpers/driver.jsx";
import { CRICKETBALL } from "../src/car/ballcar.js";

const hex = (n) => "#" + n.toString(16).padStart(6, "0");

function Story({ speed, driver, body, seam, trim, wheel }) {
  const config = useMemo(() => ({ ...CRICKETBALL, body, seam, trim, wheel }), [body, seam, trim, wheel]);
  return <BallCar speed={speed} driver={driver} config={config} />;
}

export default {
  title: "Vehicles/Ball Cars/Cricket Ball",
  argTypes: {
    speed: { control: { type: "range", min: 0, max: 20, step: 0.5 }, name: "speed (the wheels)" },
    driver: { control: "select", options: DRIVERS },
    body: { control: "color", name: "ball" },
    seam: { control: "color", name: "stitches" },
    trim: { control: "color", name: "seat & trim" },
    wheel: { control: "color", name: "wheels" },
  },
  args: {
    speed: 6,
    driver: "none",
    body: hex(CRICKETBALL.body),
    seam: hex(CRICKETBALL.seam),
    trim: hex(CRICKETBALL.trim),
    wheel: hex(CRICKETBALL.wheel),
  },
  render: (a) => <Story {...a} />,
};

export const Default = {};
