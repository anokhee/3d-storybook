import { useMemo } from "react";

import { merge } from "../../world/merge.js";
import { unlitMat } from "../../adjectives/unlit/material.js";
import Ornament, { ornamentOf, Facing } from "../ornament/Ornament.jsx";
import { POSTS } from "./objects.js";

// `stands` is where each post is planted — a `{ position, quaternion }` per
// post, so each stands on its own bit of the ball rather than on the
// station's flat plane — and `height` how tall they all are, both worked
// out by the station from what the ring surrounds. `config` overrides
// POSTS.post's look for this one ring; `cap` overrides POSTS.cap, which is
// any ornament the garland could hang plus how it is lit (`light`) — the
// post's business, not the ornament's. The posts are painted
// `config.color`; `capColor` paints the cap.
export default function Posts({
  stands,
  height,
  config,
  cap,
  capColor = POSTS.capColor,
}) {
  const P = useMemo(() => merge(POSTS.post, config), [config]);
  const color = P.color;
  const C = useMemo(() => {
    // A cap of a DIFFERENT shape replaces the default outright rather than
    // merging: an octagram should not leave the cylinder's `sides` riding
    // along as debris (and would throw on them). The same shape still
    // merges, so `{ radius: 0.6 }` is a partial edit. Either way the light,
    // translation and rotation merge — a swapped cap says nothing about
    // them unless it does.
    const spec =
      !cap ? POSTS.cap
      : cap.shape && cap.shape !== POSTS.cap.shape ?
        {
          ...cap,
          light: merge(POSTS.cap.light, cap.light),
          translation: merge(POSTS.cap.translation, cap.translation),
          rotation: merge(POSTS.cap.rotation, cap.rotation),
        }
      : merge(POSTS.cap, cap);
    // How the cap SITS — translation and rotation — is the post's business,
    // not the ornament's.
    // Kept BESIDE the ornament rather than spread over it: the ornament's
    // own `rotation` is `{ x, y, z }` in degrees, and writing the seating's
    // radian triple over it would hand Primitive an array to read x off.
    const { translation: t, rotation: r, ...ornament } = spec;
    const rad = (deg) => (deg * Math.PI) / 180;
    return {
      ornament: ornamentOf(ornament, "Posts cap"),
      // y down on the page, up in the world.
      translation: [t.x, -t.y, t.z],
      rotation: [rad(r.x), rad(r.y), rad(r.z)],
    };
  }, [cap]);
  const material = unlitMat(color);

  return (
    <group>
      {stands.map(({ position, quaternion }, i) => (
        <group key={i} position={position} quaternion={quaternion}>
          <mesh material={material} position-y={(height + P.sink) / 2 - P.sink}>
            <cylinderGeometry
              args={[
                P.baseRadius * P.taper,
                P.baseRadius,
                height + P.sink,
                P.sides,
              ]}
            />
          </mesh>

          <group position-y={height}>
            {/* Faced from where the post stands in the station, not from its
                own origin, so a cap on the left still looks left. */}
            <Facing x={position.x} z={position.z} faceOut={C.ornament.faceOut}>
              <group position={C.translation} rotation={C.rotation}>
                <Ornament ornament={C.ornament} swatch={capColor} />
              </group>
            </Facing>
          </group>
        </group>
      ))}
    </group>
  );
}
