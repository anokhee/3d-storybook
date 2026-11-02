import { merge } from "../../world/merge.js";
import { SHOPFRONT, SHOPFRONT_KINDS, SHOP_WIDTHS, SHOP_DECORATIONS, decorationsOf } from "../shopfront/objects.js";
import { crockery, kitchenware } from "../shelving/crockery.js";
import { solid } from "../../world/palette.js";
import { WINDOW_BOX_PLANTS } from "../windowBox/objects.js";
import { WALL_HANGING_KIND_NAMES } from "../wallHanging/objects.js";
import { applyLayout, layoutFor, mirrorLayout } from "../../world/furnish.js";

// A SHOP INTERIOR: the inside of one of the library's Shopfronts, as a
// dolls' house — its front open to the street, the floor and the three
// walls round it, the pilasters, piers and the low stall walls that framed
// the glass still standing, the door swung open inward — furnished for
// the shop's kind and size, the same every time by its `seed`: a counter
// across the back with a stool behind it for the shopkeeper, and then
//   café            no counter across the back: one by the front instead,
//                   against the side wall away from the door, mugs and a teapot along it;
//                   a metal swing door in the back wall through to a kitchen
//                   behind (a sink, a stove, counters, a fridge in a roomy
//                   one); arched windows in pairs down the side walls, one
//                   big rectangular one in the back wall into the kitchen
//                   (none in a tiny one); tables fitted in between. A tiny one has its host stand at the back
//                   instead, a wall hanging over it, and two tables, side
//                   by side parallel to the door or one behind the other
//                   (`tinySeating`); a standard one, three tables in a line
//                   front to back, out from the back wall
//   bakery          shelves of cakes on the back wall, a tray of them along
//                   the counter, a table to sit at
//   florist         pot plants of every kind along both walls, a table of
//                   cut flowers in the middle
//   bookshop        books up both long walls, a rug, an armchair under a lamp
//   general store   boxes and tins up both walls, a fridge, an island of more
//   lobby           no counter across the back: a welcome mat inside the
//                   door, the concierge's desk at the back with the concierge
//                   stood behind it, a wall of mailboxes, a lift's doors, a
//                   blue-grey carpet
//   salon           no counter across the back: mirrors down the wall away
//                   from the door, a shelf of bottles under each and a salon
//                   chair before it, the stylist stood behind the first; wash
//                   basins at the back with chairs tipped back before them;
//                   chairs under hood dryers on the door's side; a checkered
//                   floor
//   convenience store  no counter across the back: glass-door coolers of
//                   drinks down both walls and along the back, an aisle (two
//                   in a double) of goods down the middle, the till by the
//                   front with the shopkeeper stood behind it
// and a clock over the counter, a picture on the wall, pendant lights.
// It lies in the shopfront's own frame: its front at z = 0 facing +z, its
// foot on y = 0, centred on x = 0, the room running back along -z.
//   kind     which it is furnished as: one of SHOP_KINDS (the Shopfront's
//            colourways: "general store", "bakery", "florist", "café", "bookshop")
//   shop     the shop this is the inside of, laid over the Shopfront's
//            defaults and its kind's colourway: its `body.size`, `door.side`,
//            `colors`… (on the street, the shop's own config, whole)
//   seed     for the layout's chances and the goods' scatter
//   scale    the library's furniture is in its own units, shrunk by this to
//            sit beside the characters (as the café tables are)
//   keeper   a stool behind the counter (someone sits on it: see `seat`)
//   lights   pendant lights from where the ceiling would be: `count` of
//            them, their `glow` (the Pendant Light's)
//   floors   the floor's colour, by kind; `pots` the pot plants' colours
//   widths   a room wider than its shopfront, by kind then size (the tiny
//            café's, for room round its tables): its `body.width`
//   curtains on a café's arched windows, `on` or not: a Curtain each
//            (Furniture/Wall Decor/Curtain), floor to ceiling — its rod
//            `rodHeight` up (null: just under the ceiling), hanging `length`
//            (null: to just off the floor) — one to a pair of windows, on
//            a rod across both, reaching `over` past them each side — and
//            any of CURTAIN's fields
//            (`open`, `pleats`, `color`, `pattern`, `dot`…)
//   tileFloor  a café's floor: a Tile Floor's config (Flooring/Tile Floor),
//            over its style's; `kitchenFloor` its kitchen's (a checker).
//            `floorOutline` "on" or "off" puts the square outline on its
//            tiles or takes it off, whatever the style says ("style": as it says)
//   tinySeating  how a tiny café's two tables stand: "side by side", a row
//            across the middle parallel to the door, chairs front and back;
//            "front to back", one behind the other down the middle, chairs
//            either side across the room; or "any", one of them by `seed`
//   cafeStyle  a café's look (CAFE_STYLES): "upscale", "casual",
//            "breakfast", "quirky", or "any" — one of them by its `seed`
//            (as on the street; the knob offers only the four). It colours
//            the room, the floor, the tables and chairs, the crockery, the
//            curtains and the lamp shades (over the shop's own colourway;
//            the curtains' and floor's set outright win)
//   floristStyle  a florist's look (FLORIST_STYLES): "basic", "modern",
//            "rustic", "witchy", or "any" — one of them by its `seed`, as `cafeStyle`
//            is a café's. It colours the room, the floor, the pots and the
//            plants in them, and the front on the street
//   diners   the chance each café chair has someone sat in it (spirits;
//            on the street, whoever the street sits there instead)
//   concierge  a lobby's, stood behind its desk
//   tiles    a convenience store's and a salon's floors: a Tile Floor's
//            config each (Flooring/Tile Floor), by kind
//   staff    a café's: its `host`, stood behind the host stand, and its
//            `chef`, pacing up and down the kitchen at `pace` (shadow
//            spirits, as the crowd on the street; see ShopInterior)
//   outside  the shop's outside, out past its front as on the street —
//            `on` or not: a strip of pavement `depth` deep, `thick` down
//            from its top (a hair over the ground, as the floor; the library's
//            paving, in the `pavement` colour), the shop windows'
//            `decoration` on it (window boxes, a bench, café tables), and
//            the shop's awning and garland lights, if it has them
//   layout   the furniture moved about by hand, over what the plan puts
//            there (world/furnish.js: `move` by item id, `drop`, `add`) —
//            made in the interiors editor (`npm run interiors`) and pasted
//            here, or into a café's or florist's style (its `layout`, bare
//            or keyed by the shop's size), or a kind's own (KIND_LAYOUTS,
//            by size); null, the plan as it is, or the kind's own
export const SHOP_KINDS = Object.keys(SHOPFRONT_KINDS);
export const SHOP_INTERIOR = {
  kind: "general store",
  shop: {},
  seed: 1,
  scale: 0.27,
  keeper: true,
  lights: { count: 2, glow: { intensity: 7, distance: 8 }, shade: 0.42 }, // indoors, half the Pendant Light's own
  widths: { "café": { 1: 3.6 } },
  staff: { host: true, chef: true, pace: 0.55 },
  concierge: true,
  tiles: {
    salon: { tile: { size: 0.35, layout: "checker", color: { hex: "#F7F4EE" }, alt: { hex: "#2F2A36" }, outline: { on: false } }, grout: { color: { hex: "#CFC8C0" } }, mosaic: { on: false } },
    "convenience store": { tile: { size: 0.45, color: { hex: "#EEF1F1" }, outline: { on: false } }, grout: { color: { hex: "#C9CFD2" } }, mosaic: { on: false } },
  },
  diners: 0.5,
  curtains: { on: true, open: 0.55, rodHeight: null, length: null, over: 0.18 },
  cafeStyle: "any",
  floristStyle: "any",
  tinySeating: "any",
  tileFloor: {},
  kitchenFloor: { tile: { size: 0.22, layout: "checker", color: { hex: "#F7F4EE" }, alt: { hex: "#2F2A36" } }, grout: { color: { hex: "#BDB6AA" } }, mosaic: { on: false } },
  floors: { "café": "#8A5A3C", lobby: "#7F8A99", salon: "#F7F4EE", "convenience store": "#EEF1F1", bakery: "#E3D5C3", florist: "#A39A90", bookshop: "#5C4033", "general store": "#C9BFB2" },
  pots: ["#C8744B", "#E07A6B", "#3B6E8F", "#F2E9DC", "#4F7A4A", "#F2C94C"],
  outside: { on: true, depth: 1.8, thick: 0.15, pavement: "#C9BFB2" },
  layout: null,
};

export const SHOP_INTERIOR_KNOBS = {
  kind: { path: "kind", options: SHOP_KINDS },
  cafeStyle: { path: "cafeStyle", options: ["upscale", "casual", "breakfast", "quirky"], value: "upscale", name: "café style" },
  floristStyle: { path: "floristStyle", options: ["basic", "modern", "rustic", "witchy"], value: "basic", name: "florist style" },
  size: { path: "shop.body.size", options: [1, 2, 3], name: "size (1 tiny, 2 standard, 3 double)" },
  doorSide: { path: "shop.door.side", options: ["left", "middle", "right"], name: "door side" },
  seed: { path: "seed", range: [1, 60, 1] },
  keeper: { path: "keeper", bool: true, name: "shopkeeper's stool" },
  lights: { path: "lights.count", range: [0, 4, 1] },
  host: { path: "staff.host", bool: true, name: "café host" },
  chef: { path: "staff.chef", bool: true, name: "café chef" },
  concierge: { path: "concierge", bool: true, name: "lobby concierge" },
  outside: { path: "outside.on", bool: true, name: "decoration out front" },
  decoration: { path: "shop.shopWindow.decoration", options: SHOP_DECORATIONS, name: "shop decoration (out front)" },
  awning: { path: "shop.awning.on", bool: true, name: "awning (out front)" },
  garland: { path: "shop.garland.on", bool: true, name: "garland lights (out front)" },
  diners: { path: "diners", range: [0, 1, 0.05], name: "diners (chance a chair is sat in)" },
  curtains: { path: "curtains.on", bool: true, name: "curtains" },
  curtainOpen: { path: "curtains.open", range: [0, 1, 0.05], name: "curtains open" },
  curtainOver: { path: "curtains.over", range: [0, 0.3, 0.01], name: "curtain overhang (past the window, each side)" },
  curtainRod: { path: "curtains.rodHeight", range: [1.5, 2.7, 0.05], value: 2.6, name: "curtain rod height" },
  curtainLength: { path: "curtains.length", range: [0.5, 2.7, 0.05], value: 2.57, name: "curtain length" },
  curtainColor: { path: "curtains.color.hex", color: true, name: "curtain colour" },
  curtainPattern: { path: "curtains.pattern.layout", options: ["none", "grid", "stagger", "border", "rings"], name: "curtain pattern" },
  tinySeating: { path: "tinySeating", options: ["side by side", "front to back"], value: "side by side", name: "tiny café seating" },
  floorTile: { path: "tileFloor.tile.color.hex", color: true, name: "floor tile colour" },
  floorGrout: { path: "tileFloor.grout.color.hex", color: true, name: "floor grout colour" },
  floorMosaic: { path: "tileFloor.mosaic.color.hex", color: true, name: "floor mosaic colour" },
  floorMosaicOn: { path: "floorMosaic", options: ["style", "on", "off"], value: "style", name: "floor mosaic" },
  floorOutline: { path: "floorOutline", options: ["style", "on", "off"], value: "style", name: "floor tile outline" },
  floorOutlineSize: { path: "tileFloor.tile.outline.scale", range: [0.3, 1, 0.01], value: 0.9, name: "floor outline size (of the tile)" },
  floorOutlineWidth: { path: "tileFloor.tile.outline.width", range: [0.002, 0.05, 0.002], value: 0.01, name: "floor outline width" },
  floorOutlineColor: { path: "tileFloor.tile.outline.color.hex", color: true, name: "floor outline colour" },
};

