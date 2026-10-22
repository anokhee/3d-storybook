import { useEffect, useMemo } from "react";
import * as THREE from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";

import { merge } from "../../world/merge.js";
import { unlitMat } from "../../adjectives/unlit/material.js";
import { roundedRect } from "../water/Pad.jsx";
import { DOT, DOTS } from "./objects.js";

// A pattern of dots (see PATTERN) raised on a face: a rounded rectangle
// `width` across (x) by `length` along (z) lying in the ground plane
// about the origin, its corners `cornerRadius` round, the dots standing
// up +y from y = 0. One mesh per kind of dot — every dot of that kind,
// wherever it lies, merged into one geometry — so a pattern is at most
// DOTS meshes, however many dots. Turn the group to lay it on any face.
export default function Pattern({
  width,
  length,
  cornerRadius = 0,
  pattern: P,
}) {
  const face = { width, length, cornerRadius };
  const dots = useMemo(() => {
    const kinds = (P?.dots ?? []).slice(0, DOTS).map((d) => merge(DOT, d));
    if (!kinds.length || !P || P.layout === "none") return [];
    const spots = spotsOf(face, P);
    // Each spot's dot: the kinds dealt round in turn.
    return kinds
      .map((dot, k) => {
        const mine = spots.filter((_, i) => i % kinds.length === k);
        if (!mine.length) return null;
        const geometry = mergeGeometries(
          mine.map(({ x, z }) => {
            const g = new THREE.ExtrudeGeometry(polygonOf(dot), {
              depth: P.raise,
              bevelEnabled: false,
            });
            g.rotateX(-Math.PI / 2);
            g.translate(x, 0, z);
            return g;
          }),
          false,
        );
        return { geometry, color: dot.color };
      })
      .filter(Boolean);
  }, [width, length, cornerRadius, P]);
  useEffect(
    () => () => dots.forEach(({ geometry }) => geometry.dispose()),
    [dots],
  );
  return (
    <group>
      {dots.map(({ geometry, color }, i) => (
        <mesh key={i} geometry={geometry} material={unlitMat(color)} />
      ))}
    </group>
  );
}

// One dot's outline, about its middle in x/y: `sides` points spaced
// evenly round it at `radius`, the first straight up then `turn`ed —
// and, pinched (`inner` under 1), a point between each pair at that
// share of the radius, so it is a star of `sides` points. A wall
// hanging's art too (see ../wallHanging/WallHanging.jsx).
export function polygonOf({ sides, radius, inner, turn }) {
  const n = Math.max(3, Math.round(sides));
  const pinch = Math.max(0, Math.min(1, inner ?? 1));
  const star = pinch < 1 - 1e-3;
  const count = star ? 2 * n : n;
  const shape = new THREE.Shape();
  for (let i = 0; i < count; i++) {
    const a =
      Math.PI / 2 + THREE.MathUtils.degToRad(turn) + (i * 2 * Math.PI) / count;
    const r = star && i % 2 ? radius * pinch : radius;
    const x = Math.cos(a) * r;
    const y = Math.sin(a) * r;
    if (i === 0) shape.moveTo(x, y);
    else shape.lineTo(x, y);
  }
  shape.closePath();
  return shape;
}

// Where the dots lie on the face, `{ x, z }` each from its middle, in
// the order they are dealt — row by row for a grid, round for a border,
// outside in for rings — all of them `inset` in from the edge.
function spotsOf(R, P) {
  const inset = Math.max(0, P.inset);
  const w = R.width - 2 * inset;
  const l = R.length - 2 * inset;
  const step = Math.max(0.1, P.spacing);
  if (w <= 0 || l <= 0) return [];
  if (P.layout === "border") return ringOf(R, inset, step);
  if (P.layout === "rings") {
    const out = [];
    for (let k = inset; R.width - 2 * k > 0 && R.length - 2 * k > 0; k += step)
      out.push(...ringOf(R, k, step));
    return out;
  }
  // A grid, centered, every row of the stagger slid half a step in turn.
  const stagger = P.layout === "stagger";
  const rows = Math.floor(l / step) + 1;
  const cols = Math.floor(w / step) + 1;
  const out = [];
  for (let j = 0; j < rows; j++) {
    const z = (j - (rows - 1) / 2) * step;
    const slide = stagger && j % 2 ? step / 2 : 0;
    const n = stagger && j % 2 && cols * step > w ? cols - 1 : cols;
    for (let i = 0; i < n; i++) {
      const x = (i - (n - 1) / 2) * step + slide;
      if (inside(R, inset, x, z)) out.push({ x, z });
    }
  }
  return out;
}

// A ring of spots `step` apart along the face's outline `inset` in from
// its edge, starting from its back-left corner.
function ringOf(R, inset, step) {
  const w = R.width - 2 * inset;
  const l = R.length - 2 * inset;
  if (w <= 0 || l <= 0) return [];
  const path = roundedRect(w, l, Math.max(0, R.cornerRadius - inset));
  const n = Math.max(1, Math.round(path.getLength() / step));
  return path
    .getSpacedPoints(n)
    .slice(0, n)
    .map(({ x, y }) => ({ x, z: y }));
}

// Whether `x`, `z` lies within the face's outline drawn `inset` in.
function inside(R, inset, x, z) {
  const hw = R.width / 2 - inset;
  const hl = R.length / 2 - inset;
  if (Math.abs(x) > hw + 1e-6 || Math.abs(z) > hl + 1e-6) return false;
  const r = Math.max(0, Math.min(R.cornerRadius - inset, hw, hl));
  const dx = Math.abs(x) - (hw - r);
  const dz = Math.abs(z) - (hl - r);
  return dx <= 0 || dz <= 0 || dx * dx + dz * dz <= r * r + 1e-6;
}
