import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";

import { merge } from "../../world/merge.js";
import { latLonDir, standOn } from "../../world/layout.js";
import OnPlanet from "../planet/OnPlanet.jsx";
import { INVALID_MATERIAL } from "../../adjectives/invalid/material.js";
import { PLANET } from "../planet/objects.js";
import { bodyOf } from "../planet/bodies.js";
import { standAt } from "../planet/standAt.js";
import { TRAMPOLINE } from "../trampoline/objects.js";
import Trampoline from "../trampoline/Trampoline.jsx";
import { GACHAPON } from "../gachapon/objects.js";
import Gachapon, {
  gachaponHeightOf,
  gachaponFootprintOf,
} from "../gachapon/Gachapon.jsx";
import { VENDING_MACHINE } from "../vendingMachine/objects.js";
import VendingMachine, {
  vendingMachineHeightOf,
  vendingMachineFootprintOf,
} from "../vendingMachine/VendingMachine.jsx";
import { BENCH } from "../bench/objects.js";
import Bench, { benchHeightOf, benchFootprintOf } from "../bench/Bench.jsx";
import { COUCH } from "../couch/objects.js";
import Couch, { couchHeightOf, couchFootprintOf } from "../couch/Couch.jsx";
import { CHAIR } from "../chair/objects.js";
import Chair, { chairHeightOf, chairFootprintOf } from "../chair/Chair.jsx";
import { STICK_LAMP } from "../lamp/objects.js";
import StickLamp, {
  stickLampHeightOf,
  stickLampFootprintOf,
} from "../lamp/StickLamp.jsx";
import { COUNTER } from "../counter/objects.js";
import Counter, {
  counterHeightOf,
  counterFootprintOf,
} from "../counter/Counter.jsx";
import { FRIDGE } from "../fridge/objects.js";
import Fridge, {
  fridgeHeightOf,
  fridgeFootprintOf,
} from "../fridge/Fridge.jsx";
import { POT_PLANT } from "../potPlant/objects.js";
import PotPlant, {
  potPlantHeightOf,
  potPlantFootprintOf,
} from "../potPlant/PotPlant.jsx";
import { TABLE } from "../table/objects.js";
import Table, { tableHeightOf, tableFootprintOf } from "../table/Table.jsx";
import { CAPSULE } from "../capsule/objects.js";
import Capsule, {
  capsuleHeightOf,
  capsuleFootprintOf,
} from "../capsule/Capsule.jsx";
import { ENCLOSURE } from "../enclosure/objects.js";
import { HOUSE } from "../house/objects.js";
import House, { houseHeightOf, houseFootprintOf } from "../house/House.jsx";
import { TWO_STORY_HOUSE } from "../house/twoStory/objects.js";
import TwoStoryHouse, {
  twoStoryHouseHeightOf,
  twoStoryHouseFootprintOf,
} from "../house/twoStory/TwoStoryHouse.jsx";
import { MUSHROOM_HOUSE } from "../house/mushroom/objects.js";
import MushroomHouse, {
  mushroomHouseHeightOf,
  mushroomHouseFootprintOf,
} from "../house/mushroom/MushroomHouse.jsx";
import { TRAILER } from "../house/trailer/objects.js";
import Trailer, {
  trailerHeightOf,
  trailerFootprintOf,
} from "../house/trailer/Trailer.jsx";
import { CUPCAKE } from "../house/cupcake/objects.js";
import Cupcake, {
  cupcakeHeightOf,
  cupcakeFootprintOf,
} from "../house/cupcake/Cupcake.jsx";
import { TREE } from "../tree/objects.js";
import Tree, { treeHeightOf, treeFootprintOf } from "../tree/Tree.jsx";
import { POSTS } from "../post/objects.js";
import Posts from "../post/Posts.jsx";
import Enclosure from "../enclosure/Enclosure.jsx";
import Ornament, {
  ornamentOf,
  dropOf,
  isShape,
} from "../ornament/Ornament.jsx";
import { WATER, GROUND, IN_GROUND } from "../water/objects.js";
import Pad from "../water/Pad.jsx";
import { RUG } from "../rug/objects.js";
import Rug from "../rug/Rug.jsx";
import { WALL_HANGING } from "../wallHanging/objects.js";
import WallHanging from "../wallHanging/WallHanging.jsx";
import { STATION, AT_CENTRE, EMPTY } from "./objects.js";
import { ThingContext } from "./thing.js";

