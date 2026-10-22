// XYLOPHONE: the objects of the xylophone project, each stood on the stage.
// That project builds plain three.js scenery: every builder takes a scene
// to add to, the `{ toonMat, inked }` helpers that give it the toon-and-ink
// look, and where the blob (the instrument) stands. So each is handed a
// Group as its scene and the origin as the blob's spot, then the group is
// slid so what it built is centered on the stage. Builders that return an
// `animate` are animated. Source: src/xylophone/, ported as modules.
import { useEffect, useMemo } from "react";
import * as THREE from "three";
import { useFrame, useThree } from "@react-three/fiber";
import { toonMat, inked, ink, outlineMat, setStroke } from "../../src/xylophone/ink.js";

const TOOLS = { toonMat, inked, ink: outlineMat };
// A clipping plane far below everything: the coast clips its sand at the
// horizon, which here is nowhere.
export const NO_CLIP = new THREE.Plane(new THREE.Vector3(0, 1, 0), 1e6);

// `build(scene, tools, x, z, clip)` is one of the project's builders.
// `pick(result)` says which object of what it returns is the thing (the
// fence of { fence, nearFence }, say); by default the first Object3D in it.
// `args` are any extra arguments the builder takes after (scene, tools,
// x, z): the coast's clipping plane, say. Nothing by default, since some
// builders read a list there (the trees' `around`).
export function Built({ build, args = [], center = true }) {
  const { group, result } = useMemo(() => {
    const group = new THREE.Group();
    const result = build(group, TOOLS, 0, 0, ...args);
    if (center) {
      const box = new THREE.Box3().setFromObject(group);
      if (!box.isEmpty()) {
        const c = box.getCenter(new THREE.Vector3());
        group.position.set(-c.x, 0, -c.z);
      }
    }
    return { group, result };
  }, [build, center, ...args]);

  // The ink outline's stroke, kept a constant width on screen.
  const camera = useThree((s) => s.camera);
  const size = useThree((s) => s.size);
  useEffect(() => {
    setStroke(camera, size.height);
  }, [camera, size.height]);

  // The builders' animations take (now, dt) in seconds, as the game's loop
  // gives them; the grid's `update` takes dt alone. (The fish heads'
  // `update` is per fish and is left to the game.)
  useFrame(({ clock }, dt) => {
    const step = Math.min(dt, 0.05);
    if (typeof result?.animate === "function") result.animate(clock.elapsedTime, step);
    if (build.name === "buildGrid" && typeof result?.update === "function") result.update(step);
  });

  return <primitive object={group} />;
}