// Each kind's own knobs, there only for that kind (a florist has no café
// style, staff or curtains; a café no florist style): the rest are every
// kind's. `shopInteriorKnobsOf(kind)`: the knobs a shop of that kind has —
// not `kind` itself (a shop is the one kind it is)
export const SHOP_INTERIOR_KNOBS_OWN = {
  "café": ["cafeStyle", "host", "chef", "diners", "curtains", "curtainOpen", "curtainOver", "curtainRod", "curtainLength", "curtainColor", "curtainPattern",
    "tinySeating", "floorTile", "floorGrout", "floorMosaic", "floorMosaicOn", "floorOutline", "floorOutlineSize", "floorOutlineWidth", "floorOutlineColor"],
  florist: ["floristStyle"],
  lobby: ["concierge"],
};
export const shopInteriorKnobsOf = (kind) => {
  const others = new Set(Object.entries(SHOP_INTERIOR_KNOBS_OWN).filter(([k]) => k !== kind).flatMap(([, names]) => names));
  return Object.fromEntries(Object.entries(SHOP_INTERIOR_KNOBS).filter(([name]) => name !== "kind" && !others.has(name))
    .map(([name, k]) => [name, name === "decoration" ? { ...k, options: decorationsOf(kind) } : k])); // (its kind's decorations only)
};

// THE CAFÉ'S STYLES (SHOP_INTERIOR's `cafeStyle`), each laid over the café's
// own colourway inside — `colors` the shop's (`room` the walls, `trim` the
// woodwork and table legs, `door` the chairs, `wall` the tabletops,
// `awning` the rugs, `sign` the pictures, `lamp` the bulbs and shades,
// `furniture`, if set, the chairs' frames and the host stand's base in
// place of the woodwork's, `windows` the window frames'),
// `goods` the crockery's colours, `floor` (the bare floor's colour), its
// `tileFloor` (a Tile Floor's: Flooring/Tile Floor — the tiles, the grout,
// the mosaic in each tile) and the `curtains` (a Curtain's colour, pattern
// and dot), and its `plants`: the colours its pot plants come in — `pots`,
// `blooms` for a flower's petals, `leaves` for a bush's or a blade's;
// `tall` the tall pot plant's own: its `pot`, its `leaves`, its `stem`;
// and its `windows`, if set, over the arched pairs' sizes (`w`, `foot`,
// `top` — 0 square-headed, 1 a full arch — `gap` between the two of a
// pair, `bars` false for whole glass, and `head`, if set, the wall left
// over them under the ceiling, in place of their height `h`); `shop`, if
// set, over the café's shopfront (its `shopWindow`, `storyWindow`…), on
// the street and inside alike; and `front`, the shopfront's own colours
// on the street (the Shopfront's: `wall` the front, `trim`, `awning` and
// its `stripe`, `sign`, `door`, `quoin`, `room` the glimpse in through the
// glass), out of the same palette as the room inside — its walls for the
// front, its woodwork for the trim
const sw = (hex) => solid(hex);
// THE CAFÉS' LAYOUTS, laid out by hand in the interiors editor (2026-11-02)
// and shared between styles: each style's own crockery, bowls, plates and
// plants fill them in (CAFE_STYLES' `goods`, `bowls`, `plants`). Size 2,
// made with the door on the right (mirrored for a door on the left).
//
// UPSCALE (and breakfast): the front worktop turned side-on by the door with
// cupboards under it and the host beside it; the kitchen's worktops over a
// dishwasher, an oven and cupboards, its stove bare; the lights in a row
// down the room, one more added; the abstract picture hung lower; the
// counter's dish stand gone, and a wall of café crockery behind the host
// stand instead
const CAFE_LAYOUT_ROW = {
  2: {
    door: "right",
    move: {
      hanging0: { y: 1.05, art: "abstract" },
      chef0: { x: null, z: -5.48 },
      kcounter0: { x: -0.82, z: -1.12, yaw: -1.5708, w: 2.5, stove: false, pan: false, under: "cupboard" },
      host0: { x: -1.65, z: -1.06 },
      light0: { x: 0.46, z: -4.46, y: 1.81 },
      light1: { x: 0.44, z: -3.47, y: 1.81 },
      kcounter3: { under: "cupboard" },
      kcounter2: { under: "oven" },
      kcounter1: { under: "dishwasher" },
      light2: { x: -0.08, z: -6 },
    },
    drop: ["dishes0"],
    add: [
      { t: "light", x: 0.47, z: -2.22, y: 1.81 },
      { t: "goods", g: { style: "cafe", x0: -0.6, x1: 0.6, depth: 0.28, shelves: [0.3, 0.75, 1.2, 1.65] }, x: -1.8, z: -2.13, yaw: 1.5708 },
    ],
  },
};
// CASUAL (and quirky): the café tables turned side-on in a row of three
// across the back of the room (one added in place of the third), a light
// over each end table; the front worktop widened, the host beside it and a
// wall of café crockery behind the host stand; the picture moved along the
// right wall; the tall plant moved by the left wall, the wall planter and
// the counter's dish stand gone
const CAFE_LAYOUT_TABLES = {
  2: {
    door: "right",
    move: {
      cafe0: { x: -0.69, z: -3.74, yaw: 1.5708 },
      cafe1: { yaw: 1.5708, x: 0.48, z: -3.75 },
      light1: { x: -0.77, z: -3.93 },
      light0: { x: 1.55, z: -3.98 },
      kcounter0: { w: 3, x: -0.52, z: -1.2 },
      host0: { x: -1.18, z: -1.18 },
      hanging0: { x: 2.01, z: -2.31 },
    },
    drop: ["cafe2", "dishes0", "planter0", "tall0"],
    add: [
      { t: "cafe", x: 1.47, z: -3.74, yaw: 1.5708, chairs: 2, key: "table1-0" },
      { t: "tall", x: -1.86, z: -2.26, yaw: 0 },
      { t: "goods", g: { style: "cafe", x0: -0.6, x1: 0.6, depth: 0.28, shelves: [0.3, 0.75, 1.2, 1.65] }, x: -2.04, z: -1.35, yaw: -1.5708 },
    ],
  },
};
// quirky's: the same, the picture hung further back along the right wall
// (its windows there sit nearer the front)
const CAFE_LAYOUT_TABLES_BACK_PICTURE = { 2: { ...CAFE_LAYOUT_TABLES[2], move: { ...CAFE_LAYOUT_TABLES[2].move, hanging0: { x: 2.01, z: -3.9 } } } };