// A station: the box's worth of ground at lat/lon on `body` (the planet
// unless said otherwise — see ../planet/bodies.js), whatever `objects`
// stand in it, and the enclosure round its edge. Inside, everything is
// plain +y-up with the ground at y = 0 under the station's middle —
// OnPlanet takes care of where on the globe that is. `gates` are where
// paths come into the lot, for the fence to open at (see Enclosure, and
// gatesOf in level/stations.js). `id` is the station's index in the
// level, told to each object with its own index (see thing.js) for the
// few that need telling apart — a house's door, which opens on that
// house's room and no other's.

// A `rotation` — an object's about its own spot, or the station's about its
// middle — as radians about x, y and z, from degrees. None is no turn.
const NO_TURN = { x: 0, y: 0, z: 0 };
export const eulerOf = (rotation) => {
  const { x, y, z } = merge(NO_TURN, rotation);
  const d = THREE.MathUtils.degToRad;
  return [d(x), d(y), d(z)];
};

// An object's `position` in world units: x and y are fractions of the box,
// measured from its back-left corner, and z is height off the ground.
function spotOf(position, { width, length }) {
  const { x, y, z } = merge(AT_CENTRE, position);
  return { x: (x - 0.5) * width, z: (y - 0.5) * length, lift: z };
}

// What the station knows how to stand inside it, by `type`. Every noun
// answers the same four questions and nothing else: `defaults` the config
// its overrides merge over, `top` how high its crown stands above its own
// ground once configured (for the posts to clear), `footprint` how far
// out from its middle it spreads on the ground, `{ x, z }` across and
// along (for the grass to keep back), and `draw` how it goes on screen —
// given, too, whether it is the edit view drawing (see Station's `edit`),
// for what shows only there. A new noun is one entry here.
// The houses are drawn scaled (their `scale`, so a door stands a cat tall),
// so their size helpers, which measure the unscaled house, are scaled too.
const scaledBy = (of) => (C, ...rest) => {
  const v = of(C, ...rest), k = C.scale ?? 1;
  return typeof v === "number" ? v * k : { ...v, x: v.x * k, z: v.z * k };
};

