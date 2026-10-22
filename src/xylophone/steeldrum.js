// Ported from the xylophone project as an ES module: the original is a
// classic script sharing globals (COLOR_PALETTE, ...), so the import and
// the export line below are the only changes.

// ---------- the steel drums ----------
// Loaded after palette.js and before script.js. A set of chrome steel pans round the arc, low to high: the
// lowest a bass pan whose barrel stands on the ground, the rest shorter pans on tripod stands. The notes are
// pads sunk into the dished top of each pan
const STEELDRUM = {
  label: "Steel drums",
  raise: 1.25, // the pans stand at waist height, and the player sits up on the stool
  mallets: true, // pan sticks
  sunglasses: true, // the player wears shades at the beach (blob.js)
  mood: "dusk", // "day", "night", "hall" or "dusk" (a low orange sun): lighting.js has each
  grows: "fish", // fish heads pop up out of the sand (fish.js)
  backdrop: "none", // the sea is behind instead
  floor: "sand", // sand instead of the grass and meadow flowers
  horizon: 32, // the ground and sea reach this far past the camera's target (22 elsewhere), so the island can sit further out
  haze: 0.5, // half-strength distance haze: 1 = the usual, 0 = none
  fence: false, // open to the beach
  sea: 9.5, // the water starts this far behind the player, past a strip of beach
  coast: true, // the beach, palm trees either side of the player, and an island and a sailboat out on the water (island.js)
  // how many notes go on each pan, low to high (they add up to the number of bars)
  pans: [6, 5, 5, 5, 5],
  // how far down each pan's barrel (its skirt) reaches, as a share of the way to the ground: the bass pan's goes
  // all the way, the higher pans' get shorter and stand on legs
  skirts: [1, 0.5, 0.38, 0.3, 0.24],
  margin: 0.4, // how far a pan's rim reaches past its outermost note (much more and neighboring pans overlap)
  dish: 0.3, // how deep the playing surface dips at its middle
  rim: 0.1, // how far above the bars' usual height the rim sits
  pad: { width: 0.7, length: 0.95, thickness: 0.1 }, // each note's pad
  colors: {
    chrome: "#C9CFD8", // the barrels and the playing surface
    rim: "#8E98A6",
    stand: "#2B2F36",
    // the pads take the xylophone's bar colors, so the notes match everywhere they show
  },
  sound: {
    attack: 0.004,
    // a steel pan note is tuned so its overtones sit on the octave and the twelfth, which is where its sweet,
    // singing ring comes from. What makes it sound like steel rather than a synth: the octave blooms in a
    // moment after the strike (the struck note area hands its energy up to it, the pan's "bwaang"); the
    // hammered metal is never perfectly true, so a second fundamental a hair sharp beats slowly against the
    // first and the upper partials sit slightly off their exact multiples; and a few inharmonic modes of the
    // surrounding steel ping for an instant at the strike. A resonant filter that starts open and sweeps down
    // puts a vowel-like "wah" on the front of the note
    partials: [
      [1, 1, 2.4],
      [1.0035, 0.3, 2.0], // the shimmer: beats against the fundamental a few times a second
      [2.003, 0.6, 1.6, 0.045], // the octave, swelling in
      [3.008, 0.28, 0.9, 0.025], // the twelfth
      [4.02, 0.1, 0.45],
      [5.43, 0.07, 0.12], // the surrounding steel's ping: quick and not on any harmonic
      [7.18, 0.045, 0.07],
      [9.76, 0.03, 0.05],
    ],
    filter: {
      q: 4.5, // a resonant peak that sweeps down through the partials
      open: 10, // starts at this many times the note's frequency
      openMax: 8000, // but no higher than this, in Hz
      settle: 3, // and closes down to this many times the frequency
      settleMin: 800, // but no lower than this
      time: 0.35, // seconds to close
    },
    thud: { cutoff: 900, gain: 0.08 }, // the rubber tip of the stick: a soft knock under the metal
  },
};


export { STEELDRUM };
