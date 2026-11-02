import * as THREE from "three";

import { toon } from "../../adjectives/unlit/toon.js";
import { solid } from "../../world/palette.js";

// THE BOWL'S DESIGNS (see BOWL's `design`): what's painted round its
// outside, drawn on a canvas that wraps once round the bowl — left to right
// is round it, the top the rim and the bottom the foot. Each design has its
// own colours under BOWL.colors[design]; "basic" is plain, the bowl's own
// `colors.bowl`, and paints nothing.
//
//   chinoiserie  blue-and-white: a double line under the rim, a band at
//                the foot, and round the middle peonies on curling stems
//   striped      stripes up its side, foot to rim, and a band at the rim
//   folk         flowers with leaves round the middle, a row of dots
//                under the rim and over the foot
const W = 1024, H = 128;
const hexOf = (c) => c?.hex ?? c;

const DRAW = {
  chinoiserie(ctx, c) {
    const ink = hexOf(c.ink);
    ctx.fillStyle = hexOf(c.porcelain); ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = ink;
    ctx.fillRect(0, 5, W, 5); ctx.fillRect(0, 15, W, 2); // under the rim
    ctx.fillRect(0, H - 12, W, 12); ctx.fillRect(0, H - 19, W, 2); // the foot
    // the curling stem, all the way round
    ctx.strokeStyle = ink; ctx.lineWidth = 3;
    ctx.beginPath();
    for (let x = 0; x <= W; x += 4) {
      const y = 52 + Math.sin((x / W) * Math.PI * 2 * 5) * 16;
      x ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
    }
    ctx.stroke();
    // peonies where it crests, curls where it dips
    for (let k = 0; k < 5; k++) {
      const x = ((k + 0.25) / 5) * W, y = 46;
      ctx.globalAlpha = 0.55;
      for (let p = 0; p < 7; p++) {
        const a = (p / 7) * Math.PI * 2;
        ctx.beginPath(); ctx.ellipse(x + Math.cos(a) * 20, y + Math.sin(a) * 20, 19, 12, a, 0, Math.PI * 2); ctx.fill();
      }
      ctx.globalAlpha = 1;
      ctx.beginPath(); ctx.arc(x, y, 12, 0, Math.PI * 2); ctx.fill();
      const cx = ((k + 0.75) / 5) * W;
      ctx.lineWidth = 4;
      ctx.beginPath(); ctx.arc(cx, 58, 16, Math.PI * 0.2, Math.PI * 1.7); ctx.stroke();
      ctx.beginPath(); ctx.arc(cx + 6, 62, 6, 0, Math.PI * 2); ctx.fill();
    }
  },
  striped(ctx, c) {
    ctx.fillStyle = hexOf(c.base); ctx.fillRect(0, 0, W, H);
    // stripes up the side, foot to rim, evenly round it
    ctx.fillStyle = hexOf(c.stripe);
    const n = 28, w = W / n;
    for (let k = 0; k < n; k++) ctx.fillRect(k * w + w * 0.25, 0, w * 0.5, H);
    ctx.fillStyle = hexOf(c.rim); ctx.fillRect(0, 0, W, 9);
  },
  folk(ctx, c) {
    ctx.fillStyle = hexOf(c.base); ctx.fillRect(0, 0, W, H);
    const dots = (y) => { ctx.fillStyle = hexOf(c.accent); for (let x = 8; x < W; x += 22) { ctx.beginPath(); ctx.arc(x, y, 4, 0, Math.PI * 2); ctx.fill(); } };
    dots(10); dots(H - 30);
    for (let k = 0; k < 6; k++) {
      const x = ((k + 0.5) / 6) * W, y = 48;
      // two leaves either side, then the flower over them
      ctx.fillStyle = hexOf(c.leaf);
      for (const s of [-1, 1]) { ctx.beginPath(); ctx.ellipse(x + s * 44, y + 8, 28, 12, s * 0.5, 0, Math.PI * 2); ctx.fill(); }
      ctx.fillStyle = hexOf(c.flower);
      for (let p = 0; p < 5; p++) {
        const a = (p / 5) * Math.PI * 2 - Math.PI / 2;
        ctx.beginPath(); ctx.arc(x + Math.cos(a) * 22, y + Math.sin(a) * 22, 17, 0, Math.PI * 2); ctx.fill();
      }
      ctx.fillStyle = hexOf(c.accent);
      ctx.beginPath(); ctx.arc(x, y, 13, 0, Math.PI * 2); ctx.fill();
    }
  },
};
export const BOWL_DESIGNS = ["basic", ...Object.keys(DRAW)];
// (the plate and the teacup wear the same: Food/Kitchen/Plate, Teacup)
export const DESIGNS = BOWL_DESIGNS;