const NOUNS = {
  // Nothing, on a spot: only the edit view draws it, a flat disc on the
  // ground to pick and drag by.
  empty: {
    defaults: EMPTY,
    top: () => 0,
    footprint: (E) => round(E.radius),
    draw: (E, key, edit) =>
      edit ?
        <mesh key={key} rotation-x={-Math.PI / 2} position-y={0.02}>
          <circleGeometry args={[E.radius, 24]} />
          <meshBasicMaterial color={E.color} transparent opacity={0.6} />
        </mesh>
      : null,
  },
  trampoline: {
    defaults: TRAMPOLINE,
    top: (T) => T.height - T.sink + T.frame.thickness,
    footprint: (T) => round(T.radius + T.frame.thickness),
    // Settled into the ground by `sink` rather than balanced on it.
    draw: (T, key) => (
      <group key={key} position-y={-T.sink}>
        <Trampoline config={T} />
      </group>
    ),
  },
  gachapon: {
    defaults: GACHAPON,
    top: gachaponHeightOf,
    footprint: gachaponFootprintOf,
    draw: (G, key) => <Gachapon key={key} config={G} />,
  },
  vendingMachine: {
    defaults: VENDING_MACHINE,
    top: vendingMachineHeightOf,
    footprint: vendingMachineFootprintOf,
    draw: (V, key) => <VendingMachine key={key} config={V} />,
  },
  bench: {
    defaults: BENCH,
    top: benchHeightOf,
    footprint: benchFootprintOf,
    draw: (B, key) => <Bench key={key} config={B} />,
  },
  couch: {
    defaults: COUCH,
    top: couchHeightOf,
    footprint: couchFootprintOf,
    draw: (C, key) => <Couch key={key} config={C} />,
  },
  chair: {
    defaults: CHAIR,
    top: chairHeightOf,
    footprint: chairFootprintOf,
    draw: (C, key) => <Chair key={key} config={C} />,
  },
  // A table is a SURFACE: whatever is stood within its top's edges
  // stands on its top rather than the ground (see contentsOf), and
  // nothing is kept off it, the way nothing is kept off a rug.
  table: {
    defaults: TABLE,
    top: tableHeightOf,
    footprint: tableFootprintOf,
    surface: true,
    draw: (C, key) => <Table key={key} config={C} />,
  },
  // A kitchen counter (see ../counter/), plain or with a sink in it: a
  // SURFACE, like a table, so what is stood on it stands on its top.
  counter: {
    defaults: COUNTER,
    top: counterHeightOf,
    footprint: counterFootprintOf,
    surface: true,
    draw: (C, key) => <Counter key={key} config={C} />,
  },
  // A fridge (see ../fridge/).
  fridge: {
    defaults: FRIDGE,
    top: fridgeHeightOf,
    footprint: fridgeFootprintOf,
    draw: (F, key) => <Fridge key={key} config={F} />,
  },
  // A pot plant (see ../potPlant/): a bush or flowers in a pot.
  potPlant: {
    defaults: POT_PLANT,
    top: potPlantHeightOf,
    footprint: potPlantFootprintOf,
    draw: (P, key) => <PotPlant key={key} config={P} />,
  },
  // A stick lamp (see ../lamp/): a tall one for a corner, or a short one
  // for a table.
  stickLamp: {
    defaults: STICK_LAMP,
    top: stickLampHeightOf,
    footprint: stickLampFootprintOf,
    draw: (L, key) => <StickLamp key={key} config={L} />,
  },
  capsule: {
    defaults: CAPSULE,
    top: capsuleHeightOf,
    footprint: capsuleFootprintOf,
    draw: (C, key) => <Capsule key={key} config={C} />,
  },
  house: {
    defaults: HOUSE,
    top: scaledBy(houseHeightOf),
    footprint: scaledBy(houseFootprintOf),
    draw: (H, key) => <House key={key} config={H} />,
  },
  twoStoryHouse: {
    defaults: TWO_STORY_HOUSE,
    top: scaledBy(twoStoryHouseHeightOf),
    footprint: scaledBy(twoStoryHouseFootprintOf),
    draw: (H, key) => <TwoStoryHouse key={key} config={H} />,
  },
  mushroomHouse: {
    defaults: MUSHROOM_HOUSE,
    top: scaledBy(mushroomHouseHeightOf),
    footprint: scaledBy(mushroomHouseFootprintOf),
    draw: (M, key) => <MushroomHouse key={key} config={M} />,
  },
  trailer: {
    defaults: TRAILER,
    top: scaledBy(trailerHeightOf),
    footprint: scaledBy(trailerFootprintOf),
    draw: (T, key) => <Trailer key={key} config={T} />,
  },
  cupcake: {
    defaults: CUPCAKE,
    top: scaledBy(cupcakeHeightOf),
    footprint: scaledBy(cupcakeFootprintOf),
    draw: (C, key) => <Cupcake key={key} config={C} />,
  },
  tree: {
    defaults: TREE,
    top: treeHeightOf,
    footprint: treeFootprintOf,
    draw: (T, key) => <Tree key={key} config={T} />,
  },
  // A water feature — a body of water of any kind (see WATER's `kind`),
  // lying in the ground: nothing to draw here — the
  // pools are drawn all at once, since two that touch are one (see
  // ../water/Water.jsx's Pools) — but, in the edit view, a pad its shape
  // to press on and drag by (see ../water/Pad.jsx). Its footprint is its
  // own rectangle; it stands no higher than the ground.
  waterFeature: {
    defaults: WATER,
    top: () => 0,
    footprint: (W) => ({ x: W.width / 2, z: W.length / 2 }),
    draw: (W, key, edit) => (edit ? <Pad key={key} {...W} /> : null),
  },
  // A patch of plain ground, the same: an island where it lies in a pool
  // (see ../water/pools.js).
  ground: {
    defaults: GROUND,
    top: () => 0,
    footprint: (G) => ({ x: G.width / 2, z: G.length / 2 }),
    draw: (G, key, edit) => (edit ? <Pad key={key} {...G} /> : null),
  },
  // A rug, lying on the ground for other things to stand on (see
  // ../rug/Rug.jsx): its footprint its own rectangle, but nothing keeps
  // off it (see IN_GROUND); it stands as high as it is thick.
  rug: {
    defaults: RUG,
    top: (R) => R.thickness,
    footprint: (R) => ({ x: R.width / 2, z: R.length / 2 }),
    draw: (R, key) => <Rug key={key} config={R} />,
  },
  // A wall hanging, a framed picture (see ../wallHanging/): stood up to
  // a wall and turned to face out from it, hung `hang` up. Its footprint
  // is only its thickness, so it goes flush to a wall turned any way,
  // and nothing keeps off it (see IN_GROUND).
  wallHanging: {
    defaults: WALL_HANGING,
    top: (H) => H.hang + H.height,
    footprint: (H) => round(H.thickness / 2),
    draw: (H, key) => <WallHanging key={key} config={H} />,
  },
  // One post on its own, wearing its cap. Config is POSTS.post plus `cap`
  // and `capColor` as Posts takes them. With nothing to fence its height
  // is `height`, or `headroom` off the ground where none is set.
  post: {
    defaults: { ...POSTS.post, cap: POSTS.cap, capColor: POSTS.capColor },
    top: (P) => P.height ?? P.headroom,
    footprint: (P) => round(P.baseRadius),
    draw: ({ cap, capColor, ...post }, key) => (
      <Posts
        key={key}
        stands={[LONE_STAND]}
        height={post.height ?? post.headroom}
        config={post}
        cap={cap}
        capColor={capColor}
      />
    ),
  },
};
// A round thing's footprint: as far one way as the other, and marked so,
// since a round thing wants the grass kept back in a circle, not a square
// with four bald corners past its rim.
const round = (r) => ({ x: r, z: r, round: true });
const LONE_STAND = {
  position: new THREE.Vector3(),
  quaternion: new THREE.Quaternion(),
};

