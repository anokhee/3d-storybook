import { useEffect, useMemo } from "react";
import * as THREE from "three";
import { useThree } from "@react-three/fiber";

import { hue, PALETTE } from "../../world/palette.js";
import { MOON_DIR } from "../moon/objects.js";
import { registerWater, unregisterWater } from "../../player/waters.js";
import { poolsOf } from "./pools.js";
import { sheetGeometry } from "./sheet.js";
import Foam from "./Foam.jsx";
import Basin from "./Basin.jsx";
import Tub from "./Tub.jsx";
import Bath from "./Bath.jsx";
import Kiddie from "./Kiddie.jsx";
import Rocks from "./Rocks.jsx";
import Steam from "./Steam.jsx";

// What the water mirrors. The world has no environment of its own (that
// is parked — see Moonlight), so the sheet is handed one: the night sky
// with the moon hung in it where the real one is, and a soft haze round
// it, baked once per renderer into a reflection map the material can
// read. Sized off `gloss`, so one map serves every pool with the same.
const envs = new Map();
function skyFor(gl, G) {
  const key = `::`;
  if (envs.has(key)) return envs.get(key);
  const scene = new THREE.Scene();
  scene.background = hue(PALETTE.sky.night);
  const far = 100;
  const at = MOON_DIR.clone().multiplyScalar(far);
  const disc = (size, swatch, opacity = 1) => {
    const m = new THREE.Mesh(
      new THREE.SphereGeometry(far * size, 24, 12),
      new THREE.MeshBasicMaterial({
        color: hue(swatch),
        transparent: opacity < 1,
        opacity,
      }),
    );
    m.position.copy(at);
    return m;
  };
  scene.add(disc(G.haze, PALETTE.moon.glow, G.hazeAlpha));
  scene.add(disc(G.moon, PALETTE.moon.body));
  const pmrem = new THREE.PMREMGenerator(gl);
  const env = pmrem.fromScene(scene, 0.04).texture;
  pmrem.dispose();
  envs.set(key, env);
  return env;
}

// One pool — see pools.js for what one is — lying in its own frame on
// its ball. Its look is `pool.W`, the first member's WATER config — but
// for its colors, which the level hands down as `colors`, `{ surface,
// foam }` swatches (see palettes.js), where it has them: the water takes
// its color off the grass it lies in (see level/groundCover.js) — a pond
// does; a swimming pool is its own blue whatever grows round it, and lies
// in a tiled tub (see Basin.jsx); a hot spring is its own milky green,
// with rocks round it (see Rocks.jsx) and steam rising off it (see
// Steam.jsx); an above-ground pool is a pool's blue, up in its tub (see
// Tub.jsx); a kiddie pool the same, in its rings (see Kiddie.jsx); a
// bath the same, its tub up on feet (see Bath.jsx).
export default function Water({ pool, colors = null }) {
  const W = pool.W;
  const pooled = W.kind === "pool";
  const own = W.kind !== "pond";
  const surface = (!own && colors?.surface) || W.color;
  // Rebuilt only when the pool's shape changes (its `key`), not on every
  // nudge of it about the ball.
  const geometry = useMemo(
    () => sheetGeometry(pool),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [pool.key],
  );
  useEffect(() => () => geometry.dispose(), [geometry]);
  // See-through, and left out of the depth buffer so the grass at its bank
  // and anything wading in it draws through it rather than vanishing
  // behind the sheet. Water's own index, so the mirror is faint straight
  // down and comes up at a glance across it, the way a pond's does.
  const gl = useThree((s) => s.gl);
  const material = useMemo(() => {
    const G = W.gloss;
    return new THREE.MeshPhysicalMaterial({
      color: hue(surface),
      transparent: true,
      opacity: W.alpha,
      depthWrite: false,
      roughness: G.roughness,
      metalness: 0,
      ior: 1.33,
      envMap: skyFor(gl, G),
      envMapIntensity: G.reflect,
    });
  }, [surface, W.alpha, W.gloss, gl]);

  // Stood `lift` up off the ground, along the ground's up there.
  const lifted = useMemo(
    () => pool.origin.clone().addScaledVector(pool.dir, pool.lift),
    [pool.origin, pool.dir, pool.lift],
  );

  // Where the doll wades — see player/waters.js.
  useEffect(() => {
    const water = registerWater(pool);
    return () => unregisterWater(water);
  }, [pool]);

  return (
    <group position={lifted} quaternion={pool.frame}>
      {pooled && <Basin pool={pool} />}
      {W.kind === "tub" && <Tub pool={pool} />}
      {W.kind === "bath" && <Bath pool={pool} />}
      {W.kind === "kiddie" && <Kiddie pool={pool} />}
      {W.kind === "spring" && <Rocks pool={pool} />}
      {W.kind === "spring" && <Steam pool={pool} />}
      <mesh geometry={geometry} material={material} />
      {W.foam.map((layer, i) => (
        <Foam
          key={i}
          pool={pool}
          layer={layer}
          color={own ? null : colors?.foam}
        />
      ))}
    </group>
  );
}

// Every pool the stations make (see poolsOf), drawn. Keyed by its
// members, so a pool keeps its sheet while it is dragged and two that
// run together become one.
export function Pools({ stations, colors = null }) {
  const pools = useMemo(() => poolsOf(stations), [stations]);
  return pools.map((pool) => (
    <Water key={pool.members.join(",")} pool={pool} colors={colors} />
  ));
}
