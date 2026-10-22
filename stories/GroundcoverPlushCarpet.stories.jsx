// Plush Carpet: the grass's strands (src/cutout.js strandGeometry) made into
// pile: short, thick and nearly straight, each a stubby column with a round
// domed top, barely bent, its normals leaned well up so the field reads as
// one soft, velvety mass rather than tufts. Instanced over the disc in one
// dusky pink, all over. Made for the xylophone
// project's planet (xylophone/refactored/grass.js, PLUSH), and kept in step
// with it. See stories/helpers/field.jsx.
import { Field } from "./helpers/field.jsx";
import { strandGeometry } from "../src/cutout.js";
import { solid } from "../src/world/palette.js";
import { between } from "../src/world/random.js";

// The strand: GRASS's (src/nouns/grass/objects.js) knobs, set for pile.
const PLUSH = {
  cap: 1, // a true hemisphere on top: round, not pointed
  shaft: 3,
  dome: 5, // segments round the cap, so the dome reads round
  radial: 8,
  shade: 0.6, // the root only a little darker than the tip
  soft: 0.6, // normals leaned well up: one soft mass
  hand: {
    height: [0.22, 0.38],
    baseRadius: [0.38, 0.55],
    taper: [0.8, 0.95], // barely narrowing: columns, not blades
    bend: [0, 0.12],
    stiff: [0.6, 0.9],
  },
};
const COLORS = [solid("#BF889B")]; // one color all over

const H = PLUSH.hand;
const strand = (rand) => ({
  geometry: strandGeometry({
    length: between(H.height, rand), radius: between(H.baseRadius, rand), taper: between(H.taper, rand), cap: PLUSH.cap, bend: between(H.bend, rand), stiff: between(H.stiff, rand),
    shaft: PLUSH.shaft, dome: PLUSH.dome, radial: PLUSH.radial, shade: PLUSH.shade, soft: PLUSH.soft, tip: 0, tipFrom: 0.6,
  }),
  up: 0, // rooted at its foot
});

export default {
  title: "Nature/Groundcover/Plush Carpet",
  argTypes: {
    density: { control: { type: "range", min: 500, max: 40000, step: 500 }, name: "strands" },
    variants: { control: { type: "range", min: 1, max: 24, step: 1 } },
  },
  args: { density: 16000, variants: 12 },
  render: (a) => <Field make={strand} variants={a.variants} density={a.density} colors={COLORS} size={[0.9, 1.3]} lean={8} sink={[0.02, 0.08]} grain={0} />,
};

export const Default = {};
