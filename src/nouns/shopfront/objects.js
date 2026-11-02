import { solid } from "../../world/palette.js";
import { WINDOW_BOX_PLANTS } from "../windowBox/objects.js";
import { LETTERING_WORDS } from "../lettering/objects.js";
import { FENCE_TYPES } from "../enclosure/objects.js";

// A SHOPFRONT: a low high-street shop, its front facing +z at z = 0, its
// foot on y = 0, centred on x = 0, its body running back along -z.
//   terrace    stood in a row with neighbours at each side: nothing (the
//              cornice, the quoins) reaches past its own sides
//   body       `size` 1, 2 or 3 (a tiny shoppe, a standard one, a double:
//              SHOP_WIDTHS across the front; a tiny one has one shop window
//              and its door at a side) — or `width` itself, if set — `depth` back, the shop floor
//              `ground` tall and each storey over it `storey` tall,
//              `stories` in all (the shop floor counts); `pilaster` the
//              width of the posts at each end of the shopfront, `recess`
//              how far the door and the window's back wall sit in behind
//              the front, `pier` the post between the door and the window
//   sign       the band over the shop floor (the fascia): `height`, the
//              awning hung on it and over that the library's Sign (Buildings/
//              Sign: a clay board) in the sign colour, `board` of the shop's
//              width across and `tall` high, thrown in `clay`
//   door       the doorway `width`, the door in it `height` tall (a little
//              over a character's), a `fanlight` of glass over it at most
//              that tall and panelling over that, on the
//              `side` ("left", "middle" or "right", as you face the shop —
//              in the middle, the shop windows split either side of it); `style`
//              which of the library's doors stands in it — "house" (the
//              House Door, Fixtures/Doors) with a fanlight of glass over
//              it, or "arched" (the Arched Door, Fixtures/Arches)
//   shopWindow   the shop windows, over a low wall `stall` high (`bySize`,
//              if given, any of these laid over for a shop of that `size`): `count`
//              of them side by side, each the library's window (Fixtures/
//              Windows in the storybook: Opening and Molding) — `style`
//              "plain" for one big pane or "pane" for `panes` divided by
//              bars, `topCurve` and `bottomCurve` its top and bottom edges
//              each 0 square to 1 a half-round arch, `frame` its bezel's
//              width and `trim` its moulding's, `gap` the wall left between
//              and round them (or, `sets` over 1, in that many groups,
//              `setGap` of wall between each and at the ends); none
//              wider than `widest`, if set (the wall taking up the rest);
//              `glass` makes the pane see-through — the
//              vending machine's glowing glass (`glassLight`), the shop
//              floor a room behind it, lit warm (`room`, with a `lamp`);
//              `tiny` a tiny shop's decoration in place of café or
//              umbrella tables (which its front can't spare the room for);
//              `decoration` what stands on the pavement in front of them —
//              one of SHOP_DECORATIONS: "none", "window box" (one under
//              each, see windowBox), "bench" (the library's Wooden Bench
//              along each stretch of them, see bench) "café tables" (its
//              Café Table, see cafeTables) or "umbrella tables" (the same
//              with a parasol up through each)
//   goods      the window display, behind see-through shop windows: `on`,
//              shelves at `shelves` (shares of the window's height up from
//              its foot), `depth` deep, in `wood`, of `style` goods ("boxes",
//              "cakes", "flowers", "books", or "cafe": the library's Mugs,
//              Teapots and Bowls on bare boards, as the café kitchen's shelf has
//              them — see shelving/crockery.js) in `colors`, `seed` for
//              their scatter; they are their own colour at any hour, so they
//              glow behind the glass as a vending machine's do; `bySize`, any
//              of these laid over for a shop of that size (as the shop windows')
//   windowBox  the window boxes (the library's Window Box, the cupcake
//              house's), under the shop windows on the ground (a shop
//              window `decoration`) and under the story windows in place of
//              their sills (`storyWindow.box`): in `color` with `soil`, growing
//              `flowers` of any pot plant `kind` in `colors` (one or two, to go
//              with the front: each kind its own); `shop` and
//              `story` their sizes — `height`, `depth`, the plants `radius`
//              big on stems `stem` long, one every `every` along
//   garland    a string of lit bulbs (the library's Garland), `on` or not:
//              looped along the awning's front edge (or under the sign
//              band, with no awning), tied every `every` across, dipping
//              `sag` of each loop, bulbs `bulb` big every `spacing` on
//              strings `drop` long, in `colors` (null: the Garland's own)
//   roof       `style` "flat" (a cornice along the top), "pitched" —
//              `facing` "front" (a gable end to the street, with a round
//              window in it) or "side" (the ridge along the street) — or
//              "dormer": the ridge along the street with `dormers` windows
//              out of its front slope, each `dormer.width` wide and up to
//              `height` tall, `back` up the slope from the eave, roofed in a
//              little gable of `pitch`, its window the story windows' look;
//              `pitch` its slope, rise over run; `overhang` past the walls
//              (not past the sides in a terrace); slabs `thick`, in the
//              roof colour
//   bench      the Wooden Bench (its `colors`, if given: `wood` the
//              seat and back, `frame` the rest), at `scale` (its seat at a character's
//              knee), at most `width` long (in its own units; less to fit),
//              its middle `out` from the front
//   cafeTables the Café Table (table, chairs either side; for "umbrella
//              tables" a parasol too, only where there is no awning over
//              it), one every `every` along
//              each stretch of window that has room, `out` from the front;
//              `chairs`, if set, over its chairs' (`color` the seat,
//              `legColor` the frame: a café's, its chairs inside)
//   quoins     the corner blocks up each side of the front, over the shop
//              floor (an accent trim): `on`, `course` tall with `joint`
//              between, `long` and `short` across in turn, standing `out`
//              off the wall; `wrap` round the side too (off in a terrace,
//              where a neighbour stands there), in the quoin colour
//   awning     `on` or not; over the door and the window, hung `lift` up the sign band
//              (the board over it): `depth`
//              out from the front, sloping `drop` down to its front edge,
//              striped every `stripe` in the awning and stripe colours, a
//              scalloped valance `valance` deep along its edge
//   balconies  the flats upstairs: `on` or not — a balcony at each storey's
//              windows, its floor a slab of the pavement's paving (the
//              library's, world/paving.js) `thick` through and `depth` out
//              from the wall, `pad` past the window each side (windows
//              whose balconies would come within `join` share one), `lift` over the storey's floor
//              (clear of the sign band under the first), in the
//              `pavement` colour; railed on its three open sides with the
//              library's fence of the `railing` type (FENCE_TYPES:
//              "wroughtIron" — Fixtures/Fences/Wrought Iron Fence — or
//              "picket", "wooden", "chainlink", "posts"), shrunk whole to
//              `height`, its posts at most `spacing` apart; `boxes`, a
//              window box hung on the slab's front edge, at the foot of the
//              railing outside it (the story windows' size),
//              in place of the story windows' own, growing `plants` (one of
//              WINDOW_BOX_PLANTS, or "same": the shop's window boxes' kind);
//              `spirits`, the `chance` each balcony has a Shadow Spirit out
//              on it, stood in one of `poses` ("stand", "smoke": having a
//              cigarette), who and where fixed by `seed`
//   storyWindow  the windows on each storey over the shop floor: `count`
//              in a row (4: two each side), in two groups either side of
//              the middle — `between` apart within a group, `middle` between
//              the groups, `margin` in from the quoins — each `width` by
//              `height` or as wide as its slot allows (if that is under
//              `least`, two fewer), with a sill — the same
//              library window, with the same `style`, `panes`, `topCurve`,
//              `bottomCurve`, `frame`, `trim` (`count` 1: one in the middle,
//              a standard shop's size; `bySize` as the shop windows'); or,
//              `match`, each the shop
//              windows' size and shape, one straight over each of them
//              (no taller than `most` of the storey)
//   colors     the walls, the trim (posts, window frames, sills, the
//              cornice), the awning and its stripe, the sign board, the
//              door, the dark behind the door's glass, that glass; `frame`,
//              if set, the windows' frames and mouldings in place of the trim's
// What may stand on the pavement in front of the shop windows.
export const SHOP_DECORATIONS = ["none", "window box", "bench", "café tables", "umbrella tables"];

