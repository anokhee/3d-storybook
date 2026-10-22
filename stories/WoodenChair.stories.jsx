// Wooden Chair: the wooden bench, one seat wide: the same slats, legs,
// back and armrests (src/nouns/bench), narrowed from a bench's seven to
// two. Its knobs are the bench's.
import Bench from "../src/nouns/bench/Bench.jsx";
import { BENCH, BENCH_KNOBS } from "../src/nouns/bench/objects.js";
import { knobStory } from "./helpers/knobs.js";

const K = knobStory(BENCH, BENCH_KNOBS, {}, { width: 2 });

export default {
  title: "Furniture/Seating/Wooden Chair",
  component: Bench,
  argTypes: K.argTypes,
  args: K.args,
  render: (a) => <Bench config={K.configOf(a)} />,
};

export const Default = {};
