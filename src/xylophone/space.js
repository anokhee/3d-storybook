// Ported from the xylophone project as an ES module: the original is a
// classic script sharing globals (THREE, COLOR_PALETTE, ...), so the imports
// and the export line below are the only changes.
import * as THREE from "three";
import { COLOR_PALETTE } from "./palette.js";
import { clayLumps } from "./clay.js";

// ---------- space: the vibraphone's world, a moon out in space ----------
// Loaded after palette.js, before script.js. In place of the meadow, the player and the vibraphone stand on
// the top of a moon of white clay, the same moon as the dollies' (its lumps are the dolls' own bump field,
// clay.js: the "bumpiness" texture at the same dial and seed). Only its top half is there, the top sliced
// flat and the lumps eased away where the instrument stands. Far off, a ringed planet and a small moon, slowly
// turning, among the same stars as the kalimba's night (script.js). Which instrument shows it is each
// instrument's `floor` setting ("space"). Colors live in palette.js (moonClay, moonUnder, planet, planetRing,
// moon)
const SPACE = {
  moon: {
    radius: 16, // of the ball, world units
    top: 11.5, // how wide the flat top is, radius from the player: the ball is sunk until its cut is this wide
    clear: 10.5, // the lumps are eased flat within this far of the player...
    fade: 2.5, // ...over this much more
    // the lumps: the dollies' "bumpiness" clay (amplitude 0.08 at dial 0.6, the field's frequency walked from
    // 7.5 to 4.5 by the same dial), seed 7 like their moon
    bump: { amplitude: 0.08 * 0.6, frequency: 7.5 + (4.5 - 7.5) * 0.6, roughness: 0.1, octaves: 2, warp: 1.6, seed: 7 },
    detail: [160, 80], // segments round and down the half ball
  },
  planet: { at: [-38, -26, -115], r: 16, ring: [22, 34], tilt: [0.45, 0.3], spin: 0.02 },
  moon2: { at: [48, -34, -95], r: 5 }, // the small far-off moon
  colors: {
    clay: COLOR_PALETTE.moonClay,
    under: COLOR_PALETTE.moonUnder,
    planet: COLOR_PALETTE.planet,
    ring: COLOR_PALETTE.planetRing,
    moon: COLOR_PALETTE.moon,
  },
};


// builds space into `scene` round the player at (x, z), hidden. `toonMat` and `inked` come from script.js.
// Returns the group and animate(now, dt): the slow turning of the far things
function buildSpace(scene, { toonMat, inked }, x, z) {
  const S = SPACE,
    K = S.colors,
    space = new THREE.Group(),
    v = new THREE.Vector3();
  space.name = "space";
  space.visible = false;
  space.position.set(x, 0, z);
  scene.add(space);

  // ---------- the moon underfoot ----------
  // the top half of a lumpy ball, sunk so its cut-flat top is `top` wide: every point is its direction pushed
  // out by the lumps (eased away near the player), then anything above the ground pressed down onto it
  const M = S.moon,
    sink = Math.sqrt(M.radius * M.radius - M.top * M.top), // the ball's middle, this far below the ground
    geo = new THREE.SphereGeometry(1, M.detail[0], M.detail[1], 0, Math.PI * 2, 0, Math.PI / 2),
    p = geo.attributes.position;
  for (let k = 0; k < p.count; k++) {
    v.fromBufferAttribute(p, k).normalize();
    let h = clayLumps(M.bump, v.x, v.y, v.z);
    const out = Math.hypot(v.x, v.z) * M.radius, // roughly how far from the player, across
      t = Math.min(1, Math.max(0, (out - M.clear) / M.fade));
    h *= t * t * (3 - 2 * t);
    v.multiplyScalar(M.radius * (1 + h));
    v.y = Math.min(v.y - sink, 0);
    p.setXYZ(k, v.x, v.y, v.z);
  }
  geo.computeVertexNormals();
  const clay = inked(new THREE.Mesh(geo, toonMat(K.clay)));
  clay.receiveShadow = true;
  // the cut underneath, closed off, in case the camera ever looks up at it
  const under = new THREE.Mesh(new THREE.CircleGeometry(M.radius, 96).rotateX(Math.PI / 2), toonMat(K.under));
  under.position.y = -sink;
  space.add(clay, under);

  // ---------- the far sky: a ringed planet and a moon (the stars are the night sky's: script.js) ----------
  const far = new THREE.Group();
  space.add(far);
  const P = S.planet,
    planet = new THREE.Group(),
    farMat = (c) => {
      const m = toonMat(c);
      m.fog = false;
      return m;
    };
  planet.position.set(...P.at);
  planet.rotation.set(P.tilt[0], 0, P.tilt[1]);
  const globe = inked(new THREE.Mesh(new THREE.SphereGeometry(P.r, 48, 32), farMat(K.planet)));
  // bands round the globe: a few slightly darker stripes
  const bandMat = farMat(new THREE.Color(K.planet).multiplyScalar(0.82));
  [-0.45, 0.1, 0.55].forEach((lat) => {
    const band = new THREE.Mesh(
      new THREE.SphereGeometry(P.r * 1.004, 48, 4, 0, Math.PI * 2, Math.PI / 2 - lat - 0.08, 0.16),
      bandMat,
    );
    globe.add(band);
  });
  const ringMat = farMat(K.ring);
  ringMat.side = THREE.DoubleSide;
  const ring = inked(new THREE.Mesh(new THREE.RingGeometry(P.ring[0], P.ring[1], 96).rotateX(-Math.PI / 2), ringMat));
  planet.add(globe, ring);
  far.add(planet);
  const moon = inked(new THREE.Mesh(new THREE.SphereGeometry(S.moon2.r, 32, 20), farMat(K.moon)));
  moon.position.set(...S.moon2.at);
  far.add(moon);
  // none of it throws or catches shadows: it's all far beyond the sun's shadow camera
  far.traverse((o) => {
    if (o.isMesh) o.castShadow = o.receiveShadow = false;
  });

  const animate = (now, dt) => {
    planet.rotation.y += P.spin * dt;
    far.rotation.y += 0.004 * dt;
  };
  return { space, animate };
}


export { buildSpace, SPACE };
