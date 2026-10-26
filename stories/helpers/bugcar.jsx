// BUG CAR: the roadster remade as a beetle (src/car/bugcar.js), in the
// stage's toon, facing +x, its wheels turning as if driving at `speed`
// world units a second, and `driver` who sits in it ("none",
// or a character, see driver.jsx). `config` is a BUGCAR (LADYBUG, STAGBEETLE, HORNEDBEETLE, LONGHORN or BUTTERFLY) with
// whatever the story's knobs change.
import { useEffect, useMemo } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { buildBugCar, BUGCAR } from "../../src/car/bugcar.js";
import { toon } from "../../src/adjectives/unlit/toon.js";
import { Driver } from "./driver.jsx";

// The cube (world units) the stage frames for every bug car's picture
// (parameters.stage.frame, see .storybook/stage.jsx): the biggest of them,
// the butterfly with its wings out, edge to edge, so the whole set comes
// out at one zoom and one angle.
export const BUG_CAR_FRAME = 6.4;

export function BugCar({ speed = 6, config = BUGCAR, driver = "none" }) {
  const built = useMemo(() => buildBugCar((color, extra) => toon(new THREE.Color(color), extra), config), [config]);
  useEffect(() => () => built.group.traverse((o) => o.geometry?.dispose?.()), [built]);
  useFrame((_, dt) => built.roll(Math.min(dt, 0.05), speed));
  return (
    <>
      <primitive object={built.group} />
      <Driver kind={driver} seat={built.seat} scale={config.scale} />
    </>
  );
}
