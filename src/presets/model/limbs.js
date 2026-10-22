// What a limb is STRUNG from — dowel or beads. Pure DATA, and deliberately
// thin: how many links a limb has, how wide each bead runs, and how the
// spacers between them are proportioned all belong to the BODY now — see
// presets/bodies.js (`limbSegments`, the `radius` bands in `arms`/`legs`,
// and the `spacer` block), because the body deals the limbs and those are
// its numbers to push around. All that is left to say here is the stalk
// geometry itself.
export const limbDefaults = {
  stalk: "barrel",
};

export const limbs = {
  cylinder: {},
  bead: { stalk: "bead" },
  // Strung exactly as the bead is — same links, same widths — only the bead
  // itself is cut angular: two cones base to base, the diamond of a strung
  // jewelry bicone.
  bicone: { stalk: "bicone" },
};
