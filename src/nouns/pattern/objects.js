import { PALETTE } from "../../world/palette.js";

// A pattern of dots raised on a flat face — a rug's, a cushion's (see
// Pattern.jsx): `layout` how they are laid out — "grid", rows and
// columns `spacing` apart; "stagger", the same with every other row
// slid half a step; "border", a ring of them just inside the edge,
// `spacing` apart along it; "rings", borders inside borders, `spacing`
// apart, to the middle; or "none" — kept `inset` in from the edge, each
// `raise` thick on top of the face. `dots` are the dots themselves, one
// to three (see DOTS), dealt round in turn — with two, every other dot
// is the second; with three, the first, the second, the third, and
// round again. Each is a polygon of `sides` points equidistant from its
// middle, at `radius`; `inner` pinches every other point in to that
// share of the radius, making it a star (1 is no pinch, a plain
// polygon); `turn` spins it, in degrees; `color` its own.
export const DOT = {
  sides: 8,
  radius: 0.22,
  inner: 1,
  turn: 0,
  color: PALETTE.rug.dots[0],
};
export const DOTS = 3;
export const LAYOUTS = ["grid", "stagger", "border", "rings", "none"];
export const PATTERN = {
  layout: "grid",
  spacing: 0.8,
  inset: 0.5,
  raise: 0.05,
  dots: [DOT],
};
