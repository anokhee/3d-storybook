// Stage: a stage with the red curtain hanging along its back and a
// spotlight on it from high in front, its beam faintly showing: the piano's
// stage in the xylophone project. The platform and the curtain are that
// project's (src/xylophone/stage.js and curtain.js, settings at the top of
// each), stood on the stage by stories/helpers/xylophone.jsx, without the
// audience the platform is built with. The spotlight is the game's too,
// the music hall's (lighting.js there, `hall.spot`; built in its
// script.js), copied below as SPOT.
import * as THREE from "three";
import { Built } from "./helpers/xylophone.jsx";
import { buildStage, STAGE } from "../src/xylophone/stage.js";
import { buildCurtain, CURTAIN } from "../src/xylophone/curtain.js";

// How far behind the platform's back edge the curtain's folds hang
const GAP = 0.6;

// The floor: a light honey oak, warm like the curtain's crimson but much
// lighter and quieter, so the red stands out against it and the gold
// trim ties the two together (the game's is a dark stain, #6B3A1F)
const FLOOR = "#C29A6E";

// The spotlight, where the game hangs it over the stage: a warm lamp high
// in front pointed at the player, a cone of `angle` either side, and the
// beam a faint cone from the lamp to the pool it throws (`beam` its
// opacity, 0 none).
const SPOT = {
  color: "#fff1d0",
  intensity: 2.4,
  position: [2, 14, 10],
  target: [0, 2, -1.5],
  angle: 0.3,
  penumbra: 0.5,
  distance: 45,
  decay: 1,
  beam: 0.1,
};

function spotlight(scene) {
  const S = SPOT;
  const spot = new THREE.SpotLight(S.color, S.intensity, S.distance, S.angle, S.penumbra, S.decay);
  spot.position.set(...S.position);
  spot.target.position.set(...S.target);
  // narrow end at the lamp
  const from = new THREE.Vector3(...S.position), to = new THREE.Vector3(...S.target);
  const dir = from.clone().sub(to), len = dir.length();
  dir.normalize();
  const beam = new THREE.Mesh(
    new THREE.CylinderGeometry(0.25, Math.tan(S.angle) * len, len, 32, 1, true),
    new THREE.MeshBasicMaterial({ color: S.color, transparent: true, opacity: S.beam, depthWrite: false, side: THREE.DoubleSide, fog: false }),
  );
  beam.position.copy(to).addScaledVector(dir, len / 2);
  beam.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir);
  beam.visible = S.beam > 0;
  scene.add(spot, spot.target, beam);
}

// The stage without its audience, then the curtain: it hangs CURTAIN.back
// behind the line it is given, so it is given the one that puts it GAP
// behind the stage's back edge, and it is as wide as the stage. (The
// floor's colour and the curtain's width are read as they are built, so
// they are set for the build and put back after, leaving the game's
// settings as they are.) Then the spotlight.
function buildStageWithCurtain(scene, tools) {
  const floor = STAGE.colors.floor;
  STAGE.colors.floor = FLOOR;
  let audience;
  try { ({ audience } = buildStage(scene, tools)); } finally { STAGE.colors.floor = floor; }
  scene.remove(audience);
  const width = CURTAIN.width;
  CURTAIN.width = 2 * STAGE.halfWidth;
  try { buildCurtain(scene, tools, 0, STAGE.back - GAP + CURTAIN.back); } finally { CURTAIN.width = width; }
  spotlight(scene);
}

export default {
  title: "Buildings/Stage",
  render: () => <Built build={buildStageWithCurtain} />,
};

export const Default = {};
