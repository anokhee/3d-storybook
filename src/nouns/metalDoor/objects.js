import { solid, PALETTE } from "../../world/palette.js";

// A METAL DOOR: the swing door into a restaurant's kitchen, in its
// doorway — a leaf of brushed steel with a window let into it high up (a
// porthole, or a rounded square), a steel ring round the glass on both
// faces, a kick plate across its foot and a push plate at the height of
// a hand, on both faces too; hung in an archway, its head bowed as the
// dollies' archways are, with a moulding round it on both faces of the
// wall (src/interior/Molding.jsx, as the dollies' houses frame theirs).
// The doorway is centred on x = 0, its foot on y = 0, the wall's middle
// on z = 0 (its faces ±wall/2). Whoever builds the wall cuts the doorway
// (its outline: archOutline in MetalDoor.jsx) and hangs this in it (the
// café's kitchen door, in ../shopInterior/ShopInterior.jsx).
//   width, height   the doorway: `height` to the top of its head
//   curve    how bowed its head is: 1 a half-round as wide as the door, 0 flat
//   wall     how thick the wall is, for the moulding to sit on its faces
//   frame    the moulding: `thickness` the band's width, `depth` how far
//            proud of the wall, `color`; or null for none
//   leaf     the door itself: `thickness`, `gap` round it in the doorway
//   hinge    which side it hangs from: -1 left, 1 right (looking at +z)
//   open     how far it is swung, -1 to 1 (1 wide open toward -z, -1
//            toward +z); or pass a ref as `swing` to move it as you go
//   window   `shape` "round" or "square"; `size` across; `at` its middle
//            off the ground; `ring` how broad the steel ring round it is
//   kick     the plate across the foot: `height`
//   push     the plate a hand pushes on: `width`, `height`, `at` (its
//            middle off the ground), on the side away from the hinge
//   colors   `steel` (the leaf), `ring`, `kick`, `push`, `glass`
export const METAL_DOOR = {
  width: 0.8,
  height: 1.85,
  curve: 1,
  wall: 0.12,
  frame: { thickness: 0.07, depth: 0.03, color: PALETTE.house.molding },
  leaf: { thickness: 0.05, gap: 0.02 },
  hinge: 1,
  open: 0,
  window: { shape: "round", size: 0.3, at: 1.25, ring: 0.035 },
  kick: { height: 0.28 },
  push: { width: 0.1, height: 0.3, at: 0.95 },
  colors: {
    steel: solid("#B9BFC5"),
    ring: solid("#8D949B"),
    kick: solid("#D5D9DD"),
    push: solid("#D5D9DD"),
    glass: solid("#CFE3EA"),
  },
};

export const METAL_DOOR_KNOBS = {
  open: { path: "open", range: [-1, 1, 0.05] },
  curve: { path: "curve", range: [0, 1, 0.05], name: "arch curve" },
  windowShape: { path: "window.shape", options: ["round", "square"], name: "window shape" },
  windowSize: { path: "window.size", range: [0.15, 0.5, 0.01], name: "window size" },
  windowAt: { path: "window.at", range: [0.8, 1.5, 0.01], name: "window height" },
  width: { path: "width", range: [0.5, 1.2, 0.05] },
  height: { path: "height", range: [1.4, 2.4, 0.05] },
  kick: { path: "kick.height", range: [0, 0.5, 0.01], name: "kick plate" },
  frameWidth: { path: "frame.thickness", range: [0, 0.2, 0.01], name: "frame width" },
  frameColor: { path: "frame.color.hex", color: true, name: "frame color" },
  steel: { path: "colors.steel.hex", color: true, name: "steel" },
};