// How wide a shop is, by its `size`: 1 a tiny shoppe, 2 a standard one,
// 3 a double.
export const SHOP_WIDTHS = { 1: 3.0, 2: 4.4, 3: 6.6 };

export const SHOPFRONT = {
  terrace: false,
  body: { size: 2, width: null, depth: 5, ground: 3.85, storey: 2.6, stories: 2, pilaster: 0.25, recess: 0.45, pier: 0.18 },
  // (`say`: what the board says, in the library's Lettering — the font's
  // glyphs as they come, nothing wrong with them — or null for a blank
  // board; `text`: the rest of that lettering (font, or how `wrong`) over
  // LETTERING's own. Its colour is the trim's unless colors.lettering says)
  sign: { height: 1.15, board: 0.8, tall: 0.68, clay: { amount: 0.4, seed: 14 }, say: null, text: {} },
  // the door a little over a character's height (the Human stands about
  // 1.36; the car game's houses fit theirs to it exactly), a short pane of
  // glass over it, panelling over that
  door: { width: 0.85, height: 1.65, fanlight: 0.42, side: "right", style: "house" },
  shopWindow: { decoration: "none", glass: true, glassLight: { type: "glowing", showBulb: false, alpha: 0.14, frost: 0.3, brightness: 0.5, pulse: 0 }, stall: 0.5, count: 1, style: "pane", panes: 6, topCurve: 0, bottomCurve: 0, frame: 0.07, trim: 0.1, gap: 0.2 },
  goods: { on: true, style: "boxes", colors: ["#E07A6B", "#F2C94C", "#6FA35A", "#A9B8E0", "#F2E9DC"], shelves: [0.12, 0.55], depth: 0.32, wood: "#8A5A3C", seed: 3 },
  windowBox: {
    color: solid("#A8744F"),
    soil: solid("#4A3322"),
    flowers: { kind: "daisy", colors: [solid("#F2C94C"), solid("#FFFFFF")], stemColor: solid("#6B8E3D") },
    shop: { height: 0.42, depth: 0.32, radius: 0.15, stem: 0.18, every: 0.42, forward: 0.15 },
    // (the story ones deep, their flowers along the front edge, well out
    // past the window's pane — it stands 0.2 off the wall — so none reach
    // back into it)
    story: { height: 0.16, depth: 0.42, radius: 0.1, stem: 0.1, every: 0.3, forward: 0.3 },
  },
  balconies: { on: false, depth: 0.8, thick: 0.14, lift: 0.1, pad: 0.25, join: 0.5, pavement: "#C9BFB2", railing: "wroughtIron", height: 0.85, spacing: 1.2, boxes: true, plants: "same", spirits: { chance: 0, poses: ["stand", "smoke"], seed: 1 } },
  garland: { on: false, every: 1.1, sag: 0.18, spacing: 0.28, bulb: 0.045, drop: 0.07, colors: null },
  roof: { style: "flat", facing: "front", pitch: 0.75, overhang: 0.18, thick: 0.1, dormers: 2, dormer: { width: 1.0, height: 1.0, back: 0.5, pitch: 0.8 } },
  bench: { scale: 0.21, width: 7, out: 0.32, colors: null },
  cafeTables: { every: 1.9, out: 0.75, chairs: null },
  quoins: { on: true, wrap: true, course: 0.24, joint: 0.05, long: 0.42, short: 0.28, out: 0.04 },
  awning: { on: true, lift: 0.3, depth: 1.3, drop: 0.55, stripe: 0.32, valance: 0.14 },
  storyWindow: { box: false, match: false, most: 0.7, count: 4, middle: 0.6, between: 0.22, margin: 0.12, least: 0.42, width: 0.8, height: 1.2, style: "pane", panes: 4, topCurve: 0, bottomCurve: 0, frame: 0.06, trim: 0.08 },
  colors: {
    wall: solid("#F2E9DC"),
    trim: solid("#3B6E8F"),
    awning: solid("#3B6E8F"),
    stripe: solid("#F2E9DC"),
    sign: solid("#F2C94C"),
    door: solid("#3B6E8F"),
    interior: solid("#3A3550"),
    room: solid("#D8B48C"),
    roof: solid("#5B4A6B"),
    quoin: solid("#C9A07A"),
    lamp: solid("#FFF1C9"),
    glass: solid("#BFE3EC"),
  },
};

