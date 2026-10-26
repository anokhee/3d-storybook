// Spider car: the roadster (see Car.stories.jsx) remade as a spider — a
// big round abdomen with cream markings over a smaller head, four eyes
// on its face (two big headlights and a smaller pair behind them) and
// two red-tipped fangs, eight jointed legs out of the abdomen's flanks
// banded orange at the knees that sway as it drives, the cockpit cut
// into the abdomen's top
// (src/car/spidercar.js). See stories/helpers/spidercar.jsx.
import { useMemo } from "react";
import { SpiderCar } from "./helpers/spidercar.jsx";
import { BUG_CAR_FRAME } from "./helpers/bugcar.jsx";
import { DRIVERS } from "./helpers/driver.jsx";
import { SPIDERCAR } from "../src/car/spidercar.js";

const hex = (n) => "#" + n.toString(16).padStart(6, "0");

function Story({ speed, driver, sway, body, band, spot, fangTip, trim, wheel }) {
  const config = useMemo(() => ({ ...SPIDERCAR, sway, body, band, spot, fangTip, trim, wheel }), [sway, body, band, spot, fangTip, trim, wheel]);
  return <SpiderCar speed={speed} driver={driver} config={config} />;
}

export default {
  title: "Vehicles/Bug Cars/Spider",
  parameters: { stage: { frame: BUG_CAR_FRAME } },
  argTypes: {
    speed: { control: { type: "range", min: 0, max: 20, step: 0.5 }, name: "speed (the wheels)" },
    driver: { control: "select", options: DRIVERS },
    sway: { control: { type: "range", min: 0, max: 0.4, step: 0.02 }, name: "leg sway" },
    body: { control: "color" },
    band: { control: "color", name: "leg bands" },
    spot: { control: "color", name: "markings" },
    fangTip: { control: "color", name: "fang tips" },
    trim: { control: "color", name: "seats & trim" },
    wheel: { control: "color", name: "wheels" },
  },
  args: {
    speed: 6,
    driver: "none",
    sway: SPIDERCAR.sway,
    body: hex(SPIDERCAR.body),
    band: hex(SPIDERCAR.band),
    spot: hex(SPIDERCAR.spot),
    fangTip: hex(SPIDERCAR.fangTip),
    trim: hex(SPIDERCAR.trim),
    wheel: hex(SPIDERCAR.wheel),
  },
  render: (a) => <Story {...a} />,
};

export const Default = {};
