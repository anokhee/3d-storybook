// The scene's palette: every color the scene lab (scene.html) lets you
// pick, as the lab last set them (pasted back from its "copy palette"). The lab saves the colors
// you set in the browser; the field reads them back (savedPalette), so
// what is tuned in the lab is what the field wears, with no copying.
// Sky and foam are the day's in the field (HOURS in main.field.js); the
// trees' and flowers' colors are baked into their geometry by the
// field's own builders, so those four stay the lab's alone for now.
export const PALETTE_KEY = "scene-lab"; // where the lab keeps its state in localStorage
export const PALETTE = {
  // Sampled from the case study's camera-roll carousel (2026-10-16): the
  // dusk sea and sky, the Okunoin cedar path, the azalea park, the lit
  // house and the clay vessel
  sky: 0xd9d5cc, // the dusk sky's pale warm gray
  water: 0x495a74, // the sea under it; see-through: the sand and seabed show up through it
  foam: 0xe6e0d7, // the lace on the sea: the dusk sky, lifted; at night it takes a little of the water (daylight.js FOAM_DIM)
  seabed: 0x5c5961, // the far mountains' slate
  sand: 0xd9c9bc, // the white azaleas
  ground: 0x70773f, // the grass: the park's green
  earth: 0x4a270e, // the bare earth round the statues' feet: the wet bank below the lit house
  splotch: 0x727b4c, // the pentagons on the grass: the cedars' moss
  splotch2: 0x727b4c, // the small pentagons among them (beach.js SPLOTCH.small...)
  stone: 0xc0bbb6, // the statues: the path's paving
  eyes: 0x121c26, // the vessel's case, near black
  trees: 0x727b4c, // the canopy: the cedars' lit foliage (0x555036, their shaded green, was far too dark on the trees)
  bark: 0x70614d, // the cedar trunks
  // The wildflowers: four petal colors, each cluster one of them, and one heart
  flowers: 0xce829e, // the azaleas' pink
  flowers2: 0xd2c4bc, // the dusk's pink
  flowers3: 0xdea678, // the vessel's terracotta
  flowers4: 0x9199b6, // the night's blue
  hearts: 0xb68a4d, // the lit windows' amber
};
export const FLOWER_KEYS = ["flowers", "flowers2", "flowers3", "flowers4"]; // the petal colors, in the palette's order
// The palette as the lab last saved it, over the defaults for anything it
// didn't (or if there is no saved lab, or no storage)
export function savedPalette() {
  const C = { ...PALETTE };
  try {
    const saved = JSON.parse(localStorage.getItem(PALETTE_KEY) || "{}")?.C;
    if (saved && typeof saved === "object") for (const key of Object.keys(PALETTE)) if (Number.isInteger(saved[key])) C[key] = saved[key];
  } catch {
    /* no storage: the defaults */
  }
  return C;
}
