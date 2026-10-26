// Burger car: the roadster (see Car.stories.jsx) remade as a hamburger —
// an oval stack of bottom bun, lumpy patty, drooping cheese, a lettuce
// ruffle and tomato slices under a sesame top bun, the cockpit cut down
// through the top bun, the wheels standing out either side
// (src/car/burgercar.js). See stories/helpers/burgercar.jsx.
import { useMemo } from "react";
import { BurgerCar } from "./helpers/burgercar.jsx";
import { DRIVERS } from "./helpers/driver.jsx";
import { BURGERCAR } from "../src/car/burgercar.js";

const hex = (n) => "#" + n.toString(16).padStart(6, "0");

function Story({ speed, driver, bun, patty, cheese, lettuce, tomato, trim, wheel, hasCheese, hasLettuce, hasTomato, seeds }) {
  const config = useMemo(
    () => ({ ...BURGERCAR, bun, patty, cheese, lettuce, tomato, trim, wheel, hasCheese, hasLettuce, hasTomato, seeds }),
    [bun, patty, cheese, lettuce, tomato, trim, wheel, hasCheese, hasLettuce, hasTomato, seeds],
  );
  return <BurgerCar speed={speed} driver={driver} config={config} />;
}

export default {
  title: "Vehicles/Food Cars/Burger",
  argTypes: {
    speed: { control: { type: "range", min: 0, max: 20, step: 0.5 }, name: "speed (the wheels)" },
    driver: { control: "select", options: DRIVERS },
    bun: { control: "color", name: "buns" },
    patty: { control: "color" },
    cheese: { control: "color" },
    lettuce: { control: "color" },
    tomato: { control: "color" },
    trim: { control: "color", name: "seats & trim" },
    wheel: { control: "color", name: "wheels" },
    hasCheese: { control: "boolean", name: "with cheese" },
    hasLettuce: { control: "boolean", name: "with lettuce" },
    hasTomato: { control: "boolean", name: "with tomato" },
    seeds: { control: "boolean", name: "sesame seeds" },
  },
  args: {
    speed: 6,
    driver: "none",
    bun: hex(BURGERCAR.bun),
    patty: hex(BURGERCAR.patty),
    cheese: hex(BURGERCAR.cheese),
    lettuce: hex(BURGERCAR.lettuce),
    tomato: hex(BURGERCAR.tomato),
    trim: hex(BURGERCAR.trim),
    wheel: hex(BURGERCAR.wheel),
    hasCheese: BURGERCAR.hasCheese,
    hasLettuce: BURGERCAR.hasLettuce,
    hasTomato: BURGERCAR.hasTomato,
    seeds: BURGERCAR.seeds,
  },
  render: (a) => <Story {...a} />,
};

export const Default = {};
