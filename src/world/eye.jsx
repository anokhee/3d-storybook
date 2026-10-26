// EYE: a creature's eye, a white dome with a big dark pupil on the front
// of it, so a face reads as looking at something rather than as the two
// black beads of a vinyl figure. Every animal and character with eyes of
// that kind uses it, so they all look alike.
//
//   r         the dome's radius; its flat back lies through the eye's
//             middle, so set the middle on the head's surface
//   pupil     the pupil's swatch: the creature's own `eyes` colour (which
//             was the bead's), so its knob still changes it
//   look      which way the pupil faces, in the eye's frame: [0, 0, 1] is
//             +z, the way the creatures face; an eye on the side of a head
//             looks mostly forward and a little out, [s, 0, AHEAD]
//   face      which way the dome faces, out of the head (by default the
//             way it looks); an eye on the side of a head faces out of
//             the side, [s, 0, OUT], so its back lies flat on the head
//   size      the pupil's radius, as a share of the dome's
//   shape     the pupil's outline: "round", "slit" (tall, a cat's) or
//             "bar" (wide, a goat's)
//   iris      a ring of colour round the pupil (a cat's), if a swatch;
//             `irisSize` its radius, as a share of the dome's
//   white     the dome's swatch
// and anything else a <group> takes (position, scale).
//
// The iris and the pupil are each a thin skin on the dome, the shape cut
// out of a sphere a hair bigger than it, so they lie flat on the eye
// rather than standing out of it.
import { useEffect, useMemo } from "react";
import * as THREE from "three";
import { solid } from "./palette.js";
import { unlitMat } from "../adjectives/unlit/material.js";

export const EYE_WHITE = solid("#FBF8F1");
export const PUPIL = 0.72;
export const IRIS = 0.88;
export const CAT_PUPIL = 0.62; // a cat's slit, inside its iris

// How far forward an eye on the side of a head looks, and faces, for each
// step out: it looks about 30 degrees off straight ahead, so the pupil
// sits toward the front, and faces about 65 degrees off, out of the side
export const AHEAD = 1.7;
export const OUT = 0.45;

// Each shape's pupil as [across, up] shares of a round one of `size`
const SHAPES = { round: [1, 1], slit: [0.42, 1.12], bar: [1.12, 0.42] };

const Z = new THREE.Vector3(0, 0, 1);
const turnTo = (dir) => new THREE.Quaternion().setFromUnitVectors(Z, new THREE.Vector3(...dir).normalize());

// The dome: the front half of a ball, facing +z
const domeOf = (r) => new THREE.SphereGeometry(r, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2).rotateX(Math.PI / 2);

// A skin on a ball of `R` round +z, its outline `w` across and `h` up
// (each the sine of how far it reaches): a round cap, squeezed to the
// outline and pushed back out onto the ball
function skinOf(R, w, h) {
  const m = Math.max(w, h);
  const g = new THREE.SphereGeometry(R, 32, 8, 0, Math.PI * 2, 0, Math.asin(Math.min(0.99, m))).rotateX(Math.PI / 2);
  const p = g.attributes.position, v = new THREE.Vector3();
  for (let i = 0; i < p.count; i++) {
    v.fromBufferAttribute(p, i);
    v.x *= w / m;
    v.y *= h / m;
    v.setLength(R);
    p.setXYZ(i, v.x, v.y, v.z);
  }
  g.computeVertexNormals();
  return g;
}

export function Eye({ r, pupil, look = [0, 0, 1], face = look, size = PUPIL, shape = "round", iris, irisSize = IRIS, white = EYE_WHITE, ...props }) {
  const [w, h] = SHAPES[shape] ?? SHAPES.round;
  const geo = useMemo(() => ({
    dome: domeOf(r),
    iris: iris ? skinOf(r * 1.004, irisSize, irisSize) : null,
    pupil: skinOf(r * 1.008, size * w, size * h),
  }), [r, !!iris, irisSize, size, w, h]);
  useEffect(() => () => Object.values(geo).forEach((g) => g?.dispose()), [geo]);
  const faceTurn = useMemo(() => turnTo(face), [face[0], face[1], face[2]]);
  const lookTurn = useMemo(() => turnTo(look), [look[0], look[1], look[2]]);
  return (
    <group {...props}>
      <mesh geometry={geo.dome} quaternion={faceTurn} castShadow material={unlitMat(white)} />
      <group quaternion={lookTurn}>
        {iris && <mesh geometry={geo.iris} material={unlitMat(iris)} />}
        <mesh geometry={geo.pupil} material={unlitMat(pupil)} />
      </group>
    </group>
  );
}
