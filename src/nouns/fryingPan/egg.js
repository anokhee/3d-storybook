import * as THREE from "three";

import { fruitMat } from "../../world/fruit/parts.js";

// A FRIED EGG, built: the frying pan's (see FRYING_PAN's `egg`) — a flat
// white a little longer than wide, a domed yolk a touch off its middle.
// A THREE.Group lying on y = 0, plain three.js so a bowl of noodles can
// lay one too (src/world/food/fill.js). `radius` the white's, `yolk` the
// yolk's; `white` and `yolkColor` swatches or hexes.
export function buildFriedEgg({ radius, yolk, white, yolkColor }) {
  const g = new THREE.Group();
  const w = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, radius * 0.08, 20), fruitMat(white));
  w.scale.z = 0.85;
  w.position.y = radius * 0.04;
  const y = new THREE.Mesh(new THREE.SphereGeometry(yolk, 12, 8), fruitMat(yolkColor));
  y.scale.y = 0.55;
  y.position.set(radius * 0.2, radius * 0.08, 0);
  g.add(w, y);
  return g;
}