export const CAFE_STYLES = {
  // the café as first furnished: dark woodwork, tan walls, terracotta
  // tabletops, coral curtains
  upscale: {
    colors: {},
    front: { wall: sw("#C9573F"), trim: sw("#2F2A36"), awning: sw("#2F2A36"), stripe: sw("#F2E9DC"), sign: sw("#F2C94C"), door: sw("#2F2A36"), quoin: sw("#E8D8C0") },
    // a tiny one's out front: a window box (not café tables), forest green
    // against the terracotta, cream and mustard flowers in it
    shop: { shopWindow: { tiny: "window box" }, windowBox: { color: sw("#3E5E45"), flowers: { colors: [sw("#F2E9DC"), sw("#F2C94C")] } } },
    goods: ["#F2E9DC", "#2F2A36", "#C9573F", "#F2C94C"],
    // the bowls on its shelves (Food/Kitchen/Bowl's designs): plain dark
    // ones and cream ones striped in terracotta
    bowls: [{ design: "basic", colors: { bowl: "#2F2A36" } }, { design: "striped", colors: { striped: { base: "#F2E9DC", stripe: "#C9573F", rim: "#2F2A36" } } }],
    layout: CAFE_LAYOUT_ROW,
    floor: "#8A5A3C",
    tileFloor: {}, // the Tile Floor as made: the Upscale Café Tile, a flower in each
    curtains: { color: sw("#E07A6B"), pattern: { layout: "none" } },
    plants: { pots: ["#2F2A36", "#C9573F", "#F2E9DC"], blooms: ["#E07A6B", "#C9573F", "#F2E9DC"], leaves: ["#4F7A4A", "#3E6B47"],
      tall: { pot: "#22365C", leaves: "#4F8A52", stem: "#3E6B47" } },
  },
  // warm and easy, in browns and purples: soft lilac walls, brown
  // woodwork, plum chairs at cream tables, lavender rugs, ochre curtains,
  // plain cream tiles, big square-headed windows floor to ceiling; out front a
  // brown face with plum trim and no awning
  casual: {
    colors: { room: sw("#DDCDE9"), trim: sw("#7A5236"), door: sw("#55306E"), wall: sw("#F4EDE4"), awning: sw("#82609E"), sign: sw("#45245A"), lamp: sw("#F7E7C6") },
    front: { wall: sw("#8A6248"), trim: sw("#45245A"), awning: sw("#55306E"), stripe: sw("#F4EDE4"), sign: sw("#B79BCF"), door: sw("#45245A"), quoin: sw("#E8DCCB"), room: sw("#DDCDE9") },
    goods: ["#F4EDE4", "#82609E", "#7A5236", "#B79BCF"],
    // the bowls on its shelves: plain, in plum and in cream
    bowls: [{ design: "basic", colors: { bowl: "#82609E" } }, { design: "basic", colors: { bowl: "#F4EDE4" } }],
    layout: CAFE_LAYOUT_TABLES,
    floor: "#B98E66",
    tileFloor: { tile: { size: 0.3, color: sw("#EFE6DA"), outline: { on: false } }, grout: { color: sw("#CDBFAE") }, mosaic: { on: false } },
    curtains: { color: sw("#C08A2E"), pattern: { layout: "none" } },
    // big plain rectangles, floor to ceiling, the two of a pair close
    windows: { w: 0.72, foot: 0.06, top: 0, gap: 0.08, head: 0.16, bars: false },
    // and its front the same: big plain picture windows from just off the
    // ground up to the sign, two in a standard one (one tiny, four double),
    // square-headed windows upstairs to match, and no awning
    // (a tiny one's out front: a bench, lilac on a dark plum frame)
    shop: { shopWindow: { count: 2, style: "plain", topCurve: 0, stall: 0.04, gap: 0.04, widest: 99, tiny: "bench", bySize: { 1: { count: 1 }, 3: { count: 4 } } }, storyWindow: { topCurve: 0 }, awning: { on: false }, bench: { colors: { wood: sw("#B79BCF"), frame: sw("#45245A") } } },
    plants: { pots: ["#7A5236", "#B79BCF", "#F4EDE4"], blooms: ["#82609E", "#B79BCF", "#F4EDE4"], leaves: ["#6F8F5E", "#5E7F4E"],
      tall: { pot: "#45245A", leaves: "#2F5A3C", stem: "#3E6B47" } },
  },
  // sunny, in yellow and blue: light blue walls, yellow woodwork, window
  // frames a deeper ochre than the chairs', yellow-white tiles with a
  // light blue star in each, plain blue curtains, chairs a darker blue still on ochre
  // frames, an ochre host stand
  breakfast: {
    colors: { room: sw("#C6DCF0"), trim: sw("#F2B92E"), door: sw("#2F5D8A"), furniture: sw("#C08A2E"), windows: sw("#A87420"), wall: sw("#F7F4EE"), awning: sw("#7FA7C9"), sign: sw("#2F5D8A"), lamp: sw("#FFE08A") },
    front: { wall: sw("#35597F"), trim: sw("#F2B92E"), awning: sw("#4A78A8"), stripe: sw("#F7F4EE"), sign: sw("#2F5D8A"), door: sw("#2F5D8A"), quoin: sw("#F7F4EE"), room: sw("#C6DCF0") },
    // a tiny one's out front: a window box, sunny yellow against the blue,
    // pale blue and white flowers in it
    shop: { shopWindow: { tiny: "window box" }, windowBox: { color: sw("#F2B92E"), flowers: { colors: [sw("#9DBFE0"), sw("#F7F4EE")] } } },
    goods: ["#F2C94C", "#7FA7C9", "#F7F4EE", "#2F5D8A"],
    // the bowls on its shelves: blue-and-white chinoiserie
    bowls: [{ design: "chinoiserie", colors: { chinoiserie: { porcelain: "#F7F4EE", ink: "#2F5D8A" } } }],
    layout: CAFE_LAYOUT_ROW,
    floor: "#E3C9A0",
    tileFloor: { tile: { size: 0.3, color: sw("#FCF5DE"), outline: { on: false } }, grout: { color: sw("#E8D7AE") }, mosaic: { sides: 6, inner: 0.45, curve: 0, turn: 0, radius: 0.3, rim: 0.05, color: sw("#9DBFE0"), rimColor: sw("#7FA7D1") } },
    curtains: { color: sw("#4A78A8"), pattern: { layout: "none" } },
    plants: { pots: ["#F2C94C", "#F7F4EE", "#7FA7C9"], blooms: ["#F2C94C", "#7FA7C9", "#F7F4EE"], leaves: ["#6FA35A", "#7FAF4F"],
      tall: { pot: "#B8443A", leaves: "#2F5A3C", stem: "#3E6B47" } },
  },
  // odd on purpose, everything a little off from everything else: mint
  // walls, tangerine woodwork, plum chairs on black frames at pink tables,
  // mustard rugs, a black and white checker floor, pink curtains with white
  // polka dots; out front poppy red woodwork, awning and door on a pink
  // face, the quoins a saturated blue, and every window rounded — the
  // shop window one big one, the stretch's whole width, a single pane
  // rounded top and bottom — the curves eased by the shop's size, so the
  // arcs take about 0.7 of its height whatever its width, a short straight
  // up each side between them (a whole oval pinches its moulding to points
  // at the ends); upstairs, pills. No awning: out front, umbrella tables
  quirky: {
    colors: { room: sw("#BFE6D6"), trim: sw("#E8743B"), door: sw("#6B3E7A"), furniture: sw("#2F2A36"), wall: sw("#F2A7C3"), awning: sw("#F2C94C"), sign: sw("#6B3E7A"), lamp: sw("#FFE08A") },
    front: { wall: sw("#F4AEB5"), trim: sw("#E5484D"), awning: sw("#E5484D"), stripe: sw("#F7F4EE"), sign: sw("#F2C94C"), door: sw("#E5484D"), quoin: sw("#2B6BE0"), room: sw("#BFE6D6") },
    // (a tiny one's out front: a bench, mint on a bright blue frame like its quoins)
    shop: { awning: { on: false }, bench: { colors: { wood: sw("#BFE6D6"), frame: sw("#2B6BE0") } }, shopWindow: { tiny: "bench", decoration: "umbrella tables", count: 1, style: "plain", topCurve: 0.52, bottomCurve: 0.52, widest: 99, bySize: { 1: { count: 1, topCurve: 0.75, bottomCurve: 0.75 }, 3: { count: 1, sets: 1, topCurve: 0.28, bottomCurve: 0.28 } } }, storyWindow: { topCurve: 1, bottomCurve: 1 } },
    goods: ["#F2A7C3", "#F2C94C", "#6B3E7A", "#BFE6D6"],
    // the bowls on its shelves: folk-painted, plum with mustard flowers
    bowls: [{ design: "folk", colors: { folk: { base: "#6B3E7A", flower: "#F2C94C", accent: "#F2A7C3", leaf: "#BFE6D6" } } }],
    layout: CAFE_LAYOUT_TABLES_BACK_PICTURE,
    floor: "#3A3550",
    tileFloor: { tile: { size: 0.3, layout: "checker", color: sw("#F7F4EE"), alt: sw("#2F2A36"), outline: { on: false } }, grout: { color: sw("#9A8F82") }, mosaic: { on: false } },
    curtains: { color: sw("#F2A7C3"), pattern: { layout: "stagger" }, dot: { color: sw("#F7F4EE") } },
    plants: { pots: ["#E8743B", "#6B3E7A", "#F2C94C"], blooms: ["#F2A7C3", "#E8743B", "#F2C94C"], leaves: ["#4F8A52", "#6FA35A"],
      tall: { pot: "#F2C94C", leaves: "#2F5A3C", stem: "#3E6B47" } },
  },
};
export const CAFE_STYLE_NAMES = Object.keys(CAFE_STYLES);

// Which style a café of this `seed` is (`asked`, if it names one; else
// one by the seed), and a café's shopfront config with that style's
// colours laid over it — so the street's shopfront wears the same
// colourway as the room inside it (interiorOf does the same)
export const cafeStyleOf = (seed, asked) => (CAFE_STYLES[asked] ? asked : CAFE_STYLE_NAMES[Math.abs(Math.floor(seed)) % CAFE_STYLE_NAMES.length]);
export const cafeShopfrontOf = (shop, seed, asked) => {
  const St = CAFE_STYLES[cafeStyleOf(seed, asked)];
  // its tables out front with the chairs from inside (their seats the
  // room's chair colour, their frames its furniture's or woodwork's)
  const inside = merge(merge(merge(SHOPFRONT.colors, SHOPFRONT_KINDS["café"].colors), shop.colors ?? {}), St.colors);
  const chairs = { color: inside.door, legColor: inside.furniture ?? inside.trim };
  return merge(merge(shop, St.shop ?? {}), { colors: St.front, goods: { colors: St.goods, bowls: St.bowls ?? null }, cafeTables: { chairs } });
};

