// PLANETS: a world from the planets project, stood at the origin. The
// Planet class (src/planets/planet.js) builds it from a species and a
// seed; `update()` spins it and orbits its moons each frame. A world is a
// unit sphere times the size its species rolled, so it is scaled up here
// to sit with the rest of the catalog, and lifted so it floats clear of
// the ground.
import { useEffect, useMemo } from "react";
import { createPortal, useFrame, useThree } from "@react-three/fiber";
import { Planet, generateStars } from "../../src/planets/planet.js";
import { SPECIES, LIGHTS } from "../../src/planets/worlds.js";

export const SPECIES_NAMES = Object.keys(SPECIES);
export const palettesOf = (species) => SPECIES[species].palettes.map((p) => p.name);

// The project's star field, once, shared by every world; put at the scene's
// top level so the camera fits the world and not the sky.
let starField = null;
function Stars() {
  const scene = useThree((s) => s.scene);
  const stars = useMemo(() => (starField ??= generateStars()), []);
  return createPortal(<primitive object={stars} />, scene);
}

// The frame every world sits in: in space (the stage's backdrop),
// under the project's stars, floating where the ground would be, under
// the project's own light: a white sun from one side and a little ambient
// (LIGHTS in worlds.js). The stage lights nothing for these stories.
// The game's numbers are in three's old light units, where every light
// was pi times what the same number gives now (useLegacyLights went in
// r155), so they are scaled up here or the night side goes black.
const LEGACY = Math.PI;
function Space({ lift, children }) {
  const L = LIGHTS.directional;
  return (
    <group position-y={lift}>
      <Stars />
      <directionalLight color={0xffffff} intensity={L.intensity * LEGACY} position={[L.position.x, L.position.y, L.position.z]} />
      <ambientLight color={LIGHTS.ambient.color} intensity={LIGHTS.ambient.intensity * LEGACY} />
      {children}
    </group>
  );
}

export function World({ species = "earthlike", seed = 9, palette = null, size = 4, spin = true }) {
  const planet = useMemo(() => new Planet({ species, seed, palette: palette || null, scale: size }), [species, seed, palette, size]);
  useEffect(() => () => planet.dispose(), [planet]);
  useFrame(() => { if (spin) planet.update(); });
  return (
    <Space lift={size * 1.5}>
      <primitive object={planet.group} />
    </Space>
  );
}
