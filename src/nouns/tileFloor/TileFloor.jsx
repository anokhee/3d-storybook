import { useEffect, useMemo } from "react";
import * as THREE from "three";

import { merge } from "../../world/merge.js";
import { unlitMat } from "../../adjectives/unlit/material.js";
import { toon } from "../../adjectives/unlit/toon.js";
import { polygonOf } from "../pattern/Pattern.jsx";
import { TILE_FLOOR } from "./objects.js";

// The tiles are PAINTED, not built: the grout, every tile and the mosaic in
// each are drawn once onto one image (as the street paints its pavement)
// and laid over the slab as a decal — one plane, one draw call, however
// many tiles, where built tiles were a geometry each. `px` pixels to the
// metre, the image at most `max` across.
const PAINT = { px: 220, max: 2048 };

// ONE TILE FLOOR (see TILE_FLOOR): `config` overrides any of its fields
export default function TileFloor({ config }) {
  const F = useMemo(() => merge(TILE_FLOOR, config), [config]);
  const { width: W, length: L, thickness: t, tile: T, grout: G, mosaic: M } = F;
  // a colour left blank (a knob not yet picked) falls back to the floor's own
  const hexOf = (sw, own) => (typeof sw?.hex === "string" && sw.hex ? sw.hex : own.hex);
  const tileHex = hexOf(T.color, TILE_FLOOR.tile.color), altHex = hexOf(T.alt, TILE_FLOOR.tile.alt), groutHex = hexOf(G.color, TILE_FLOOR.grout.color);
  const mosaicHex = hexOf(M.color, TILE_FLOOR.mosaic.color), rimHex = hexOf(M.rimColor, TILE_FLOOR.mosaic.rimColor);
  const O = T.outline ?? {}, outlineHex = hexOf(O.color, TILE_FLOOR.tile.outline.color);
  const paint = useMemo(() => {
    const px = Math.min(PAINT.px, PAINT.max / Math.max(W, L));
    const c = document.createElement("canvas");
    c.width = Math.max(2, Math.round(W * px));
    c.height = Math.max(2, Math.round(L * px));
    const g = c.getContext("2d");
    // the image's top edge is the floor's -z edge (the plane's v = 1, see below)
    const X = (x) => (x + W / 2) * px, Z = (z) => (z + L / 2) * px;
    // the grout: the bed the tiles are set in
    g.fillStyle = groutHex;
    g.fillRect(0, 0, c.width, c.height);
    // the tiles: squares `size` apart, the grid's lines through the middle,
    // each inset half the grout, clipped at the floor's edges
    const s = Math.max(0.02, T.size), gr = Math.min(G.width, s * 0.4) / 2;
    const nx = Math.ceil(W / 2 / s), nz = Math.ceil(L / 2 / s);
    const whole = []; // the whole tiles' middles, for the mosaics
    for (let i = -nx; i < nx; i++) for (let j = -nz; j < nz; j++) {
      const x0 = Math.max(-W / 2, i * s + gr), x1 = Math.min(W / 2, (i + 1) * s - gr);
      const z0 = Math.max(-L / 2, j * s + gr), z1 = Math.min(L / 2, (j + 1) * s - gr);
      if (x1 - x0 < 1e-3 || z1 - z0 < 1e-3) continue;
      g.fillStyle = T.layout === "checker" && (i + j) & 1 ? altHex : tileHex;
      g.fillRect(X(x0), Z(z0), (x1 - x0) * px, (z1 - z0) * px);
      if (x1 - x0 > s - 2 * gr - 1e-3 && z1 - z0 > s - 2 * gr - 1e-3) whole.push([(x0 + x1) / 2, (z0 + z1) / 2]);
    }
    // the square outline on each whole tile, `scale` of it across and up
    if (O.on && O.scale > 0 && O.width > 0 && whole.length) {
      const half = (O.scale * s) / 2, lw = Math.min(O.width, half);
      g.strokeStyle = outlineHex;
      g.lineWidth = lw * px;
      for (const [cx, cz] of whole) g.strokeRect(X(cx - half + lw / 2), Z(cz - half + lw / 2), (2 * half - lw) * px, (2 * half - lw) * px);
    }
    // the mosaic in the middle of each whole tile, its rim under it: the
    // polygon (or star) the dots are drawn with, sized by the tile
    if (M.on && M.radius > 0 && whole.length) {
      const dot = { sides: Math.max(3, Math.round(M.sides)), inner: M.inner, turn: M.turn, curve: M.curve ?? 0 };
      const trace = (radius, hex) => {
        const pts = polygonOf({ ...dot, radius: radius * s }).getPoints(8);
        g.fillStyle = hex;
        for (const [cx, cz] of whole) {
          g.beginPath();
          pts.forEach((p, k) => (k ? g.lineTo(X(cx + p.x), Z(cz - p.y)) : g.moveTo(X(cx + p.x), Z(cz - p.y))));
          g.closePath();
          g.fill();
        }
      };
      if (M.rim > 0) trace(M.radius + M.rim, rimHex);
      trace(M.radius, mosaicHex);
    }
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 4;
    return { tex, mat: toon(new THREE.Color("#FFFFFF"), { map: tex }) };
  }, [W, L, T.size, T.layout, tileHex, altHex, G.width, groutHex, M.on, M.sides, M.inner, M.turn, M.curve, M.radius, M.rim, mosaicHex, rimHex, O.on, O.scale, O.width, outlineHex]);
  useEffect(() => () => { paint.mat.dispose(); paint.tex.dispose(); }, [paint]);
  return (
    <group>
      {/* the slab, in the grout's colour; the painted tiles laid on its top */}
      <mesh position-y={t / 2} material={unlitMat(G.color)} receiveShadow>
        <boxGeometry args={[W, t, L]} />
      </mesh>
      <mesh position-y={t + 0.002} rotation-x={-Math.PI / 2} material={paint.mat} receiveShadow>
        <planeGeometry args={[W, L]} />
      </mesh>
    </group>
  );
}
