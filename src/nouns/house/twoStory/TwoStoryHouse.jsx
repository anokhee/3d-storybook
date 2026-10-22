import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";

import { merge } from "../../../world/merge.js";
import { unlitMat } from "../../../adjectives/unlit/material.js";
import House, {
  Plaque,
  Window,
  houseHeightOf,
  houseFootprintOf,
} from "../House.jsx";
import { useBody } from "../../planet/OnPlanet.jsx";
import { registerSolid, unregisterSolid } from "../../../player/solids.js";
import { TWO_STORY_HOUSE } from "./objects.js";

// Where the two stand so the pair is centered: the house pushed over by
// half the garage's width away from it, the garage's middle then half the
// house's width out the other way.
const houseXOf = (H) => (-H.garage.side * H.garage.width) / 2;
const garageXOf = (H) => (H.garage.side * H.body.width) / 2;

// The garage's walls: a box with its top sloped down away from the house,
// as a quadrilateral in x/y — the inner wall `height` tall, the outer
// `drop` shorter — pulled out `depth` along z and centered on it, built
// about the garage's own middle. Cached by its sizes, like the house's.
const shells = new Map();
function shellGeometry(G) {
  const key = `${G.side}:${G.width}:${G.depth}:${G.height}:${G.roof.drop}`;
  if (shells.has(key)) return shells.get(key);
  const inner = (-G.side * G.width) / 2;
  const outer = (G.side * G.width) / 2;
  const shape = new THREE.Shape()
    .moveTo(inner, 0)
    .lineTo(outer, 0)
    .lineTo(outer, G.height - G.roof.drop)
    .lineTo(inner, G.height);
  const g = new THREE.ExtrudeGeometry(shape, {
    depth: G.depth,
    bevelEnabled: false,
  }).translate(0, 0, -G.depth / 2);
  g.computeVertexNormals();
  g.computeBoundingBox();
  shells.set(key, g);
  return g;
}

// The lean-to slab: a box laid down the slope from the house's wall,
// `overhang` past the outer wall, `eaves` past the front and back, stood
// off the slope by half its thickness — `{ position, rotation, size }` for
// a box built about its middle, in the garage's frame, unsunk.
function leanToOf(G) {
  const R = G.roof;
  const run = G.width;
  const length = Math.hypot(run, R.drop);
  const along = { x: (G.side * run) / length, y: -R.drop / length };
  const out = { x: (G.side * R.drop) / length, y: run / length };
  const total = length + R.overhang;
  const mid = total / 2;
  return {
    position: [
      (-G.side * G.width) / 2 + along.x * mid + (out.x * R.thickness) / 2,
      G.height + along.y * mid + (out.y * R.thickness) / 2,
      0,
    ],
    rotation: [0, 0, Math.atan2(along.y, along.x)],
    size: [total, R.thickness, G.depth + 2 * R.eaves],
  };
}

// How tall it stands off its ground, for the posts to clear: the house's
// ridge — the garage is the low side.
export const twoStoryHouseHeightOf = houseHeightOf;

// How far out from its middle it spreads: the pair's width between them,
// plus whichever roof hangs further past its outer wall; the house's
// depth, since the garage sits flush with its front and no deeper.
export function twoStoryHouseFootprintOf(H) {
  const G = H.garage;
  const house = houseFootprintOf(H);
  const houseHang = house.x - H.body.width / 2;
  const garageHang =
    G.roof.overhang * (G.width / Math.hypot(G.width, G.roof.drop));
  return {
    x: (H.body.width + G.width) / 2 + Math.max(houseHang, garageHang),
    z: Math.max(house.z, G.depth / 2 + G.roof.eaves),
  };
}

// The garage door: a wide plaque with its foot on the ground, and the
// seams of its panels laid across it, standing a hair prouder.
function GarageDoor({ D, face }) {
  const S = D.seams;
  const seams =
    S ?
      Array.from(
        { length: S.count - 1 },
        (_, k) => ((k + 1) * D.height) / S.count,
      )
    : [];
  return (
    <group>
      <Plaque
        x={0}
        y={D.height / 2}
        width={D.width}
        height={D.height}
        depth={D.depth}
        face={face}
        detail={D.detail}
        color={D.color}
      />
      {seams.map((y, k) => (
        <Plaque
          key={k}
          x={0}
          y={y}
          width={D.width}
          height={S.thickness}
          depth={D.depth + 0.02}
          face={face}
          detail={D.detail}
          color={S.color}
        />
      ))}
    </group>
  );
}

// One two-story house, standing on the ground at y = 0 with its front
// facing +z. `config` overrides any of TWO_STORY_HOUSE's fields for this
// one instance. The house draws itself (see House) and is solid on its
// own account; the garage is solid here, a box its own size at its own
// spot, so the doll walks round the pair rather than through the corner
// between them.
export default function TwoStoryHouse({ config }) {
  const H = useMemo(() => merge(TWO_STORY_HOUSE, config), [config]);
  const G = H.garage;
  const B = H.body;

  const garage = useRef();
  const ball = useBody();
  useEffect(() => {
    const at = new THREE.Vector3();
    const turn = new THREE.Quaternion();
    garage.current.updateWorldMatrix(true, false);
    garage.current.getWorldPosition(at);
    garage.current.getWorldQuaternion(turn);
    at.sub(ball.center);
    const solid = registerSolid({
      body: ball,
      dir: at.clone().normalize(),
      top: at.length() - ball.radius + G.height - G.sink,
      frame: turn,
      halfWidth: G.width / 2,
      halfLength: G.depth / 2,
    });
    return () => unregisterSolid(solid);
  }, [G, ball]);

  const shell = useMemo(() => shellGeometry(G), [G]);
  const slab = useMemo(() => leanToOf(G), [G]);
  // The upper floor's windows are the ground floor's, moved.
  const U = useMemo(() => merge(H.windows, H.upstairs), [H]);
  const face = B.depth / 2;
  return (
    <group>
      <group position-x={houseXOf(H)}>
        <House config={H} />
        {U.at.map((x, i) => (
          <Window key={i} W={U} x={x} face={face} />
        ))}
      </group>
      <group ref={garage} position={[garageXOf(H), 0, face - G.depth / 2]}>
        <group position-y={-G.sink}>
          <mesh geometry={shell} material={unlitMat(G.color)} />
          <mesh
            position={slab.position}
            rotation={slab.rotation}
            material={unlitMat(G.roof.color)}
          >
            <boxGeometry args={slab.size} />
          </mesh>
        </group>
        <GarageDoor D={G.door} face={G.depth / 2} />
      </group>
    </group>
  );
}
