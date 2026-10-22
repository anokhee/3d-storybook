import { block } from "../../world/palette.js";

// The color schemes a stand of trees is dealt from, by name — the edit
// panel's colors picker (see level/groundCover.js), picked apart from
// the tree's kind, though each kind has the one it naturally comes in.
// Each is what a tree's canopy may be, one rolled per tree — or, for a
// dead tree, all trunk, its bark. Blocks of clay, as the grass's are.
export const TREE_PALETTES = {
  // Leaf greens: the grass's green, a yellower and a deeper.
  leaves: [block("#6C8F5B"), block("#8FA85C"), block("#4F7A4A")],
  // Needle greens, cooler and darker.
  needles: [block("#3F6B4F"), block("#2F5A48"), block("#4B7358")],
  // Blossom pinks, deep to nearly white.
  blossom: [block("#F2A3B8"), block("#F8C6D3"), block("#FCE3E9")],
  // Bare wood, weathered: pale, mid and dark grays with the brown gone.
  bare: [block("#A89A86"), block("#8C8072"), block("#6E655B")],
};
