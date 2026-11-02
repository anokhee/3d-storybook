// A MASK, as a Shadow Spirit wears one (../anthro/ShadowSpirit.jsx): a round
// shell shrink-wrapped onto the face it is made for — its back a hair off
// the skin, domed out a little more at the middle — and on its front, laid
// the same way (shrink-wrapped onto the shell), what it shows: eyes, a mouth,
// face paint (lines, dots or whiskers); and, for some, ears standing up from its rim.
//
// MASK_SHAPE is the shell: `radius` across, its back `lift` off the skin,
// `thick`, its front domed out `bulge` more at the middle; `eyeAt` where the
// eyes sit from its middle, [across, up]; `smooth` how many times its shape
// is eased (a mask is rigid: it follows the face's shape, not every crease).
//
// MASK_STYLES are the designs, each a list of what is drawn:
//   eyes     "round" (holes), "slit" (thin and flat), "tilted up",
//            "tilted down" (almonds, outer corners raised or dropped) or
//            "doe" (small and nearly round) — EYES in ./build.js
//            (the builder can still draw "happy",
//            closed arcs; none are dealt)
//   mouth    "toothy" (an open dark blob, small white teeth lining its top
//            and bottom edges), "toothy frown" (the same, turned sulky: its
//            corners drooping), "frown", or none — no smiles
//   nose     "cone": the dolly's nose, a cone rounded off at its tip
//            standing straight out of the face; "button": a little round
//            bead; "snout": a pig's, a flat-ended disc with two nostrils;
//            "triangle" (or "cat"): a little painted triangle — each in a
//            deeper shade of the shell (noseColorOf in ./build.js) unless
//            `noseColor` says
//   ears     "horse" (the zebra's: standing up to soft points) or "bear"
//            (round, sat on the rim) — in the shell's colour, their insides
//            a deeper shade of it (ears and horns: the headdress, HEADDRESSES)
//   tendrils how many smooth, tapering stalks (1–3) fan out of each
//            side, the middle one halfway down the face, in `tendrilColor` (else a deeper shade of the shell) —
//            their own switch, with any headdress
//   horns    horns out of its forehead, of a `type` — "buffalo", "ram",
//            "giraffe" (ossicones), "rhino" (one horn) or "elephant"
//            (tusks), each that animal's own shape (HORN_TYPES in ./build.js);
//            the buffalo's a pair like so, each on
//            a flat base, straight out of the forehead (perpendicular to
//            it; `tilt` leans it toward the side), then out, up and curling
//            in at a blunt tip — `radius` at the base, `tip` of that at the
//            tip, `length` tall, rooted `x` either side of the middle and `y`
//            up from it, in `color`; `show` whether it has them
//   paints   the face paint: a list of any of PAINTS in ./build.js, each its
//            own switch — "whiskers" (three a side), "vertical" (a line down
//            through each eye and one on the brow), "underEye" (1–3 even strokes
//            under each eye, `underEyeLines`), "brow" (a filled triangle, with blushed cheeks), "chin" (three stripes),
//            "cheekDots" (with a line down the forehead and chin), "flicks" (eyeliner: round each eye and out to a point),
//            — in
//            `markColor` (else the ink), standing a hair proud of the shell
// (Only `plain` and `horned` are made up for now; the rest are there to draw.)
// And `color`, if the style has a shell colour of its own (else the
// wearer's mask colour), `ink` likewise for the eyes, mouth and lines.
// the paint variants, one of which a mask may wear (PAINTS in ./build.js)
export const PAINT_VARIANTS = ["vertical", "underEye", "brow", "chin", "flicks", "cheekDots", "whiskers"];
export const MASK_SHAPE = { radius: 0.15, lift: 0.01, thick: 0.016, bulge: 0.014, eyeAt: [0.052, 0.022], smooth: 8 };

