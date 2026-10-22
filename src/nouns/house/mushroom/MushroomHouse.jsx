import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";

import { merge } from "../../../world/merge.js";
import { LIGHT } from "../../../adjectives/lit/objects.js";
import Primitive from "../../primitive/Primitive.jsx";
import Seated from "../../primitive/Seated.jsx";
import {
  primitiveExtent,
  primitiveGeometry,
} from "../../primitive/geometry.js";
import { useBody } from "../../planet/OnPlanet.jsx";
import { registerSolid, unregisterSolid } from "../../../player/solids.js";
import { useDoorAt } from "../House.jsx";
import { MUSHROOM_HOUSE } from "./objects.js";

const rad = (deg) => (deg * Math.PI) / 180;

// The stem is `height` tall: its `form` pressed to that along y — a
// cylinder stands two radii tall — over whatever else the form says.
const stemFormOf = (S) => ({ ...S.form, tall: S.height / (2 * S.radius) });
const stemGeometryOf = (S) =>
  primitiveGeometry(
    "cylinder",
    S.radius,
    undefined,
    S.detail,
    stemFormOf(S),
    undefined,
    S.clay,
  );

// Where the stem's foot and crown really are once formed and sunk, off the
// ground: the stem is built about its own middle, lifted so its foot meets
// the ground less what is sunk into it.
function stemOf(S) {
  const e = primitiveExtent(
    "cylinder",
    S.radius,
    undefined,
    S.detail,
    stemFormOf(S),
    undefined,
    S.clay,
  );
  const lift = -e.bottom - S.sink;
  return { lift, top: lift + e.top, mid: lift + (e.top + e.bottom) / 2 };
}

// The cap: a sphere's top half, its cut in the x/z plane, pressed down to
// `squash` of its height — so its dome stands `radius * squash` above the
// cut — the cut sat `sink` down over the stem's top.
const capFormOf = (C) => ({ tall: C.squash });
const capBaseOf = (M) => stemOf(M.stem).top - M.cap.sink;
const capTopOf = (M) => capBaseOf(M) + M.cap.radius * M.cap.squash;

// Where a spot sits: on the dome at its lat/lon, sunk in by its own
// radius times `sink`. The dome is a sphere pressed down, so a point on
// it is the sphere's, its y scaled by the squash; the spot is pulled in
// toward the dome's middle rather than along the surface's true normal,
// which is close enough for a dot of clay.
function spotsOf(C) {
  const P = C.spots;
  if (!P) return [];
  return P.at.map(({ lat, lon }) => {
    const la = rad(lat);
    const lo = rad(lon);
    const dir = new THREE.Vector3(
      Math.cos(la) * Math.sin(lo),
      Math.sin(la) * C.squash,
      Math.cos(la) * Math.cos(lo),
    );
    const on = dir.clone().multiplyScalar(C.radius);
    return on.sub(dir.normalize().multiplyScalar(P.radius * P.sink)).toArray();
  });
}

// How tall the house stands off its ground, for the posts to clear: the
// crown of the cap.
export const mushroomHouseHeightOf = (M) => capTopOf(M);

// How far out from its middle it spreads, for the player to be kept out of
// and the grass to keep back from: the cap's rim, round with it.
export function mushroomHouseFootprintOf(M) {
  const r = Math.max(M.cap.radius, M.stem.radius);
  return { x: r, z: r, round: true };
}