// What a `type` puts in the station: its spot, how high its top stands
// above the station's ground, and how it draws.
function placeableOf(
  { type, position, rotation, config, ...stray },
  box,
  where,
) {
  // A `cap` or `color` written beside `type` instead of under `config`
  // would otherwise do nothing, quietly.
  const keys = Object.keys(stray);
  if (keys.length)
    throw new Error(
      `${where}: unknown field${keys.length > 1 ? "s" : ""} ${keys.map((k) => `"${k}"`).join(", ")} — ` +
        `an object takes \`type\`, \`position\`, \`rotation\` and \`config\`; overrides go under \`config\``,
    );
  const at = spotOf(position, box);
  const turn = eulerOf(rotation);
  // A kind that is no longer — a noun since taken out, left in a saved
  // level — stands as an empty, to be made into something else from the
  // panel, rather than taking the whole station down with it.
  if (typeof type === "string" && !NOUNS[type] && !isShape(type)) {
    console.warn(
      `${where}: no such kind of thing as "${type}" — an empty for now`,
    );
    type = "empty";
  }
  const noun = NOUNS[type];
  if (noun) {
    const C = merge(noun.defaults, config);
    return {
      type,
      at,
      turn,
      top: at.lift + noun.top(C),
      footprint: noun.footprint(C),
      // Whether it lies in the ground rather than stands on it — see
      // IN_GROUND — and whether things stand on IT (see contentsOf).
      inGround: IN_GROUND.includes(type),
      surface: noun.surface === true,
      draw: (key, edit) => noun.draw(C, key, edit),
    };
  }
  if (typeof type !== "string")
    throw new Error(
      `${where}: type must be one of ${Object.keys(NOUNS).join(", ")} or an ornament shape, got ${JSON.stringify(type)}`,
    );
  // Anything a garland could hang can stand on the ground too, lifted so
  // its lowest point meets it.
  const { color, ...spec } = config ?? {};
  const o = ornamentOf({ shape: type, ...spec }, where);
  const lift = o.radius * 2 - dropOf(o) - o.radius;
  return {
    type,
    at,
    turn,
    top: at.lift + lift + o.radius,
    footprint: round(o.radius),
    inGround: false,
    surface: false,
    draw: (key) => (
      <group key={key} position-y={lift}>
        <Ornament ornament={o} swatch={color ?? POSTS.capColor} />
      </group>
    ),
  };
}