export const MASK_STYLES = {
  plain: { eyes: "round" },
  // the default white, slit-eyed, the dolly's cone nose, an open
  // toothy mouth and a pair of buffalo horns (see `horns` above:
  // tune them with MASK.horn's knobs)
  horned: {
    eyes: "tilted up",
    nose: "cone",
    mouth: "toothy",
    paints: ["vertical"],
    horns: { show: true, type: "buffalo", radius: 0.022, tip: 0.53, length: 0.1, tilt: 0, x: 0.062, y: 0.095, color: "#F2E9DC" },
  },
};
// THE HEADDRESS: what stands up out of the mask's rim or forehead — at most
// one of these: ears, or horns of a type (HORN_TYPES in ./build.js) — each
// as the style fields it sets. (Tendrils, out of the sides, are their own
// switch: `tendrils`.)
export const HEADDRESSES = {
  "horse ears": { ears: "horse" },
  "bear ears": { ears: "bear" },
  "buffalo horns": { horns: "buffalo" },
  "ram horns": { horns: "ram" },
  "giraffe horns": { horns: "giraffe" },
  "rhino horn": { horns: "rhino" },
  "elephant tusks": { horns: "elephant" },
};
export const MASK_STYLE_NAMES = Object.keys(MASK_STYLES);
const MASK_HORN = MASK_STYLES.horned.horns;

// The prop on its own (Props/Mask): which `style`, its colours, and how big
// it is shown (`scale`: a mask is small beside anything else), or `worn` by
// a Shadow Spirit instead.
export const MASK = {
  style: "horned",
  // the headdress: one of HEADDRESSES (ears or horns), or "none"
  headdress: "buffalo horns",
  // tendrils out of each side, with any headdress: 0 (none) to 3
  tendrils: 0,
  // the horns' shape, when the headdress is horns: these override the style's own
  horn: { ...MASK_HORN },
  // the paint (one at most: lines, dots or whiskers) and its colour: these override the style's own
  paint: "vertical",
  // the pattern: a faint tone-on-tone deco design under the paint (PATTERNS
  // in ./build.js: border, beads, sunburst, swirls, fans) or "none", and how
  // much deeper than the shell it is
  pattern: "border",
  patternShade: 0.09,
  // how many under-eye lines (the underEye paint): 1 to 3
  underEyeLines: 2,
  markColor: "#1A1620",
  // the eyes: "round", "slit", "tilted up", "tilted down" or "doe"
  eyes: "tilted up",
  // the nose: none, "cone", "button", "snout" or "triangle"
  nose: "cone",
  worn: false,
  scale: 5,
  color: "#F7F4EE",
  ink: "#1A1620",
};

export const MASK_KNOBS = {
  worn: { path: "worn", bool: true, name: "worn by a Shadow Spirit" },
  color: { path: "color", color: true, name: "mask colour" },
  ink: { path: "ink", color: true, name: "eyes & lines colour" },
  eyes: { path: "eyes", options: ["round", "slit", "tilted up", "tilted down", "doe"], name: "eyes" },
  nose: { path: "nose", options: ["none", "cone", "button", "snout", "triangle"], name: "nose" },
  paint: { path: "paint", options: ["none", ...PAINT_VARIANTS], name: "paint" },
  underEyeLines: { path: "underEyeLines", range: [1, 3, 1], name: "under-eye lines" },
  markColor: { path: "markColor", color: true, name: "paint colour" },
  pattern: { path: "pattern", options: ["none", "border", "beads", "sunburst", "swirls", "fans"], name: "pattern (tone on tone)" },
  patternShade: { path: "patternShade", range: [0.02, 0.3, 0.01], name: "pattern depth" },
  headdress: { path: "headdress", options: ["none", ...Object.keys(HEADDRESSES)], name: "headdress" },
  tendrils: { path: "tendrils", range: [0, 3, 1], name: "tendrils (a side; 0 none)" },
  hornRadius: { path: "horn.radius", range: [0.005, 0.08, 0.001], name: "horn base radius" },
  hornLength: { path: "horn.length", range: [0.02, 0.3, 0.005], name: "horn length" },
  hornTip: { path: "horn.tip", range: [0.1, 1, 0.01], name: "horn tip (share of base)" },
  hornTilt: { path: "horn.tilt", range: [-1.57, 1.57, 0.01], name: "horn tilt off perpendicular" },
  hornX: { path: "horn.x", range: [0, 0.15, 0.002], name: "horn x" },
  hornY: { path: "horn.y", range: [-0.15, 0.15, 0.002], name: "horn y" },
  hornColor: { path: "horn.color", color: true, name: "horn colour" },
};

