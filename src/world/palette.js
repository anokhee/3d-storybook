import * as THREE from "three";

// A swatch is { hex, vary }. `hex` is the color as authored; `vary` is how
// far a generated instance may drift from it — an OFFSET range, so [0, 0]
// means "always exactly hex". Hue is degrees; sat and bright are 0-1 points
// of HSL saturation and lightness.
// A color authored exactly: no drift at all.
export const solid = (hex) => ({
  hex,
  vary: { hue: [0, 0], sat: [0, 0], bright: [0, 0] },
});

// A block of plasticine: one color, give or take the light on it — a
// NARROW drift, since clay comes in blocks rather than washes.
export const block = (hex) => ({
  hex,
  vary: { hue: [-3, 3], sat: [-0.03, 0.03], bright: [-0.04, 0.04] },
});

// Stock the nouns share by name below, so one change reaches all of them.
const white = solid("#FFFFFF");
const cream = solid("#F2E9DC");
const violet = solid("#7c56be");
const plum = solid("#3B2A4E");
const grape = solid("#6e12c9");

// Every color in the world, grouped by the noun that wears it. Change a
// swatch here and everything painted with it follows.
export const PALETTE = {
  white,
  cream,
  // The sky, and what hangs in it.
  sky: {
    night: solid("#0C121D"),
    stars: solid("#FFF6EF"),
    // What the night sky throws into the shadow side of everything (see
    // r3f/src/refactored/nouns/moon/Moonlight.jsx): a cool blue, so
    // shadow is night rather than gray.
    ambient: solid("#6A8CD6"),
    // ...and what the shade is tinted toward: the night, deep, nearly
    // black.
    shadow: solid("#0B1330"),
    // By day (see LIGHTING.sun): the sky's fill, and the shade's tint —
    // a sky blue, since a sunlit shadow is lit by the sky.
    dayAmbient: solid("#7397c1"),
    dayShadow: solid("#0E1E42"),
  },
  // The sun, by day: its light, its glow in the sky, and the ball itself
  // — its lit face and its rim (see r3f/src/refactored/nouns/sun/).
  sun: {
    light: solid("#FFF1D2"),
    glow: solid("#FFF7E6"),
    body: solid("#FFE27A"),
    shade: solid("#F2A05A"),
  },
  // The spec card's button (see r3f/src/game/Card.jsx): a candy pink that
  // sits warm against the night sky, and the ink on it.
  card: {
    button: solid("#F7A8D3"),
    buttonHover: solid("#F58EC6"),
    buttonInk: solid("#3B1E36"),
  },
  moon: {
    body: white,
    glow: solid("#F5FAF6"),
    // What it reflects of the sun onto the planet's night: the world's key.
    light: solid("#FFD6A4"),
  },
  // The ground, and the haze and clouds round it.
  planet: {
    ground: solid("#DDC8A4"),
    atmosphere: solid("#84b2d4"),
    // The sky by day, from the ground — see Atmosphere.jsx's day shell:
    // overhead, and paler down at the horizon.
    daylight: solid("#6FB2E8"),
    horizon: solid("#C9E4F7"),
    // The clouds by night: a sheer sheet, pale along its top edge and
    // fading out through a bluer wash at the bottom.
    cloud: solid("#E2ECFF"),
    cloudFade: solid("#B4C8F2"),
    // The same by day: white, fading through the sky's own blue.
    dayCloud: solid("#FFFFFF"),
    dayCloudFade: solid("#C9E4F7"),
    // The rings hung round the atmosphere (see r3f/src/refactored/nouns/ring/).
    ring: solid("#F7A8D3"),
  },
  // Grass: the stock green. The blocks a clay field is pinched from are
  // the grass noun's own — see r3f/src/refactored/nouns/grass/palettes.js.
  grass: {
    green: block("#6a8663"),
  },
  // Pebbles: the blocks of stone-colored clay they are rolled from — a
  // warm gray, a slate blue and a pale sand.
  pebble: {
    blocks: [block("#B9B4A8"), block("#8E97A3"), block("#D8CFC0")],
    // Under water: the same stones, wet and dark.
    bed: [block("#5E6B78"), block("#46525E"), block("#7A8794")],
  },
  garlandLights: {
    warm: solid("#FFD092"),
    coral: solid("#FFB084"),
    pink: solid("#F4CEEC"),
  },
  // Flowers: the one middle they all share, and the petal colors. What
  // each kind's petals may be is the flower noun's own — see
  // r3f/src/refactored/nouns/flower/palettes.js.
  flower: {
    pistil: solid("#FFD092"), // one warm yellow for every flower
    pink: solid("#F4CEEC"),
    coral: solid("#FFB084"),
  },
  garland: {
    cord: solid("#262838"),
  },
  post: {
    body: violet,
    cap: violet,
  },
  sign: {
    board: white,
  },
  trampoline: {
    mat: solid("#2E344E"),
    frame: solid("#E8C8C4"),
    skirt: solid("#22263A"),
  },
  // The gachapon, and the parts it and the vending machine share.
  gachapon: {
    globe: solid("#fefff6"),
    lid: solid("#EA85AF"),
    label: white,
    // The little fence on the lid: its posts and their caps.
    buntingPosts: solid("#EA85AF"),
    buntingCaps: solid("#FFD092"),
    star: solid("#FFE27A"),
    base: solid("#EA85AF"),
    feet: solid("#EA85AF"),
    sticker: white,
  },
  dial: {
    face: cream,
    decal: solid("#E5534B"),
  },
  door: {
    dome: cream,
  },
  slot: {
    plate: cream,
    slit: solid("#1B1424"),
  },
  vendingMachine: {
    body: solid("#A366E1"),
    feet: solid("#A366E1"),
    door: solid("#8b4bcb"),
    // The case let into the front: the frame round it, the walls inside,
    // the lit panel at the back, the lamp under the top, the shelves and
    // their labels, and the glass over all of it.
    frame: solid("#8b4bcb"),
    walls: solid("#F2D3E4"),
    panel: solid("#FFF6DC"),
    lamp: solid("#FFE790"),
    shelves: solid("#FFD092"),
    labels: white,
    // The stickers piled on the shelves, dealt round the piles in turn.
    stickers: [
      solid("#F3A9CB"),
      solid("#8FD1A8"),
      solid("#7FB6E6"),
      solid("#F4D46A"),
    ],
    glass: solid("#FFF8E6"),
    // The marquee over the top: its posts and their caps.
    marqueePosts: solid("#8b4bcb"),
    marqueeCaps: solid("#FFD092"),
  },
  // The house: its walls, the roof slabs and the beam along the ridge,
  // the window frames and the lit panes in them, the door and its knob —
  // and the two-story house's garage door and the seams across it.
  house: {
    walls: solid("#F5EBDD"),
    roof: violet,
    ridge: plum,
    frame: white,
    molding: solid("#FBF6EC"),
    pane: solid("#FFF6DC"),
    door: solid("#E5534B"),
    knob: solid("#FFD092"),
    garageDoor: solid("#FBF6EC"),
    garageSeam: solid("#D8CBB6"),
  },
  // The mushroom house: its stem, the cap and the gills under it, the
  // spots on it, the window frames and lit panes, the door and its knob.
  mushroomHouse: {
    stem: solid("#F5EBDD"),
    cap: solid("#E8646A"),
    gills: solid("#F2D3E4"),
    spots: white,
    frame: white,
    pane: solid("#FFF6DC"),
    door: violet,
    knob: solid("#FFD092"),
  },
  // The trailer: its shell, the stripe round it and the roof on it, the
  // vent up top, the window frame and pane, the door and knob, the wheels
  // and their hubcaps, the hitch out front.
  trailer: {
    body: solid("#F4EFE6"),
    stripe: solid("#6FC3C9"),
    roof: solid("#8FD3D8"),
    vent: solid("#D9D9DE"),
    frame: white,
    molding: solid("#FBF6EC"),
    pane: solid("#FFF6DC"),
    door: solid("#E5534B"),
    knob: solid("#FFD092"),
    wheels: plum,
    hubs: solid("#D9D9DE"),
    hitch: plum,
  },
  // The cupcake: its paper case, the cake over its rim, the frosting
  // swirled on top, the cherry and its stem, the sprinkles, the window
  // frames and lit panes, the door and its knob.
  cupcake: {
    cup: solid("#F4A7C0"),
    cake: solid("#E9B872"),
    frosting: solid("#FBE3EE"),
    cherry: solid("#D8323C"),
    stem: solid("#6B8E3D"),
    sprinkles: [
      solid("#FFD166"),
      solid("#6FC3C9"),
      solid("#F26D8D"),
      solid("#9B7BE0"),
      solid("#7ED491"),
    ],
    frame: white,
    pane: solid("#FFF6DC"),
    door: violet,
    knob: solid("#FFD092"),
  },
  // Trees (see r3f/src/refactored/nouns/tree/): the bark, live and dead,
  // and the blocks of green a canopy is pinched from — leaves for a
  // deciduous tree, needles for a conifer — one rolled per tree; and the
  // pinks a flowering tree's blossoms are, one rolled per tree too.
  // Trees: the live bark. What a canopy — or a dead trunk — may be is the
  // tree noun's own — see r3f/src/refactored/nouns/tree/palettes.js.
  tree: {
    bark: block("#8A6A4E"),
  },
  bench: {
    legs: solid("#E8C39E"),
    seat: solid("#CF8F5E"),
    backFrame: solid("#E8C39E"),
    back: solid("#CF8F5E"),
    armrests: solid("#E8C39E"),
  },
  // The fences round a lot (see ENCLOSURE's types): the picket fence's
  // boards and the rails behind them; the wooden fence's posts and rails,
  // in the bench's two woods; the chain link's wire and its posts.
  fence: {
    picket: solid("#F7F3EA"),
    picketRail: solid("#E4DDCD"),
    woodPost: solid("#E8C39E"),
    woodRail: solid("#CF8F5E"),
    chain: solid("#B8C0CC"),
    chainPost: solid("#8E97A6"),
  },
  water: {
    surface: solid("#4FA3D8"),
    // The foam lying on it: off-white, a little of the sky in it.
    foam: solid("#EEF6FB"),
    // A swimming pool: its water, chlorine-clear; the tiles lining it and
    // the grout between them; the coping tiles round its rim and theirs;
    // and the ladder's steel.
    pool: {
      water: solid("#5CC3EA"),
      tile: solid("#A9DCEA"),
      grout: solid("#F3F8FA"),
      border: solid("#F1EBDD"),
      borderGrout: solid("#CEC5B3"),
      ladder: solid("#D6DDE3"),
    },
    // An above-ground pool: the panels of its wall and the rim on top.
    tub: {
      panel: solid("#BFE0EE"),
      band: solid("#7FB8D6"),
      rim: solid("#F6F7F5"),
    },
    // A bath: its porcelain, its clawed feet, the tap over it and the
    // duck afloat in it.
    bath: {
      porcelain: solid("#FBF7F2"),
      feet: solid("#E9C46A"),
      tap: solid("#E9C46A"),
      duck: solid("#FFD23F"),
      beak: solid("#F4845F"),
    },
    // A kiddie pool: its inflatable rings, dealt in turn, and its floor.
    kiddie: {
      rings: [solid("#F48FB1"), solid("#8ED0F0"), solid("#FFE082")],
      floor: solid("#BFE6F5"),
    },
    // A hot spring: milky mineral water, the scum at its edge, the steam
    // off it, and the rocks round it.
    spring: {
      water: solid("#9AD9D2"),
      scum: solid("#F1E9D2"),
      mist: solid("#FFFFFF"),
      steam: solid("#F4FBFB"),
      rocks: [block("#8C8378"), block("#6F6A66"), block("#A69C8E")],
    },
  },
  // The capsule the doll arrives in: its lid and the base it stands in.
  capsule: {
    lid: solid("#EA85AF"),
    base: cream,
  },
  // The dolls: the blocks a doll is pinched from, keyed by name because the
  // grid deals them as an axis (a tab of checkboxes, a ?color= param), and
  // the one paint every eye and mouth is dabbed in.
  dolly: {
    blocks: {
      strawberry: block("#E8646A"),
      tangerine: block("#F2A05A"),
      butter: block("#F4D46A"),
      mint: block("#8FD1A8"),
      sky: block("#7FB6E6"),
      lilac: block("#B79AE0"),
      bubblegum: block("#F3A9CB"),
      cloud: block("#F5F1EA"),
    },
    paint: solid("#2A2331"),
  },
  // A rug on a floor, and the dots raised on it — one color per kind
  // of dot, in the order they are added (see nouns/rug/objects.js).
  rug: {
    wool: solid("#D9705C"),
    dots: [solid("#F6E3C5"), solid("#3B2A4E"), solid("#8FD1A8")],
  },
  // A kitchen counter: its cabinet, the worktop, the basin sunk in it
  // and the tap over that.
  counter: {
    body: solid("#F5EBDD"),
    top: solid("#6FA8C9"),
    basin: solid("#DDE7E3"),
    tap: solid("#E8C39E"),
  },
  // A fridge: its body, its doors and their handles.
  fridge: {
    body: solid("#DDE7E3"),
    door: solid("#F3A9CB"),
    handle: solid("#E8C39E"),
  },
  // A pot plant: its pot, the soil, the stems and the leaves on them.
  potPlant: {
    pot: solid("#D9705C"),
    soil: solid("#3B2A4E"),
    stem: solid("#5FAE6B"),
    leaves: solid("#8FD1A8"),
  },
  // A stick lamp: its base, its pole, and the shade on top.
  stickLamp: {
    base: solid("#3B2A4E"),
    pole: solid("#E8C39E"),
    shade: solid("#FFF6DC"),
  },
  // A wall hanging: its frame, the backing inside it, and the art on that.
  wallHanging: {
    frame: solid("#3B2A4E"),
    backing: solid("#F6E3C5"),
    art: solid("#E5534B"),
  },
  // A chair: its seat, and its frame — the legs and the back.
  chair: {
    seat: solid("#F4D46A"),
    frame: solid("#E8C39E"),
  },
  // A table: its top and its legs.
  table: {
    top: solid("#CF8F5E"),
    legs: solid("#E8C39E"),
  },
  // The couch: its frame — the base and arms — its cushions, its legs.
  couch: {
    frame: solid("#6FA8C9"),
    cushions: solid("#F4D46A"),
    pillows: solid("#E0705E"),
    legs: solid("#E8C39E"),
  },
};

