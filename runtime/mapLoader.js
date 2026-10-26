// LOADING A MAP INTO A GAME. Plain three.js, no React: a game imports this
// (or copies it beside its own code) and loads the .glb the mapmaker saved.
//
//   const { group, placements, starts, cover } = await loadMap("maps/world.glb", {
//     finish: (material) => myToonMaterial(material.color),   // optional
//     radiusAt: (dir) => groundRadiusAt(dir),                 // optional
//   });
//   scene.add(group);
//
// Each placement in the file is a node carrying, as extras, the bearing it
// was placed at (`dir`, a unit vector from the planet's middle), its `yaw`,
// `scale` and `lift`, its `role`, and the catalog `entry` and knob `args` it
// was made from.
//
// ROLES. "prop" (the default) is scenery: its baked mesh goes in `group`.
// "player" is the one START MARKER: where the player begins, and as which
// character. Its baked mesh is NOT added to `group` — the game has its own —
// but it is in `placements` with its `object`, and in `starts.player` (or
// null). A start's `heading` is the way it faces: its own +x, as the editor
// turned it. (Older maps' "vehicle" and "mount" starts are read as props.)
//
// GROUNDCOVER. A placement whose entry is "cover-<type>" is a patch of
// grass, flowers, pebbles, bare ground, water or road (see cover.js):
// `p.cover` is its type, and `cover` lists them all, in stacking order. A
// road is a stroke: `p.knots` (bearings) and `p.closed`. The editor bakes a
// preview of each into the file, but a game plants its own from the
// patches' shapes with cover.js's sampleCover, so they are left out of
// `group` by default.
//
// TERRAIN. A placement whose entry is "terrain-<type>" is a plateau or a
// ramp (see terrain.js): `p.terrain` is its type, and `terrain` lists them.
// A game raises its own ground from them (terrain.js's terrainField); the
// editor bakes nothing for them, so they are left out of `group` too.
//
// `include(placement)` says which baked meshes go in `group`: the props
// that are not patches or terrain, by default. A game that builds some of the map's
// things itself (its own houses, instanced trees) leaves those out here and
// reads them off `placements` instead.
//
// With `radiusAt` the loader stands each thing on the GAME's ground at its
// bearing — the editor laid them out on a plain ball (or a snapshot of this
// ground), the game's is the real thing — else they stay where the editor
// put them. `finish` swaps every material for the game's own, given the
// baked one (its color is what the storybook painted); without it the baked
// materials are used as they are.
import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

// The turn that lands a +y-up model's up on the ball's up at `dir`.
export function standOn(dir, target = new THREE.Quaternion()) {
  const up = dir.clone().normalize();
  const seed = Math.abs(up.z) > 0.99 ? new THREE.Vector3(1, 0, 0) : new THREE.Vector3(0, 0, 1);
  const fwd = seed.addScaledVector(up, -seed.dot(up)).normalize();
  const right = new THREE.Vector3().crossVectors(up, fwd);
  return target.setFromRotationMatrix(new THREE.Matrix4().makeBasis(right, up, fwd));
}

const Y = new THREE.Vector3(0, 1, 0);

// A placement's frame on the ball: where it stands (at `radius` out, plus its
// lift), how it is turned (stood up, then its yaw), and the way it faces.
export function poseOf({ dir, yaw = 0, lift = 0 }, radius) {
  const d = Array.isArray(dir) ? new THREE.Vector3().fromArray(dir) : dir.clone();
  d.normalize();
  const quaternion = standOn(d);
  if (yaw) quaternion.multiply(new THREE.Quaternion().setFromAxisAngle(Y, yaw));
  const heading = new THREE.Vector3(1, 0, 0).applyQuaternion(quaternion);
  return { dir: d, position: d.clone().multiplyScalar(radius + lift), quaternion, heading };
}

const coverOf = (entry) => (typeof entry === "string" && entry.startsWith("cover-") ? entry.slice(6) : null);
const terrainOf = (entry) => (typeof entry === "string" && entry.startsWith("terrain-") ? entry.slice(8) : null);

export async function loadMap(url, { finish = null, radiusAt = null, include = (p) => p.role === "prop" && !p.cover && !p.terrain, loader = new GLTFLoader() } = {}) {
  const gltf = await loader.loadAsync(url);
  // The map's own node (the editor's group) and the placements under it.
  let mapNode = null;
  const nodes = [];
  gltf.scene.traverse((o) => {
    if (o.userData?.mm === "map") mapNode = o;
    else if (o.userData?.mm === 1) nodes.push(o);
  });
  const surface = mapNode?.userData.surface ?? { kind: "planet", radius: 36 };
  const group = new THREE.Group();
  group.name = mapNode?.userData.name ?? "map";
  const materials = new Map();
  const placements = [];
  const starts = { player: null };
  for (const node of nodes) {
    const d = node.userData;
    const role = d.role === "player" ? "player" : "prop";
    const dir = new THREE.Vector3().fromArray(d.dir).normalize();
    const pose = poseOf(d, radiusAt ? radiusAt(dir) : surface.radius);
    if (radiusAt) {
      node.position.copy(pose.position);
      node.quaternion.copy(pose.quaternion);
    }
    node.scale.setScalar(d.scale ?? 1);
    node.traverse((o) => {
      if (!o.isMesh) return;
      if (finish) {
        const list = Array.isArray(o.material) ? o.material : [o.material];
        const out = list.map((m) => {
          if (!materials.has(m.uuid)) materials.set(m.uuid, finish(m));
          return materials.get(m.uuid);
        });
        o.material = Array.isArray(o.material) ? out : out[0];
      }
      o.castShadow = o.receiveShadow = true;
    });
    const p = { id: node.name, role, entry: d.entry, args: d.args ?? {}, dir, heading: pose.heading, yaw: d.yaw ?? 0, scale: d.scale ?? 1, lift: d.lift ?? 0, cover: coverOf(d.entry), terrain: terrainOf(d.entry), knots: d.knots, closed: !!d.closed, object: node };
    placements.push(p);
    if (include(p)) group.add(node);
    if (role === "player") starts.player ??= p;
  }
  return { group, placements, starts, cover: placements.filter((p) => p.cover), terrain: placements.filter((p) => p.terrain), surface };
}
