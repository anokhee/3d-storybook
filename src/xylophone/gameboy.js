// Ported from the xylophone project as an ES module: the original is a
// classic script sharing globals (COLOR_PALETTE, ...), so the import and
// the export line below are the only changes.

// ---------- the handheld: a chiptune instrument ----------
// Loaded after palette.js and before script.js. The notes become chunky magenta buttons on a gray plastic base
// round the arc, pressed by the bare tentacle tips, and a giant handheld console stands behind the player, its
// screen running a little flying game that every note played makes flap, all in a glowing green cyber grid
// where every note also sends a neon bar floating up out of the floor (grid.js)
const GAMEBOY = {
  label: "Handheld",
  raise: 0, // the base sits on the ground and so does the player
  mallets: false, // the tentacle tips press the buttons
  mood: "cyber", // dark, for the grid to glow against: lighting.js
  grows: "nothing",
  backdrop: "none",
  fence: false,
  floor: "grid", // a glowing green grid under a glowing dome, in place of the meadow (grid.js)
  clouds: false,
  headphones: true, // the player wears over-ear headphones (blob.js)
  antennae: "none", // and no antennae
  // the plastic base under the buttons, as distances out from the bars' arc (negative: in toward the player)
  base: { inner: -1.3, outer: 1.3, top: -0.35 }, // top: how far below the bars' usual height its top sits
  // the buttons: round, set in a dark well, and staggered in and out in pairs like a handheld's A and B
  button: { r: 0.3, h: 0.2, well: 0.37, stagger: 0.22 },
  // the console behind the player, standing on the ground and facing the camera
  console: {
    back: 4.2, // how far behind the player its front face stands
    width: 6,
    height: 9.8,
    depth: 1,
    corner: 0.35, // the rounding of three of its corners
    bigCorner: 1.5, // and the big round corner at the bottom right
  },
  // the screen: a little flying game the music plays (script.js). Sizes and speeds in screen pixels
  screen: {
    speed: 34, // how fast the world scrolls past, pixels a second
    gravity: 260, // how fast the craft falls, pixels a second a second
    flap: 95, // how hard a note flaps it up, pixels a second
    spacing: 64, // between pillars
    pillar: 10, // a pillar's width
    opening: 46, // the gap to fly through
    autopilot: 1.5, // seconds after the last note before it flies itself
  },
  colors: {
    body: "#C5C1BA",
    base: "#B3AFA8", // the base under the buttons, a shade darker
    bezel: "#5E6070", // round the screen
    lcd: ["#9BBC0F", "#8BAC0F", "#306230", "#0F380F"], // the screen's four greens, lightest to darkest
    button: "#A3245E",
    well: "#3B3A44", // the recess round each button
    dpad: "#2B2B30",
    pill: "#7D7E88", // start and select
    slot: "#6F6C66", // the speaker slots
    led: "#D02030", // the power light
  },
  sound: {
    attack: 0.001,
    // a pulse wave a quarter on, three quarters off: the classic handheld lead sound. One partial, as the chip
    // plays it; `wave` swaps the sine for this shape
    wave: "pulse25",
    partials: [[1, 0.3, 0.9]],
    steps: 15, // fade in this many hard steps, like the chip's volume envelope, instead of a smooth curve
    thud: { cutoff: 7000, gain: 0.03 }, // a tiny click
  },
};


export { GAMEBOY };