// A round pane (the cupcake's too — see Cupcake.jsx — so it is
// exported): a cylinder lying along z — a coin, `depth` thick — with
// its frame, a wider coin, behind it against the wall. Built lying in x/y
// and bulging out along +z, so Seated can stand it flush on the stem.
export function Coin({ config: R }) {
  const light = useMemo(() => merge(LIGHT, R.light), [R.light]);
  const F = R.frame;
  const form = useMemo(
    () => ({ tall: R.depth / (2 * R.radius) }),
    [R.depth, R.radius],
  );
  const frameForm = useMemo(
    () => (F ? { tall: F.depth / (2 * (R.radius + F.thickness)) } : null),
    [F, R.radius],
  );
  const K = R.knob;
  return (
    <group>
      {F && (
        <group position-z={F.depth / 2}>
          <Primitive
            shape="cylinder"
            radius={R.radius + F.thickness}
            detail={R.detail}
            form={frameForm}
            clay={R.clay}
            rotation={{ x: 90 }}
            swatch={F.color}
          />
        </group>
      )}
      <group position-z={(F?.depth ?? 0) + R.depth / 2}>
        <Primitive
          shape="cylinder"
          radius={R.radius}
          detail={R.detail}
          form={form}
          clay={R.clay}
          rotation={{ x: 90 }}
          swatch={R.color}
          light={light}
        />
      </group>
      {K && (
        <group
          position={[
            K.side * R.radius,
            0,
            (F?.depth ?? 0) + R.depth + K.radius * 0.6,
          ]}
        >
          <Primitive shape="sphere" radius={K.radius} swatch={K.color} />
        </group>
      )}
    </group>
  );
}

// How an arch's two solids are pressed to shape: a cube `radius` wide
// stretched to `straight` tall and `depth` deep, and a coin of `radius`
// `depth` thick.
const archFormsOf = (radius, depth, straight) => ({
  box: { tall: straight / (2 * radius), deepen: depth / (2 * radius) },
  arch: { tall: depth / (2 * radius) },
});

// An arched slab (the cupcake's door too, so it is exported): a box
// `width` across standing under a half-coin of the same width, `height`
// tall from its foot to the crown of the arch, with its frame, a wider
// arch, behind it against the wall, and a knob on it. Built like the Coin
// — lying in x/y, bulging out along +z, its middle at mid-height — so
// Seated can stand it flush on the stem.
export function Arch({ config: R }) {
  const light = useMemo(() => merge(LIGHT, R.light), [R.light]);
  const F = R.frame;
  const K = R.knob;
  const r = R.width / 2;
  // The straight part stands from the foot up to where the arch springs.
  // The frame's springs from the same height: it is `thickness` wider each
  // side and taller by that over the top, so its arch is that much bigger.
  const straight = R.height - r;
  const at = -R.height / 2 + straight / 2;
  const forms = useMemo(
    () => archFormsOf(r, R.depth, straight),
    [r, R.depth, straight],
  );
  const frameForms = useMemo(
    () => (F ? archFormsOf(r + F.thickness, F.depth, straight) : null),
    [F, r, straight],
  );
  const part = (radius, depth, forms, swatch, light) => (
    <group>
      <group position-y={at}>
        <Primitive
          shape="cube"
          radius={radius}
          detail={R.detail}
          form={forms.box}
          clay={R.clay}
          swatch={swatch}
          light={light}
        />
      </group>
      <group position-y={-R.height / 2 + straight}>
        <Primitive
          shape="cylinder"
          radius={radius}
          detail={R.detail}
          form={forms.arch}
          half="back"
          clay={R.clay}
          rotation={{ x: 90 }}
          swatch={swatch}
          light={light}
        />
      </group>
    </group>
  );
  return (
    <group>
      {F && (
        <group position-z={F.depth / 2}>
          {part(r + F.thickness, F.depth, frameForms, F.color)}
        </group>
      )}
      <group position-z={(F?.depth ?? 0) + R.depth / 2}>
        {part(r, R.depth, forms, R.color, light)}
      </group>
      {K && (
        <group
          position={[K.side * r, 0, (F?.depth ?? 0) + R.depth + K.radius * 0.6]}
        >
          <Primitive shape="sphere" radius={K.radius} swatch={K.color} />
        </group>
      )}
    </group>
  );
}

