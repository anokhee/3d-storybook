// Ported from the xylophone project as an ES module: the original is a
// classic script sharing globals (COLOR_PALETTE, ...), so the import and
// the export line below are the only changes.

// ---------- the xylophone (and the layout every instrument shares) ----------
// Loaded after palette.js and before script.js.

// the semicircle the bars fan round. All three instruments use it
const ARC = {
  center: [0, -1.5], // x, z of the arc's center. The player sits here
  radius: 7, // from the center to the middle of each bar; the bars come out about a unit apart round the arc
  span: Math.PI, // the angle the bars fan across
  lenMax: 3.4, // bar length at the low end
  lenMin: 1.6, // and at the high end
  barWidth: 0.62,
  barThickness: 0.24,
  // spacing: bar centers sit radius × span / (bars − 1) apart round the arc (about 0.88 with these values), so
  // the gap between bars is that minus barWidth. Widen the gaps with a bigger radius or span, or a narrower bar
};

const XYLOPHONE = {
  label: "Toy Xylophone", // what the button says
  raise: 0, // how much higher than the toy base the bars sit (the player gets a stool to match if > 0)
  mallets: true, // play with mallets (false: the bare tentacle tips press the bars)
  clownNose: true, // the player wears a red clown nose (blob.js)
  antennae: "hats", // and two party hats in place of its antennae ("antennae", "hats" or "mushrooms": blob.js)
  mood: "playroom", // "day", "night", "hall", "dusk", "pixel" or "playroom" (a yellow wall for a sky): lighting.js has each
  grows: "jacks", // what the notes set off: "flowers" or "ferns" (grown in the meadow), or "jacks" (jacks.js)
  backdrop: "none", // what stands behind the fence: "trees", "toad", "forest" (trees round the toad), "curtain", "blocks", "none", or a list of them (trees.js, toad.js, curtain.js, blocks.js)
  fence: false, // the giant jack-in-the-boxes stand behind the player instead
  forward: 1, // how far toward the camera the player sits from the middle of the bars' arc
  teddies: true, // an audience of teddy bears sitting in front (teddies.js)
  // the room: a floor of colored squares instead of the grass and meadow flowers, and a rainbow on the wall
  // instead of clouds. Leave these out for the outdoors
  floor: "mat",
  wall: "rainbow",
  // every color that belongs to the xylophone. Hex values are what you see under full light. The felt pads and
  // the metal posts and axles are shared with the other instruments, so they stay in palette.js
  colors: {
    wood: "#EBAF5C", // the rails
    woodDark: "#F29F2C", // the plate and end blocks
    bars: [
      "#CEC2FF",
      "#8D70FF",
      "#F55829",
      "#FFC847",
      "#C3423F",
      "#EC695D",
      "#81A15C",
      "#6680FF",
    ], // the bars cycle through these, low to high
    wheel: "#14253D",
    wheelHub: "#DAB52F",
    cord: "#F9F3DC", // the pull cord
    bead: "#F29F2C", // and the bead on the end of it
  },
  // the pull-along toy base
  plateT: 0.42, // thickness of the curved wooden plate
  plateWidth: 3, // how far across the plate is, radially. The longest bars are ARC.lenMax long
  plateOffset: 0, // slide the plate's centerline out from the bar centers (positive) or in toward the player (negative)
  lift: 0.65, // how high the plate's underside rides off the ground on its wheels
  wheelR: 0.6,
  wheelW: 0.28,
  wheelAt: [0.1, 0.3, 0.7, 0.9], // where along the arc the axles sit, 0 = low end, 1 = high end
  sound: {
    attack: 0.004, // seconds for a partial to reach full volume
    // each partial: [frequency multiple, volume, decay seconds]. A bright knock: a fundamental plus a few
    // stiff, inharmonic partials that die fast. The loudest overtone is tuned to 3, an octave and a fifth up,
    // as real xylophone bars are carved to be (an untuned bar rings at 2.76): in tune with the other notes of
    // a chord, where 2.76 grated against them
    partials: [
      [1, 1, 1.4],
      [3, 0.35, 0.5],
      [5.4, 0.15, 0.25],
      [8.9, 0.06, 0.15],
    ],
    thud: { cutoff: 2500, gain: 0.35 }, // the mallet's knock: lowpass cutoff in Hz, and volume
  },
};


export { ARC, XYLOPHONE };
