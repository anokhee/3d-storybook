// Caterpillar car: the roadster (see Car.stories.jsx) remade as a
// caterpillar — a row of round green segments with a yellow spot on each
// flank and stubby red feet beneath, a head dome like the ladybug's
// with headlights for eyes and knobbed antennae, a
// little horn on the last segment, the cockpit cut down through the
// middle segments (src/car/caterpillarcar.js). See
// stories/helpers/caterpillarcar.jsx.
import { useMemo } from "react";
import { CaterpillarCar } from "./helpers/caterpillarcar.jsx";
import { BUG_CAR_FRAME } from "./helpers/bugcar.jsx";
import { DRIVERS } from "./helpers/driver.jsx";
import { CATERPILLARCAR } from "../src/car/caterpillarcar.js";

const hex = (n) => "#" + n.toString(16).padStart(6, "0");

function Story({ speed, driver, body, head, spot, foot, trim, wheel }) {
  const config = useMemo(() => ({ ...CATERPILLARCAR, body, head, spot, foot, trim, wheel }), [body, head, spot, foot, trim, wheel]);
  return <CaterpillarCar speed={speed} driver={driver} config={config} />;
}

export default {
  title: "Vehicles/Bug Cars/Caterpillar",
  parameters: { stage: { frame: BUG_CAR_FRAME } },
  argTypes: {
    speed: { control: { type: "range", min: 0, max: 20, step: 0.5 }, name: "speed (the wheels)" },
    driver: { control: "select", options: DRIVERS },
    body: { control: "color" },
    head: { control: "color" },
    spot: { control: "color", name: "spots & antenna tips" },
    foot: { control: "color", name: "feet & horn" },
    trim: { control: "color", name: "seats & trim" },
    wheel: { control: "color", name: "wheels" },
  },
  args: {
    speed: 6,
    driver: "none",
    body: hex(CATERPILLARCAR.body),
    head: hex(CATERPILLARCAR.head),
    spot: hex(CATERPILLARCAR.spot),
    foot: hex(CATERPILLARCAR.foot),
    trim: hex(CATERPILLARCAR.trim),
    wheel: hex(CATERPILLARCAR.wheel),
  },
  render: (a) => <Story {...a} />,
};

export const Default = {};