// Shops in colourways of their own, each laid over SHOPFRONT.
export const SHOPFRONT_KINDS = {
  "general store": {},
  // two big picture windows, one clear pane each: no bars, no arch
  bakery: {
    door: { side: "left" },
    shopWindow: { count: 2, style: "plain", topCurve: 0 },
    roof: { style: "pitched", facing: "front" },
    goods: { style: "cakes", colors: ["#F6E3C8", "#F2A7C3", "#FFF4EA", "#8A5A3C", "#F2C94C"] },
    // upstairs, its windows the shop windows' over again: the same size and
    // shape, one over each
    storyWindow: { match: true },
    windowBox: { flowers: { colors: [solid("#E07A8B"), solid("#FFF4EA")] } },
    colors: { quoin: solid("#FFF4EA"), wall: solid("#F6D6C8"), trim: solid("#8A5A3C"), awning: solid("#E07A8B"), stripe: solid("#FFF4EA"), sign: solid("#FFF4EA"), door: solid("#8A5A3C") },
  },
  florist: {
    body: { stories: 1 },
    sign: { say: "florist" },
    shopWindow: { style: "pane", panes: 4, topCurve: 0.35, decoration: "window box" },
    storyWindow: { box: true },
    windowBox: { flowers: { kind: "tulip", colors: [solid("#F2A7C3"), solid("#FFFFFF")] } },
    goods: { style: "flowers", colors: ["#F2A7C3", "#E5484D", "#F2C94C", "#FFFFFF", "#C4A3D9"] },
    colors: { quoin: solid("#F2E9DC"), wall: solid("#DCE8D0"), trim: solid("#4F7A4A"), awning: solid("#4F7A4A"), stripe: solid("#FFFFFF"), sign: solid("#F2A7C3"), door: solid("#4F7A4A") },
  },
  café: {
    door: { style: "arched" },
    sign: { say: "cafe" },
    // the café's windows inside, on the street too: slim arches about as
    // wide as those down its walls (half a metre), each in seven panes —
    // two across and three up, the arch the seventh — as many as fit:
    // two in a tiny one, four in a standard one; in a big one six, in three
    // pairs spaced evenly along it
    shopWindow: { count: 4, style: "pane", panes: 7, topCurve: 1, frame: 0.05, trim: 0.04, gap: 0.08, widest: 0.5, decoration: "café tables", bySize: { 1: { count: 2 }, 3: { count: 6, sets: 3, setGap: 0.3 } } },
    // (in a tiny one, its two shelves up off the window's foot and closer together)
    goods: { style: "cafe", colors: ["#F2E9DC", "#2F2A36", "#C9573F", "#F2C94C"], bySize: { 1: { shelves: [0.36, 0.62] } } },
    // upstairs, a tiny one has one window in the middle, a standard one's size
    storyWindow: { topCurve: 1, panes: 2, bySize: { 1: { count: 1 } } },
    windowBox: { flowers: { colors: [solid("#F2C94C"), solid("#F2E9DC")] } },
    colors: { quoin: solid("#E8D8C0"), wall: solid("#C9573F"), trim: solid("#2F2A36"), awning: solid("#2F2A36"), stripe: solid("#F2E9DC"), sign: solid("#F2C94C"), door: solid("#2F2A36") },
  },
  bookshop: {
    body: { stories: 3 },
    door: { side: "left", style: "arched" },
    shopWindow: { panes: 8 },
    roof: { style: "pitched", facing: "side" },
    goods: { style: "books", colors: ["#B8433B", "#3E5C76", "#F2E9DC", "#4F7A4A", "#F2C94C", "#2F2A36"] },
    windowBox: { flowers: { colors: [solid("#B8433B"), solid("#F2E9DC")] } },
    colors: { quoin: solid("#F2E9DC"), wall: solid("#3E5C76"), trim: solid("#F2E9DC"), awning: solid("#B8433B"), stripe: solid("#F2E9DC"), sign: solid("#F2E9DC"), door: solid("#B8433B") },
  },
  // a block of flats' way in: navy and brass, tall, its door in the middle
  // under an arch, nothing in the windows for sale
  lobby: {
    body: { stories: 3 },
    door: { side: "middle", style: "arched" },
    shopWindow: { style: "pane", panes: 6, topCurve: 0.35 },
    goods: { on: false },
    windowBox: { flowers: { colors: [solid("#F2E9DC")] } },
    colors: { quoin: solid("#F2E9DC"), wall: solid("#2F3A56"), trim: solid("#C9A45C"), awning: solid("#2F3A56"), stripe: solid("#C9A45C"), sign: solid("#C9A45C"), door: solid("#C9A45C"), room: solid("#EDE4D3") },
  },
  // a hair salon: blush pink and black, bottles of shampoo in the window
  salon: {
    door: { style: "arched" },
    shopWindow: { style: "pane", panes: 2, topCurve: 0.6 },
    goods: { style: "bottles", colors: ["#F2A7C3", "#F7F4EE", "#C4A3D9", "#A9C4D9", "#2F2A36"] },
    windowBox: { flowers: { colors: [solid("#F7F4EE"), solid("#E8A0B4")] } },
    colors: { quoin: solid("#F7F4EE"), wall: solid("#F2C9D3"), trim: solid("#2F2A36"), awning: solid("#2F2A36"), stripe: solid("#F2C9D3"), sign: solid("#F7F4EE"), door: solid("#2F2A36"), room: solid("#FBEFF1") },
  },
  // open late: bright and plain, green and white, drinks in the window
  "convenience store": {
    shopWindow: { style: "plain", topCurve: 0 },
    goods: { style: "bottles", colors: ["#E5484D", "#3B6E8F", "#F2C94C", "#6FA35A", "#F7F4EE"] },
    windowBox: { flowers: { colors: [solid("#F2C94C")] } },
    colors: { quoin: solid("#DDE3E6"), wall: solid("#F4F6F5"), trim: solid("#2E7D5B"), awning: solid("#2E7D5B"), stripe: solid("#F4F6F5"), sign: solid("#F2C94C"), door: solid("#2E7D5B"), room: solid("#F4F6F5") },
  },
};

