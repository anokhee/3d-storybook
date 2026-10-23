// Turtle car: the roadster (see Car.stories.jsx) remade as a turtle — a
// domed shell marked out in scutes, a lighter notched margin round its
// foot, a round head with big eyes and headlights in its cheeks, stubby
// legs by the wheels and a pointed tail, the cockpit cut into the
// shell's top (src/car/turtlecar.js). See stories/helpers/turtlecar.jsx.
import { useMemo } from "react";
import { TurtleCar } from "./helpers/turtlecar.jsx";
import { DRIVERS } from "./helpers/driver.jsx";
import { TURTLECAR } from "../src/car/turtlecar.js";

const hex = (n) => "#" + n.toString(16).padStart(6, "0");

function Story({ speed, driver, shell, plate, scute, margin, skin, belly, trim, wheel }) {
  const config = useMemo(
    () => ({ ...TURTLECAR, shell, plate, scute, margin, skin, belly, trim, wheel }),
    [shell, plate, scute, margin, skin, belly, trim, wheel],
  );
  return <TurtleCar speed={speed} driver={driver} config={config} />;
}

export default {
  title: "Vehicles/Car/Turtle",
  argTypes: {
    speed: { control: { type: "range", min: 0, max: 20, step: 0.5 }, name: "speed (the wheels)" },
    driver: { control: "select", options: DRIVERS },
    shell: { control: "color" },
    plate: { control: "color", name: "growth rings" },
    scute: { control: "color", name: "scute lines" },
    margin: { control: "color", name: "margin band" },
    skin: { control: "color" },
    belly: { control: "color" },
    trim: { control: "color", name: "seats & trim" },
    wheel: { control: "color", name: "wheels" },
  },
  args: {
    speed: 6,
    driver: "none",
    shell: hex(TURTLECAR.shell),
    plate: hex(TURTLECAR.plate),
    scute: hex(TURTLECAR.scute),
    margin: hex(TURTLECAR.margin),
    skin: hex(TURTLECAR.skin),
    belly: hex(TURTLECAR.belly),
    trim: hex(TURTLECAR.trim),
    wheel: hex(TURTLECAR.wheel),
  },
  render: (a) => <Story {...a} />,
};

export const Default = {};
