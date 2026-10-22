import { PALETTE } from "../../world/palette.js";

// The sky: what the whole world sits inside.

export const SKY = {
  shell: 300, // radius of the sphere the stars are scattered on
};

// The stars: lit spheres scattered over the sky's shell, one draw call for
// the lot however many there are, the way the ground cover plants grass.
//
//   density     how many, over the whole shell
//   radius      a star's radius, before the size roll
//   size        multiplier on the radius, rolled per star
//   brightness  rolled per star: 1 is full, 0 is out. Scales both how
//               bright the star's own color is and how far its halo reaches
//               (see GLOW.halo), so a dim star is small and faint
//   detail      facets, as a multiple of a sphere's — far off and tiny, a
//               star needs very few
//   halo        whether each star gets a halo smeared round it
//   colors      swatches, one rolled per star inside its vary ranges
//   seed        so the same sky comes back on reload
export const STARS = {
  density: 400,
  radius: 0.35,
  size: [0.6, 1.4],
  brightness: [0.35, 1],
  detail: 0.5,
  halo: true,
  colors: [PALETTE.sky.stars],
  seed: 7,
};
