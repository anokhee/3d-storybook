// Ported from the xylophone project as an ES module: the original is a
// classic script sharing globals (COLOR_PALETTE, ...), so the import and
// the export line below are the only changes.

// ---------- the vibraphone ----------
// Loaded after palette.js and before script.js. Played on top of a moon out in space (space.js).
const VIBRAPHONE = {
  label: "Vibraphone",
  raise: 1.25, // how much higher than the toy base the bars sit; the player gets a stool this tall
  mallets: true,
  mood: "space", // a deep blue-black sky and a bright white sun: lighting.js
  grows: "nothing", // nowhere to grow: it's all clay and space
  backdrop: "none",
  fence: false,
  floor: "space", // standing on a moon in space in place of the meadow (space.js)
  clouds: false,
  stars: "all", // the night sky's stars, all the way round: there's no ground to hide the lower ones
  antennae: "stars", // the player's antennae end in stars (blob.js)
  // the steel frame
  tube: [2.2, 0.9], // resonator length under the lowest note and under the highest
  tubeR: 0.24,
  legsAt: [0.06, 0.5, 0.94], // where along the arc the leg pairs stand, 0 = low end, 1 = high end
  legSpread: 1.7, // legs stand this far in and out from the bar centers, radially
  casterR: 0.14,
  sound: {
    attack: 0.012,
    // a purer tone (bars tuned with a 4:1 partial) that rings on for seconds
    partials: [
      [1, 1, 3.0],
      [4, 0.22, 1.1],
      [10, 0.05, 0.3],
    ],
    // the slow wobble of the spinning fans in the resonators: rate in Hz, how deep it dips, and the level
    // it wobbles around
    tremolo: { rate: 5.5, depth: 0.28, level: 0.72 },
    thud: { cutoff: 1400, gain: 0.18 },
  },
};


export { VIBRAPHONE };
