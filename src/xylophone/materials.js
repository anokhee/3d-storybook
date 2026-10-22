// Ported from the xylophone project as an ES module: the original is a
// classic script sharing globals (THREE, COLOR_PALETTE, ...), so the imports
// and the export line below are the only changes.
import { COLOR_PALETTE } from "./palette.js";

// ---------- material parameters ----------
// Loaded after palette.js and before script.js.
const MATERIALS = {
  // toon gradient ramp: brightness of each shading step from deep shadow to highlight, 0-255. Add or remove
  // entries for more or fewer steps
  ramp: [90, 150, 215, 255],
  outlines: {
    enabled: true, // draw the ink outline around every mesh
    color: COLOR_PALETTE.ink,
    stroke: 1.5, // outline width in screen pixels. The same on every object, near or far
  },
};


export { MATERIALS };
