// Ported from the xylophone project as an ES module: the original is a
// classic script sharing globals (THREE, COLOR_PALETTE, ...), so the imports
// and the export line below are the only changes.
import * as THREE from "three";

// ---------- the scene's colors ----------
// change these and nothing else. Hex values ("#rrggbb" strings or 0xrrggbb numbers) are what you see under full light.
// The xylophone's own colors live with its other settings, in xylophone.js (XYLOPHONE.colors).
// Loaded before script.js, so COLOR_PALETTE is available everywhere.
const COLOR_PALETTE = {
  // sky and light
  sky: "#70CDFF", // scene background, and the top of the page behind the canvas
  skyLow: "#7A7FCD", // bottom of the page background (only shows if the canvas doesn't cover it)
  ambientLight: "#Fff3d6", // flat fill light
  sunLight: "#FFD48A", // the one directional light that casts shadows
  // ink
  ink: "#24303D", // outline color, only used when INK_OUTLINES is on
  pupil: "#2B1D1A", // pupils and mouth: a flat dark fill
  captionInk: "#0B0226", // the hint text under the canvas
  // instrument hardware shared by the xylophone and vibraphone. The xylophone's own colors (wood, bars,
  // wheels, cord) live in xylophone.js
  felt: 0x3c4a57, // the pads along the rails
  metal: 0xd6dde6, // the washers and pins under the bars, and the axles
  // mallets, in order: left, right, then extras 1-6. The xylophone's four theme colors, each mallet the one
  // nearest the run of bars it plays (its home bar in blob.js), so they match the keys
  mallets: [
    "#BB342F", // bar 4, red
    "#30BCED", // bar 20, blue
    "#FFDF64", // bar 9, yellow
    "#5B9A6D", // bar 15, green
    "#FFDF64", // bar 7, yellow
    "#5B9A6D", // bar 17, green
    "#BB342F", // bar 2, red
    "#30BCED", // bar 22, blue
  ],
  // blob
  skin: "#F49AC1", // bubblegum pink
  nucleus: "#BF889B", // the solid ball inside the blob
  shimmer: ["#B4E6F8", "#FFB8E1", "#FFF2A6"], // the colors the blob's slime shimmers through: blue, pink, yellow
  blobGlow: "#FFD6EA", // the soft halo round the blob
  blobCheek: "#FF9E8A", // its dolly cheeks: a coral blush, apart from its skin and its hot-pink nose, matte
  skinDark: 0xd8ad24, // defined for the blob but nothing uses it yet
  eyeWhite: 0xffffff,
  eyePaint: "#2A2331", // the dollies' eye paint (3d-storybook src/world/palette.js, paint)
  eyeShine: "#E4DCF0", // the shines on its eyes: a soft lilac white, not stark
  tongue: "#F07A8C", // inside the blob's open mouth
  sunglassLens: "#1E2230", // the blob's sunglasses at the steel drums
  sunglassFrame: "#2A2A33",
  clownNose: "#E8302E", // the blob's clown nose at the toy xylophone
  starBauble: "#FFC93C", // the stars on its antennae in space
  headphones: "#2B2D36", // its headphones on the handheld: the band and cups
  headphonePad: "#474A57", // the cushions
  headphoneLight: "#46FF7A", // the glowing ring on each cup
  blobHats: ["#4D96FF", "#B983FF"], // and its two party hats there, in the jack-in-the-boxes' hat colors
  blobPompom: "#FFFFFF",
  // ground and sky
  ground: "#2BA84A", // the field. A darker spring green so the blob pops
  grassColors: ["#3DC15E", "#2E9E4C", "#6BD66E"], // the blades: each one picks one of these at random
  flowerColors: ["#F26D8D", "#FFFFFF", "#8F7CE0", "#FFB347"], // petals: each flower picks one of these
  flowerCenter: "#F6C113",
  flowerStem: "#2E9E4C",
  flowerLeaf: "#3DBE5A", // leaves on every flower's stem
  fernColors: ["#2F8F4E", "#3FA85B", "#5BBF6A"], // fronds, tinted toward the note's color
  fernStem: "#7A5A3A",
  cloud: 0xffffff,
  // the wooden fence behind the blob (its layout lives with the FENCE settings in fence.js)
  fencePost: "#8E6239", // posts and their caps
  fenceRail: "#C08B57", // rails and pickets
  // the conifers behind the fence (their layout lives with the TREES settings in trees.js)
  treeColors: ["#1E7A48", "#25915A", "#1B6B4C"], // foliage: each tree picks one of these
  treeTrunk: "#6E4A2C",
  // the toy xylophone's playroom: the floor squares, the toy blocks behind the fence, and the rainbow on the
  // wall (whose own color is the playroom mood's sky, in lighting.js)
  matColors: ["#FF6B6B", "#FFD93D", "#6BCB77", "#4D96FF", "#B983FF", "#FF9F45"],
  blockColors: ["#E63946", "#F4A261", "#FFD166", "#06D6A0", "#118AB2", "#8F5BD6"],
  rainbow: ["#E8453C", "#F28C28", "#F6D13A", "#4CB963", "#3E8DDD", "#8E5BD1"], // outside in
  baseboard: "#FFF6E0", // the strip along the bottom of the wall
  floor: "#8FA3C2", // the playroom's foam floor: a soft, greyed blue
  hangingCloud: "#FFFFFF", // the clouds hanging from the playroom ceiling
  cloudCord: "#F4EFE6",
  // the kalimba's beach: the sand where the grass was, and the placeholder sea behind the player
  sand: "#E9D3A0",
  sea: "#2FA3D9",
  foam: "#EAF7FB", // the strip where the sea meets the sand
  // the steel drums' coast (island.js): the island, its palm tree, and the sailboat
  islandSand: "#EFD29A",
  palmTrunk: "#8A5A34",
  palmLeaf: "#3E9A4A",
  coconut: "#5A3A1E",
  boatHull: "#2E5FA8",
  boatDeck: "#D9B07A", // the deck, mast and boom
  sail: "#FFF6E6",
  pennant: "#E0453A",
  shells: ["#FFF3E6", "#F6C9B0", "#F2A98E", "#F4D58A", "#E9B3C4", "#D9C2E8"], // the shells on the sand, one each
  // the fish heads that pop out of the steel drums' sand (fish.js)
  fish: "#F2A33A", // the body, before it's tinted toward the note
  fishBelly: "#FFF1D6",
  fishFin: "#E86A4A",
  fishLips: "#F26D8D",
  fishEye: "#FFFFFF",
  fishPupil: "#141418",
  // the toadstools the kalimba's notes sprout (MUSHROOM_SPROUTS in mushrooms.js)
  mushroomCap: "#D9463B", // tinted toward each note's color
  mushroomSpots: "#FFF3DF",
  mushroomStem: "#EDE2C8",
  mushroomGills: "#C9B48F", // the underside of the cap
  // space, for the vibraphone (space.js)
  moonClay: "#FFFFFF", // the moon underfoot: white clay, like the dollies' moon
  moonUnder: "#3A3F5C", // its cut underside
  planet: "#C77DD8",
  planetRing: "#F2D9A0",
  moon: "#D9D4C7",
  // the handheld's cyber grid (grid.js)
  gridFloor: "#0A2410",
  gridLine: "#46FF7A", // the floor's glowing lines
  gridDome: "#2EE866", // the dome's glow and lines
  // the giant toad behind the kalimba (toad.js)
  toadSkin: "#8C9A4B",
  toadWarts: "#6E7B37",
  toadEye: "#E8B23A",
  toadPupil: "#1E1A14",
  toadMouth: "#3A2E1F",
  // the red stage curtain behind the fence at the piano (layout in curtain.js)
  curtain: "#B3202E",
  curtainValance: "#8C1623", // the short drape along the top
  curtainTrim: "#D9A93A", // the rod and the fringe
  // vibraphone mode: metal bars and the resonator tubes under them
  vibraBar: "#D9DEE6",
  vibraSharp: "#8E98A6",
  vibraFrame: "#AEB7C4", // the steel frame, rails, rack and legs
  resonator: "#D4A93A",
  caster: "#2B2F36",
  // piano mode
  pianoWhite: "#F7F3E8", // the natural keys
  pianoBlack: "#111116", // the black keys
  pianoCase: "#15151A", // the electric piano body, stand, and the stool
  // the blob's caterpillar antennae
  antenna: "#F97639",
  antennaTip: "#434BB1",
  // the stage (stage.js) and its audience of blobs
  stageFloor: "#6B3A1F", // a polished stage: one smooth dark-stained surface
  stageLip: "#17121A", // the black front of the stage
  // the concert hall round the piano (hall.js)
  hallFloor: "#5A1E2C", // burgundy carpet
  hallWall: "#3B2433",
  hallDome: "#2C2A4A",
  hallTrim: "#C9A044", // gilding: pilasters, ribs, cornice and rings
  hallLight: "#FFD9A0", // the sconces and the oculus
  audience: ["#F26D8D", "#58B947", "#2F7FD6", "#F7CF3A", "#8F7CE0", "#F58A2B"],
};


export { COLOR_PALETTE };
