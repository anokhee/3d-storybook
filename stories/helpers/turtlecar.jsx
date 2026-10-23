// TURTLE CAR: the roadster remade as a turtle (src/car/turtlecar.js),
// in the stage's toon, facing +x, its wheels turning as if driving at
// `speed` world units a second, and `driver` who sits in it ("none",
// or a character, see driver.jsx). `config` is a TURTLECAR with whatever
// the story's knobs change.
import { useEffect, useMemo } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { buildTurtleCar, TURTLECAR } from "../../src/car/turtlecar.js";
import { toon } from "../../src/adjectives/unlit/toon.js";
import { Driver } from "./driver.jsx";

export function TurtleCar({ speed = 6, config = TURTLECAR, driver = "none" }) {
  const built = useMemo(() => buildTurtleCar((color, extra) => toon(new THREE.Color(color), extra), config), [config]);
  useEffect(() => () => built.group.traverse((o) => o.geometry?.dispose?.()), [built]);
  useFrame((_, dt) => built.roll(Math.min(dt, 0.05), speed));
  return (
    <>
      <primitive object={built.group} />
      <Driver kind={driver} seat={built.seat} scale={config.scale} />
    </>
  );
}