// The knobs for one of its windows, at `path` ("shopWindow" or
// "storyWindow"), each named after it.
export const windowKnobs = (path, name) => ({
  [`${path}Style`]: { path: `${path}.style`, options: ["plain", "pane"], name: `${name} style` },
  [`${path}Panes`]: { path: `${path}.panes`, range: [1, 12, 1], name: `${name} panes` },
  [`${path}Top`]: { path: `${path}.topCurve`, range: [0, 1, 0.05], name: `${name} top arch` },
  [`${path}Bottom`]: { path: `${path}.bottomCurve`, range: [0, 1, 0.05], name: `${name} bottom arch` },
});

export const SHOPFRONT_KNOBS = {
  size: { path: "body.size", options: [1, 2, 3], name: "size (1 tiny, 2 standard, 3 double)" },
  stories: { path: "body.stories", range: [1, 4, 1] },
  doorSide: { path: "door.side", options: ["left", "middle", "right"], name: "door side" },
  doorStyle: { path: "door.style", options: ["house", "arched"], name: "door style" },
  signWidth: { path: "sign.board", range: [0.3, 0.95, 0.01], name: "sign width" },
  signHeight: { path: "sign.tall", range: [0.2, 0.9, 0.01], name: "sign height" },
  signSay: { path: "sign.say", options: ["", ...LETTERING_WORDS], name: "sign says" },
  decoration: { path: "shopWindow.decoration", options: SHOP_DECORATIONS, name: "shop decoration" },
  storyBoxes: { path: "storyWindow.box", bool: true, name: "story window boxes" },
  boxPlant: { path: "windowBox.flowers.kind", options: WINDOW_BOX_PLANTS, name: "window box plants" },
  boxColor: { path: "windowBox.color.hex", color: true, name: "window box color" },
  roof: { path: "roof.style", options: ["flat", "pitched", "dormer"], name: "roof" },
  dormers: { path: "roof.dormers", range: [1, 3, 1], name: "dormers" },
  roofFacing: { path: "roof.facing", options: ["front", "side"], name: "roof facing" },
  roofPitch: { path: "roof.pitch", range: [0.2, 1.6, 0.05], name: "roof pitch" },
  roofColor: { path: "colors.roof.hex", color: true, name: "roof color" },
  quoins: { path: "quoins.on", bool: true, name: "quoins (corner blocks)" },
  quoinColor: { path: "colors.quoin.hex", color: true, name: "quoin color" },
  storyWindows: { path: "storyWindow.count", range: [2, 6, 2], name: "story windows per row" },
  awning: { path: "awning.on", bool: true, name: "awning" },
  garland: { path: "garland.on", bool: true, name: "garland lights" },
  balconies: { path: "balconies.on", bool: true, name: "balconies (upstairs)" },
  balconyRailing: { path: "balconies.railing", options: FENCE_TYPES, name: "balcony railing" },
  balconyBoxes: { path: "balconies.boxes", bool: true, name: "balcony window boxes" },
  balconySpirits: { path: "balconies.spirits.chance", range: [0, 1, 0.05], name: "balcony spirits (chance someone's out on each)" },
  balconySeed: { path: "balconies.spirits.seed", range: [1, 40, 1], name: "balcony spirits seed (who, where)" },
  balconyPlants: { path: "balconies.plants", options: ["same", ...WINDOW_BOX_PLANTS], name: "balcony box plants (same: as the window boxes)" },
  awningHeight: { path: "awning.lift", range: [0, 0.6, 0.05], name: "awning height" },
  seeThrough: { path: "shopWindow.glass", bool: true, name: "see-through shop window" },
  display: { path: "goods.on", bool: true, name: "window display" },
  goodsStyle: { path: "goods.style", options: ["boxes", "cakes", "flowers", "books", "cafe"], name: "goods" },
  ...windowKnobs("shopWindow", "shop window"),
  shopWindowCount: { path: "shopWindow.count", range: [1, 3, 1], name: "shop windows" },
  ...windowKnobs("storyWindow", "story window"),
  awningDepth: { path: "awning.depth", range: [0.4, 2.5, 0.05], name: "awning depth" },
  wallColor: { path: "colors.wall.hex", color: true, name: "wall color" },
  trimColor: { path: "colors.trim.hex", color: true, name: "trim color" },
  awningColor: { path: "colors.awning.hex", color: true, name: "awning color" },
  stripeColor: { path: "colors.stripe.hex", color: true, name: "stripe color" },
  signColor: { path: "colors.sign.hex", color: true, name: "sign color" },
  doorColor: { path: "colors.door.hex", color: true, name: "door color" },
};

