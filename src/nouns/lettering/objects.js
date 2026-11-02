import { solid } from "../../world/palette.js";

// Lettering: a word written out in shapes and stood up, its face to +z,
// its middle at x = 0. Two scripts:
//
//   "glyphs"  the world's own script — the symbols carved up the Monuments
//             (the albatross statues' wGlyph: ring, triangle, square,
//             pentagon, bar, I, II, III, dot), the ones the street's speech
//             bubbles are written in. Each letter of the word is one glyph,
//             always the same one for the same letter (GLYPH_OF), so a sign
//             that says cafe says it the same way on every café; drawn as
//             strokes `stroke` wide in a cell `size` square
//   "font"    a typeface's own glyphs, one of LETTERING_FONTS (three's own
//             typefaces, the bold cut of each) at an em of `size`
//
// Either can be got WRONG (`wrong`): each letter bobbed off the line,
// tilted, grown or squeezed by its own roll, and every outline pushed
// about by smooth noise, so it reads as the word while something about it
// is off — cut from card by hand, or melted a little in the sun. As made,
// nothing is wrong (STRAIGHT); the Melted and Cutout entries show it.
//
//   say      the word
//   script   "glyphs" or "font"
//   font     the typeface, for "font"
//   size     a glyph's cell, or the font's em, in world units
//   glyphs   the glyph script's own: `stroke` how wide a stroke is, as a
//            share of the cell; `advance` how far the pen moves on after
//            a glyph, and `space` after a space, as shares of the cell
//   thick    front to back
//   bevel    how much the edges are rounded
//   color    its own
//   wrong    how wrong it is. Every 0 is the script as it came:
//     seed     which wrongness
//     wobble   the outlines pushed about by smooth noise, as a share of
//              `size` (0.1 of it at 1)
//     grain    how many bumps of that noise fit in a `size`: few is melted,
//              many is a trembling hand
//     bob      each letter up or down off the baseline, as a share of `size`
//     tilt     degrees each letter may lean, one way or the other
//     grow     how much bigger or smaller each letter may be, a share of 1
//     squeeze  how much narrower or wider each letter may be
//     slant    the whole word sheared, degrees off upright
//     drift    the letter spacing gone uneven, as a share of `size`
export const GLYPHS = ["ring", "triangle", "square", "pentagon", "bar", "I", "II", "III", "dot"];
// which glyph a letter is: round the nine by its place in the alphabet
// (a ring, b triangle, ... i dot, j ring again), any other character by
// its code
export const GLYPH_OF = (ch) => {
  const c = ch.toLowerCase().charCodeAt(0);
  return GLYPHS[(c >= 97 && c <= 122 ? c - 97 : c) % GLYPHS.length];
};
export const LETTERING_SCRIPTS = ["glyphs", "font"];
export const LETTERING_FONTS = ["helvetiker", "optimer", "gentilis", "droid sans", "droid serif"];
export const LETTERING_WORDS = ["cafe", "bakery", "books", "flowers", "florist", "salon", "shop", "open"];
// Nothing wrong at all: the script as it came, as the shopfronts' signs
// have it.
export const STRAIGHT = { wobble: 0, bob: 0, tilt: 0, grow: 0, squeeze: 0, slant: 0, drift: 0 };
export const LETTERING = {
  say: "cafe",
  script: "glyphs",
  font: "droid serif",
  size: 1,
  glyphs: { stroke: 0.1, advance: 0.9, space: 0.5 },
  thick: 0.12,
  bevel: 0.012,
  color: solid("#2F2A36"),
  wrong: { seed: 3, grain: 1.4, ...STRAIGHT },
};

export const LETTERING_KNOBS = {
  say: { path: "say", options: LETTERING_WORDS, name: "says" },
  script: { path: "script", options: LETTERING_SCRIPTS },
  font: { path: "font", options: LETTERING_FONTS, name: "font (for the font script)" },
  size: { path: "size", range: [0.3, 3, 0.1] },
  stroke: { path: "glyphs.stroke", range: [0.03, 0.25, 0.01], name: "glyph stroke" },
  advance: { path: "glyphs.advance", range: [0.5, 1.5, 0.05], name: "glyph spacing" },
  thick: { path: "thick", range: [0.02, 0.6, 0.01], name: "thickness" },
  bevel: { path: "bevel", range: [0, 0.08, 0.004] },
  color: { path: "color.hex", color: true },
  seed: { path: "wrong.seed", range: [0, 40, 1], name: "wrong: seed" },
  wobble: { path: "wrong.wobble", range: [0, 2, 0.05], name: "wrong: wobble" },
  grain: { path: "wrong.grain", range: [0.3, 6, 0.1], name: "wrong: grain" },
  bob: { path: "wrong.bob", range: [0, 0.5, 0.01], name: "wrong: bob" },
  tilt: { path: "wrong.tilt", range: [0, 30, 1], name: "wrong: tilt" },
  grow: { path: "wrong.grow", range: [0, 0.6, 0.01], name: "wrong: grow" },
  squeeze: { path: "wrong.squeeze", range: [0, 0.6, 0.01], name: "wrong: squeeze" },
  slant: { path: "wrong.slant", range: [-30, 30, 1], name: "wrong: slant" },
  drift: { path: "wrong.drift", range: [0, 0.5, 0.01], name: "wrong: drift" },
};
