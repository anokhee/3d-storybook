// The playroom's rainbow, from the xylophone game, given a little
// thickness. In the game it is bands of color drawn to a canvas and laid
// on the curved wall (ROOM.rainbow in its script.js); here each band is a
// half ring of its own, pulled out `thick` world units so the arc stands
// as a thing, upright, its feet on the ground. The colors are the game's
// (COLOR_PALETTE.rainbow, outside in); the proportions, a band a tenth
// of the outer radius, are the game's decal's.
import * as THREE from "three";
import { COLOR_PALETTE } from "./palette.js";

export const RAINBOW = {
  radius: 8, // the outer edge, world units (the game's decal: about 19.5)
  band: 0.75, // each band across (the game's: about 1.8)
  thick: 0.6, // how far it is pulled out
  bands: COLOR_PALETTE.rainbow, // outside in
};

// A half ring, `outer` to `inner`, in the x/y plane, feet on y = 0
function halfRing(outer, inner) {
  const s = new THREE.Shape();
  s.absarc(0, 0, outer, 0, Math.PI, false);
  s.lineTo(-inner, 0);
  s.absarc(0, 0, inner, Math.PI, 0, true);
  s.closePath();
  return s;
}

// The rainbow stood at (x, z), facing +z. Returns its group.
export function buildRainbow(scene, { toonMat, inked }, x, z, R = RAINBOW) {
  const rainbow = new THREE.Group();
  R.bands.forEach((col, k) => {
    const outer = R.radius - k * R.band,
      inner = outer - R.band;
    if (inner <= 0) return;
    const g = new THREE.ExtrudeGeometry(halfRing(outer, inner), { depth: R.thick, bevelEnabled: false, curveSegments: 48 });
    g.translate(0, 0, -R.thick / 2); // centered on its plane
    rainbow.add(inked(new THREE.Mesh(g, toonMat(col))));
  });
  rainbow.position.set(x, 0, z);
  scene.add(rainbow);
  return rainbow;
}

// The rainbow as a cardboard standee, as the refactored page stands it behind the blob: thin like card, in
// five bands taken from the xylophone's keys, held up from behind each leg by an easel: a vertical stick up
// the back of the rainbow, and a triangle of card standing on the ground behind it.
//   radius, band, thick, bands   as RAINBOW's
//   stick   how tall the stick is, from the rainbow's feet
//   brace   the triangle's upright edge, as a part of the stick's height
//   depth   how far back along the ground the triangle's foot runs
//   card    the easels' color
export const STANDEE = {
  radius: 10.5,
  band: 0.85,
  thick: 0.22,
  bands: ["#CD453E", "#FFC165", "#C9D17C", "#66B091", "#4DC9EF"], // the keys' bars 1, 7, 13, 19 and 25, outside in
  stick: 5,
  brace: 0.85,
  depth: 3,
  card: "#A8C7B1", // the xylophone's body
};

// The standee stood at (x, z), facing +z. `groundAt(x, z)` is how high the ground is there (flat by default);
// where it falls away, the rainbow is let down until the outer edge of each leg is on it, and the easels stand
// on where it is lowest under them. Returns a group holding the lot.
export function buildRainbowStandee(scene, tools, x, z, S = STANDEE, groundAt = () => 0) {
  const standee = new THREE.Group();
  scene.add(standee);
  const rainbow = buildRainbow(standee, tools, x, z, S),
    inner = S.radius - S.band * S.bands.length;
  rainbow.position.y = Math.min(groundAt(x - S.radius, z), groundAt(x + S.radius, z));
  // an easel behind each leg, in the middle of its bands; the stick's foot goes a little into the ground
  const card = tools.toonMat(S.card),
    back = z - S.thick / 2;
  [-1, 1].forEach((side) => {
    const ex = x + (side * (S.radius + inner)) / 2,
      base = groundAt(ex, back - S.depth) - 0.05,
      tall = rainbow.position.y + S.stick - base;
    const stick = tools.inked(new THREE.Mesh(new THREE.BoxGeometry(0.32, tall, 0.14), card));
    stick.position.set(ex, base + tall / 2, back - 0.07);
    standee.add(stick);
    // the triangle, drawn in the plane across z (its upright edge at the stick, its foot running back), then
    // turned to stand on edge and given the card's thickness
    const tri = new THREE.Shape();
    tri.moveTo(0, 0);
    tri.lineTo(0, tall * S.brace);
    tri.lineTo(S.depth, 0);
    tri.closePath();
    const panel = tools.inked(
      new THREE.Mesh(new THREE.ExtrudeGeometry(tri, { depth: 0.1, bevelEnabled: false }).translate(0, 0, -0.05), card),
    );
    panel.rotation.y = Math.PI / 2; // its x along -z: running back from the stick
    panel.position.set(ex, base, back - 0.14);
    standee.add(panel);
  });
  return standee;
}