// Each kind's own choices, there only for that kind (each shop is its own
// thing: no café tables or café crockery on a florist, no florist's
// flowers in a café's window): by knob, which option belongs to which
// kind. Options not listed are every kind's. `shopfrontKnobsOf(kind)`:
// SHOPFRONT_KNOBS with the other kinds' options left out; and
// `decorationsOf(kind)`, the decorations a shop of that kind can have.
export const SHOPFRONT_OPTIONS_OWN = {
  goodsStyle: { cafe: "café", flowers: "florist" },
  decoration: { "café tables": "café", "umbrella tables": "café" },
  signSay: { cafe: "café", florist: "florist", flowers: "florist", bakery: "bakery", books: "bookshop", salon: "salon" },
};
const ownTo = (knob, kind) => (o) => { const k = SHOPFRONT_OPTIONS_OWN[knob]?.[o]; return !k || k === kind; };
export const decorationsOf = (kind) => SHOP_DECORATIONS.filter(ownTo("decoration", kind));
export const shopfrontKnobsOf = (kind) => Object.fromEntries(Object.entries(SHOPFRONT_KNOBS).map(([name, k]) =>
  [name, SHOPFRONT_OPTIONS_OWN[name] && k.options ? { ...k, options: k.options.filter(ownTo(name, kind)) } : k]));