// THE FLORIST'S STYLES (SHOP_INTERIOR's `floristStyle`), as the café's
// (CAFE_STYLES): `colors` the room's over the florist's own colourway
// (`room` the walls, `trim` the woodwork and table legs, `wall` the
// tabletop, `door`, `furniture`, `awning` the rugs, `sign` the pictures,
// `lamp` the bulbs and shades), `floor` the bare floor's colour, `goods`
// the flowers' colours in the shop window, `plants` the pot plants down
// the walls — `pots` their pots' colours, `kinds` which plants (PLANT_KINDS:
// a bush, a leaf, or a flower), `blooms` a flower's colours, `leaves` a
// bush's or a leaf's; `shop` over the florist's shopfront (its windows,
// awning, window boxes…), on the street and inside alike; `front` the
// shopfront's own colours on the street (`lettering` the sign's word)
export const FLORIST_STYLES = {
  // the florist as first made: a sage front, green woodwork and awning, a
  // pink sign board, cottage windows with window boxes of tulips
  basic: {},
  // modern, as a Korean or Japanese one is: a pure white building, its posts,
  // sign band and cornice a shade off white, no corner blocks, no awning;
  // pale oak for the window frames, the door and a board with charcoal
  // lettering; the shop window one big one, shaped as the quirky café's —
  // rounded top and bottom, its curves taking about 0.7 of its height,
  // straight up each side (a tall pill in a tiny shop, a wide one in a
  // double) — thin-framed, a single pane; upstairs the quirky café's
  // windows, tall pills of two panes, one to a size (one in a tiny shop,
  // two in a standard, three in a double), no boxes; oak window boxes of white tulips. Inside white walls on a
  // pale oak floor, oak woodwork, plants in white, oat and oak pots —
  // mostly leaves, a few white and blush tulips, sage greens
  modern: {
    colors: { room: sw("#F6F4EF"), trim: sw("#C8A57A"), frame: sw("#C8A57A"), wall: sw("#EFE8DC"), door: sw("#C8A57A"), furniture: sw("#B08D63"), awning: sw("#E3DCCF"), sign: sw("#B9C4A8"), lamp: sw("#FFF6E6") },
    front: { wall: sw("#FFFFFF"), trim: sw("#ECE8E0"), frame: sw("#C8A57A"), awning: sw("#C8A57A"), stripe: sw("#F6F4EF"), sign: sw("#D9BE96"), lettering: sw("#3A3632"), door: sw("#C8A57A"), quoin: sw("#F6F4EF"), roof: sw("#D9D5CE"), room: sw("#F6F4EF") },
    shop: {
      awning: { on: false },
      quoins: { on: false },
      shopWindow: { style: "plain", topCurve: 0.61, bottomCurve: 0.61, count: 1, frame: 0.05, trim: 0.06, gap: 0.04, stall: 0.35, widest: 2.4, decoration: "window box",
        bySize: { 1: { count: 1, widest: 99, topCurve: 1, bottomCurve: 1 }, 3: { count: 1, widest: 3.4, topCurve: 0.43, bottomCurve: 0.43 } } },
      // (upstairs, the quirky café's windows: tall pills of two panes)
      storyWindow: { style: "pane", panes: 2, topCurve: 1, bottomCurve: 1, width: 0.8, height: 1.2, count: 2, box: false, bySize: { 1: { count: 1 }, 3: { count: 3 } } },
      windowBox: { color: sw("#C8A57A"), flowers: { kind: "tulip", colors: [sw("#FFFFFF"), sw("#F2D4CF")] } },
    },
    goods: ["#FFFFFF", "#F2D4CF", "#E8E4DA", "#B9C4A8"],
    floor: "#DCC8A8",
    plants: { pots: ["#F6F4EF", "#E6DDD0", "#C8A57A"], kinds: ["leaf", "leaf", "bush", "tulip"], blooms: ["#FFFFFF", "#F2D4CF"], leaves: ["#7F9C78", "#5E8060"] },
  },
  // warm and weathered: a cream plaster front, dark wood trim and door, a
  // sage awning, a wooden board with cream lettering, small-paned square
  // windows, wooden window boxes of daisies; inside cream walls on a wood
  // floor, terracotta pots of daisies, poppies and bushes
  rustic: {
    colors: { room: sw("#EFE3CC"), trim: sw("#6B4A33"), wall: sw("#A47A55"), door: sw("#6B4A33"), furniture: sw("#5C4033"), awning: sw("#B5A07A"), sign: sw("#8A9A6B"), lamp: sw("#FFE3A8") },
    front: { wall: sw("#E8DCC4"), trim: sw("#6B4A33"), awning: sw("#8A9A6B"), stripe: sw("#F2E9DC"), sign: sw("#8A6248"), lettering: sw("#F2E9DC"), door: sw("#6B4A33"), quoin: sw("#BFAF92"), room: sw("#F2E6CF") },
    shop: {
      shopWindow: { style: "pane", panes: 6, topCurve: 0, decoration: "window box" },
      windowBox: { color: sw("#7A5236"), flowers: { kind: "daisy", colors: [sw("#FFFFFF"), sw("#F2C94C")] } },
    },
    goods: ["#E8D6B0", "#C4A3D9", "#F2C94C", "#E07A6B", "#FFFFFF"],
    floor: "#8A6248",
    plants: { pots: ["#C8744B", "#B5651D", "#A8744F"], kinds: ["daisy", "poppy", "bush", "tulip", "leaf"], blooms: ["#F2C94C", "#FFFFFF", "#C4A3D9", "#E07A6B"], leaves: ["#6F8F5E", "#556B2F"] },
  },
  // dark and a little witchy: a black front, a pale board with black
  // lettering, big plain windows, no awning, black window boxes of white
  // tulips; inside pale walls on a concrete floor, black woodwork, plants
  // in white, black and grey pots — mostly leaves, a few white and blush tulips
  witchy: {
    colors: { room: sw("#F4F1EC"), trim: sw("#2B2B2E"), wall: sw("#E6E1D8"), door: sw("#2B2B2E"), furniture: sw("#2B2B2E"), awning: sw("#C9C2B8"), sign: sw("#2B2B2E"), lamp: sw("#FFF4E0") },
    front: { wall: sw("#2B2B2E"), trim: sw("#1E1E21"), awning: sw("#2B2B2E"), stripe: sw("#F4F1EC"), sign: sw("#F4F1EC"), lettering: sw("#1E1E21"), door: sw("#1E1E21"), quoin: sw("#3A3A3E"), room: sw("#F4F1EC") },
    shop: {
      awning: { on: false },
      shopWindow: { style: "plain", topCurve: 0, count: 2, stall: 0.15, gap: 0.04, widest: 99, decoration: "window box", bySize: { 1: { count: 1 }, 3: { count: 3 } } },
      storyWindow: { topCurve: 0 },
      windowBox: { color: sw("#1E1E21"), flowers: { kind: "tulip", colors: [sw("#FFFFFF"), sw("#F2D4CF")] } },
    },
    goods: ["#FFFFFF", "#F2D4CF", "#E8E4DA", "#B5C99A"],
    floor: "#BDB8B0",
    plants: { pots: ["#F4F1EC", "#2B2B2E", "#BDB8B0"], kinds: ["leaf", "leaf", "bush", "tulip"], blooms: ["#FFFFFF", "#F2D4CF"], leaves: ["#3E6B47", "#5A8A5E"] },
  },
};
export const FLORIST_STYLE_NAMES = Object.keys(FLORIST_STYLES);

// Which style a florist of this `seed` is (`asked`, if it names one; else
// one by the seed), and a florist's shopfront config in it — as the café's
export const floristStyleOf = (seed, asked) => (FLORIST_STYLES[asked] ? asked : FLORIST_STYLE_NAMES[Math.abs(Math.floor(seed)) % FLORIST_STYLE_NAMES.length]);
export const floristShopfrontOf = (shop, seed, asked) => {
  const St = FLORIST_STYLES[floristStyleOf(seed, asked)];
  return merge(merge(shop, St.shop ?? {}), { ...(St.front ? { colors: St.front } : {}), ...(St.goods ? { goods: { colors: St.goods, bowls: St.bowls ?? null } } : {}) });
};
// A shop's style, as interiorOf settled it: a café's or a florist's (or none)
export const styleOfShop = (I) => (I.kind === "café" ? CAFE_STYLES[I.cafeStyle] : I.kind === "florist" ? FLORIST_STYLES[I.floristStyle] : null) ?? null;

// The whole of it, laid over its defaults: the shop's config filled in
// from the Shopfront's defaults and the kind's colourway (and a café's
// style, or a florist's: see CAFE_STYLES, FLORIST_STYLES)
export const interiorOf = (config = {}) => {
  const kind = config.kind ?? SHOP_INTERIOR.kind, seed = config.seed ?? SHOP_INTERIOR.seed;
  const asked = config.cafeStyle ?? SHOP_INTERIOR.cafeStyle;
  const style = kind !== "café" ? null : cafeStyleOf(seed, asked);
  const fstyle = kind !== "florist" ? null : floristStyleOf(seed, config.floristStyle ?? SHOP_INTERIOR.floristStyle);
  const St = style ? CAFE_STYLES[style] : fstyle ? FLORIST_STYLES[fstyle] : null;
  // (the style's layout, if it has one for this size, else the kind's own: see SHOP_INTERIOR's `layout`)
  const size = config.shop?.body?.size ?? SHOPFRONT_KINDS[kind]?.body?.size ?? SHOPFRONT.body.size;
  const laid = layoutFor(St?.layout, size) ?? layoutFor(KIND_LAYOUTS[kind], size);
  const own = {
    ...(St?.curtains ? { curtains: St.curtains } : {}), ...(St?.tileFloor ? { tileFloor: St.tileFloor } : {}),
    ...(St?.floor ? { floors: { [kind]: St.floor } } : {}), ...(fstyle && St.plants?.pots ? { pots: St.plants.pots } : {}),
    ...(laid ? { layout: laid } : {}),
  };
  const I = merge(merge(SHOP_INTERIOR, own), config);
  I.cafeStyle = style ?? I.cafeStyle;
  I.floristStyle = fstyle ?? I.floristStyle;
  if (I.floorMosaic === "on" || I.floorMosaic === "off") I.tileFloor = merge(I.tileFloor ?? {}, { mosaic: { on: I.floorMosaic === "on" } });
  if (I.floorOutline === "on" || I.floorOutline === "off") I.tileFloor = merge(I.tileFloor ?? {}, { tile: { outline: { on: I.floorOutline === "on" } } });
  // the style's colours over the shop's own (on the street a shop brings its
  // whole colourway in with it, so they go on last)
  // (but what the shop asks for outright of its outside wins over the
  // style's — its awning on or off, its decoration out front)
  const asks = { ...(I.shop.awning?.on != null ? { awning: { on: I.shop.awning.on } } : {}), ...(I.shop.shopWindow?.decoration ? { shopWindow: { decoration: I.shop.shopWindow.decoration } } : {}) };
  const shop = merge(merge(merge(merge(SHOPFRONT, SHOPFRONT_KINDS[I.kind] ?? {}), I.shop), St ? { ...St.shop, colors: St.colors ?? {}, ...(St.goods ? { goods: { colors: St.goods, bowls: St.bowls ?? null } } : {}) } : {}), asks);
  // a room wider than its shopfront, by kind and size (`widths`): the tiny
  // café's, for room to walk round its tables
  const wide = I.widths?.[I.kind]?.[shop.body.size];
  if (wide && shop.body.width == null) shop.body = { ...shop.body, width: wide };
  // a layout made with the door on the other side is turned round (see mirrorLayout)
  const layout = I.layout?.door && I.layout.door !== shop.door.side && shop.door.side !== "middle" ? mirrorLayout(I.layout) : I.layout;
  return { ...I, shop, layout };
};

