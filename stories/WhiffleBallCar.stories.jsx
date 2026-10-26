// Whiffle Ball car: the roadster remade as a whiffle ball (src/car/ballcar.js), white plastic with eight oblong holes cut round the nose, in the
// stage's toon, its one-seat cockpit cut into the top with room for a driver, its
// wheels turning as if driving at `speed`. See stories/helpers/ballcar.jsx.
import { useMemo } from "react";
import { BallCar } from "./helpers/ballcar.jsx";
import { DRIVERS } from "./helpers/driver.jsx";
import { WHIFFLEBALL } from "../src/car/ballcar.js";

const hex = (n) => "#" + n.toString(16).padStart(6, "0");

function Story({ speed, driver, body, inner, trim, wheel }) {
  const config = useMemo(() => ({ ...WHIFFLEBALL, body, inner, trim, wheel }), [body, inner, trim, wheel]);
  return <BallCar speed={speed} driver={driver} config={config} />;
}

export default {
  title: "Vehicles/Ball Cars/Whiffle Ball",
  argTypes: {
    speed: { control: { type: "range", min: 0, max: 20, step: 0.5 }, name: "speed (the wheels)" },
    driver: { control: "select", options: DRIVERS },
    body: { control: "color", name: "ball" },
    inner: { control: "color", name: "holes (inside)" },
    trim: { control: "color", name: "seat & trim" },
    wheel: { control: "color", name: "wheels" },
  },
  args: {
    speed: 6,
    driver: "none",
    body: hex(WHIFFLEBALL.body),
    inner: hex(WHIFFLEBALL.inner),
    trim: hex(WHIFFLEBALL.trim),
    wheel: hex(WHIFFLEBALL.wheel),
  },
  render: (a) => <Story {...a} />,
};

export const Default = {};
