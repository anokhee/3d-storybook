// Car: the convertible from the Car project, remade as a roadster: a body
// with a domed bonnet and a rounded boot, two bucket seats, a dashboard
// and steering wheel, a framed windshield, bumpers, lights and four wheels
// with hubcaps, turning as if driving (src/car/car.js). See
// stories/helpers/car.jsx.
import { Car } from "./helpers/car.jsx";
import { CAR } from "../src/car/car.js";
import { DRIVERS } from "./helpers/driver.jsx";

const hex = (n) => "#" + n.toString(16).padStart(6, "0");

export default {
  title: "Vehicles/Car/Car",
  argTypes: {
    speed: { control: { type: "range", min: 0, max: 20, step: 0.5 }, name: "speed (the wheels)" },
    driver: { control: "select", options: DRIVERS },
    body: { control: "color" },
    trim: { control: "color", name: "seats & trim" },
    wheel: { control: "color", name: "wheels" },
  },
  args: { speed: 6, driver: "none", body: hex(CAR.body), trim: hex(CAR.trim), wheel: hex(CAR.wheel) },
  render: (a) => <Car speed={a.speed} driver={a.driver} body={a.body} trim={a.trim} wheel={a.wheel} />,
};

export const Default = {};
