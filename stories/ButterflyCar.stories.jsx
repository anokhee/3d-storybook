// Butterfly car: the roadster (see Car.stories.jsx) remade as a
// butterfly — a dark head dome with headlight eyes and long clubbed
// antennae, the cockpit, a dark shell dome over the rear banded across
// and tapering to a tail, and two great patterned wings each side that
// flap as it drives, the wheels tucked under it (src/car/bugcar.js). See
// stories/helpers/bugcar.jsx.
import { useMemo } from "react";
import { BugCar } from "./helpers/bugcar.jsx";
import { DRIVERS } from "./helpers/driver.jsx";
import { BUTTERFLY } from "../src/car/bugcar.js";

const hex = (n) => "#" + n.toString(16).padStart(6, "0");

function Story({ speed, driver, wing, wingEdge, wingDot, shell, band, trim, wheel }) {
  const config = useMemo(() => ({ ...BUTTERFLY, wing, wingEdge, wingDot, shell, head: shell, band, trim, wheel }), [wing, wingEdge, wingDot, shell, band, trim, wheel]);
  return <BugCar speed={speed} driver={driver} config={config} />;
}

export default {
  title: "Vehicles/Car/Butterfly",
  argTypes: {
    speed: { control: { type: "range", min: 0, max: 20, step: 0.5 }, name: "speed (wheels & wings)" },
    driver: { control: "select", options: DRIVERS },
    wing: { control: "color", name: "wings" },
    wingEdge: { control: "color", name: "wing borders & eyespots" },
    wingDot: { control: "color", name: "wing dots" },
    shell: { control: "color", name: "body & head" },
    band: { control: "color", name: "body bands" },
    trim: { control: "color", name: "seats & trim" },
    wheel: { control: "color", name: "wheels" },
  },
  args: {
    speed: 6,
    driver: "none",
    wing: hex(BUTTERFLY.wing),
    wingEdge: hex(BUTTERFLY.wingEdge),
    wingDot: hex(BUTTERFLY.wingDot),
    shell: hex(BUTTERFLY.shell),
    band: hex(BUTTERFLY.band),
    trim: hex(BUTTERFLY.trim),
    wheel: hex(BUTTERFLY.wheel),
  },
  render: (a) => <Story {...a} />,
};

export const Default = {};
