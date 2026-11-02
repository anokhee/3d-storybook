// Bike Rack: a row of bent-tube hoops to lock a bike to, the kind that
// stands on a pavement outside a shop. Its defaults are BIKE_RACK in
// src/nouns/bikeRack/objects.js.
import BikeRack from "../src/nouns/bikeRack/BikeRack.jsx";
import { BIKE_RACK, BIKE_RACK_KNOBS } from "../src/nouns/bikeRack/objects.js";
import { knobStory } from "./helpers/knobs.js";

const K = knobStory(BIKE_RACK, BIKE_RACK_KNOBS, {}, {});

export default {
  title: "Furniture/Street/Bike Rack",
  component: BikeRack,
  argTypes: K.argTypes,
  args: K.args,
  render: (a) => <BikeRack config={K.configOf(a)} />,
};

export const Default = {};
