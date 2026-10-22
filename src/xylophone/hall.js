// Ported from the xylophone project as an ES module: the original is a
// classic script sharing globals (THREE, COLOR_PALETTE, ...), so the imports
// and the export line below are the only changes.
import * as THREE from "three";
import { COLOR_PALETTE } from "./palette.js";
import { glowTexture } from "./mushrooms.js";

// ---------- the concert hall: a round room with a domed ceiling, for the piano ----------
// Loaded after palette.js, materials.js and mushrooms.js (for glowTexture), before script.js. A carpeted floor
// where the meadow was, a round wall with gilded pilasters and glowing sconces between them, a gold cornice,
// and a shallow dome above ribbed in gold, with a softly lit oculus at its crown. Seen from inside, so the
// wall and dome show their back faces. Which instrument shows it is each instrument's `floor` setting
// ("hall"). Colors live in palette.js (hallFloor, hallWall, hallDome, hallTrim, hallLight)
const HALL = {
  radius: 36, // how far the wall stands from the middle of the scene. Past the camera's furthest zoom
  wallH: 13, // height of the wall up to where the dome springs
  domeH: 15, // how far the dome rises above that
  ribs: 16, // gold ribs running up the dome; a pilaster stands under each
  rib: 0.22, // rib thickness
  rings: [0.4, 0.75], // gold rings round the dome, as a fraction of the way up it
  cornice: 0.45, // thickness of the gold band where the wall meets the dome
  pilaster: { w: 1.1, d: 0.5 }, // width and depth of the columns up the wall
  oculus: 3.5, // radius of the lit round at the top of the dome. 0 = none
  sconce: { y: 7, glow: 4.5, opacity: 0.6 }, // lamps between the pilasters: height, glow size and strength
  colors: {
    floor: COLOR_PALETTE.hallFloor,
    wall: COLOR_PALETTE.hallWall,
    dome: COLOR_PALETTE.hallDome,
    trim: COLOR_PALETTE.hallTrim,
    light: COLOR_PALETTE.hallLight,
  },
};

// builds the hall into `scene`, hidden. `toonMat` and `inked` come from script.js. Returns the group
function buildHall(scene, { toonMat, inked }) {
  const H = HALL,
    R = H.radius,
    hall = new THREE.Group();
  hall.name = "hall";
  hall.visible = false;
  scene.add(hall);
  const inside = (hex) => {
      const m = toonMat(hex);
      m.side = THREE.BackSide; // seen from inside
      return m;
    },
    trimMat = toonMat(H.colors.trim),
    lightMat = new THREE.MeshBasicMaterial({ color: H.colors.light });
  // the floor: a carpet over the whole room
  const floor = new THREE.Mesh(new THREE.CircleGeometry(R, 96), toonMat(H.colors.floor));
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  hall.add(floor);
  // the wall, and the dome on top: the upper half of a sphere, squashed to domeH
  const wall = new THREE.Mesh(
    new THREE.CylinderGeometry(R, R, H.wallH, 96, 1, true).translate(0, H.wallH / 2, 0),
    inside(H.colors.wall),
  );
  const dome = new THREE.Mesh(
    new THREE.SphereGeometry(R, 96, 32, 0, Math.PI * 2, 0, Math.PI / 2)
      .scale(1, H.domeH / R, 1)
      .translate(0, H.wallH, 0),
    inside(H.colors.dome),
  );
  hall.add(wall, dome);
  // a point on the dome's inner surface: `up` 0 at its foot to 1 at the crown, `round` radians round it, pulled
  // `inset` in from the surface
  const onDome = (up, round, inset) => {
    const th = (up * Math.PI) / 2,
      r = (R - inset) * Math.cos(th);
    return new THREE.Vector3(r * Math.sin(round), H.wallH + (H.domeH - inset) * Math.sin(th), r * Math.cos(round));
  };
  // how far up the dome the oculus's edge is
  const topUp = H.oculus > 0 ? Math.acos(H.oculus / R) / (Math.PI / 2) : 0.98;
  for (let i = 0; i < H.ribs; i++) {
    const round = (i / H.ribs) * Math.PI * 2,
      pts = [];
    for (let k = 0; k <= 24; k++) pts.push(onDome((k / 24) * topUp, round, H.rib));
    hall.add(inked(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 48, H.rib, 6), trimMat)));
    // the pilaster under it, standing against the wall and turned to face the middle
    const P = H.pilaster,
      pil = inked(new THREE.Mesh(new THREE.BoxGeometry(P.w, H.wallH, P.d), trimMat));
    pil.position.set((R - P.d / 2) * Math.sin(round), H.wallH / 2, (R - P.d / 2) * Math.cos(round));
    pil.rotation.y = round;
    hall.add(pil);
    // and a sconce halfway to the next one: a little lamp with a glow round it
    const mid = round + Math.PI / H.ribs,
      lampAt = new THREE.Vector3((R - 0.35) * Math.sin(mid), H.sconce.y, (R - 0.35) * Math.cos(mid)),
      lamp = inked(new THREE.Mesh(new THREE.SphereGeometry(0.35, 12, 8), lightMat));
    lamp.position.copy(lampAt);
    lamp.castShadow = false;
    const glow = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: glowTexture(),
        color: H.colors.light,
        opacity: H.sconce.opacity,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }),
    );
    glow.scale.setScalar(H.sconce.glow);
    glow.position.copy(lampAt).multiplyScalar((R - 0.8) / (R - 0.35));
    glow.position.y = H.sconce.y;
    hall.add(lamp, glow);
  }
  // gold rings: the cornice where the wall meets the dome, and the rings round the dome
  const ring = (radius, y, tube) => {
    const t = inked(new THREE.Mesh(new THREE.TorusGeometry(radius, tube, 8, 128).rotateX(Math.PI / 2), trimMat));
    t.position.y = y;
    hall.add(t);
  };
  ring(R - H.cornice, H.wallH, H.cornice);
  H.rings.forEach((f) => {
    const p = onDome(f * topUp, 0, H.rib);
    ring(p.z, p.y, H.rib);
  });
  // the oculus: a lit round at the crown, framed in gold
  if (H.oculus > 0) {
    const top = H.wallH + H.domeH * Math.sin((topUp * Math.PI) / 2),
      eye = new THREE.Mesh(new THREE.CircleGeometry(H.oculus, 48).rotateX(Math.PI / 2), lightMat);
    eye.position.y = top - 0.05;
    hall.add(eye);
    ring(H.oculus, top - 0.1, H.rib * 1.6);
  }
  // nothing up here is under the sun's shadow camera anyway; don't have it draw them
  hall.traverse((o) => {
    if (o.isMesh && o !== floor) o.castShadow = false;
  });
  return hall;
}


export { buildHall, HALL };
