import { useEffect, useMemo } from "react";
import * as THREE from "three";

import { unlitMat } from "../../adjectives/unlit/material.js";
import { polygonOf } from "../pattern/Pattern.jsx";
import { WALL_HANGING_KINDS } from "./objects.js";

// The art's flat layers, back to front, each { shape, color }, laid in a
// `w` by `h` picture about its middle (see WALL_HANGING's kinds). Every
// shape keeps inside the picture by how it is drawn, so nothing needs
// cutting off at its edge.
const rect = (x0, y0, x1, y1) => new THREE.Shape().moveTo(x0, y0).lineTo(x1, y0).lineTo(x1, y1).lineTo(x0, y1).closePath();
const disc = (cx, cy, r) => new THREE.Shape().absarc(cx, cy, r, 0, Math.PI * 2, false);
const ellipse = (cx, cy, rx, ry) => new THREE.Shape().absellipse(cx, cy, rx, ry, 0, Math.PI * 2, false);
// a run of hills: the ground under a wavy line across the picture, `base`
// up from its foot, rising `amp` and falling in `waves` humps
const hills = (w, y0, base, amp, waves, phase) => {
  const s = new THREE.Shape().moveTo(-w / 2, y0), n = 40;
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    s.lineTo(-w / 2 + t * w, y0 + base + amp * (0.5 + 0.5 * Math.sin(phase + t * Math.PI * waves)));
  }
  return s.lineTo(w / 2, y0).closePath();
};
const rngOf = (seed) => { let x = (Math.floor(seed) * 9301 + 49297) % 233280 || 1; return () => (x = (x * 9301 + 49297) % 233280) / 233280; };

function layersOf(kind, w, h, A) {
  const P = A.palette, r = rngOf(A.seed ?? 3), m = Math.min(w, h);
  if (kind === "picture") {
    // the mat round it; on the print, a wall, a table top across the foot,
    // a vase on it with a stem and a bloom
    const pw = w - 2 * A.mat * m, ph = h - 2 * A.mat * m, b = -ph / 2, k = Math.min(pw, ph);
    const vw = k * 0.32, vh = ph * 0.3, ty = b + ph * 0.22;
    const vase = new THREE.Shape().moveTo(-vw * 0.3, ty).lineTo(vw * 0.3, ty)
      .bezierCurveTo(vw * 0.75, ty + vh * 0.35, vw * 0.5, ty + vh * 0.8, vw * 0.18, ty + vh)
      .lineTo(-vw * 0.18, ty + vh).bezierCurveTo(-vw * 0.5, ty + vh * 0.8, -vw * 0.75, ty + vh * 0.35, -vw * 0.3, ty).closePath();
    const stemTop = Math.min(ph / 2 - k * 0.2, ty + vh + ph * 0.28);
    const bloom = new THREE.Shape(), petals = 6, br = k * 0.16;
    for (let i = 0; i <= petals * 8; i++) {
      const a = (i / (petals * 8)) * Math.PI * 2, rr = br * (0.72 + 0.28 * Math.cos(a * petals));
      i ? bloom.lineTo(Math.cos(a) * rr, stemTop + Math.sin(a) * rr) : bloom.moveTo(rr, stemTop);
    }
    return [
      { shape: rect(-pw / 2, b, pw / 2, ph / 2), color: P[0] },
      { shape: rect(-pw / 2, b, pw / 2, ty), color: P[1] },
      { shape: rect(-k * 0.012, ty + vh * 0.9, k * 0.012, stemTop), color: P[3] },
      { shape: ellipse(k * 0.07, ty + vh + (stemTop - ty - vh) * 0.45, k * 0.07, k * 0.03), color: P[3] },
      { shape: vase, color: P[2] },
      { shape: bloom, color: P[4] },
      { shape: disc(0, stemTop, br * 0.3), color: { hex: "#F2C94C" } },
    ];
  }
  if (kind === "landscape") {
    const b = -h / 2;
    return [
      { shape: rect(-w / 2, b, w / 2, h / 2), color: P[0] },
      { shape: disc((r() - 0.5) * w * 0.6, h * 0.18, m * 0.12), color: P[1] },
      { shape: hills(w, b, h * 0.32, h * 0.22, 1.5 + r() * 1.5, r() * 6), color: P[2] },
      { shape: hills(w, b, h * 0.18, h * 0.16, 1 + r() * 1.2, r() * 6), color: P[3] },
      { shape: rect(-w / 2, b, w / 2, b + h * 0.14), color: P[4] },
    ];
  }
  if (kind === "abstract") {
    // two fields split across, a great half-round sat on the foot over the
    // split, a circle up in the other field, a thin stripe down one side
    const sx = (r() - 0.5) * w * 0.3, b = -h / 2, R = Math.min(w * 0.3, h * 0.55);
    const ax = Math.max(-w / 2 + R, Math.min(w / 2 - R, sx + (r() - 0.5) * w * 0.15));
    const arc = new THREE.Shape().moveTo(ax - R, b).absarc(ax, b, R, Math.PI, 0, true).lineTo(ax - R, b);
    const cr = m * (0.12 + r() * 0.06), side = r() < 0.5 ? -1 : 1;
    const cx = side * (w / 2 - cr - w * 0.08), cy = h / 2 - cr - h * 0.1;
    const st = w * 0.035, stx = -side * (w / 2 - w * 0.12);
    return [
      { shape: rect(-w / 2, b, sx, h / 2), color: P[0] },
      { shape: rect(sx, b, w / 2, h / 2), color: P[1] },
      { shape: arc, color: P[2] },
      { shape: disc(cx, cy, cr), color: P[3] },
      { shape: rect(stx - st / 2, b + h * 0.1, stx + st / 2, h / 2 - h * 0.08), color: P[4] },
    ];
  }
  // a shape
  return [{ shape: polygonOf({ ...A, radius: (m / 2) * A.radius }), color: A.color, raise: A.raise }];
}