// One mushroom house, standing on the ground at y = 0 with its front
// facing +z. `config` overrides any of MUSHROOM_HOUSE's fields for this
// one instance.
export default function MushroomHouse({ config }) {
  const M = useMemo(() => merge(MUSHROOM_HOUSE, config), [config]);
  const S = M.stem;
  const C = M.cap;

  // Solid to the player: registered by where it actually IS, as a column
  // the cap's reach and the house's height, so it may sit anywhere in the
  // tree.
  const root = useRef();
  const ball = useBody();
  useEffect(() => {
    const at = new THREE.Vector3();
    root.current.updateWorldMatrix(true, false);
    root.current.getWorldPosition(at);
    at.sub(ball.center);
    const solid = registerSolid({
      body: ball,
      dir: at.clone().normalize(),
      top: at.length() - ball.radius + capTopOf(M),
      radius: mushroomHouseFootprintOf(M).x,
    });
    return () => unregisterSolid(solid);
  }, [M, ball]);

  const stem = useMemo(() => stemOf(S), [S]);
  const stemForm = useMemo(() => stemFormOf(S), [S]);
  const stemBody = useMemo(() => stemGeometryOf(S), [S]);
  const capForm = useMemo(() => capFormOf(C), [C]);
  const capBase = capBaseOf(M);
  const spots = useMemo(() => spotsOf(C), [C]);
  // Where the door and windows sit on the stem, as Seated reads it: x
  // across, y DOWN from the stem's mid-height, z out from the face. The
  // door's foot is on the ground; a window round the drum at `apart`
  // degrees from the front lands where a ray fired in at that x meets it.
  const W = M.windows;
  const D = M.door;
  // The door can be gone in at (see ../house/House.jsx, useDoorAt): its
  // foot is on the ground at the stem's front. Inside: the stem's color,
  // the cap's underfoot, and its own rooms.
  const foot = useRef();
  const room = useMemo(
    () => ({
      walls: S.color,
      floor: C.color,
      rooms: M.interior.rooms,
      ways: {
        arch: M.interior.arch,
        door: M.interior.door,
        window: M.interior.window,
      },
      door: D,
      window: W,
    }),
    [S, C, M.interior, D, W],
  );
  useDoorAt(foot, D.height, room);
  const seats = useMemo(
    () => ({
      door: { translation: { x: 0, y: stem.mid - D.height / 2, z: 0 }, ...D },
      windows: [-1, 1].map((side) => ({
        translation: {
          x: side * S.radius * Math.sin(rad(W.apart)),
          y: stem.mid - W.y,
          z: 0,
        },
        ...W,
      })),
    }),
    [stem, S.radius, W, D],
  );
  return (
    <group ref={root}>
      <group ref={foot} position-z={S.radius} />
      <group position-y={stem.lift}>
        <Primitive
          shape="cylinder"
          radius={S.radius}
          detail={S.detail}
          form={stemForm}
          clay={S.clay}
          swatch={S.color}
        />
        <Seated body={stemBody} spec={seats.door} part={Arch} />
        {seats.windows.map((spec, i) => (
          <Seated key={i} body={stemBody} spec={spec} part={Coin} />
        ))}
      </group>
      <group position-y={capBase}>
        <Primitive
          shape="sphere"
          radius={C.radius}
          detail={C.detail}
          form={capForm}
          clay={C.clay}
          half="top"
          swatch={C.color}
        />
        {C.gills && (
          <group position-y={-C.gills.thickness / 2}>
            <Primitive
              shape="cylinder"
              radius={C.radius}
              detail={C.detail}
              form={{ tall: C.gills.thickness / (2 * C.radius) }}
              swatch={C.gills.color}
            />
          </group>
        )}
        {spots.map((position, i) => (
          <group key={i} position={position}>
            <Primitive
              shape="sphere"
              radius={C.spots.radius}
              detail={C.spots.detail}
              swatch={C.spots.color}
            />
          </group>
        ))}
      </group>
    </group>
  );
}