// What stands inside, and how high the tallest of it reaches — what the
// enclosure has to clear. Anything stood within a surface's edges — a
// table's top, turned as the table is — is lifted onto it, its own lift
// on top of that; the tallest surface under it, where there are two.
function contentsOf(S) {
  const things = S.objects
    .map((o, i) => placeableOf(o, S.boundingBox, `STATION objects[${i}]`))
    .map((t, i, all) => {
      if (t.surface || t.inGround) return t;
      const under = all.filter((s) => s.surface && s !== t && onTopOf(s, t));
      if (!under.length) return t;
      const lift = Math.max(...under.map((s) => s.top));
      return {
        ...t,
        at: { ...t.at, lift: t.at.lift + lift },
        top: t.top + lift,
      };
    });
  const top = Math.max(0, ...things.map((t) => t.top));
  return { things, top };
}

// Whether `t`'s spot lies within `s`'s footprint, in `s`'s own frame —
// turned back by `s`'s own turn about its spot (`turn` is an euler
// triple, see eulerOf; its y is the turn about the ground's up).
function onTopOf(s, t) {
  const dx = t.at.x - s.at.x;
  const dz = t.at.z - s.at.z;
  const a = -s.turn[1];
  const x = dx * Math.cos(a) - dz * Math.sin(a);
  const z = dx * Math.sin(a) + dz * Math.cos(a);
  const f = s.footprint;
  return f.round ?
      Math.hypot(x, z) <= f.x
    : Math.abs(x) <= f.x && Math.abs(z) <= f.z;
}

// Every `type` a station knows, for the edit panel's dropdown.
export const NOUN_TYPES = Object.keys(NOUNS);

// What stands in a station, for the edit view: each object's spot in the
// lot (`at`, world units from the middle) and its footprint.
export const stationThings = (config) =>
  contentsOf(merge(STATION, config)).things;

// How far from the station's middle the fence reaches.
export function stationReach(config) {
  const S = merge(STATION, config);
  return Math.hypot(S.boundingBox.width / 2, S.boundingBox.length / 2);
}

// Where a station keeps the grass back: rectangles on the ground, each as
// `{ origin, frame, halfWidth, halfLength, cornerRadius }` — `origin` the
// rectangle's middle on the ball, `frame` the turn from the ball's frame
// into its own (x across, z along) — so the grass runs up to a straight
// edge round the lot. Cleared land (`cleared`), it is one: the lot itself,
// `clearing` times the box, its corners as round as the fence's and
// scaled with it, so the bare lot is the fence's own shape — a round pen
// stands on a round patch. Otherwise it is one round EACH object, fence or
// no fence, the grass growing in the lot: its own footprint padded by
// `clearing` times itself and never less than the footprint — so a machine
// always has bare ground to stand on, and the ground between two of them
// stays grass rather than one bald lot round the pair — a round object's
// patch round with it. `cornerRadius` rounds the corners of those, 0 for
// square ones. Grass only grows on the planet, so this is measured
// there.
export function stationClearings(lat, lon, config, cornerRadius = 0) {
  const S = merge(STATION, config);
  const centre = latLonDir(lat, lon);
  const frame = standOn(centre).multiply(
    new THREE.Quaternion().setFromEuler(
      new THREE.Euler(...eulerOf(S.rotation)),
    ),
  );
  // The rectangles in the station's own plane: middle and half sizes.
  const pad = (r) => Math.max(r, r * S.clearing);
  // The fence's corners in world units, the way perimeterPath reads
  // `corner`: that share of the short half-side.
  const half = { x: S.boundingBox.width / 2, z: S.boundingBox.length / 2 };
  const fenceCorner =
    Math.max(0, Math.min(1, merge(ENCLOSURE, S.enclosure).corner)) *
    Math.min(half.x, half.z);
  const rects =
    S.cleared ?
      [
        {
          mid: { x: 0, z: 0 },
          half: { x: half.x * S.clearing, z: half.z * S.clearing },
          corner: fenceCorner * S.clearing,
        },
      ]
      // Not the water, which keeps the grass off its bank its own way
      // (see ../water/pools.js), nor the ground, which is just ground.
    : contentsOf(S)
        .things.filter((t) => !t.inGround)
        .map(({ at, footprint: f }) => {
          const half = { x: pad(f.x), z: pad(f.z) };
          return {
            mid: at,
            half,
            corner: f.round ? Math.min(half.x, half.z) : cornerRadius,
          };
        });
  // Each middle, carried from the station's plane onto the ball the way
  // Station draws things: stood off the station's middle, then turned by
  // the station's rotation and its own frame on the globe.
  return rects.map(({ mid, half, corner }) => ({
    origin: standAt(mid.x, mid.z)
      .position.applyQuaternion(frame)
      .add(centre.clone().multiplyScalar(PLANET.radius)),
    frame,
    halfWidth: half.x,
    halfLength: half.z,
    cornerRadius: corner,
  }));
}

