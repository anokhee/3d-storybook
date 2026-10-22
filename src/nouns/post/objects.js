import { PALETTE } from "../../world/palette.js";

// A post, and the cap it wears. Colors come from PALETTE (src/world/palette.js), as { hex, vary } swatches.
//
// Where the posts stand — how many, round what — is the enclosure's
// business, not the post's (see ENCLOSURE); a post stands tall enough to
// clear the tallest thing inside by `headroom`. Only the look is authored
// here.
export const POSTS = {
  post: {
    baseRadius: 0.21, // the foot; the top is this times `taper`
    taper: 0.7, // top radius as a fraction of the foot's
    headroom: 7.2, // how far the top stands above the tallest thing inside...
    height: null, // ...unless a height is set, which is then the height
    sides: 6,
    sink: 0.8, // foot buried; each post is planted on its own bit of ground
    color: PALETTE.post.body,
  },
  // Any ornament the garland could hang, and how it is lit (see LIGHT).
  // Swapping the cap for a different shape replaces the shape outright, but
  // an override that leaves `light`, `translation` or `rotation` out keeps
  // these. Both move the cap in its OWN frame, after it has been faced
  // outward. `translation` is { x, y, z } in world units off the post top,
  // y running DOWN the way a screen's does, as every translation here
  // does — so -y lifts it, and a shape centered on its origin, like a
  // daisy, wants y of about minus its radius to stand clear of the post
  // rather than half inside it; x slides it sideways and z pushes it out
  // from the ring. `rotation` is degrees
  // about its own axes — x tips a daisy's face up or down, y turns it left
  // or right, z spins it in its own plane.
  cap: {
    shape: "cylinder",
    radius: 0.3,
    translation: { x: 0, y: 0, z: 0 },
    rotation: { x: 0, y: 0, z: 0 },
    light: { type: "lit", brightness: 1 },
  },
  // Beside the cap rather than inside it, so a swapped shape keeps its color.
  capColor: PALETTE.post.cap,
};
