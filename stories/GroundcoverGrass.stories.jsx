// Grass: the dollies' grass over the whole stage, the strands the planet's
// ground cover is made of (src/cutout.js strandGeometry, with GRASS's
// numbers from src/nouns/grass/objects.js): tapered tubes bent along a
// curve, each variant rolled its own way from GRASS.hand, instanced over
// the disc in the lush greens, pooled in patches (the game's grass layer
// in src/nouns/groundCover/objects.js). See stories/helpers/field.jsx.
import { Field } from "./helpers/field.jsx";
import { strandGeometry } from "../src/cutout.js";
import { GRASS } from "../src/nouns/grass/objects.js";
import { GRASS_PALETTES } from "../src/nouns/grass/palettes.js";
import { between } from "../src/world/random.js";

const H = GRASS.hand;
const strand = (rand) => ({
  geometry: strandGeometry({
    length: between(H.height, rand), radius: between(H.baseRadius, rand), taper: between(H.taper, rand), cap: GRASS.cap, bend: between(H.bend, rand), stiff: between(H.stiff, rand),
    shaft: GRASS.shaft, dome: GRASS.dome, radial: GRASS.radial, shade: GRASS.shade, soft: GRASS.soft, tip: GRASS.tip, tipFrom: GRASS.tipFrom,
  }),
  up: 0, // rooted at its foot
});

export default {
  title: "Nature/Groundcover/Grass",
  argTypes: {
    density: { control: { type: "range", min: 200, max: 12000, step: 100 }, name: "strands" },
    variants: { control: { type: "range", min: 1, max: 24, step: 1 } },
    pool: { control: { type: "range", min: 1, max: 18, step: 0.5 }, name: "patch size" },
  },
  args: { density: 4000, variants: 12, pool: 5 },
  render: (a) => <Field make={strand} variants={a.variants} density={a.density} pool={a.pool} colors={GRASS_PALETTES.lush} size={[0.5, 1.5]} lean={20} sink={[0.05, 0.2]} grain={0.1} />,
};

export const Default = {};