// `edit`, given, is the edit view's hold on the objects (see
// level/EditView.jsx): `onPointerDown(i, e)`, `onPointerMove(e)` and
// `onPointerUp(e)` for a press, a drag and a release on object `i`, and
// `onPointerOver(i, e)` and `onPointerOut(i, e)` for the hover; and
// `held`, the index of the object a drag is holding — or "all", the
// whole station — or null, drawn `lift` world units up off the ground
// while it is; and `invalid`, what is over
// another and cannot stay there — an object's index, or "all" for the
// whole station — worn in the invalid material while it is. The game
// passes none.
// Whatever is inside, in the invalid material while `on` — every mesh's
// own material remembered and put back after. Re-walked every render it
// is on, so a mesh rebuilt under it is caught too.
function Invalid({ on, children }) {
  const ref = useRef();
  const saved = useRef(new Map());
  useEffect(() => {
    if (!on) return;
    ref.current.traverse((o) => {
      if (o.isMesh && o.material !== INVALID_MATERIAL) {
        saved.current.set(o, o.material);
        o.material = INVALID_MATERIAL;
      }
    });
  });
  useEffect(() => {
    if (on) return;
    const restore = () => {
      saved.current.forEach((m, o) => (o.material = m));
      saved.current.clear();
    };
    restore();
    return restore;
  }, [on]);
  return <group ref={ref}>{children}</group>;
}

export default function Station({
  id = null,
  body = "planet",
  lat = 0,
  lon = 0,
  config,
  gates,
  edit = null,
}) {
  const S = useMemo(() => merge(STATION, config), [config]);
  const { things, top } = useMemo(() => contentsOf(S), [S]);
  const B = bodyOf(body);
  const ids = useMemo(
    () => things.map((_, index) => ({ station: id, index })),
    [things, id],
  );

  // Every prop on the lot casts a shadow and takes one: the lot's meshes,
  // whatever they are, flagged after each render — a prop swapped in the
  // edit view is caught the same way.
  const props = useRef();
  useEffect(() => {
    props.current?.traverse((o) => {
      if (o.isMesh) o.castShadow = o.receiveShadow = true;
    });
  });
  return (
    <>
      {/* A body of water in the lot is not drawn here: pools are made of
        every body of water at once, since two that touch are one — see
        ../water/Water.jsx's Pools. */}
      <OnPlanet body={B} lat={lat} lon={lon}>
        <group
          ref={props}
          rotation={eulerOf(S.rotation)}
          position-y={edit?.held === "all" ? edit.lift : 0}
        >
          <Invalid on={edit?.invalid === "all"}>
            {things.map(({ at, turn, draw }, i) => {
              const lift = at.lift + (edit?.held === i ? edit.lift : 0);
              const { position, quaternion } = standAt(at.x, at.z, lift, B);
              return (
                <group
                  key={i}
                  position={position}
                  quaternion={quaternion}
                  onPointerDown={edit && ((e) => edit.onPointerDown(i, e))}
                  onPointerMove={edit && ((e) => edit.onPointerMove(e))}
                  onPointerUp={edit && ((e) => edit.onPointerUp(e))}
                  onPointerOver={edit && ((e) => edit.onPointerOver(i, e))}
                  onPointerOut={edit && ((e) => edit.onPointerOut(i, e))}
                >
                  {/* Its own turn, about its own spot, on top of standing. */}
                  <Invalid on={edit?.invalid === i}>
                    <ThingContext.Provider value={ids[i]}>
                      <group rotation={turn}>{draw(i, edit != null)}</group>
                    </ThingContext.Provider>
                  </Invalid>
                </group>
              );
            })}
            {S.hasEnclosure && (
              <Enclosure
                box={S.boundingBox}
                top={top}
                config={S.enclosure}
                gates={gates}
              />
            )}
          </Invalid>
        </group>
      </OnPlanet>
    </>
  );
}
