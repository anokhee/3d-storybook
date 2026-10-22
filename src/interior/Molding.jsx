import { useEffect, useMemo } from "react";
import * as THREE from "three";

import { unlitMat } from "../adjectives/unlit/material.js";

// The moulding round an opening indoors — a doorway, an archway, a
// window — as the house's architecture has it (see DWELLING.interior's
// `frame` in nouns/house/objects.js): a band `thickness` wide following
// the opening's edge, `depth` proud of the wall, in its own `color`.
// The opening is `width` across and `height` tall with its foot at
// y = 0 and its top and bottom edges bowed on `topCurve` and
// `bottomCurve` (1 a half-round as wide as it is, 0 flat — as Opening
// and Lintel have them), the band's curves the same ellipses swollen
// `thickness` each way. Open at the foot for a way through a wall — the
// band is a jamb up each side and a head over — or `closed` all the way
// round for a window. Drawn on one face of a wall: its back on z = 0,
// standing out along +z, so stand it on the face and turn it to look
// into the room. `frame` null draws nothing.
export default function Molding({
  width,
  height,
  topCurve = 0,
  bottomCurve = 0,
  closed = false,
  frame,
}) {
  const t = frame?.thickness ?? 0;
  const depth = frame?.depth ?? 0;
  const geometry = useMemo(() => {
    if (!(t > 0) || !(depth > 0)) return null;
    const r = width / 2;
    const riseT = r * clamp01(topCurve);
    const riseB = closed ? r * clamp01(bottomCurve) : 0;
    const shape = new THREE.Shape();
    if (closed) {
      // A ring: the swollen outline, with the opening's own cut out.
      loop(shape, r, height, riseT, riseB, t);
      const hole = new THREE.Path();
      loop(hole, r, height, riseT, riseB, 0);
      shape.holes.push(hole);
    } else {
      // An upturned U: up the outside, over, down, then back up the
      // inside and over again, so the foot is open to the floor.
      const R = r + t;
      shape.moveTo(-R, 0);
      shape.lineTo(-R, height - riseT);
      head(shape, R, height, riseT, t, true);
      shape.lineTo(R, 0);
      shape.lineTo(r, 0);
      shape.lineTo(r, height - riseT);
      head(shape, r, height, riseT, 0, false);
      shape.lineTo(-r, 0);
      shape.closePath();
    }
    return new THREE.ExtrudeGeometry(shape, {
      depth,
      bevelEnabled: false,
      curveSegments: 16,
    });
  }, [width, height, topCurve, bottomCurve, closed, t, depth]);
  useEffect(() => () => geometry?.dispose(), [geometry]);
  if (!geometry) return null;
  return <mesh geometry={geometry} material={unlitMat(frame.color)} />;
}

const clamp01 = (v) => Math.max(0, Math.min(1, v ?? 0));
const EPS = 1e-3;

// The head of an outline `pad` outside the opening's, from its left
// shoulder at (-(r), height - rise) over to its right — `over` from left
// to right, else back from right to left: the opening's top ellipse
// swollen `pad` up, or a flat lintel `pad` up where there is no curve.
function head(path, R, height, rise, pad, over) {
  const sign = over ? 1 : -1;
  if (rise > EPS) {
    path.absellipse(
      0,
      height - rise,
      R,
      rise + pad,
      over ? Math.PI : 0,
      over ? 0 : Math.PI,
      over,
    );
  } else {
    path.lineTo(-sign * R, height + pad);
    path.lineTo(sign * R, height + pad);
  }
}

// The opening's whole outline `pad` outside it, as one loop: up the
// left, over the top, down the right and under the foot — the foot's
// ellipse swollen `pad` down, or flat `pad` below where there is no
// curve. The opening's foot is at y = 0, so a curved one bows from
// y = `riseB` down to it.
function loop(path, r, height, riseT, riseB, pad) {
  const R = r + pad;
  path.moveTo(-R, riseB);
  path.lineTo(-R, height - riseT);
  head(path, R, height, riseT, pad, true);
  path.lineTo(R, riseB);
  if (riseB > EPS) {
    path.absellipse(0, riseB, R, riseB + pad, 0, Math.PI, true);
  } else {
    path.lineTo(R, -pad);
    path.lineTo(-R, -pad);
  }
  path.closePath();
}
