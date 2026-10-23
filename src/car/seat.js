/* ============================================================
   SEAT HEADREST: the part of a bucket seat above its backrest, shared by
   the cars (car.js, bugcar.js, bananacar.js, fishcar.js, hotdogcar.js).

   The backrest is a 0.5-tall box leaning back by `lean`. The headrest is
   a smaller cushion set exactly along the backrest's own axis, a hand's
   breadth above its top and tilted the same, so it sits straight over
   the backrest, held up by two skinny metal posts that run from inside
   the backrest to inside the headrest.

   `add` and `box` are the car builder's own helpers (its `finish`
   makes the materials); `back` is the backrest's centre [x, y] and z the
   seat's side; `width` is the headrest's across the car.
   ============================================================ */
import * as THREE from "three";

export const SEAT_METAL = 0xc3cbd2; // cool silver; the toon look has no shine, so it is the colour that says metal

const BACK_HALF = 0.25; // half the backrest's height
const REST_HALF = 0.07; // half the headrest's height
const GAP = 0.09; // clear space between them, where the posts show

export function seatHeadrest(add, box, trim, back, z, width, lean = 0.22) {
  const [bx, by] = back;
  const along = (d) => [bx - Math.sin(lean) * d, by + Math.cos(lean) * d]; // d along the backrest's axis, up from its centre
  const [rx, ry] = along(BACK_HALF + GAP + REST_HALF);
  const rest = box(0.1, REST_HALF * 2, width, trim, rx, ry, z);
  rest.rotation.z = lean;
  const reach = BACK_HALF + GAP + 0.03 - (BACK_HALF - 0.05); // from 0.05 inside the backrest to 0.03 inside the headrest
  const [px, py] = along(BACK_HALF - 0.05 + reach / 2);
  for (const side of [-1, 1]) {
    const post = add(new THREE.CylinderGeometry(0.014, 0.014, reach, 8), SEAT_METAL, px, py, z + side * width * 0.28);
    post.rotation.z = lean;
  }
}