// THE KINDS' OWN LAYOUTS: a kind's furniture moved about by hand in the
// interiors editor (`npm run interiors`), by the shop's size, laid over
// what planOf puts there for every shop of that kind and size (a café's
// or florist's style's `layout` wins over it). `door` says which side the
// door was on when it was made: a shop with it on the other side gets the
// layout the other way round (mirrorLayout). Made for `seed` 1; a kind
// whose furniture stands the same whatever the seed (the convenience
// store's: its seed only scatters the goods) keeps it for every seed.
export const KIND_LAYOUTS = {
  // THE TINY CONVENIENCE STORE (2026-11-02): one long cooler across the
  // back in place of the three (the side ones gone); the till and its
  // sweets turned to face the door from the middle of the left wall, the
  // keeper behind it; three short aisles of boxes across the back of the
  // room, side by side, the one light over them
  "convenience store": {
    1: {
      door: "right",
      move: {
        cooler0: { x: -0.01, len: 2.7 },
        goods1: { x: 1.02, z: -2.6 },
        goods2: { x: -1.1, z: -2.6 },
        light1: { x: 0.03, z: -2.65 },
        host0: { x: -1.11, z: -1.06 },
        goods0: { x: -0.42, z: -0.96 },
        kcounter0: { x: -0.4, z: -1 },
      },
      drop: ["cooler1", "cooler2", "light0"],
      add: [
        { t: "goods", x: -0.1, z: -2.6, yaw: 1.5708, g: { depth: 0.26, x0: -0.79, x1: 0.79, z: 0.28, shelves: [0.12, 0.45, 0.8, 1.15], style: "boxes" } },
      ],
    },
    // THE STANDARD CONVENIENCE STORE (2026-11-02): the back cooler shorter
    // and over to the left, a short cooler down the back of the left wall
    // in place of the side ones; the till turned to face the door from the
    // back right corner, the keeper behind it, a door in the back wall
    // behind the keeper; two aisles of boxes across the room, a long one
    // by the front and a shorter one behind, the one light over them
    2: {
      door: "right",
      move: {
        cooler0: { x: -0.46, z: -4.79, len: 2.5 },
        goods2: { x: -0.49, z: -2.12, yaw: 0, g: { x0: -0.95, x1: 0.95 } },
        light1: { x: -0.26, z: -1.7 },
        host0: { x: 1.33, z: -3.91, yaw: 0 },
        kcounter0: { x: 1.2, z: -3.18, yaw: 0 },
      },
      drop: ["cooler1", "cooler2", "light0", "goods1", "goods0"],
      add: [
        { t: "cooler", x: -1.8, z: -3.74, yaw: 1.5708, len: 2.1, h: 1.95, d: 0.55 },
        { t: "door", x: 1.45, z: -4.88, yaw: 0, width: 0.8, height: 1.85, curve: 0 },
        { t: "goods", x: -0.55, z: -0.77, yaw: 0, g: { depth: 0.26, x0: -1.45, x1: 1.45, z: 0.28, shelves: [0.12, 0.45, 0.8, 1.15], style: "boxes" } },
      ],
    },
  },
};

// Where a shop's door is across its front, as Shopfront.jsx lays it out:
// `x` along the front in the shop's frame, its `width`; `W` the shop's
// width and `inner` the half-width inside the pilasters
export function shopDoorOf(C) {
  const W = C.body.width ?? SHOP_WIDTHS[C.body.size] ?? SHOP_WIDTHS[2], inner = W / 2 - C.body.pilaster;
  const tiny = W <= SHOP_WIDTHS[1] + 1e-6 || C.body.size === 1, middle = C.door.side === "middle" && !tiny;
  const x = middle ? 0 : (C.door.side === "left" ? -1 : 1) * (inner - C.door.width / 2);
  return { x, width: C.door.width, W, inner, middle, tiny };
}

// A small seeded random, and a string's seed for it
export const rngOf = (seed) => {
  let x = (Math.imul((seed | 0) ^ 0x9e3779b9, 2654435761) >>> 0) % 2147483646 + 1;
  const next = () => ((x = (x * 16807) % 2147483647) - 1) / 2147483646;
  next(); next();
  return next;
};
export const hashOf = (str) => { let h = 2166136261; for (let i = 0; i < str.length; i++) h = Math.imul(h ^ str.charCodeAt(i), 16777619); return h >>> 0; };

const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));


// WHAT IS IN THE SHOP, from its config (as interiorOf gives it): `room`
// (the half-width inside the walls `iw`, the back wall at `zb`, the height
// `h`, the doorway), the furniture to draw (`items`, each { t, x, z, … },
// with an `id` each: see world/furnish.js) and the footprints on the floor
// nothing can walk through (`blocks`, each { x0, x1, z0, z1 }) — all in the
// shop's frame. Pure, so whoever walks about the room can work out the
// same blocks. `layout`, if given (else the config's own), is laid over
// the furniture last: items moved, taken out, put in (furnish.js).
export function planOf(I, layout = I.layout) {
  const plan = furnishOf(I);
  const laid = applyLayout(plan.items, plan.blocks, layout, { S: I.scale, fill: (a) => filledOf(a, I) });
  const room = { ...plan.room }, blocks = [...laid.blocks];
  // a room through the back wall (a "room" item stood on it: see
  // ShopInterior's WallRoom), in a shop with no kitchen: the walker goes
  // through its opening as through a café's kitchen door — the room is its
  // `kitchen`, the back wall either side of the opening and the room's own
  // side walls are blocks
  const back = laid.items.find((it) => it.t === "room" && Math.abs(it.z - (room.zb - 0.06)) < 0.25);
  if (back && !room.kitchen) {
    const zb = room.zb, kzb = zb - 0.12 - back.deep, half = back.width / 2, dw = back.opening.width;
    room.kitchen = { KD: back.deep, W: back.width, zb: kzb, doorX: back.x, doorW: dw, doorH: back.opening.height };
    blocks.push({ x0: -room.iw, x1: back.x - dw / 2, z0: zb - 0.12, z1: zb }, { x0: back.x + dw / 2, x1: room.iw, z0: zb - 0.12, z1: zb });
    [-1, 1].forEach((e) => blocks.push({ x0: Math.min(e * (back.x + e * half), e * (room.iw + 0.2)), x1: Math.max(e * (back.x + e * half), e * (room.iw + 0.2)), z0: kzb - 0.2, z1: zb }));
  }
  return { ...plan, room, items: laid.items, blocks };
}

// An item added by a layout, its missing fields filled in as the plan
// would have: a goods display's wood, colours and seed, a café table's
// seat key, a hanging's art, a tall plant's style colours
function filledOf(a, I) {
  const C = I.shop, it = { yaw: 0, ...a };
  const seed = hashOf(JSON.stringify([a.t, a.x, a.z])) % 1000;
  if (it.t === "goods") it.g = { wood: C.goods.wood, colors: C.goods.colors, bowls: C.goods.bowls, seed, depth: 0.28, x0: -0.6, x1: 0.6, z: 0, shelves: [0.3, 0.75, 1.2, 1.65], style: "boxes", ...(a.g ?? {}) };
  if (it.t === "cafe") { it.chairs ??= 2; it.key ??= `added${seed}`; }
  if (it.t === "salon") it.key ??= `added${seed}`;
  if (it.t === "hanging") it.art ??= "picture";
  if (it.t === "planter") { it.kind ??= "ivy"; it.seed ??= seed; }
  if (it.t === "plant") { it.kind ??= "bush"; it.size ??= 1; it.pot ??= I.pots[seed % I.pots.length]; }
  if (it.t === "tall") { const T = I.kind === "café" ? CAFE_STYLES[I.cafeStyle]?.plants?.tall : null; it.pot ??= T?.pot ?? I.pots[seed % I.pots.length]; if (T) { it.leaves ??= T.leaves; it.stem ??= T.stem; } }
  if (it.t === "cooler") { it.len ??= 1; it.h ??= 1.9; it.d ??= 0.55; it.seed ??= seed; }
  if (it.t === "mirror") it.g ??= { wood: C.goods.wood, colors: C.goods.colors, seed, x0: -0.42, x1: 0.42, z: 0.2, depth: 0.18, shelves: [0.85], style: "bottles", legs: false };
  if (it.t === "mailboxes") { it.hang ??= 0.55; it.cfg ??= { cols: 4, rows: 5, box: { width: 0.75, height: 0.55 }, seed: seed % 60 + 1 }; }
  if (it.t === "counter") it.w ??= 6;
  if (it.t === "kcounter") { it.w ??= 4; it.kind ??= "plain"; }
  if (it.t === "table") { it.w ??= 4; it.l ??= 2.4; }
  if (it.t === "rug") { it.w ??= 6; it.l ??= 4; }
  if (it.t === "door") { it.width ??= 0.8; it.height ??= 1.85; it.curve ??= 0; }
  if (it.t === "object") { it.args ??= {}; it.scale ??= I.scale; it.y ??= 0; }
  if (it.t === "arch") { it.width ??= 1.1; it.height ??= 2.1; it.curve ??= 1; }
  if (it.t === "window") { it.y ??= 0.95; it.w ??= 0.5; it.h ??= 1.25; it.top ??= 1; it.bars ??= true; }
  if (it.t === "room") { it.width ??= 3; it.deep ??= 2.5; it.opening = { width: 1.0, height: 2.0, curve: 1, ...(a.opening ?? {}) }; it.door ??= false; }
  if (it.t === "light") it.y ??= C.body.ground - C.sign.height;
  if (it.t === "clock") it.y ??= 2.1;
  if (it.t === "board") it.y ??= 2.6 * I.scale;
  return it;
}