// DEALING A MASK (the grid on Props/Mask): a design drawn at random, `r` a
// seeded random in [0, 1), from what the builder can draw (see MASK_STYLES
// above): eyes and a nose always; a toothy mouth or none; a headdress — ears (horse or
// bear) OR horns, never both: they'd crowd the rim; tendrils on some; one paint on some — lines, dots or whiskers,
// never more than one. No smiles, closed eyes, tears, cat or fox ears,
// moons or stars. Whiskers are paint now; blush cheeks come only with the brow.
// MASK_SHELLS: never black — every shell light, the colours pale, most of
// the way to the white mask's bone (55% of the way), to stand out hard
// against the spirits' plum-black bodies, in colours that sit well with
// them (bone, cream, butter, peach, coral, rose, lilac, sky, mint), its ink
// the dark of the bodies themselves.
export const MASK_SHELLS = ["#F7F4EE", "#F7F4EE", "#F5EDDC", "#F7E7B6", "#F7D9C1", "#F4C4B9", "#F6D2D9", "#E2D7EE", "#CEE4EF", "#D3EBD8"];
const INK = "#1A1620";
const BLUSH = ["#F2A9B8", "#E8826E"], PAINT = ["#C8423A", "#2E5E9E", "#1A1620", "#E0A82E", "#7A4FB8"];
const HORN_COLORS = ["#F2E9DC", "#F2E9DC", "#C9A94E", "#8A5A3B", "#E8D5B0"];
const HORNS = ["buffalo", "ram", "giraffe", "rhino", "elephant"];
// THE WALL (the grid on Props/Mask, and the masks the street's spirits
// wear): `count` designs, each { style, extra } for maskFor — the plain and
// the horned, then the rest dealt from a seed; `roll` reseeds them.
const mulberry = (seed) => () => { seed |= 0; seed = (seed + 0x6d2b79f5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
export function maskWall(count = 24, roll = 0) {
  const r = mulberry(roll * 7919 + 17);
  return Array.from({ length: count }, (_, i) => (i === 0 ? { style: "plain" } : i === 1 ? { style: "horned" } : { style: "plain", extra: dealMask(r) }));
}
export function dealMask(r) {
  const pick = (list) => list[Math.floor(r() * list.length)];
  const chance = (p) => r() < p;
  const color = pick(MASK_SHELLS);
  const ink = INK;
  const s = { color, ink, eyes: pick(["round", "slit", "tilted up", "tilted down", "doe"]) };
  // the mouth: the toothy one, or none at all
  const mouth = pick(["toothy", "none"]);
  if (mouth !== "none") s.mouth = mouth;
  s.nose = pick(["cone", "button", "snout", "triangle", "cone"]); // always a nose
  const crown = r();
  if (crown < 0.3) {
    s.ears = pick(["horse", "bear"]);
  } else if (crown < 0.65) {
    s.horns = { ...MASK_HORN, type: pick(HORNS), color: pick(HORN_COLORS) };
  }
  // a faint tone-on-tone pattern under it all, on about half
  if (chance(0.5)) s.pattern = pick(["border", "beads", "sunburst", "swirls", "fans"]);
  // tendrils, on their own, out of the sides (with any headdress)
  if (chance(0.2)) s.tendrils = 1 + Math.floor(r() * 3);
  // the paint: none on some, else exactly one
  if (chance(0.65)) {
    const name = pick(PAINT_VARIANTS);
    s.paints = [name];
    s.markColor = pick(PAINT);
    if (name === "underEye") s.underEyeLines = 1 + Math.floor(r() * 3);
    if (name === "brow") s.cheeks = pick(BLUSH); // the brow comes with blushed cheeks
  }
  return s;
}
