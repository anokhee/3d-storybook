import * as THREE from "three";
import { bytes } from "../../world/palette.js";

// One soft round smear, warm at the middle and gone by its own edge. Squared
// falloff: a linear ramp reads as a gray square.
export function haloTexture(swatch, alpha) {
  const c = document.createElement("canvas");
  c.width = c.height = 64;
  const ctx = c.getContext("2d");
  const [r, g, b] = bytes(swatch);
  const grad = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
  for (let i = 0; i <= 8; i++) {
    const k = i / 8;
    grad.addColorStop(k, `rgba(${r},${g},${b},${alpha * (1 - k) ** 2})`);
  }
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 64, 64);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}
