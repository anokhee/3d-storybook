import React, { Suspense, useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

import { merge } from "../../world/merge.js";
import { solid } from "../../world/palette.js";
import { unlitMat } from "../../adjectives/unlit/material.js";
import { displayOf, windowOutline, wallWithHoles } from "../shopfront/display.js";
import { ShopfrontWindow, Glass, ShopDecoration, Awning, ShopGarland } from "../shopfront/Shopfront.jsx";
import { pavingMat } from "../../world/paving.js";
import { shopFloorOf } from "../shopfront/objects.js";
import { DWELLING } from "../house/objects.js";
import { Door } from "../house/House.jsx";
import { Arch } from "../house/Panes.jsx";
import SwingLeaf from "../shopfront/SwingLeaf.jsx";
import CafeTable, { cafeSeatTop } from "../cafeTable/CafeTable.jsx";
import { CAFE_TABLE } from "../cafeTable/objects.js";
import { placeAt } from "../tableSetting/cafePlace.jsx";
import Counter from "../counter/Counter.jsx";
import CuttingBoard from "../cuttingBoard/CuttingBoard.jsx";
import Cookpot from "../cookpot/Cookpot.jsx";
import FryingPan from "../fryingPan/FryingPan.jsx";
import Chair from "../chair/Chair.jsx";
import Table from "../table/Table.jsx";
import Rug from "../rug/Rug.jsx";
import { RUG } from "../rug/objects.js";
import StickLamp from "../lamp/StickLamp.jsx";
import Fridge from "../fridge/Fridge.jsx";
import WallClock from "../wallClock/WallClock.jsx";
import WallHanging from "../wallHanging/WallHanging.jsx";
import { wallHangingOf } from "../wallHanging/objects.js";
import PotPlant from "../potPlant/PotPlant.jsx";
import { POT_PLANT_TALL } from "../potPlant/objects.js";
import WallPlanter from "../wallPlanter/WallPlanter.jsx";
import PendantLight from "../pendantLight/PendantLight.jsx";
import MetalDoor, { archOutline } from "../metalDoor/MetalDoor.jsx";
import Crockery from "../shelving/Crockery.jsx";
import { crockery, kitchenware, swatches, CROCKERY_SCALE } from "../shelving/crockery.js";
import Curtain from "../curtain/Curtain.jsx";
import TileFloor from "../tileFloor/TileFloor.jsx";
import ShadowSpirit from "../anthro/ShadowSpirit.jsx";
import WallMailboxes from "../wallMailboxes/WallMailboxes.jsx";
import SalonChair from "../salonChair/SalonChair.jsx";
import { salonSeatTop } from "../salonChair/objects.js";
import { interiorOf, planOf, rngOf, hashOf, styleOfShop } from "./objects.js";
import { usePlaced } from "../../world/placed.js";

// ANY OBJECT OF THE CATALOG stood in the room (an "object" item: see
// world/placed.js) — the story's component, drawn from the item's `args`
// (its knobs), at its `scale`, `y` up off the floor; nothing until whoever
// shows the room has handed the catalog in. One that throws (a knob at a
// size it cannot build) draws nothing, not the whole room
export function PlacedObject({ it, S }) {
  const Story = usePlaced(it.entry);
  if (!Story) return null;
  return (
    <group position={[it.x, it.y ?? 0, it.z]} rotation-y={it.yaw ?? 0} scale={it.scale ?? S}>
      <Quiet><Suspense fallback={null}><Story args={it.args ?? {}} /></Suspense></Quiet>
    </group>
  );
}
class Quiet extends React.Component {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidUpdate(prev) { if (this.state.failed && prev.children !== this.props.children) this.setState({ failed: false }); }
  render() { return this.state.failed ? null : this.props.children; }
}

// The goods on the shelves, their own colour at any hour (as the shop
// windows' are): one merged geometry each, see shopfront/display.js
const goodsMat = new THREE.MeshBasicMaterial({ vertexColors: true });
// Shelves of goods (one merged geometry, see displayOf); or, `style`
// "cafe", the bare boards with the library's crockery set out on them (a
// café's: Mugs, Teapots and Bowls), or "kitchen", a kitchen's things (see
// ../shelving/crockery.js), at `S`.
function Goods({ g, lift = 0, S = CROCKERY_SCALE }) {
  const cafe = g.style === "cafe" || g.style === "kitchen";
  const geo = useMemo(() => displayOf(cafe ? { ...g, style: "none" } : g), [g, cafe]);
  const pieces = useMemo(() => {
    if (!cafe) return null;
    const at = { x0: g.x0 + 0.06, x1: g.x1 - 0.06, ys: g.shelves, z: g.z - g.depth / 2, S, r: rngOf(g.seed ?? 1), colors: g.colors, bowls: g.bowls };
    return g.style === "kitchen" ? kitchenware(at) : crockery({ ...at, teapots: Math.max(1, Math.round(g.shelves.length * 0.75)) });
  }, [g, cafe, S]);
  useEffect(() => () => geo.dispose(), [geo]);
  return (
    <group position-y={lift}>
      <mesh geometry={geo} material={goodsMat} castShadow />
      {pieces && <Crockery pieces={pieces} S={S} />}
    </group>
  );
}
const Slab = ({ at, size, swatch }) => (
  <mesh position={at} material={unlitMat(swatch)} castShadow receiveShadow>
    <boxGeometry args={size} />
  </mesh>
);

// A WALL from u0 to u1 along its own x, `h` tall, `depth` thick back from
// its inner face (z = 0, facing +z), with arched windows let into it at
// `at` (their middles, along x), as the plan's `win` sizes them: each with
// a frame round it on the inside, a sill, a pane of glass, and glazing bars
// dividing it in seven — six panes below the arch, two across and three
// up, the arch itself the seventh. `door`, if given ({ x, width, height, curve }), is a doorway cut
// up from the wall's foot, its head bowed (see MetalDoor's archOutline).
// `bars` false leaves the glass whole (the kitchen's). `curtain`, if given, a Curtain's config: one hung over each pair of
// windows (`at` taken two by two), its rod across both and `over` past
// them each side; a window left over on its own, one of its own.
// `cuts`, the layout's own openings in this wall (see cutsOf): windows of
// their own sizes ({ kind: "window", x, foot, w, h, top, bars }) and more
// doorways ({ kind: "door", x, width, height, curve }: a door's, an
// archway's, a room's). A wall with nothing in it is a plain slab.
const glassMat = new THREE.MeshBasicMaterial({ color: "#CFE3EA", transparent: true, opacity: 0.35, depthWrite: false, side: THREE.DoubleSide });
function WindowedWall({ u0, u1, h, depth = 0.12, at = [], win, door, cuts = [], wall, trim, curtain, bars = true }) {
  // every window, the plan's and the layout's; every doorway, left to right
  const wins = [
    ...at.map((cx) => ({ cx, foot: win.foot, w: win.w, h: win.h, top: win.top, bars })),
    ...cuts.filter((c) => c.kind === "window").map((c) => ({ cx: c.x, foot: c.foot, w: c.w, h: c.h, top: c.top, bars: c.bars })),
  ];
  const doors = [...(door ? [door] : []), ...cuts.filter((c) => c.kind === "door")].sort((a, b) => a.x - b.x);
  const key = JSON.stringify([u0, u1, h, depth, wins, doors]);
  const geos = useMemo(() => {
    const outline = new THREE.Shape().moveTo(u0, 0);
    doors.forEach((d) => archOutline(outline, d.x - d.width / 2, d.x + d.width / 2, d.height, d.curve));
    outline.lineTo(u1, 0).lineTo(u1, h).lineTo(u0, h).closePath();
    wins.forEach((w) => outline.holes.push(windowOutline(new THREE.Path(), w.cx, w.foot, w.w, w.h, w.top)));
    const body = new THREE.ExtrudeGeometry(outline, { depth, bevelEnabled: false, curveSegments: 16 });
    body.translate(0, 0, -depth);
    if (!wins.length) return { body, frame: null, pane: null };
    const f = 0.05;
    const frame = new THREE.ExtrudeGeometry(wins.map((w) => {
      const sh = windowOutline(new THREE.Shape(), w.cx, w.foot - f, w.w + 2 * f, w.h + 2 * f, w.top);
      sh.holes.push(windowOutline(new THREE.Path(), w.cx, w.foot, w.w, w.h, w.top));
      return sh;
    }), { depth: 0.03, bevelEnabled: false, curveSegments: 16 });
    const pane = new THREE.ShapeGeometry(wins.map((w) => windowOutline(new THREE.Shape(), w.cx, w.foot, w.w, w.h, w.top)), 16);
    pane.translate(0, 0, -depth / 2);
    return { body, frame, pane };
  }, [key]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => () => Object.values(geos).forEach((g) => g?.dispose()), [geos]);
  // the curtains: each pair's middle and its rod's config, as wide as it
  const rods = useMemo(() => {
    if (!curtain || !win) return [];
    const out = [];
    for (let i = 0; i < at.length; i += 2) {
      const a = at[i], b = at[i + 1] ?? at[i];
      out.push({ x: (a + b) / 2, config: { ...curtain, width: Math.abs(b - a) + win.w + 2 * curtain.over } });
    }
    return out;
  }, [curtain, at.join(","), win?.w]); // eslint-disable-line react-hooks/exhaustive-deps
  const bar = 0.03;
  return (
    <group>
      <mesh geometry={geos.body} material={unlitMat(wall)} castShadow receiveShadow />
      {geos.frame && <mesh geometry={geos.frame} material={unlitMat(trim)} />}
      {geos.pane && <mesh geometry={geos.pane} material={glassMat} />}
      {rods.map((c) => <group key={c.x} position={[c.x, c.config.rodHeight, 0.13]}><Curtain config={c.config} /></group>)}
      {wins.map((w, i) => {
        // the glazing bars: one up the middle to where the arch springs, two
        // across a third and two thirds of the way up, one across at the spring
        const spring = w.foot + w.h - (w.w / 2) * Math.min(1, w.top);
        return (
          <group key={i}>
            <Slab at={[w.cx, w.foot - 0.07, 0.05]} size={[w.w + 0.2, 0.04, 0.1]} swatch={trim} />
            {w.bars && (
              <>
                <Slab at={[w.cx, (w.foot + spring) / 2, -depth / 2]} size={[bar, spring - w.foot, 0.04]} swatch={trim} />
                {[1 / 3, 2 / 3].map((f) => <Slab key={f} at={[w.cx, w.foot + (spring - w.foot) * f, -depth / 2]} size={[w.w, bar, 0.04]} swatch={trim} />)}
                <Slab at={[w.cx, spring, -depth / 2]} size={[w.w, bar, 0.04]} swatch={trim} />
              </>
            )}
          </group>
        );
      })}
    </group>
  );
}

// WHAT THE LAYOUT LETS INTO THE WALLS — its "door", "arch", "window" and
// "room" items (see Furniture), each stood on a wall's middle plane, turned
// to face into the room (the editor's "to the wall"): which wall each is
// in, and the opening to cut there, as the wall measures it (a side wall's
// u runs along z: see ShopInterior's side walls). `back` the back wall's,
// `[-1]` and `[1]` the left and right walls'; an item within `near` of a
// wall's middle. A door's and an archway's opening is its own size, a
// room's its `opening`; a window's is its `w` by `h` from `y` up
function cutsOf(items, W, zb, near = 0.25) {
  const out = { back: [], [-1]: [], [1]: [] };
  const cut = (it, x) => (it.t === "window"
    ? { kind: "window", x, foot: it.y, w: it.w, h: it.h, top: it.top, bars: !!it.bars }
    : it.t === "room"
      ? { kind: "door", x, width: it.opening.width, height: it.opening.height, curve: it.opening.curve }
      : { kind: "door", x, width: it.width, height: it.height, curve: it.curve });
  for (const it of items) {
    if (!WALL_KINDS.has(it.t)) continue;
    if (Math.abs(it.z - (zb - 0.06)) < near) out.back.push(cut(it, it.x));
    else if (Math.abs(it.x + (W / 2 - 0.06)) < near) out[-1].push(cut(it, -it.z));
    else if (Math.abs(it.x - (W / 2 - 0.06)) < near) out[1].push(cut(it, it.z));
  }
  return out;
}
const WALL_KINDS = new Set(["door", "arch", "window", "room"]);

// A DOOR IN A WALL (a "door" item): a Metal Door (Fixtures/Doors/Metal
// Door) hung in a doorway `width` by `height`, its head bowed by `curve`,
// framed in the shop's trim — the wall it stands in cut round it (see
// cutsOf: the item's foot on the wall's middle, turned to face into the
// room). Shut, or swung `open` (-1 to 1); it leads nowhere, as a café's kitchen door does
function WallDoor({ it, C }) {
  const door = useMemo(() => ({ width: it.width, height: it.height, curve: it.curve, open: it.open ?? 0, wall: 0.12, hinge: 1, frame: { color: C.colors.trim } }), [it.width, it.height, it.curve, it.open, C.colors.trim]);
  return <group position={[it.x, 0, it.z]} rotation-y={it.yaw ?? 0}><MetalDoor config={door} /></group>;
}
// A ROOM THROUGH A WALL (a "room" item): behind the wall it stands in, out
// through an opening cut there (`opening`: `width`, `height`, `curve`; a
// Metal Door hung in it if `door`), a room `width` across and `deep` back,
// `height` tall (the shop's, unless set), its floor in `floor` (the shop's
// floor colour, unless set) and its walls in the shop's room colour — its
// own back and side walls, the shop's wall its front. In the item's frame:
// its foot on the wall's middle plane, facing into the shop (+z), the room
// running back along -z. On the back wall of a shop with no kitchen, the
// street's walker goes through (planOf puts it in `room.kitchen`)
function WallRoom({ it, C, h, floor }) {
  const W = it.width, D = it.deep, H = it.height ?? h, t = 0.12, z0 = -0.06, zb = z0 - D;
  const door = useMemo(() => (it.door ? { width: it.opening.width, height: it.opening.height, curve: it.opening.curve, open: it.open ?? 0, wall: t, hinge: 1, frame: { color: C.colors.trim } } : null), [it.door, it.opening, it.open, C.colors.trim]);
  return (
    <group position={[it.x, 0, it.z]} rotation-y={it.yaw ?? 0}>
      {door && <MetalDoor config={door} />}
      <Slab at={[0, 0.0075, (z0 + zb) / 2]} size={[W, 0.015, D]} swatch={solid(it.floor ?? floor)} />
      <Slab at={[0, H / 2, zb - t / 2]} size={[W + 2 * t, H, t]} swatch={C.colors.room} />
      {[-1, 1].map((e) => <Slab key={e} at={[e * (W / 2 + t / 2), H / 2, (z0 + zb) / 2]} size={[t, H, D]} swatch={C.colors.room} />)}
    </group>
  );
}

// THE CAFÉ'S STAFF: shadow spirits, as the crowd on the street (Characters/
// Anthropomorphic/Shadow Spirit). The host stood still behind the host
// stand; the chef, in a chef's hat and apron (the Shadow Spirit's "chef"
// outfit), pacing the kitchen from end to end at
// `pace`, stopping at each end a while to see to the counters.
const STANDING = { pose: "stand", animate: false };
const WALKING = { pose: "walk", animate: true };
const CHEF_WALKING = { ...WALKING, outfit: "chef" }, CHEF_STANDING = { ...STANDING, outfit: "chef" };
const SITTING = { pose: "sit", animate: false };
function Host({ it, look }) {
  return <group position={[it.x, 0, it.z]} rotation-y={it.yaw}><ShadowSpirit config={STANDING} lookAt={look} /></group>;
}
function Chef({ it, look }) {
  const me = useRef(), walk = useRef(), still = useRef();
  const st = useMemo(() => {
    const r = rngOf(it.seed);
    return { r, x: it.x0 + (it.x1 - it.x0) * r(), dir: r() < 0.5 ? -1 : 1, wait: 0 };
  }, [it]);
  useFrame((_, dt) => {
    if (!me.current) return;
    dt = Math.min(dt, 0.1);
    let yaw;
    if (st.wait > 0) {
      st.wait -= dt;
      yaw = Math.PI; // to the counters
    } else {
      st.x += st.dir * it.pace * dt;
      if ((st.dir > 0 && st.x >= it.x1) || (st.dir < 0 && st.x <= it.x0)) {
        st.x = THREE.MathUtils.clamp(st.x, it.x0, it.x1);
        st.dir = -st.dir;
        st.wait = 1.2 + st.r() * 1.8;
      }
      yaw = st.dir * Math.PI / 2;
    }
    me.current.position.x = st.x;
    let d = yaw - me.current.rotation.y;
    d = Math.atan2(Math.sin(d), Math.cos(d));
    me.current.rotation.y += d * Math.min(1, dt * 10);
    if (walk.current) walk.current.visible = st.wait <= 0;
    if (still.current) still.current.visible = st.wait > 0;
  });
  return (
    <group ref={me} position={[st.x, 0, it.z]}>
      <group ref={walk}><ShadowSpirit config={CHEF_WALKING} lookAt={look} /></group>
      <group ref={still} visible={false}><ShadowSpirit config={CHEF_STANDING} lookAt={look} /></group>
    </group>
  );
}

const burnerMat = new THREE.MeshBasicMaterial({ color: "#2B2B2E" });

// A SALON'S MIRROR: let into a wall (its face at z = 0, facing +z), a tall
// mirror with rounded top corners in a frame of the shop's trim, a shelf
// under it with bottles along it (`g`, the shop's goods)
const mirrorGlass = solid("#D9E4EA"), mirrorShine = solid("#F2F6F8");
function Mirror({ it, C }) {
  const w = 0.75, mh = 1.05, foot = 1.0, f = 0.05;
  return (
    <group position={[it.x, 0, it.z]} rotation-y={it.yaw}>
      <Slab at={[0, foot + mh / 2, 0.012]} size={[w + 2 * f, mh + 2 * f, 0.024]} swatch={C.colors.trim} />
      <Slab at={[0, foot + mh / 2, 0.026]} size={[w, mh, 0.006]} swatch={mirrorGlass} />
      <Slab at={[-w * 0.18, foot + mh * 0.62, 0.03]} size={[0.05, mh * 0.5, 0.002]} swatch={mirrorShine} />
      <Slab at={[0, 0.8, 0.12]} size={[w + 0.15, 0.04, 0.24]} swatch={C.colors.trim} />
      <Goods g={it.g} lift={-0.03} />
    </group>
  );
}
// A WASH BASIN: a salon's, against a wall (at z = 0, facing +z): a dark
// cabinet, a white bowl let into its top at the front, a chrome tap
const basinCab = solid("#2F2A36"), basinBowl = solid("#F7F4EE"), basinTap = solid("#C9CED6");
function Basin({ it }) {
  return (
    <group position={[it.x, 0, it.z]} rotation-y={it.yaw}>
      <Slab at={[0, 0.45, 0.22]} size={[0.7, 0.9, 0.44]} swatch={basinCab} />
      <mesh position={[0, 0.9, 0.3]} scale={[1, 0.55, 1]} rotation-x={Math.PI} material={unlitMat(basinBowl)}>
        <sphereGeometry args={[0.26, 20, 10, 0, Math.PI * 2, 0, Math.PI / 2]} />
      </mesh>
      <mesh position={[0, 0.92, 0.3]} rotation-x={Math.PI / 2} material={unlitMat(basinBowl)}><torusGeometry args={[0.26, 0.03, 8, 24]} /></mesh>
      <Slab at={[0, 1.02, 0.08]} size={[0.04, 0.22, 0.04]} swatch={basinTap} />
      <Slab at={[0, 1.12, 0.15]} size={[0.04, 0.04, 0.16]} swatch={basinTap} />
    </group>
  );
}

// A LIFT'S DOORS: a lobby's, let into a side wall (its face at z = 0,
// facing +z): two brushed-steel doors meeting in the middle in a brass
// surround, a little brass dial over them with its pointer on a floor,
// and beside them a brass plate with the call buttons, up and down, lit
const liftSteel = solid("#AEB6BF"), liftSeam = solid("#4A515A"), liftBrass = solid("#C9A45C"), liftGlow = solid("#FFE08A"), liftDial = solid("#F2E9DC");
function Elevator({ it }) {
  const w = 1.0, dh = 2.0, f = 0.09, out = 0.04;
  return (
    <group position={[it.x, 0, it.z]} rotation-y={it.yaw}>
      {/* the surround: up both sides and across the top */}
      {[-1, 1].map((e) => <Slab key={e} at={[e * (w / 2 + f / 2), (dh + f) / 2, out / 2]} size={[f, dh + f, out]} swatch={liftBrass} />)}
      <Slab at={[0, dh + f / 2, out / 2]} size={[w + 2 * f, f, out]} swatch={liftBrass} />
      {/* the two doors, a dark seam where they meet */}
      {[-1, 1].map((e) => <Slab key={`d${e}`} at={[e * w / 4, dh / 2, 0.012]} size={[w / 2 - 0.006, dh, 0.024]} swatch={liftSteel} />)}
      <Slab at={[0, dh / 2, 0.026]} size={[0.012, dh, 0.004]} swatch={liftSeam} />
      {/* the dial over them: a brass half-round, its cream face, its pointer */}
      <group position={[0, dh + f + 0.13, 0.01]}>
        <mesh rotation-x={Math.PI / 2} material={unlitMat(liftBrass)}><cylinderGeometry args={[0.16, 0.16, 0.02, 24, 1, false, -Math.PI / 2, Math.PI]} /></mesh>
        <mesh position-z={0.012} rotation-x={Math.PI / 2} material={unlitMat(liftDial)}><cylinderGeometry args={[0.13, 0.13, 0.01, 24, 1, false, -Math.PI / 2, Math.PI]} /></mesh>
        <Slab at={[0.03, 0.05, 0.02]} size={[0.012, 0.11, 0.006]} swatch={liftSeam} />
      </group>
      {/* the call buttons, by the right-hand side of the surround */}
      <group position={[w / 2 + f + 0.14, 1.05, 0]}>
        <Slab at={[0, 0, 0.01]} size={[0.1, 0.22, 0.02]} swatch={liftBrass} />
        {[0.05, -0.05].map((y) => <mesh key={y} position={[0, y, 0.025]} rotation-x={Math.PI / 2} material={unlitMat(liftGlow)}><cylinderGeometry args={[0.022, 0.022, 0.015, 12]} /></mesh>)}
      </group>
    </group>
  );
}

// A COOLER: a convenience store's glass-door fridge of drinks, `len` long,
// `h` tall, `d` deep, its back against a wall (at z = 0, facing +z): a pale
// cabinet open at the front, shelves of bottles and cans inside, a glass
// front in doors about half a metre wide, each with its handle, a lit
// strip along the top in the shop's sign colour, a dark kick plate under
const coolerGlass = new THREE.MeshBasicMaterial({ color: "#D6ECF5", transparent: true, opacity: 0.2, depthWrite: false });
const DRINKS = ["#E5484D", "#3B6E8F", "#F2C94C", "#6FA35A", "#F2A7C3", "#F7F4EE", "#E8A93B", "#7FA7C9"];
const coolerBody = solid("#E9ECEE"), coolerFrame = solid("#5E6670");
function Cooler({ it, C }) {
  const { len, h, d } = it, t = 0.04, n = Math.max(1, Math.round(len / 0.5)), dw = len / n, top = 0.22, kick = 0.12;
  const g = useMemo(() => ({ x0: -len / 2 + t + 0.02, x1: len / 2 - t - 0.02, z: d - 0.1, depth: d - 0.16, shelves: [0.2, 0.6, 1.0, 1.4].filter((y) => y < h - top - 0.25), style: "bottles", colors: DRINKS, wood: "#C9CED6", seed: it.seed, legs: false }), [len, h, d, it.seed]);
  const gh = h - top - kick; // the glass's height
  return (
    <group position={[it.x, 0, it.z]} rotation-y={it.yaw}>
      <Slab at={[0, h / 2, t / 2]} size={[len, h, t]} swatch={coolerBody} />
      {[-1, 1].map((e) => <Slab key={e} at={[e * (len / 2 - t / 2), h / 2, d / 2]} size={[t, h, d]} swatch={coolerBody} />)}
      <Slab at={[0, h - top / 2, d / 2]} size={[len, top, d]} swatch={coolerBody} />
      <Slab at={[0, h - top / 2, d + 0.006]} size={[len - 0.06, top * 0.55, 0.012]} swatch={C.colors.sign} />
      <Slab at={[0, kick / 2, d / 2]} size={[len, kick, d]} swatch={coolerFrame} />
      <Goods g={g} />
      <mesh position={[0, kick + gh / 2, d - 0.01]} material={coolerGlass}><planeGeometry args={[len - 2 * t, gh]} /></mesh>
      {Array.from({ length: n + 1 }, (_, i) => <Slab key={`m${i}`} at={[-len / 2 + i * dw, kick + gh / 2, d - 0.01]} size={[0.035, gh, 0.03]} swatch={coolerFrame} />)}
      {Array.from({ length: n }, (_, i) => <Slab key={`h${i}`} at={[-len / 2 + (i + 1) * dw - 0.07, kick + gh * 0.5, d + 0.02]} size={[0.02, 0.35, 0.025]} swatch={coolerFrame} />)}
    </group>
  );
}

// WHOEVER SITS IN A CAFÉ CHAIR, and the place laid for them. `seat(key,
// top)`, if given, says who (the street's own sitters); without it, a
// shadow spirit sits there at the `diners` chance, the same each time by
// the chair's `key` and the shop's `seed`. Someone sat there, a Table
// Setting (Food/Kitchen/Table Setting) is laid in front of them on the
// tabletop; an empty chair, none. In the chair's frame, in world units
// (see CafeTable's `seat`). Called as a function (not a component), so a
// chair nobody sits in gets nothing at all.
function Diner({ key, seat, diners = 0, seed = 1, theme }) {
  const top = cafeSeatTop();
  const who = seat ? seat(key, top)
    : rngOf(hashOf(`${seed}:${key}`))() < diners ? <group position={[0, top, -0.04]}><ShadowSpirit config={SITTING} /></group> : null;
  if (!who) return null;
  return placeAt(who, key, theme);
}

// One piece of the furniture, from the plan (planOf). The library's
// furniture at `S` (the interior's scale); `seat(key, top)` for the stools
// and chairs someone could sit on (see ShopInterior). Drawn again only when
// its own item changes (by content: the plan makes every item anew each
// time a layout moves one, and a shelf of books is not rebuilt for a table
// dragged across the room)
const Furniture = React.memo(FurnitureOf, (a, b) =>
  a.C === b.C && a.S === b.S && a.glow === b.glow && a.shadeGlow === b.shadeGlow && a.seat === b.seat && a.diners === b.diners && a.seed === b.seed && a.look === b.look && a.h === b.h && a.floor === b.floor
  && (a.it === b.it || JSON.stringify(a.it) === JSON.stringify(b.it)));
function FurnitureOf({ it, C, S, glow, shadeGlow, seat, diners, seed, look, h, floor }) {
  const scaled = (child) => <group position={[it.x, 0, it.z]} rotation-y={it.yaw ?? 0}><group scale={S}>{child}</group></group>;
  switch (it.t) {
    case "counter":
      return scaled(<Counter config={{ under: it.under ?? "plain", body: { width: it.w }, colors: { body: C.colors.trim, top: solid("#F2E9DC") } }} />);
    case "kcounter":
      // a café's: the one by the front in its trim, the kitchen's pale; a
      // stove's rings on top of one, a pot and a pan on them
      return scaled(
        <>
          <Counter config={{ kind: it.kind ?? "plain", under: it.under ?? "plain", body: { width: it.w }, colors: it.front ? { body: C.colors.furniture ?? C.colors.trim, top: solid("#F2E9DC") } : { body: solid("#E8E1D6"), top: solid("#B9B2A8") } }} />
          {it.stove && [-1, 1].flatMap((a) => [-1, 1].map((b) => (
            <mesh key={`${a}${b}`} position={[a * it.w / 4, 2.62, b * 0.45]} material={burnerMat}>
              <cylinderGeometry args={[0.34, 0.34, 0.06, 20]} />
            </mesh>
          )))}
          {/* on the rings (Food/Kitchen/Cookpot, Frying Pan): a pot at the
              back left, a pan at the front right, its handle out to the side */}
          {it.pot && <group position={[-it.w / 4, 2.65, -0.45]}><Cookpot /></group>}
          {it.pan && <group position={[it.w / 4, 2.65, 0.45]} rotation-y={-0.5}><FryingPan /></group>}
        </>
      );
    case "board":
      // a cutting board on a kitchen worktop
      return <group position={[it.x, it.y, it.z]} scale={S}><CuttingBoard /></group>;
    case "dishes":
      // the crockery (see crockery in objects.js), on bare shelves of its own if it has them
      return (
        <group position={[it.x, it.lift ?? 0, it.z]} rotation-y={it.yaw ?? 0}>
          {it.boards && <Goods g={it.boards} />}
          <Crockery pieces={it.pieces} S={S} />
        </group>
      );
    case "host":
      return <Host it={it} look={look} />;
    case "chef":
      return <Chef it={it} look={look} />;
    case "keeper":
      // a stool behind the counter, facing the shop, and whoever sits on it
      return (
        <group position={[it.x, 0, it.z]}>
          <group scale={S}><Chair config={{ colors: { seat: C.colors.door, frame: C.colors.furniture ?? C.colors.trim } }} /></group>
          {seat?.("keeper", cafeSeatTop(S))}
        </group>
      );
    case "cafe":
      return (
        <group position={[it.x, 0, it.z]} rotation-y={it.yaw}>
          <CafeTable config={{ table: { top: C.colors.wall, leg: C.colors.trim }, chairs: { count: it.chairs, color: C.colors.door, legColor: C.colors.furniture ?? C.colors.trim } }}
            seat={(c) => Diner({ key: `${it.key}-${c}`, seat, diners, seed, theme: C.goods })} />
        </group>
      );
    case "goods":
      return <group position={[it.x, 0, it.z]} rotation-y={it.yaw}><Goods g={it.g} lift={it.lift} S={S} /></group>;
    case "plant":
      return scaled(<PotPlant config={{ pot: { color: solid(it.pot) }, plant: { kind: it.kind, size: 0.35 * it.size, ...(it.color ? { color: solid(it.color) } : {}) }, stems: { height: 0.9 * it.size } }} />);
    case "table":
      return scaled(<Table config={{ top: { width: it.w, length: it.l, color: C.colors.wall }, legs: { color: C.colors.trim } }} />);
    case "rug":
      // a rug; or `rug` over it (a welcome mat: its own colour, corners, pattern)
      return scaled(<Rug config={merge(RUG, { width: it.w, length: it.l, ...(it.rug ?? {}), color: it.rug?.color ? solid(it.rug.color) : C.colors.awning })} />);
    case "mailboxes":
      // a wall of them (Furniture/Wall Decor/Wall Mailboxes), its foot a little under knee height
      return scaled(<WallMailboxes config={{ ...it.cfg, hang: (it.hang ?? 0.85) / S }} />);
    case "cooler":
      return <Cooler it={it} C={C} />;
    case "elevator":
      return <Elevator it={it} />;
    case "mirror":
      return <Mirror it={it} C={C} />;
    case "basin":
      return <Basin it={it} />;
    case "salon": {
      // a salon chair (Furniture/Seating/Salon Chair) in the shop's dark
      // upholstery, tipped back `lean` at a basin; someone in it now and
      // then: whoever `seat` gives (the street's), else a spirit at the
      // `diners` chance
      const cfg = { colors: { cushion: C.colors.door, piping: C.colors.trim }, ...(it.lean ? { back: { lean: it.lean } } : {}), ...(it.dryer ? { dryer: { on: true, ceiling: it.dryer, color: C.colors.wall } } : {}) };
      const top = salonSeatTop() * S;
      const who = seat ? seat(it.key, top) : rngOf(hashOf(`${seed}:${it.key}`))() < diners ? <group position-y={top}><ShadowSpirit config={SITTING} /></group> : null;
      return (
        <group position={[it.x, 0, it.z]} rotation-y={it.yaw}>
          <group scale={S}><SalonChair config={cfg} /></group>
          {who}
        </group>
      );
    }
    case "chair":
      return scaled(<Chair config={{ seat: { width: 2.2 }, colors: { seat: C.colors.awning, frame: C.colors.trim } }} />);
    case "lamp":
      return scaled(<StickLamp config={{}} />);
    case "fridge":
      return scaled(<Fridge config={{}} />);
    case "clock":
      return scaled(<WallClock config={{ hang: it.y / S, radius: 0.9, run: true }} />);
    case "hanging":
      // its kind's own (see wallHangingOf), framed in the shop's trim; a
      // shape in its sign's colour
      return scaled(<WallHanging config={wallHangingOf(it.art ?? "shape", { hang: it.y / S, frame: { color: C.colors.trim }, ...(it.art && it.art !== "shape" ? {} : { art: { color: C.colors.sign } }) })} />);
    case "tall":
      // a tall pot plant (Furniture/Pot Plants/Pot Plant, Tall), a little
      // over the Human's height
      return <group position={[it.x, 0, it.z]} rotation-y={it.x * 3 + it.z}><group scale={S * 1.25}><PotPlant config={merge(POT_PLANT_TALL, { pot: { color: solid(it.pot) }, ...(it.leaves ? { plant: { color: solid(it.leaves) } } : {}), ...(it.stem ? { stems: { color: solid(it.stem) } } : {}) })} /></group></group>;
    case "planter":
      // a wall planter, in the shop's trim and furniture colours
      return scaled(<WallPlanter config={{ hang: it.y / S, brackets: { color: C.colors.trim }, plate: { color: C.colors.furniture ?? C.colors.door },
        box: { color: C.colors.trim, flowers: { kind: it.kind, count: it.kind === "ivy" ? 3 : 4 }, ivy: { seed: it.seed } } }} />);
    case "door":
      return <WallDoor it={it} C={C} />;
    case "object":
      return <PlacedObject it={it} S={S} />;
    case "arch":
    case "window":
      return null; // (the wall it stands in is cut round it: see cutsOf)
    case "room":
      return <WallRoom it={it} C={C} h={h} floor={floor} />;
    case "light":
      return (
        <group position={[it.x, it.y, it.z]}>
          <PendantLight config={{ glow, shade: { on: true, brightness: shadeGlow }, colors: { cord: C.colors.trim, bulb: C.colors.lamp, shade: C.colors.lamp } }} />
        </group>
      );
    default: return null;
  }
}

// A café's back wall: its windows (one big plain one, `pass`, in a
// standard or double café; none in a tiny one), and the doorway through to the
// kitchen, arched, with a Metal Door hung in it (Fixtures/Doors/Metal
// Door: a swing door, its moulding round it in the café's trim) — closed,
// or eased as `swing` says (a ref, -1 to 1: 1 wide open into the kitchen)
function Back({ R, C, W, zb, h, swing, curtain, cuts }) {
  const k = R.kitchen, wallIn = W / 2 - 0.12, hinge = Math.sign(k.doorX) || 1;
  const arch = useMemo(() => ({ x: k.doorX, width: k.doorW, height: k.doorH, curve: 1 }), [k.doorX, k.doorW, k.doorH]);
  const door = useMemo(() => ({ width: k.doorW, height: k.doorH, curve: 1, wall: 0.12, hinge, frame: { color: C.colors.trim } }), [k.doorW, k.doorH, hinge, C.colors.trim]);
  return (
    <>
      <group position={[0, 0, zb]}>
        {R.windows.pass
          ? <WindowedWall u0={-wallIn} u1={wallIn} h={h} at={R.windows.pass.at} win={R.windows.pass} door={arch} cuts={cuts} wall={C.colors.room} trim={C.colors.windows ?? C.colors.trim} bars={false} />
          : <WindowedWall u0={-wallIn} u1={wallIn} h={h} at={R.windows.back} win={R.windows} door={arch} cuts={cuts} wall={C.colors.room} trim={C.colors.windows ?? C.colors.trim} curtain={curtain} bars={R.windows.bars} />}
      </group>
      <group position={[k.doorX, 0, zb - 0.06]}>
        <MetalDoor config={door} swing={swing} />
      </group>
    </>
  );
}

// A Tile Floor's config `width` by `length`, made once for each (so the
// floor is not laid again on every draw)
const floors = new WeakMap();
function floorOf(cfg = {}, width, length) {
  if (!floors.has(cfg)) floors.set(cfg, new Map());
  const m = floors.get(cfg), k = `${width},${length}`;
  if (!m.has(k)) m.set(k, { ...cfg, width, length });
  return m.get(k);
}

// The kitchen behind a café: its tiled floor (a checker), its side walls running on
// from the café's, and its own back wall
function Kitchen({ R, C, W, D, h, tiles }) {
  const KD = R.kitchen.KD, KW = R.kitchen.W ?? W; // its own width: a tiny café's is narrower than the room
  return (
    <>
      <group position-z={-D - KD / 2 + 0.01}><TileFloor config={floorOf(tiles, KW - 0.02, KD)} /></group>
      {[-1, 1].map((e) => <Slab key={e} at={[e * (KW / 2 - 0.06), h / 2, -D - KD / 2]} size={[0.12, h, KD]} swatch={C.colors.room} />)}
      <group position={[0, 0, R.kitchen.zb]}>
        <WindowedWall u0={-(KW / 2 - 0.12)} u1={KW / 2 - 0.12} h={h} at={R.kitchen.windows.at} win={R.kitchen.windows} wall={C.colors.room} trim={C.colors.windows ?? C.colors.trim} bars={false} />
      </group>
    </>
  );
}

// THE FRONT, from inside: the shop floor's front as the Shopfront has it
// from the street (its `F`, shopFloorOf) — the pilasters, the piers, the
// low stall walls, the wall round the shop windows with the library's
// window in each (see-through glass, its frame and moulding, as outside),
// and the doorway: its step and, over a House Door, the fanlight and the
// panelling up to the sign; round an Arched Door, panelling with the
// arch cut through it. The door itself (the same door as outside) swung
// open inward on its hinge. No goods in the windows: the room is behind.
const frontMat = (c) => unlitMat(c);
function Front({ C, F, h, doorX, doorW, swing }) {
  const P = C.body.pilaster, rec = C.body.recess, pier = C.body.pier, step = 0.08, t = 0.07;
  const { stretches, piers, slots, stall, show, showFoot, showH, hinge } = F;
  const arched = C.door.style === "arched", dh = C.door.height;
  const aw = doorW - 0.22, aH = dh + 0.15; // an Arched Door's leaf, as Shopfront sizes it
  const glass = useMemo(() => ({ light: show.glassLight, color: C.colors.glass }), [show.glassLight, C.colors.glass]);
  const key = JSON.stringify([stretches, slots, stall, h, rec, showFoot, showH, show.topCurve, show.bottomCurve, arched, doorX, doorW, aw, aH]);
  const geos = useMemo(() => {
    const walls = stretches.map((z) => wallWithHoles(z.x0, z.x1, stall, h, rec, slots.filter((o) => o.x > z.x0 && o.x < z.x1)
      .map((o) => ({ cx: o.x, foot: showFoot, w: o.w, h: showH, top: show.topCurve, bottom: show.bottomCurve }))));
    let arch = null;
    if (arched) {
      const x0 = doorX - doorW / 2, x1 = doorX + doorW / 2, shape = new THREE.Shape().moveTo(x0, 0);
      archOutline(shape, doorX - aw / 2, doorX + aw / 2, step + aH, 1);
      shape.lineTo(x1, 0).lineTo(x1, h).lineTo(x0, h).closePath();
      arch = new THREE.ExtrudeGeometry(shape, { depth: 0.04, bevelEnabled: false, curveSegments: 20 });
    }
    return { walls, arch };
  }, [key]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => () => { geos.walls.forEach((g) => g.dispose()); geos.arch?.dispose(); }, [geos]);
  const doorTop = step + dh, fan = arched ? 0 : Math.min(C.door.fanlight, h - doorTop - 0.05);
  const panelFrom = doorTop + Math.max(0, fan) + t;
  const knob = { ...DWELLING.door.knob, radius: 0.06 };
  return (
    <group>
      {/* the pilasters (the whole corner, ahead of the side walls), the piers,
          the stall walls under the glass, the wall round the windows */}
      {[-1, 1].map((e) => <Slab key={`p${e}`} at={[e * (F.W / 2 - P / 2), h / 2, -rec / 2]} size={[P, h, rec]} swatch={C.colors.trim} />)}
      {piers.map((x, k) => <Slab key={`pier${k}`} at={[x, h / 2, -rec / 2]} size={[pier, h, rec]} swatch={C.colors.trim} />)}
      {stretches.map(({ x0, x1 }, k) => <Slab key={`stall${k}`} at={[(x0 + x1) / 2, stall / 2, -rec / 2]} size={[x1 - x0, stall, rec]} swatch={C.colors.trim} />)}
      {geos.walls.map((g, k) => <mesh key={`wall${k}`} geometry={g} material={frontMat(C.colors.wall)} castShadow receiveShadow />)}
      {slots.map((o, i) => (
        <group key={`win${i}`} position={[o.x, showFoot, 0]}>
          <ShopfrontWindow width={o.w} height={showH} look={show} trim={C.colors.frame ?? C.colors.trim} glass={glass} />
        </group>
      ))}
      {/* the doorway: its step, then what is over the door or round it */}
      <Slab at={[doorX, step / 2, -rec / 2]} size={[doorW, step, rec]} swatch={C.colors.trim} />
      {arched ? (
        <mesh geometry={geos.arch} material={frontMat(C.colors.trim)} position-z={-rec - 0.005} castShadow />
      ) : (
        <>
          {fan > 0.1 && (
            <>
              <Glass x={doorX} y={doorTop + fan / 2} z={-rec + 0.05} w={doorW} h={fan} color={C.colors.glass} />
              <Slab at={[doorX, doorTop + t / 2, -rec + 0.06]} size={[doorW, t, t]} swatch={C.colors.trim} />
              <Slab at={[doorX, doorTop + fan + t / 2, -rec + 0.06]} size={[doorW, t, t]} swatch={C.colors.trim} />
            </>
          )}
          {h - panelFrom > 0.02 && <Slab at={[doorX, (panelFrom + h) / 2, -rec + 0.02]} size={[doorW, h - panelFrom, 0.04]} swatch={C.colors.trim} />}
        </>
      )}
      {/* the door, open inward on its hinge (the side away from its knob) */}
      {arched ? (
        <group position={[doorX, step + aH / 2, -rec - 0.01]}>
          <SwingLeaf hinge={hinge} width={aw} swing={swing} open={1}>
            <Arch config={{ width: aw, height: aH, depth: 0.08, detail: 1.5, clay: null, frame: null,
              knob: { radius: 0.06, side: -hinge * 0.6, color: knob.color }, color: C.colors.door }} />
          </SwingLeaf>
        </group>
      ) : (
        <group position={[doorX, step, -rec + 0.01]}>
          <SwingLeaf hinge={hinge} width={doorW - 0.08} swing={swing} open={1}>
            <Door face={0} D={{ ...DWELLING.door, width: doorW - 0.08, height: dh, depth: 0.08, knob: { ...knob, side: -hinge * 0.7 }, color: C.colors.door }} />
          </SwingLeaf>
        </group>
      )}
    </group>
  );
}

// OUT FRONT, as the street has it: a strip of its pavement (the library's
// paving, world/paving.js) the front's width, `outside.depth` deep and
// `outside.thick` down from its top;
// on it the shop's decoration (window boxes, a bench, café tables: see
// ShopDecoration); and over the doorway and windows its awning, on a slim
// strip of the sign band to hang from (not the whole band: it would hide
// the room from a camera looking in over the front), and its garland of
// lights along the awning's edge (or the front's top, without one) — in
// the shop's street colours (a café's or florist's style's `front`, not its room's).
function Outside({ I, C, F, h, cafeSeat }) {
  const O = I.outside, P = C.body.pilaster;
  const S = useMemo(() => {
    const St = styleOfShop(I);
    return St?.front ? { ...C, colors: { ...C.colors, ...St.front } } : C;
  }, [I, C]);
  const deco = F.show.decoration && F.show.decoration !== "none";
  const band = S.awning.lift + 0.06;
  return (
    <group>
      <mesh position={[0, 0.015 - O.thick / 2, O.depth / 2]} material={pavingMat(O.pavement, F.W, O.depth)} receiveShadow>
        <boxGeometry args={[F.W, O.thick, O.depth]} />
      </mesh>
      {deco && <ShopDecoration S={S} F={F} cafeSeat={cafeSeat} />}
      {S.awning.on && (
        <>
          <Slab at={[0, h + band / 2, -C.body.recess / 2 + 0.02]} size={[F.W, band, C.body.recess + 0.04]} swatch={S.colors.trim} />
          <group position={[0, h + S.awning.lift, 0.04]}>
            <Awning w={F.W - 2 * P} A={S.awning} colors={S.colors} />
          </group>
        </>
      )}
      {S.garland.on && <ShopGarland S={S} W={F.W} P={P} under={h} />}
    </group>
  );
}

// THE INSIDE OF A SHOP (see SHOP_INTERIOR): its floor, the back and side
// walls, the front as the street sees it (its shop windows, the wall round
// them, the doorway, the door swung open inward: see Front); then its
// furniture. `config` overrides any of
// SHOP_INTERIOR's fields. `seat(key, top)`, if given, is called for the
// shopkeeper's stool ("keeper") and each café chair ("table<row>-<i>-<c>"),
// `top` the seat's top off the ground, and what it returns is set in
// that chair, in world units, its origin on the ground under the seat's
// middle, facing the chair's front (as CafeTable's `seat`). `kitchenDoor`,
// in a café, a ref saying how far its swing door to the kitchen is open
// (-1 to 1, see Back); without it the door hangs closed. `frontDoor`, a
// ref (0 shut … 1 open) the front door swings to (see SwingLeaf); without
// it the front door stands open, as a dolls' house's. `look`, a ref to
// a point in the world (a THREE.Vector3, or null): what a café's host and
// chef turn their heads to look at (a customer come in; see ShadowSpirit).
// `cafeSeat`, for the café tables out front (SHOP_INTERIOR's `outside`),
// as the Shopfront's: the street can sit there whoever it sits there outside.
// `layout`, if given, is laid over the furniture in place of the config's
// own (SHOP_INTERIOR's `layout`; the interiors editor's, as it is dragged
// about), and `pickItem(item, event)`, if given, is called when a piece of
// furniture is pressed on (the editor picks it up).
export default function ShopInterior({ config, seat, kitchenDoor, frontDoor, look, cafeSeat, layout, pickItem }) {
  const I = useMemo(() => interiorOf(config), [config]);
  const plan = useMemo(() => planOf(I, layout ?? I.layout), [I, layout]);
  const C = I.shop, R = plan.room;
  // one Curtain's config for every window (see SHOP_INTERIOR's `curtains`), sized to them
  const curtain = useMemo(() => {
    if (!R.windows || !I.curtains?.on) return null;
    const { on, ...rest } = I.curtains; // eslint-disable-line no-unused-vars
    const rodHeight = Math.min(R.h - 0.04, rest.rodHeight ?? R.h - 0.1);
    return { ...rest, rodHeight, length: rest.length ?? rodHeight - 0.03, over: rest.over ?? 0.12 };
  }, [I.curtains, R.windows, R.h]);
  const { W, D, h, zb, doorX, doorW } = R;
  // the front, laid out just as the Shopfront lays it out from the street
  const front = useMemo(() => shopFloorOf(C), [C]), rec = C.body.recess;
  // the openings to cut in the walls, where the layout's doors, archways,
  // windows and rooms stand in them
  const cuts = useMemo(() => cutsOf(plan.items, W, zb), [plan.items, W, zb]);
  return (
    <group>
      {/* the floor (a hair up, clear of whatever ground it stands on), the walls:
          butted up to one another and to the pilasters, never overlapping —
          boxes sharing a face (the pilasters' outsides and tops with the side
          walls', the back wall's ends with theirs) fight over it, flickering */}
      {R.kitchen || R.tiled ? (
        // a café's: tiled (Flooring/Tile Floor), a mosaic in the middle of
        // each tile; a lobby's or a convenience store's, tiled as its kind's (`tiles`)
        <group position-z={-D / 2}><TileFloor config={floorOf(R.kitchen ? I.tileFloor : R.tiled, W - 0.02, D - 0.02)} /></group>
      ) : (
        <Slab at={[0, 0.0075, -D / 2]} size={[W - 0.02, 0.015, D - 0.02]} swatch={solid(R.floor)} />
      )}
      {R.windows ? (
        <>
          {/* a café's: side walls with windows; the back wall with them, and
              a doorway through it to the kitchen behind, whose own walls run on */}
          {[-1, 1].map((e) => (
            <group key={e} position={[e * (W / 2 - 0.12), 0, 0]} rotation-y={-e * Math.PI / 2}>
              <WindowedWall u0={e > 0 ? -D : rec} u1={e > 0 ? -rec : D} h={h} at={R.windows.sides[e].map((z) => e * z)} win={R.windows} cuts={cuts[e]} wall={C.colors.room} trim={C.colors.windows ?? C.colors.trim} curtain={curtain} bars={R.windows.bars} />
            </group>
          ))}
          <Back R={R} C={C} W={W} h={h} zb={zb} swing={kitchenDoor} curtain={curtain} cuts={cuts.back} />
          <Kitchen R={R} C={C} W={W} D={D} h={h} tiles={I.kitchenFloor} />
        </>
      ) : (
        <>
          {/* plain walls (slabs, but for what the layout lets into them) */}
          <group position-z={zb}><WindowedWall u0={-(W / 2 - 0.12)} u1={W / 2 - 0.12} h={h} cuts={cuts.back} wall={C.colors.room} trim={C.colors.windows ?? C.colors.trim} /></group>
          {[-1, 1].map((e) => (
            <group key={e} position={[e * (W / 2 - 0.12), 0, 0]} rotation-y={-e * Math.PI / 2}>
              <WindowedWall u0={e > 0 ? -D : rec} u1={e > 0 ? -rec : D} h={h} cuts={cuts[e]} wall={C.colors.room} trim={C.colors.windows ?? C.colors.trim} />
            </group>
          ))}
        </>
      )}
      <Front C={C} F={front} h={h} doorX={doorX} doorW={doorW} swing={frontDoor} />
      {I.outside?.on && <Outside I={I} C={C} F={front} h={h} cafeSeat={cafeSeat} />}
      {plan.items.map((it) => {
        const piece = <Furniture key={it.id} it={it} C={C} S={I.scale} glow={I.lights.glow} shadeGlow={I.lights.shade} seat={seat} diners={I.diners} seed={I.seed} look={look} h={h} floor={R.floor} />;
        return pickItem ? <group key={it.id} onPointerDown={(e) => pickItem(it, e)}>{piece}</group> : piece;
      })}
    </group>
  );
}
