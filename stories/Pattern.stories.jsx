// Pattern: raised dots laid over a face, the way a rug is patterned. It
// needs the face's `width` and `length` and a PATTERN (layout, spacing, dots).
import Pattern from "../src/nouns/pattern/Pattern.jsx";
import { PATTERN } from "../src/nouns/pattern/objects.js";

export default {
  title: "Misc/Pattern",
  component: Pattern,
  render: () => <Pattern width={6} length={4} pattern={PATTERN} />,
};

export const Default = {};
