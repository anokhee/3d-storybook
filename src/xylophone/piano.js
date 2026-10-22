// Ported from the xylophone project as an ES module: the original is a
// classic script sharing globals (COLOR_PALETTE, ...), so the import and
// the export line below are the only changes.

// ---------- the electric piano ----------
// Loaded after palette.js and before script.js.
const PIANO = {
  label: "Piano",
  raise: 1.25, // how much higher than the toy base the keys sit; the player gets a stool this tall
  mallets: false, // the bare tentacle tips press the keys
  mood: "hall", // "day", "night" (lamplight) or "hall" (an indoor stage with a spotlight): lighting.js has each
  grows: "nothing", // notes grow nothing ("audience" makes the audience dance to them instead)
  backdrop: "curtain", // a red stage curtain behind (curtain.js)
  fence: false, // no fence in front of the curtain
  stage: true, // the player and piano stand on a stage, with an audience of blobs in front (stage.js)
  floor: "hall", // inside a concert hall with a domed ceiling instead of the meadow (hall.js)
  // the keyboard: every playable note is a white key, all the same size; black keys sit between whole steps
  keyLength: 2.6, // white keys, world units
  keyWidth: 0.74, // narrow enough that the inner ends don't touch where the fan closes up
  blackWidth: 0.42,
  blackLength: 1.5,
  blackRaise: 0.17, // above the white keys' center line
  blackBack: 0.55, // set back toward the outer edge, so the white keys' front ends stay clear
  // the body and stand
  bodyH: 0.14, // the thin body under the keys
  bodyPad: 0.14, // how far the body reaches past the keys, front and back
  endPad: 0.6, // how far it reaches past the end keys, as a share of the frame's usual overhang
  postR: 0.06, // leg posts
  legSpread: 1.3, // posts stand this far in and out from the key centers, radially
  band: { w: 0.1, h: 0.12, at: 0.28 }, // the band joining the legs: width, height, and how far up the legs it runs (0 = ground, 1 = body)
  music: { postH: 0.45, w: 1.5, h: 1.05, tilt: 0.35 }, // the music stand: post height, desk size, lean back in radians
  sound: {
    attack: 0.003,
    // an electric piano tine: a clean, nearly pure fundamental with a couple of exact harmonics (no detuning,
    // so nothing beats or buzzes), plus a short bright ping high above it that gives the attack its bark and is
    // gone in a blink
    partials: [
      [1, 1, 2.6],
      [2, 0.16, 1.0],
      [3, 0.06, 0.5],
      [7, 0.28, 0.07], // the tine ping
    ],
    // a gentle wobble, like the amp's vibrato: rate in Hz, how deep it dips, and the level it wobbles around
    tremolo: { rate: 4.6, depth: 0.1, level: 0.9 },
    thud: { cutoff: 600, gain: 0.06 }, // a soft key thump
  },
};


export { PIANO };