// One framed thing (see WALL_HANGING), its middle at the origin, facing +z:
// the frame board at the back, the backing a hair proud of it inside the
// frame, and the art's layers on that, each a hair over the one behind
// (a shape raised `raise` off it)
function Framed({ H, kind }) {
  const F = H.frame, A = H.art, proud = 0.02;
  const iw = Math.max(0.1, H.width - 2 * F.thickness), ih = Math.max(0.1, H.height - 2 * F.thickness);
  const layers = useMemo(() => layersOf(kind, iw, ih, A).map((L) => ({
    geo: L.raise ? new THREE.ExtrudeGeometry(L.shape, { depth: L.raise, bevelEnabled: false }) : new THREE.ShapeGeometry(L.shape, 24),
    color: L.color,
  })), [kind, iw, ih, A]);
  useEffect(() => () => layers.forEach((L) => L.geo.dispose()), [layers]);
  return (
    <group>
      {F.thickness > 0 && (
        <mesh material={unlitMat(F.color)} castShadow>
          <boxGeometry args={[H.width, H.height, H.thickness]} />
        </mesh>
      )}
      <mesh position-z={proud / 2} material={unlitMat(H.backing.color)} castShadow>
        <boxGeometry args={[iw, ih, H.thickness + proud]} />
      </mesh>
      {layers.map((L, i) => (
        <mesh key={i} geometry={L.geo} position-z={H.thickness / 2 + proud + 0.002 * (i + 1)} material={unlitMat(L.color)} />
      ))}
    </group>
  );
}

// One wall hanging (see WALL_HANGING), its foot at y = 0 and facing +z,
// hung `hang` up: one framed thing, or (a "gallery") three, a tall print
// one side and a landscape over a shape the other, filling its width and
// height between them
export default function WallHanging({ config: H }) {
  const kind = H.kind ?? "shape";
  const parts = useMemo(() => {
    if (kind !== "gallery") return null;
    const g = (H.art.gap ?? 0.15), lw = (H.width - g) * 0.42, rw = H.width - g - lw, rh = (H.height - g) / 2;
    const own = (k, w, h) => ({
      ...H, ...WALL_HANGING_KINDS[k], kind: k, width: w, height: h, thickness: H.thickness,
      frame: { ...H.frame, thickness: Math.min(H.frame.thickness, Math.min(w, h) * 0.1) },
      backing: k === "shape" ? H.backing : { color: H.backing.color },
      art: { ...H.art, ...(WALL_HANGING_KINDS[k].art ?? {}), mat: 0.12 },
    });
    return [
      { at: [-H.width / 2 + lw / 2, 0], H: own("picture", lw, H.height * 0.92) },
      { at: [H.width / 2 - rw / 2, rh / 2 + g / 2], H: own("landscape", rw, rh) },
      { at: [H.width / 2 - rw / 2, -rh / 2 - g / 2], H: own("shape", rw * 0.62, rh) },
    ];
  }, [kind, H]);
  return (
    <group position-y={H.hang + H.height / 2}>
      {parts ? parts.map((p, i) => (
        <group key={i} position={[p.at[0], p.at[1], 0]}><Framed H={p.H} kind={p.H.kind} /></group>
      )) : <Framed H={H} kind={kind} />}
    </group>
  );
}
