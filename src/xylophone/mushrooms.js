// Ported from the xylophone project as an ES module: the original is a
// classic script sharing globals (THREE, COLOR_PALETTE, ...), so the imports
// and the export line below are the only changes.
import * as THREE from "three";
import { COLOR_PALETTE } from "./palette.js";

// ---------- mushrooms: the toadstools the kalimba's notes sprout ----------
// Loaded after palette.js, before script.js. Also has glowTexture, the soft dot the night sky's stars and the
// hall's lights use.

// a soft round dot fading to nothing at its edge, for glows (and the night sky's stars in script.js)
function glowTexture() {
  if (glowTexture.tex) return glowTexture.tex;
  const c = document.createElement("canvas");
  c.width = c.height = 64;
  const g = c.getContext("2d"),
    grad = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  grad.addColorStop(0, "rgba(255,255,255,1)");
  grad.addColorStop(0.35, "rgba(255,255,255,0.45)");
  grad.addColorStop(1, "rgba(255,255,255,0)");
  g.fillStyle = grad;
  g.fillRect(0, 0, 64, 64);
  return (glowTexture.tex = new THREE.CanvasTexture(c));
}

// ---------- mushroom sprouts: what the kalimba grows when a note is played ----------
// a little cluster of toadstools pushes up out of the ground where a note flower would bloom: the stems rise
// with the caps still shut tight, the caps pop open with a springy overshoot, they hold, then sink back into
// the ground. Caps in the note's color, spotted. The code that grows them is in script.js (sproutMushrooms
// and updateMushrooms)
const MUSHROOM_SPROUTS = {
  stemByPitch: [0.9, 2.1], // stem height for the lowest note and for the highest, world units
  capByPitch: [1.25, 0.5], // cap radius for the lowest note and for the highest
  stem: 0.28, // stem radius as a fraction of the cap's
  capH: 0.62, // cap height as a fraction of its radius (1 = a half sphere)
  cluster: [1, 3], // mushrooms per note: the first full size, the rest smaller round its foot
  little: [0.45, 0.7], // size of the extra ones, relative to the first
  stagger: 0.12, // seconds between each one in the cluster starting to grow
  spots: [3, 6], // spots on each cap (random in this range)
  spot: [0.13, 0.2], // spot radius relative to the cap's
  grow: 0.45, // seconds: stem rising, cap shut
  pop: 0.45, // seconds: cap springing open
  hold: 2.5,
  fade: 0.6, // seconds: sinking back into the ground
  size: [0.9, 1.1],
  tint: 0.85, // how much of the note's color goes into the cap (the rest is mushroomCap's red)
  capBase: COLOR_PALETTE.mushroomCap,
  stemColor: COLOR_PALETTE.mushroomStem,
  gillColor: COLOR_PALETTE.mushroomGills,
  spotColor: COLOR_PALETTE.mushroomSpots,
};


export { glowTexture, MUSHROOM_SPROUTS };