// THE SHOP FLOOR'S FRONT, laid out (pure; the Shopfront draws it from the
// street, the Shop Interior from inside, so the two always match): across
// it between the pilasters, the door at one side (or in the middle), a
// pier beside it (one each side, in the middle), and the shop windows
// filling the rest — one stretch of them, or two either side of a middle
// door, each stretch its share of the windows; a tiny shoppe (size 1)
// has one shop window (unless its `bySize` 1 asks for more: a café's
// two slim arches), and so its door at a side. `S` a whole shopfront
// config (SHOPFRONT's, filled in). Gives the width `W`, `under` (the top
// of the openings, the sign's foot), the door's `doorX`, `dw` and
// `hinge` (its knob on the side away from it), the `piers`' middles, the
// `stretches` ({ x0, x1, n }), each window's `slots` ({ x, w }), their
// `showFoot` and `showH`, and `show` (the shopWindow, a tiny's at one,
// or its `bySize` 1 count).
export function shopFloorOf(S) {
  const W = S.body.width ?? SHOP_WIDTHS[S.body.size] ?? SHOP_WIDTHS[2], P = S.body.pilaster, pier = S.body.pier;
  const under = S.body.ground - S.sign.height;
  const tiny = W <= SHOP_WIDTHS[1] + 1e-6 || S.body.size === 1; // (a tiny café's room is wider than its front, but still a tiny front)
  const middle = S.door.side === "middle" && !tiny;
  const s = middle ? 0 : S.door.side === "left" ? -1 : 1;
  const hinge = s || 1;
  const inner = W / 2 - P, dw = S.door.width, doorX = s * (inner - dw / 2);
  const piers = middle ? [-(dw / 2 + pier / 2), dw / 2 + pier / 2] : [s * (inner - dw - pier / 2)];
  const own = { ...S.shopWindow, ...(S.shopWindow.bySize?.[S.body.size] ?? {}) };
  const stall = own.stall;
  // (a tiny one's café or umbrella tables, which its narrow front can't
  // spare the pavement for, give way to its `tiny` decoration if it has one:
  // a window box or a bench)
  const tables = own.decoration === "café tables" || own.decoration === "umbrella tables";
  const deco = tiny && tables && own.tiny ? { decoration: own.tiny } : {};
  const show = tiny ? { ...own, count: S.shopWindow.bySize?.[1]?.count ?? 1, ...deco } : own, edge = show.frame + show.trim;
  const stretches = middle
    ? [-1, 1].map((e) => ({ x0: e < 0 ? -inner : dw / 2 + pier, x1: e < 0 ? -(dw / 2 + pier) : inner, n: Math.max(1, Math.ceil(show.count / 2)) }))
    : [{ x0: Math.min(-s * inner, s * (inner - dw - pier)), x1: Math.max(-s * inner, s * (inner - dw - pier)), n: show.count }];
  // each stretch's windows: its own slots, each less its frame and moulding
  const showH = under - stall - 2 * edge - show.gap;
  const showFoot = stall + edge + show.gap / 2;
  // (in `sets`, if more than one: that many groups along the stretch, the
  // same wall, `setGap`, between each and at its ends, its windows close
  // together within a group)
  const slots = stretches.flatMap((z) => {
    const sets = Math.max(1, Math.min(z.n, Math.round(show.sets ?? 1)));
    if (sets > 1) {
      const per = Math.max(1, Math.round(z.n / sets)), sg = show.setGap ?? 0.3;
      const span = (z.x1 - z.x0 - (sets + 1) * sg) / sets, slot = span / per;
      return Array.from({ length: sets * per }, (_, k) => {
        const j = Math.floor(k / per), i = k % per;
        return { x: z.x0 + sg + j * (span + sg) + (i + 0.5) * slot, w: Math.min(show.widest ?? Infinity, slot - 2 * edge - show.gap) };
      });
    }
    const slot = (z.x1 - z.x0) / z.n;
    return Array.from({ length: z.n }, (_, i) => ({ x: z.x0 + (i + 0.5) * slot, w: Math.min(show.widest ?? Infinity, slot - 2 * edge - show.gap) }));
  });
  return { W, under, tiny, middle, s, hinge, inner, dw, doorX, piers, stall, show, edge, stretches, slots, showH, showFoot };
}
