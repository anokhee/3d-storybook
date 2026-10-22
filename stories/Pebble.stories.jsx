// Pebble: the dollies' pebbles over the whole stage, the squashed clay
// stones the ground cover scatters (src/nouns/pebble), each variant rolled
// its own way from PEBBLE.hand, instanced over the disc in the three
// stone blocks, pooled in patches (the game's pebbles layer in
// src/nouns/groundCover/objects.js). See stories/helpers/field.jsx.
import { Field } from "./helpers/field.jsx";
import { pebbleGeometry } from "../src/nouns/pebble/geometry.js";
import { PEBBLE } from "../src/nouns/pebble/objects.js";
import { between } from "../src/world/random.js";

const H = PEBBLE.hand;
const stone = (rand) => {
  const P = { ...PEBBLE, radius: between(H.radius, rand), widen: between(H.widen, rand), deepen: between(H.deepen, rand), squash: between(H.squash, rand) };
  return { geometry: pebbleGeometry(P), up: P.radius * P.squash }; // its middle a half-height up, so it lies on the ground
};

export default {
  title: "Nature/Groundcover/Pebble",
  argTypes: {
    density: { control: { type: "range", min: 50, max: 5000, step: 50 }, name: "stones" },
    variants: { control: { type: "range", min: 1, max: 16, step: 1 } },
    pool: { control: { type: "range", min: 1, max: 18, step: 0.5 }, name: "patch size" },
  },
  args: { density: 1200, variants: 8, pool: 5 },
  render: (a) => <Field make={stone} variants={a.variants} density={a.density} pool={a.pool} colors={PEBBLE.blocks} size={[0.7, 1.4]} lean={25} sink={[0.04, 0.1]} grain={0.15} />,
};

export const Default = {};