// Ranges that mean "no drift at all" — what a color authored as a bare hex
// gets, since a config writing one is naming an exact color.
const EXACT = { hue: [0, 0], sat: [0, 0], bright: [0, 0] };

// A color the way a CONFIG writes it: `"#fefefe"` for an exact one, or a
// swatch — a PALETTE entry, or one written inline — where the drift matters.
// Everything downstream takes a swatch, so this is the one place the two
// spellings become one.
export function swatchOf(color, where = "colour") {
  const swatch =
    typeof color === "string" ? { hex: color, vary: EXACT } : color;
  if (typeof swatch?.hex !== "string" || !/^#[0-9a-f]{6}$/i.test(swatch.hex))
    throw new Error(
      `${where}: expected "#rrggbb" or a swatch, got ${JSON.stringify(color)}`,
    );
  // A swatch with no `vary` is an exact color spelled the long way, not a
  // broken one — `varied()` would read `undefined.hue` and die downstream.
  return swatch.vary ? swatch : { ...swatch, vary: EXACT };
}

// A list of them, for anything that deals colors round a run: one color
// paints every one, two alternate, three cycle. Empty is a mistake worth
// naming — it would deal `undefined` and paint nothing.
export function swatchList(colors, where = "colours") {
  if (!Array.isArray(colors) || colors.length === 0)
    throw new Error(
      `${where}: expected a non-empty list of colours, got ${JSON.stringify(colors)}`,
    );
  return colors.map((c, i) => swatchOf(c, `${where}[${i}]`));
}

// The color a swatch was authored as. three works in linear light and does
// the conversion itself once you name the space the hex was written in.
export function hue(swatch, target = new THREE.Color()) {
  return target.setStyle(swatch.hex, THREE.SRGBColorSpace);
}

// One roll inside a swatch's vary ranges. Feed it a seeded generator
// (mulberry32) rather than Math.random so a world comes back the same on
// reload.
export function varied(swatch, rand = Math.random, target = new THREE.Color()) {
  hue(swatch, target);
  const { hue: h, sat: s, bright: b } = swatch.vary;
  const pick = ([lo, hi]) => lo + rand() * (hi - lo);
  const clamp = (v) => Math.min(1, Math.max(0, v));
  const hsl = target.getHSL({}, THREE.SRGBColorSpace);
  return target.setHSL(
    (((hsl.h + pick(h) / 360) % 1) + 1) % 1, // hue wraps; the rest clamp
    clamp(hsl.s + pick(s)),
    clamp(hsl.l + pick(b)),
    THREE.SRGBColorSpace,
  );
}

// The sRGB bytes a swatch was packed from, for spots (like a canvas gradient)
// that need `rgba(...)` strings rather than a THREE.Color.
export function bytes(swatch) {
  const n = parseInt(swatch.hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