// Each design's colours as made, under `colors[design]`.
export const DESIGN_COLORS = {
  chinoiserie: { porcelain: solid("#F5F3EC"), ink: solid("#2F4F9A") },
  striped: { base: solid("#F4E9D8"), stripe: solid("#D9705C"), rim: solid("#3B2A4E") },
  folk: { base: solid("#2F5E8C"), flower: solid("#F2B92E"), accent: solid("#E5534B"), leaf: solid("#8FD1A8") },
};

// The knobs for a design's colours, each shown only while its design is
// picked (by the `design` knob): for a noun whose colours are under
// `colors[design]`.
const when = (design) => ({ if: { arg: "design", eq: design } });
export const DESIGN_KNOBS = [
  { label: "porcelain", path: "colors.chinoiserie.porcelain.hex", color: true, ...when("chinoiserie") },
  { label: "ink", path: "colors.chinoiserie.ink.hex", color: true, ...when("chinoiserie") },
  { label: "base", path: "colors.striped.base.hex", color: true, ...when("striped") },
  { label: "stripes", path: "colors.striped.stripe.hex", color: true, ...when("striped") },
  { label: "rim", path: "colors.striped.rim.hex", color: true, ...when("striped") },
  { label: "ground", path: "colors.folk.base.hex", color: true, ...when("folk") },
  { label: "flowers", path: "colors.folk.flower.hex", color: true, ...when("folk") },
  { label: "flower middles", path: "colors.folk.accent.hex", color: true, ...when("folk") },
  { label: "leaves", path: "colors.folk.leaf.hex", color: true, ...when("folk") },
];

// The design's ground colour (its inside, its underside), or `plain` for
// "basic".
export const designGround = (design, colors, plain) =>
  design === "chinoiserie" ? colors.chinoiserie.porcelain
  : design === "striped" ? colors.striped.base
  : design === "folk" ? colors.folk.base
  : plain;

// The colour the design's inside and rim are: its ground.
export const groundOf = (design, colors) => designGround(design, colors, colors.bowl);

// The painted outside's material for `design` in its `colors`, or null for
// "basic". The caller frees it (and its map) with disposeDesign.
export function designMat(design, colors) {
  const draw = DRAW[design];
  if (!draw) return null;
  const canvas = document.createElement("canvas");
  canvas.width = W; canvas.height = H;
  draw(canvas.getContext("2d"), colors[design]);
  const map = new THREE.CanvasTexture(canvas);
  map.colorSpace = THREE.SRGBColorSpace;
  map.wrapS = THREE.RepeatWrapping;
  map.anisotropy = 4;
  return toon(new THREE.Color("#ffffff"), { map });
}
// A painted skin over a dish's top, turned from `pts` ([radius, height]
// pairs from its middle out to its rim): laid rim first so it faces up,
// its pattern turned back so the design's rim is the dish's.
export function topSkin(pts, sides = 48) {
  const g = new THREE.LatheGeometry([...pts].reverse().map(([x, y]) => new THREE.Vector2(x, y)), sides);
  const uv = g.attributes.uv;
  for (let i = 0; i < uv.count; i++) uv.setY(i, 1 - uv.getY(i));
  return g;
}

export function disposeDesign(mat) {
  if (!mat) return;
  mat.map?.dispose();
  mat.dispose();
}
