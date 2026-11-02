// Shopping Bag: a thin plastic carrier bag from the corner shop — a soft,
// creased sack, full and bulging, its two sides running up into a loop of a
// handle, a little see-through, sometimes with a printed band; a baguette,
// some greens or a few oranges peeking out of the top. Built to hang from a
// hand (its origin is the handle's grip): the crowd's walkers on the flat
// street (../crowd) carry them. Shown here set down on the ground. Its code
// is src/nouns/shoppingBag/build.js and its defaults src/nouns/shoppingBag/objects.js.
import ShoppingBag from "../src/nouns/shoppingBag/ShoppingBag.jsx";
import { SHOPPING_BAG, SHOPPING_BAG_KNOBS } from "../src/nouns/shoppingBag/objects.js";
import { knobStory } from "./helpers/knobs.js";

const K = knobStory(SHOPPING_BAG, SHOPPING_BAG_KNOBS, {}, {});

export default {
  title: "Props/Shopping Bag",
  component: ShoppingBag,
  argTypes: K.argTypes,
  args: K.args,
  render: (a) => <ShoppingBag config={K.configOf(a)} />,
};

export const Default = {};
