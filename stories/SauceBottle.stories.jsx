// Sauce Bottle: a diner's squeeze bottle — a round-shouldered body with a
// band of label, a screw cap and a pointed nozzle — in ketchup, mustard or
// mayo (pick from "sauce"; "custom" to colour it yourself). Its code is
// src/nouns/sauceBottle/SauceBottle.jsx and its defaults (and the three
// sauces' colours) src/nouns/sauceBottle/objects.js.
import SauceBottle from "../src/nouns/sauceBottle/SauceBottle.jsx";
import { SAUCE_BOTTLE, SAUCE_BOTTLE_KNOBS } from "../src/nouns/sauceBottle/objects.js";
import { knobStory } from "./helpers/knobs.js";

const K = knobStory(SAUCE_BOTTLE, SAUCE_BOTTLE_KNOBS, {}, {});

export default {
  title: "Food/Condiments/Sauce Bottle",
  component: SauceBottle,
  argTypes: K.argTypes,
  args: K.args,
  render: (a) => <SauceBottle config={K.configOf(a)} />,
};

export const Default = {};
