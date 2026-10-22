// Ported from the xylophone project as an ES module: the original is a
// classic script sharing globals (COLOR_PALETTE, ...), so the import and
// the export line below are the only changes.

// ---------- the kalimba ----------
// Loaded after palette.js and before script.js. A giant thumb piano in a night-time forest clearing: a wooden box round the
// arc, a steel bridge across it, and a steel tine for every note, clamped at the back and free at the front for
// the tentacle tips to pluck
const KALIMBA = {
  label: "Kalimba",
  raise: 0, // the box sits on the ground and so does the player
  mallets: false, // the bare tentacle tips pluck the tines
  mood: "night", // "day", "night" (lamplight) or "hall" (an indoor stage with a spotlight): lighting.js has each
  grows: "mushrooms", // little toadstools pop out of the ground with each note (MUSHROOM_SPROUTS in mushrooms.js)
  backdrop: ["forest", "toad"], // a giant toad in a stand of conifers (toad.js, trees.js)
  fence: false,
  clouds: false, // a clear sky
  stars: true, // the night sky's stars (LIGHTING.stars)
  ferns: true, // ferns through the grass instead of flowers (MEADOW_FERNS in ferns.js)
  antennae: "mushrooms", // the player grows two little toadstools in place of its antennae (blob.js)
  // the tines: longest in the middle of the arc and shorter toward both ends, the V a real kalimba's tines
  // make. Each is clamped under the pressure bar at the back and runs in toward the player
  tine: {
    long: 2.6, // at the middle of the arc
    short: 1.4, // at the two ends
    width: 0.24,
    thickness: 0.07,
  },
  // the box, as distances out from the bars' arc (negative: in toward the player)
  box: {
    inner: -1.9, // front edge
    outer: 1.7, // back edge
    top: -0.45, // how far below the bars' usual height its top sits
  },
  bridge: 0.7, // the steel rod the tines rest on
  clamp: 1.0, // the pressure bar over the tines, and where the tines end at the back
  holeR: 0.38, // the sound hole in the top, at the middle of the arc under the tines
  colors: {
    box: "#B9773E",
    top: "#D9A066", // the lighter soundboard on top
    hole: "#3A2412",
    tine: "#D7DCE3",
    bridge: "#8E97A3", // the bridge and the pressure bar
  },
  sound: {
    attack: 0.002, // a pluck is quick
    // a steel tine: a round fundamental that rings a while, a faint octave, and the tine's own bright,
    // inharmonic second mode (about 6 times up, for a bar clamped at one end) that is gone in a moment and
    // gives the pluck its ping
    partials: [
      [1, 1, 2.4],
      [2, 0.12, 0.7],
      [6, 0.16, 0.16],
    ],
    thud: { cutoff: 3000, gain: 0.1 }, // the tentacle tip flicking off the tine
  },
};


export { KALIMBA };