function furnishOf(I) {
  const C = I.shop, r = rngOf(I.seed), S = I.scale;
  const d = shopDoorOf(C), D = C.body.depth, R = C.body.recess, h = C.body.ground - C.sign.height;
  const iw = d.W / 2 - 0.15, zb = -D + 0.12, away = -Math.sign(d.x || 1); // `away`: the side away from the door
  const room = { W: d.W, D, R, h, iw, zb, doorX: d.x, doorW: d.width, kind: I.kind, floor: I.floors[I.kind] ?? I.floors["general store"] };
  const items = [], blocks = [];
  const block = (x0, x1, z0, z1) => blocks.push({ x0: Math.min(x0, x1), x1: Math.max(x0, x1), z0: Math.min(z0, z1), z1: Math.max(z0, z1) });
  const goods = (o) => ({ wood: C.goods.wood, colors: C.goods.colors, bowls: C.goods.bowls, seed: Math.floor(r() * 1000), depth: 0.28, ...o });
  const pot = () => I.pots[Math.floor(r() * I.pots.length)];
  // the decor's own chances (which picture, which plants in a wall
  // planter), so choosing them moves nothing else in the room
  const dr = rngOf(I.seed * 7 + 11), dpick = (a) => a[Math.floor(dr() * a.length)];
  // a wall planter (Furniture/Pot Plants/Wall Planter) on a wall at (x, z)
  // turned `yaw`, its trough's foot `y` up, growing one of a window box's plants
  const planter = (x, z, yaw, y, kind) => { const k = dpick(WINDOW_BOX_PLANTS); items.push({ t: "planter", x, z, yaw, y, kind: kind ?? k, seed: Math.floor(dr() * 1000) }); };
  // a café's tall plant in its style's colours (`tall` in CAFE_STYLES)
  const tallOf = (x, z, p) => ({ t: "tall", x, z, pot: p, ...(CAFE_STYLES[I.cafeStyle]?.plants?.tall && I.kind === "café" ? CAFE_STYLES[I.cafeStyle].plants.tall : {}) });
  // a tall pot plant on the floor at (x, z), if it stands clear of everything
  const tall = (x, z) => {
    const k = 0.24;
    if (blocks.some((b) => x - k < b.x1 && x + k > b.x0 && z - k < b.z1 && z + k > b.z0)) return;
    items.push(tallOf(x, z, pot()));
    block(x - k, x + k, z - k, z + k);
  };
  // the counter across the back, the shopkeeper's stool behind it; nothing
  // walks behind the counter (not in a café: its counter is at the front)
  const cafe = I.kind === "café", lobby = I.kind === "lobby", conv = I.kind === "convenience store", salon = I.kind === "salon";
  const cw = clamp((d.W - 1.8) / S, 4.5, 9), cz = zb + 0.95;
  if (!cafe && !lobby && !conv && !salon) {
    items.push({ t: "counter", x: 0, z: cz, w: cw });
    if (I.keeper) items.push({ t: "keeper", x: 0, z: zb + 0.36 });
    block(-iw, iw, zb, cz + 0.36);
    // a clock over the counter, a picture on the side wall away from the door
    if (h > 2.3) items.push({ t: "clock", x: away * 0.9, z: zb + 0.01, yaw: 0, y: 2.1 });
    items.push({ t: "hanging", x: away * (iw - 0.01), z: -2.6 - r() * 0.8, yaw: -away * Math.PI / 2, y: 1.75 });
  }
  // pendant lights down the middle, from where the ceiling would be
  const n = Math.max(0, Math.round(I.lights.count));
  for (let i = 0; i < n; i++) items.push({ t: "light", x: 0, z: -D * ((i + 0.5) / n) * 0.9, y: h });
  // shelving flush to a side wall (`s` -1 left, 1 right) from z0 back to z1, its front into the room
  const shelving = (s, z0, z1, o) => {
    const len = z0 - z1;
    if (len < 0.6) return;
    items.push({ t: "goods", x: s * (iw - 0.28), z: (z0 + z1) / 2, yaw: -s * Math.PI / 2, g: goods({ x0: -len / 2, x1: len / 2, z: 0, ...o }) });
    block(s * iw, s * (iw - 0.3), z0, z1);
  };
  const doorSide = Math.sign(d.x || 1), roomy = !d.tiny;
  if (cafe) {
    // THE CAFÉ: a counter by the front, against the side wall away from the
    // door (room behind it to serve from), mugs set out along it; a door in
    // the back wall, on that side, through to a kitchen behind; arched
    // windows down both side walls and along the back, in pairs; tables
    // in rows between, a lane kept clear from each door
    const wallIn = d.W / 2 - 0.12, s = away, std = roomy && C.body.size === 2; // `std`: a standard café (size 2)
    const len = d.W < 3.5 ? 1.2 : d.W < 5 ? 1.6 : 2.0, c0 = -0.35, cm = c0 - len / 2;
    const cx = s * (wallIn - 0.9), yaw = -s * Math.PI / 2;
    // the counter: a host stand, with mugs along it (a tiny café's goes at the back: see below)
    const stand = (x, z, yaw, len) => {
      items.push({ t: "kcounter", front: true, x, z, yaw, w: len / S - 0.16 });
      items.push({ t: "dishes", x, z, yaw, lift: 2.6 * S, pieces: crockery({ x0: -len / 2 + 0.1, x1: len / 2 - 0.1, ys: [0], z: 0.1, S, r, colors: C.goods.colors, bowls: C.goods.bowls, teapots: 1 }) });
    };
    if (roomy) {
      stand(cx, cm, yaw, len);
      block(s * (wallIn - 0.58), s * (wallIn - 1.22), c0, c0 - len);
      // the host, between the stand and the wall, looking out across it
      if (I.staff?.host) { items.push({ t: "host", x: s * (wallIn - 0.29), z: cm, yaw }); block(s * (wallIn - 0.1), s * (wallIn - 0.48), cm + 0.2, cm - 0.2); }
    }
    // the kitchen: `KD` deep behind the back wall, through a door `bw` wide
    // (a tiny café's room is widened, its kitchen not: that keeps to the
    // shopfront's width, and runs a little deeper back instead; a double
    // café's runs a little deeper too, its width the same)
    const KW = roomy ? d.W : SHOP_WIDTHS[1], kIn = KW / 2 - 0.12;
    const KD = !roomy ? 2.5 : C.body.size === 3 ? 2.6 : 2.0, kzb = -D - KD + 0.12, bw = 0.8, bx = s * (kIn - 0.15 - bw / 2);
    room.kitchen = { KD, W: KW, zb: kzb, doorX: bx, doorW: bw, doorH: 1.85 };
    [[-wallIn, bx - bw / 2], [bx + bw / 2, wallIn]].forEach(([x0, x1]) => block(x0, x1, -D, zb)); // the back wall, either side of its door
    if (kIn < wallIn - 1e-6) [-1, 1].forEach((e) => block(e * kIn, e * (wallIn + 0.2), -D, kzb - 0.2)); // past the kitchen's narrower walls
    // counters along the kitchen's back wall: a sink, a stove, a run of
    // plain; a fridge at the end, in a roomy one; mugs, teapots and bowls on shelves over
    let ka = -kIn + 0.02, kb = kIn - 0.02;
    const kz = kzb + 0.32, ds = Math.sign(d.x || 1);
    if (roomy) {
      const fx = ds * (kIn - 0.38);
      items.push({ t: "fridge", x: fx, z: kzb + 0.32, yaw: 0 });
      if (ds > 0) kb = fx - 0.4; else ka = fx + 0.4;
    }
    let x = ka;
    const plainRuns = []; // the plain worktops (not the sink, not the stove), [from, to]
    for (const [kind, w0, stove] of [["sink", 1.1], ["plain", 0.9, true], ["plain", Infinity]]) {
      const w = Math.min(w0, kb - x);
      if (w < 0.45) break;
      // the stove: a cookpot on its back left ring, a frying pan on its front right
      items.push({ t: "kcounter", kind, stove, x: x + w / 2, z: kz, yaw: 0, w: w / S - 0.16, ...(stove ? { pot: true, pan: true } : {}) });
      if (kind === "plain" && !stove) plainRuns.push([x, x + w]);
      x += w;
    }
    // the shelf over the left half of the counters, over the sink: the
    // Shelving's Half Height, four boards up the top half of the wall, no
    // legs, the kitchen's things on it (kitchenware: oil, vinegar, salt and
    // pepper, empty mugs, glasses and bowls, stacks of plates); over the
    // right half, two short windows, plain glass (no bars)
    const kshelves = [1.2, 1.55, 1.9, 2.25], kmid = (ka + kb) / 2;
    items.push({ t: "dishes", x: 0, z: 0, yaw: 0, boards: goods({ x0: ka + 0.05, x1: kmid - 0.05, z: kzb + 0.2, depth: 0.2, shelves: kshelves, style: "none", legs: false }),
      pieces: kitchenware({ x0: ka + 0.1, x1: kmid - 0.1, ys: kshelves, z: kzb + 0.1, S, r, colors: C.goods.colors, bowls: C.goods.bowls }) });
    // (close together, a hand's width apart, in the middle of that half)
    const kw = Math.min(0.45, (kb - kmid) / 2 - 0.1), kg = 0.12, kc = (kmid + kb) / 2;
    room.kitchen.windows = { w: kw, h: 0.6, foot: 1.2, top: 1, at: [kc - (kw + kg) / 2, kc + (kw + kg) / 2] };
    // a cutting board on the worktop under them (Food/Kitchen/Cutting
    // Board), on the plain run nearest, kept clear of its ends
    {
      const bw = 1.3 * S, run = plainRuns.find(([a, b]) => b - a > bw + 0.1);
      if (run) items.push({ t: "board", x: clamp(kc, run[0] + bw / 2 + 0.05, run[1] - bw / 2 - 0.05), z: kz + 0.05, y: 2.6 * S });
    }
    block(-kIn, kIn, kzb, kzb + 0.66);
    // the chef, pacing the kitchen in front of the counters
    if (I.staff?.chef) items.push({ t: "chef", x0: ka + 0.45, x1: kb - 0.45, z: kzb + 1.0, pace: I.staff.pace, seed: Math.floor(r() * 1000) });
    items.push({ t: "light", x: 0, z: -D - KD / 2, y: h });
    // arched windows, in pairs, down a wall from a to b (their middles)
    // (`gap` between the two of a pair); the style's own, if it has them (see CAFE_STYLES' `windows`)
    const win = { w: 0.5, h: 1.25, foot: 0.95, top: 1, gap: 0.18, bars: true, ...CAFE_STYLES[I.cafeStyle]?.windows };
    if (win.head != null) win.h = h - win.foot - win.head;
    const pairs = (a, b) => {
      const m = 0.3, g = win.gap, G = 0.75, unit = 2 * win.w + g;
      const n = Math.floor((b - a - 2 * m + G) / (unit + G));
      const start = (a + b) / 2 - (n * unit + (n - 1) * G) / 2, out = [];
      for (let i = 0; i < n; i++) { const p = start + i * (unit + G); out.push(p + win.w / 2, p + win.w + g + win.w / 2); }
      return out;
    };
    const side = pairs(zb, -R);
    room.windows = { ...win, sides: { [-1]: side, [1]: [...side] }, back: s > 0 ? pairs(-wallIn, bx - bw / 2) : pairs(bx + bw / 2, wallIn) };
    if (roomy && I.staff?.host) {
      // behind the host, in place of the pair of windows nearest: a wall
      // planter of trailing ivy in a standard café, hung just behind the
      // host's head; a wall hanging in a double
      const ws = room.windows.sides[s];
      let best = -1;
      for (let i = 0; i + 1 < ws.length; i += 2) if (best < 0 || Math.abs((ws[i] + ws[i + 1]) / 2 - cm) < Math.abs((ws[best] + ws[best + 1]) / 2 - cm)) best = i;
      if (best >= 0) {
        const m = (ws[best] + ws[best + 1]) / 2;
        ws.splice(best, 2);
        // (the ivy right behind the host's head, on the host's own line)
        if (std) planter(s * (wallIn - 0.005), cm, -s * Math.PI / 2, 1.05, "ivy");
        else items.push({ t: "hanging", x: s * (iw - 0.01), z: m, yaw: -s * Math.PI / 2, y: 1.7 });
      }
    }
    {
      // in place of the pair of windows nearest the middle of the door's
      // side wall, up over the tables: an abstract canvas in a standard
      // café, a wall planter of trailing ivy in the others
      const e = -s, ws = room.windows.sides[e], mz = (zb - R) / 2;
      let best = -1;
      for (let i = 0; i + 1 < ws.length; i += 2) if (best < 0 || Math.abs((ws[i] + ws[i + 1]) / 2 - mz) < Math.abs((ws[best] + ws[best + 1]) / 2 - mz)) best = i;
      if (best >= 0) {
        const m = (ws[best] + ws[best + 1]) / 2;
        ws.splice(best, 2);
        if (std) items.push({ t: "hanging", x: e * (iw - 0.01), z: m, yaw: -e * Math.PI / 2, y: 1.55, art: "abstract" });
        else planter(e * (wallIn - 0.005), m, -e * Math.PI / 2, 1.35, "ivy");
      }
    }
    if (!roomy) {
      // A TINY CAFÉ: the host stand at the back, in front of the windows
      // looking into the kitchen, room behind it for the host (in from the
      // kitchen door's side); a plant in the front corner away from the door;
      // two tables in one of two layouts (`tinySeating`)
      const wb = room.windows.back, hx = wb.length ? (Math.min(...wb) + Math.max(...wb)) / 2 : 0, hl = 1.1;
      const hz0 = zb + 0.62, hz1 = hz0 + 0.64;
      stand(hx, (hz0 + hz1) / 2, 0, hl);
      block(hx - hl / 2, hx + hl / 2, hz0, hz1);
      if (I.staff?.host) { items.push({ t: "host", x: hx, z: zb + 0.31, yaw: 0 }); block(hx - 0.2, hx + 0.2, zb, hz0); }
      // behind the host, a wall hanging where that pair of windows was
      room.windows.back = [];
      items.push({ t: "hanging", x: hx, z: zb + 0.01, yaw: 0, y: 1.7 });
      const px = away * (iw - 0.35);
      items.push(tallOf(px, -0.6, pot())); r(); // (a tall one; the old size's draw kept, so the rest stays put)
      block(px - 0.35, px + 0.35, -0.95, -0.25);
      // the two tables (see `tinySeating`): side by side across the middle
      // in a row parallel to the front and its door, each one's chairs front
      // and back; or front to back down the middle, chairs across the room
      const mid = (-0.45 + hz1) / 2;
      const seating = I.tinySeating === "side by side" || I.tinySeating === "front to back" ? I.tinySeating
        : rngOf(I.seed * 31 + 7)() < 0.5 ? "side by side" : "front to back";
      room.seating = seating;
      if (seating === "side by side") {
        const tx = Math.min(0.8, iw * 0.48);
        [-tx, tx].forEach((x, i) => {
          items.push({ t: "cafe", x, z: mid, yaw: Math.PI / 2, chairs: 2, key: `table${i}-0` });
          block(x - 0.35, x + 0.35, mid - 0.85, mid + 0.85);
        });
      } else {
        const apart = 1.4;
        [mid + apart / 2, mid - apart / 2].forEach((z, i) => {
          items.push({ t: "cafe", x: 0, z, yaw: 0, chairs: 2, key: `table${i}-0` });
          block(-0.85, 0.85, z - 0.35, z + 0.35);
        });
      }
    } else {
      // (no small pot plant by the kitchen door: a double café's one plant
      // is the tall one in the back corner, see below)
      // tables, clear of the lanes in from either door
      const lanes = [[d.x - 0.95, d.x + 0.95, -1.75, 0], [bx - 0.7, bx + 0.7, zb, zb + 1.2]];
      // into the kitchen, in a standard or double café: one big plain
      // rectangle in place of the pair of arches (`pass`: its own `w`, `h`,
      // `foot`, its middle `at`), across the back wall between its end and
      // the kitchen door, a margin each side (`wb` kept, where the pair
      // would have been, for the standard one's tables to line up on)
      const wb = room.windows.back;
      {
        const [a, b] = s > 0 ? [-wallIn, bx - bw / 2] : [bx + bw / 2, wallIn];
        const foot = 0.8, pw = Math.min(b - a - 0.7, 2.6);
        room.windows.back = [];
        if (pw > 0.6) room.windows.pass = { w: pw, foot, h: Math.min(1.3, h - foot - 0.35), top: 0, at: [(a + b) / 2] };
      }
      if (C.body.size === 2 && wb.length >= 2) {
        // A STANDARD CAFÉ: three tables in one line down the room, front
        // to back, centred on the big window into the kitchen and running out from them toward the
        // front, evenly spaced; each one's chairs either side, across the
        // room. From just off the back wall to just behind the counter and
        // the front door's lane
        const wx = (wb[0] + wb[1]) / 2, x = clamp(wx, -iw + 0.95, iw - 0.95);
        const zBack = zb + 0.45, zFront = -2.25, sp = (zFront - zBack) / 2;
        [zBack, zBack + sp, zFront].forEach((z, i) => {
          items.push({ t: "cafe", x, z, yaw: 0, chairs: 2, key: `table${i}-0` });
          block(x - 0.85, x + 0.85, z - 0.35, z + 0.35);
        });
      } else if (C.body.size === 3) {
        // A DOUBLE CAFÉ: six tables, two columns of three, every one square
        // to the room with its two chairs either side across it; on the
        // side away from the counter and the kitchen door, the outer column
        // in off the wall, the rows `pz` apart, the middle one centred on the
        // side wall (front to back wall, the kitchen not counted)
        const hx = 0.85, hz = 0.35, px = 2 * hx + 0.3, pz = 1.09;
        const xo = -s * (iw - hx - 0.3), xs = [xo + s * px, xo];
        const zm = (-R + zb) / 2;
        [zm + pz, zm, zm - pz].forEach((z, j) => xs.forEach((x, i) => {
          items.push({ t: "cafe", x, z, yaw: 0, chairs: 2, key: `table${j}-${i}` });
          block(x - hx, x + hx, z - hz, z + hz);
        }));
      } else {
      // in a grid: every table square to the room, its two chairs either
      // side across it, in columns evenly spaced and centred across the room
      // and rows `pz` apart from the front back; a cell left empty wherever
      // its table would stand in anything (or a door's lane), so the rest
      // still line up
      const hits = (x0, x1, z0, z1) => [...blocks.map((k) => [k.x0, k.x1, k.z0, k.z1]), ...lanes].some(([a0, a1, b0, b1]) => x0 < a1 && x1 > a0 && z0 < b1 && z1 > b0);
      const hx = 0.85, hz = 0.35, gap = 0.1, px = 2 * hx + 0.3, pz = 2 * hz + 0.5;
      const nx = Math.max(1, Math.floor((2 * iw - 0.2 + 0.3) / px));
      const xs = Array.from({ length: nx }, (_, i) => (i - (nx - 1) / 2) * px);
      let row = 0;
      for (let z = -0.45 - hz; z - hz > zb + 0.1; z -= pz) {
        let any = false;
        for (const x of xs) {
          if (hits(x - hx - gap, x + hx + gap, z - hz - gap, z + hz + gap)) continue;
          items.push({ t: "cafe", x, z, yaw: 0, chairs: 2, key: `table${row}-${items.length}` });
          block(x - hx, x + hx, z - hz, z + hz);
          any = true;
        }
        if (any) row++;
      }
      }
    }
  } else if (lobby) {
    // THE LOBBY: a blue-grey carpet (its `floors` colour); a welcome mat
    // inside the door, clear of the doorway; the concierge's desk at the
    // back, the concierge stood behind it looking out (`concierge`), a clock
    // over it; a wall of mailboxes on the side wall away from the door; the
    // doors of a lift on the door's side; pot plants in two corners
    const dw = clamp((d.W - 2.6) / S, 4, 6.5), half = (dw * S) / 2;
    items.push({ t: "counter", x: 0, z: cz, w: dw });
    block(-half - 0.1, half + 0.1, zb, cz + 0.36);
    if (I.concierge) items.push({ t: "host", x: 0, z: zb + 0.36, yaw: 0 });
    if (h > 2.3) items.push({ t: "clock", x: 0, z: zb + 0.01, yaw: 0, y: 2.1 });
    items.push({ t: "rug", x: d.x, z: -R - 0.5, w: (d.width + 0.3) / S, l: 0.55 / S, rug: { cornerRadius: 0.15, color: "#A9844F", pattern: { layout: "border", spacing: 0.5, inset: 0.3 } } });
    const mz = -D * 0.5, cols = roomy ? 5 : 3, mw = (cols * 0.75 + (cols - 1) * 0.05 + 0.24) * S;
    items.push({ t: "mailboxes", x: away * (iw + 0.03), z: mz, yaw: -away * Math.PI / 2, hang: 0.55, cfg: { cols, rows: 5, box: { width: 0.75, height: 0.55 }, seed: Math.floor(r() * 60) + 1 } });
    block(away * (iw + 0.03), away * (iw - 0.12), mz - mw / 2, mz + mw / 2);
    // the lift: its doors in the side wall on the door's side, midway down
    // (in a tiny lobby, its back wall's corner instead would crowd the
    // desk: it keeps to the side wall all the same)
    const ez = -D * 0.5;
    items.push({ t: "elevator", x: doorSide * (iw + 0.03), z: ez, yaw: -doorSide * Math.PI / 2 });
    block(doorSide * (iw + 0.03), doorSide * (iw - 0.1), ez - 0.65, ez + 0.65);
    [[away * (iw - 0.35), -0.6], [doorSide * (iw - 0.35), zb + 0.4]].forEach(([x, z]) => {
      items.push({ t: "plant", x, z, kind: r() < 0.5 ? "leaf" : "bush", size: 0.9 + r() * 0.3, pot: pot() });
      block(x - 0.3, x + 0.3, z - 0.3, z + 0.3);
    });
  } else if (salon) {
    // THE SALON: a checkered floor; down the wall away from the door, from
    // the front back, a mirror with a shelf of bottles under it and a salon
    // chair before it, turned to it, someone in it now and then
    // (`diners`), the stylist stood behind the first (`keeper`); wash
    // basins against the back wall on the door's side, a chair tipped back
    // before each; chairs under hood dryers down the door's side;
    // a pot plant in the front corner on the door's side (a roomy one's)
    room.tiled = I.tiles.salon;
    const face = iw + 0.03, s = away;
    let i = 0;
    for (let z = -1.0; z - 0.5 > zb + 0.3; z -= 1.1, i++) {
      items.push({ t: "mirror", x: s * face, z, yaw: -s * Math.PI / 2, g: goods({ x0: -0.42, x1: 0.42, z: 0.2, depth: 0.18, shelves: [0.85], style: "bottles", legs: false }) });
      block(s * face, s * (face - 0.25), z - 0.45, z + 0.45);
      const cx = s * (face - 0.8);
      items.push({ t: "salon", x: cx, z, yaw: s * Math.PI / 2, key: `salon${i}-0` });
      block(cx - 0.33, cx + 0.33, z - 0.33, z + 0.33);
      if (i === 0 && I.keeper) { const hx = s * (face - 1.35); items.push({ t: "host", x: hx, z: z + 0.05, yaw: s * Math.PI / 2 }); block(hx - 0.2, hx + 0.2, z - 0.15, z + 0.25); }
    }
    // the wash basins, along the back on the door's side
    const nb = roomy ? 2 : 1;
    for (let k = 0; k < nb; k++) {
      const bx = doorSide * (face - 0.55 - k * 0.9);
      items.push({ t: "basin", x: bx, z: zb, yaw: 0 });
      items.push({ t: "salon", x: bx, z: zb + 0.85, yaw: 0, lean: 24, key: `wash${k}-0` });
      block(bx - 0.4, bx + 0.4, zb, zb + 1.2);
    }
    // down the door's side behind its lane, salon chairs under hood
    // dryers hung from the ceiling, facing into the room
    if (roomy) [-2.35, -3.2].forEach((z, k) => {
      const x = doorSide * (iw - 0.75);
      items.push({ t: "salon", x, z, yaw: -doorSide * Math.PI / 2, dryer: h / S, key: `dryer${k}-0` });
      block(x - doorSide * 0.35, doorSide * iw, z - 0.35, z + 0.35); // the chair and its pole behind it
    });
    const px = doorSide * (iw - 0.35);
    if (roomy && Math.abs(px - d.x) > 0.8) { items.push({ t: "tall", x: px, z: -0.6, pot: pot() }); block(px - 0.3, px + 0.3, -0.9, -0.3); }
  } else if (conv) {
    // THE CONVENIENCE STORE: a plain tiled floor; glass-door coolers of
    // drinks down both side walls (clear of the door's lane and the till)
    // and along the back; an aisle of goods down the middle, shelves both
    // sides (two aisles in a double); the till by the front against the
    // wall away from the door, sweets along it, the shopkeeper stood
    // behind it looking out (`keeper`)
    room.tiled = I.tiles["convenience store"];
    const cd = 0.55, ch = Math.min(1.95, h - 0.4), wallIn = d.W / 2 - 0.12, face = iw + 0.03;
    const len = d.W < 3.5 ? 1.0 : 1.4, c0 = -0.3, cm = c0 - len / 2, yaw = -away * Math.PI / 2, tx = away * (wallIn - 0.9);
    items.push({ t: "kcounter", front: true, x: tx, z: cm, yaw, w: len / S - 0.16 });
    items.push({ t: "goods", x: tx, z: cm, yaw, lift: 2.6 * S, g: goods({ x0: -len / 2 + 0.12, x1: len / 2 - 0.12, z: 0.12, depth: 0.2, shelves: [0.01], style: "boxes", legs: false }) });
    block(away * (wallIn - 0.58), away * (wallIn - 1.22), c0, c0 - len);
    if (I.keeper) { items.push({ t: "host", x: away * (wallIn - 0.29), z: cm, yaw }); block(away * (wallIn - 0.1), away * (wallIn - 0.48), cm + 0.2, cm - 0.2); }
    const cooler = (x, z, yaw, l) => l > 0.5 && items.push({ t: "cooler", x, z, yaw, len: l, h: ch, d: cd, seed: Math.floor(r() * 1000) });
    // along the back, between the side ones
    cooler(0, zb, 0, 2 * (face - cd));
    block(-face + cd, face - cd, zb, zb + cd);
    // down each side, from just behind the door's lane (or the till) back to the corner
    const lane = [d.x - 0.95, d.x + 0.95];
    [-1, 1].forEach((e) => {
      const x0 = Math.min(e * face, e * (face - cd)), x1 = Math.max(e * face, e * (face - cd));
      const zf = e === away ? c0 - len - 0.25 : x0 < lane[1] && x1 > lane[0] ? -1.85 : -0.4;
      cooler(e * face, (zf + zb) / 2, -e * Math.PI / 2, zf - zb);
      block(x0, x1, zb, zf);
    });
    // the aisles: evenly across the room between the side coolers, from
    // behind the till and the door's lane to a walk short of the back ones
    const n = d.W >= SHOP_WIDTHS[3] - 1e-6 ? 2 : 1, inner = face - cd;
    const za = -1.9, zk = zb + cd + 0.85, L = za - zk;
    if (L > 0.6) for (let i = 0; i < n; i++) {
      const x = -inner + ((i + 1) * 2 * inner) / (n + 1), z = (za + zk) / 2;
      [1, -1].forEach((e) => items.push({ t: "goods", x, z, yaw: e * Math.PI / 2, g: goods({ x0: -L / 2, x1: L / 2, z: 0.28, depth: 0.26, shelves: [0.12, 0.45, 0.8, 1.15], style: "boxes" }) }));
      block(x - 0.3, x + 0.3, zk, za);
    }
  } else if (I.kind === "bakery") {
    // shelves of cakes on the back wall either side of the keeper, and a
    // tray of them along the counter top
    [[-iw + 0.1, -0.6], [0.6, iw - 0.1]].forEach(([x0, x1]) => x1 - x0 > 0.5 && items.push({ t: "goods", x: 0, z: 0, yaw: 0, g: goods({ x0, x1, z: zb + 0.3, shelves: [0.95, 1.4, 1.85], style: "cakes" }) }));
    items.push({ t: "goods", x: 0, z: 0, yaw: 0, lift: 2.6 * S, g: goods({ x0: -(cw * S) / 2 + 0.12, x1: (cw * S) / 2 - 0.12, z: cz + 0.2, depth: 0.4, shelves: [0.02], style: "cakes" }) });
    if (roomy) {
      // a table to sit at with a bun
      const x = away * (iw - 0.85);
      items.push({ t: "cafe", x, z: -1.25, yaw: r() * Math.PI, chairs: 2, key: "table0" });
      block(x - 0.6, x + 0.6, -1.85, -0.65);
    }
    const tz = -1.9 - r() * 0.6;
    items.push({ t: "tall", x: doorSide * (iw - 0.35), z: tz, pot: pot() });
    block(doorSide * (iw - 0.6), doorSide * iw, tz - 0.25, tz + 0.25);
  } else if (I.kind === "florist") {
    // pot plants of every kind along both walls (clear of the door), and a
    // table of cut flowers in the middle
    // (its style's: which kinds, and the colours of their blooms and leaves,
    // picked by the decor's chances so the plants stand where they would)
    const Pl = FLORIST_STYLES[I.floristStyle]?.plants ?? {};
    const kinds = ["bush", "leaf", "daisy", "tulip", "poppy"], ownKinds = Pl.kinds ?? kinds;
    const hueOf = (k) => { const list = k === "bush" || k === "leaf" ? Pl.leaves : Pl.blooms; return list ? dpick(list) : undefined; };
    [-1, 1].forEach((s) => {
      for (let z = s === doorSide ? -1.4 : -0.5; z > cz + 0.9; z -= 0.72) {
        const k = ownKinds[Math.floor(r() * ownKinds.length)];
        items.push({ t: "plant", x: s * (iw - 0.32 - r() * 0.1), z, kind: k, size: 0.7 + r() * 0.6, pot: pot(), color: hueOf(k) });
        block(s * iw, s * (iw - 0.65), z - 0.3, z + 0.3);
      }
    });
    // a wall planter on the back wall over the counter
    if (h > 2.2) planter(0, zb + 0.005, 0, 1.45);
    if (roomy) {
      const z = -2.1;
      items.push({ t: "table", x: 0, z, w: 4, l: 2.4 });
      items.push({ t: "goods", x: 0, z: 0, yaw: 0, lift: 2 * S, g: goods({ x0: -0.48, x1: 0.48, z: z + 0.22, depth: 0.44, shelves: [0.02], style: "flowers" }) });
      block(-0.62, 0.62, z - 0.42, z + 0.42);
    }
  } else if (I.kind === "bookshop") {
    // books up both long walls, a rug, an armchair under a lamp in the
    // front corner away from the door
    const shelves = [0.3, 0.75, 1.2, 1.65, 2.1].filter((y) => y < h - 0.35);
    [-1, 1].forEach((s) => shelving(s, s === doorSide ? -1.0 : -0.4, cz + 0.5, { shelves, style: "books" }));
    items.push({ t: "rug", x: 0, z: -2.2, w: 6, l: 4 });
    if (roomy) {
      const x = away * (iw - 0.85);
      items.push({ t: "chair", x, z: -1.05, yaw: -away * 0.8 });
      items.push({ t: "lamp", x: x + away * 0.1, z: -0.55 });
      block(x - 0.35, x + 0.35, -1.4, -0.4);
    }
  } else {
    // the general store: boxes and tins up both walls, a fridge in the
    // front corner away from the door, an island of more in a big one
    const shelves = [0.3, 0.75, 1.2, 1.65].filter((y) => y < h - 0.35);
    [-1, 1].forEach((s) => shelving(s, s === doorSide ? -1.0 : -1.2, cz + 0.5, { shelves, style: "boxes" }));
    const fx = away * (iw - 0.42);
    items.push({ t: "fridge", x: fx, z: -0.55, yaw: 0 });
    block(fx - 0.4, fx + 0.4, -0.95, -0.15);
    if (d.W >= SHOP_WIDTHS[3] - 1e-6) {
      items.push({ t: "goods", x: 0, z: -2.4, yaw: 0, g: goods({ x0: -1.0, x1: 1.0, z: 0.14, shelves: [0.35, 0.8], style: "boxes" }) });
      block(-1.05, 1.05, -2.6, -2.2);
    }
  }
  // a roomy café: a tall plant in the back corner on the door's side, if
  // the tables leave it room
  if (cafe && roomy) tall(-away * (iw - 0.3), zb + 0.32);
  // every wall hanging a kind of its own (Furniture/Wall Decor/Wall Hanging):
  // a picture, a landscape, an abstract canvas, a gallery, a shape
  items.forEach((it) => { if (it.t === "hanging") { const k = dpick(WALL_HANGING_KIND_NAMES); it.art ??= k; } });
  // in a café, the abstract canvas (the biggest of them) hung a little lower
  if (cafe) items.forEach((it) => { if (it.t === "hanging" && it.art === "abstract") it.y -= 0.3; });
  return { room, items, blocks };
}
