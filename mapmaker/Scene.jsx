// THE SCENE: the planet, the map's own plateaus and ramps raised on it,
// the placements on that, and
// the pointer and keys that move them about. Lights and sky are the library
// stage's toon look (.storybook/stage.jsx) at the map's hour.
import React, { Suspense, useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { create } from "zustand";
import { Canvas, useThree, useFrame } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";

import { LOOKS } from "../.storybook/stage.jsx";
import { HOLED } from "../src/nouns/water/Basin.jsx";
import { componentOf, ENTRY, SCULPT } from "./catalog.js";
import { surfaceOf, behindBall } from "./surface.js";
import { useMap, ROLES } from "./store.js";
import { Patch } from "./Patch.jsx";
import { TerrainLobe, TerrainGround, TerrainWalls, pieceAt, shapeOf, RISERS } from "./Terrain.jsx";
import { isCover, isRoad, frameOf, toLocal, fromLocal, roadKnots, coverLobes, basinOf, BASIN, lobeDistance } from "../runtime/cover.js";
import { isTerrain, terrainType, terrainLobes, terrainField, RAMP_ARGS, MAX_LAYERS, TERRAIN } from "../runtime/terrain.js";
import { rampAlong, rampNear } from "./ramp.js";
import { bumpAt, bumpFrom, textureDefaults, textures } from "../src/presets/materials/textures.js";

// The sun's shadow box, big enough for a side of the planet.
const SHADOW = {
  "shadow-mapSize": [4096, 4096],
  "shadow-camera-left": -70,
  "shadow-camera-right": 70,
  "shadow-camera-top": 70,
  "shadow-camera-bottom": -70,
  "shadow-camera-near": 1,
  "shadow-camera-far": 260,
  "shadow-bias": -0.0002,
  "shadow-normalBias": 0.15, // (at 0.04 the cliffs' tops, nearly edge-on to a low sun, shadowed themselves in rings)
};

// THE MAP'S OWN TERRAIN: its plateaus and ramps as a field over the ball
// (../runtime/terrain.js), rebuilt when one of THEM changes (not when a
// tree moves), and laid over the base ground by the surface. The field in
// hand is kept here too, for the inspector.
export const useField = create(() => ({ field: null }));
const terrainKeyOf = (placements) =>
  placements
    .filter((p) => isTerrain(p.entry))
    .map((p) => `${p.id}:${p.dir.join(",")}:${p.yaw}:${JSON.stringify(p.args)}`)
    .join(";");
// …and its WATER: the basins the game digs under its ponds, oceans and
// springs (../runtime/cover.js's basinOf), each at the level of the
// terrain under it, rebuilt when a water patch (or the terrain) changes.
const waterKeyOf = (placements) =>
  placements
    .filter((p) => isCover(p.entry) && COVER_WATER.has(p.entry.slice(6)))
    .map((p) => `${p.id}:${p.dir.join(",")}:${p.yaw}:${JSON.stringify(p.args)}`)
    .join(";");
const COVER_WATER = new Set(["pond", "ocean", "spring", "water", "island"]);
// …and its ROADS, for the bridges over that water: a thing placed on a
// bridge stands on its deck, not in the pond.
const roadKeyOf = (placements) =>
  placements
    .filter((p) => isRoad(p.entry))
    .map((p) => `${p.id}:${JSON.stringify(p.knots ?? p.dir)}:${p.yaw}:${!!p.closed}:${JSON.stringify(p.args)}`)
    .join(";");
export const useSurface = () => {
  const spec = useMap((s) => s.map.surface);
  const terrainKey = useMap((s) => terrainKeyOf(s.map.placements));
  const waterKey = useMap((s) => waterKeyOf(s.map.placements));
  const roadKey = useMap((s) => roadKeyOf(s.map.placements));
  const roads = useMemo(() => coverLobes(useMap.getState().map.placements, spec.radius).filter((l) => l.type === "road"), [roadKey, spec.radius]);
  const field = useMemo(() => terrainField(terrainLobes(useMap.getState().map.placements, spec.radius), spec.radius), [terrainKey, spec.radius]);
  useEffect(() => useField.setState({ field }), [field]);
  // The basins read the terrain live (the field in hand, through a ref),
  // and are made again only when the water changes or the ground under a
  // pond does — its level at the middle, the rise round its edge — not on
  // every change to a cliff elsewhere: the ball is knitted from them, and
  // everything that stands in them, and a sculpt stroke across the far
  // side of the ball must not knit it all again at every stamp.
  const fieldRef = useRef(field);
  fieldRef.current = field;
  const levelKey = useMemo(() => {
    const R = spec.radius;
    return coverLobes(useMap.getState().map.placements, R)
      .filter((l) => l.type === "water")
      .map((l) => [[0, 0], [l.hw + 1, 0], [-l.hw - 1, 0], [0, l.hl + 1], [0, -l.hl - 1]].map(([x, z]) => field.rise(fromLocal(l.frame, x, z), false).toFixed(1)).join(","))
      .join(";");
  }, [waterKey, field, spec.radius]);
  const basin = useMemo(() => {
    const lobes = coverLobes(useMap.getState().map.placements, spec.radius);
    return basinOf(
      lobes.filter((l) => l.type === "water"),
      { levelAt: (d) => fieldRef.current.rise(d, false), islands: lobes.filter((l) => l.type === "island") },
    );
  }, [waterKey, levelKey, spec.radius]);
  return useMemo(() => surfaceOf(spec, field, () => [...RISERS], basin, roads), [spec.kind, spec.radius, field, basin, roads]);
};

// A story that throws (a knob turned to a size it cannot build) takes out
// only itself, with a word in the status line, not the whole map.
class Guard extends React.Component {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch(e) {
    useMap.getState().say(`${this.props.name}: ${String(e.message ?? e).split("\n")[0]}`);
  }
  componentDidUpdate(prev) {
    if (this.state.failed && prev.args !== this.props.args) this.setState({ failed: false });
  }
  render() {
    return this.state.failed ? null : this.props.children;
  }
}

// A start marker's badge: a ring on the ground in the role's colour, and a
// bar out of it the way the thing faces (its +x), since a start has a heading.
function Badge({ role, scale }) {
  const color = ROLES[role]?.color;
  if (!color) return null;
  return (
    <group scale={1 / scale} position-y={0.05}>
      <mesh rotation-x={-Math.PI / 2}>
        <ringGeometry args={[1.3, 1.6, 48]} />
        <meshBasicMaterial color={color} side={THREE.DoubleSide} />
      </mesh>
      <mesh position-x={2.1}>
        <boxGeometry args={[1.1, 0.08, 0.3]} />
        <meshBasicMaterial color={color} />
      </mesh>
    </group>
  );
}

// One placed thing: the entry drawn at its bearing, named and tagged so the
// exporter writes it out as a node a game can read back.
export const GROUPS = new Map(); // placement id → its group, for the marker and the camera
// A story's drawn body, memoised on its entry and knobs ALONE: when the
// ground under it changes (a cliff dragged, a pond dug) the group
// it sits in moves, but the story — hundreds of meshes, for a house — is
// not drawn again. A groundcover patch and a piece of terrain are the
// exception: they are made of the ground, and take the surface.
const Body = React.memo(function Body({ entry, args }) {
  const Story = componentOf(entry);
  return <Story args={args} />;
});
// Memoised: a change to one placement re-renders that one, not the hundred others.
const Placement = React.memo(function Placement({ p, surface, ghost = false }) {
  const cover = isCover(p.entry);
  const terrain = isTerrain(p.entry);
  const entry = ENTRY[p.entry];
  const ref = useRef();
  const { position, quaternion } = useMemo(() => surface.standAt(p.dir, p.lift, p.yaw), [surface, p.dir, p.lift, p.yaw]);
  const args = useMemo(() => ({ ...p.args }), [p.args]);
  useEffect(() => {
    if (ghost) return;
    GROUPS.set(p.id, ref.current);
    return () => GROUPS.delete(p.id);
  }, [p.id, ghost]);
  const role = p.role ?? "prop";
  const userData = ghost ? {} : { mm: 1, entry: p.entry, args: p.args, dir: p.dir, yaw: p.yaw, scale: p.scale, lift: p.lift, role, ...(p.clearing > 0 ? { clearing: p.clearing } : {}), ...(p.knots ? { knots: p.knots, closed: !!p.closed } : {}) };
  return (
    <group
      ref={ref}
      name={ghost ? "ghost" : p.id}
      position={position}
      quaternion={quaternion}
      scale={p.scale}
      userData={userData}
      onPointerDown={ghost ? undefined : (e) => {
        const S = useMap.getState();
        if (S.placing) return;
        // only the mode's own kind takes the pointer: in terrain mode an
        // object is not in the way of a road drawn over it, and in objects
        // mode a click on a road places on it rather than picking it
        if ((S.mode === "terrain") !== (cover || terrain)) return;
        e.stopPropagation();
        if (e.button !== 0) return;
        S.select(p.id);
        // a road's handle (the mesh hit says which knot) drags that knot; the road itself, the whole road
        const knot = e.object?.userData?.knot;
        if (knot !== undefined) S.selectKnot(knot);
        beginDrag(p.id, e.clientX, e.clientY, { knot: knot ?? null, anchor: e.point ? e.point.clone().normalize().toArray() : null });
      }}
    >
      <Guard name={entry?.name ?? p.entry} args={args}>
        <Suspense fallback={null}>{cover ? <Patch p={p} surface={surface} ghost={ghost} /> : terrain ? <TerrainLobe p={p} surface={surface} ghost={ghost} /> : entry ? <Body entry={p.entry} args={args} /> : null}</Suspense>
      </Guard>
      {!ghost && <Badge role={role} scale={p.scale} />}
    </group>
  );
});

// A press on the map's own ground (TerrainGround): the piece under it —
// a ramp, or the topmost cliff — is picked and dragged, as a press on a
// thing's own group is (Placement), in terrain mode only.
function pickTerrain(e) {
  const S = useMap.getState();
  if (S.placing || S.mode !== "terrain" || e.button !== 0 || !e.point) return;
  const field = useField.getState().field;
  const id = field && pieceAt(field, e.point.clone().normalize());
  if (!id) return;
  e.stopPropagation();
  S.select(id);
  beginDrag(id, e.clientX, e.clientY, { anchor: e.point.clone().normalize().toArray() });
}
// THE SCULPT BRUSH (the catalog's SCULPT tool): a round stamp of the
// brush's size (the store's `brush`). LEFT, the ground RISES: a round
// cliff of the brush's height is laid at the press, and another along a
// drag every half-radius, running together with cliffs of the same height
// round it (by the brush's blend) — on open ground, or just inside a tier's
// edge, a piece of that tier; further in (half the brush in), a storey on
// it, and the stroke stays on that storey: a stamp carried out to within
// half the brush of the edge under it is not laid. RIGHT,
// it goes back DOWN: the tier under the pointer is CUT over the brush's
// disc (a terrain-cut of that tier's height), and any cliff of that tier
// that fits inside the brush goes whole. A stroke is one undo step.
const tierAt = (field, at) => {
  for (let i = field.tiers.length - 1; i >= 0; i--) {
    const m = field.tiers[i].field(at);
    if (m !== Infinity && m < 0.5) return field.tiers[i];
  }
  return null;
};
const stampSpacing = (r) => Math.max(0.6, r * 0.5);
const layerOf = (tier) => Math.max(1, ...tier.lobes.filter((l) => l.type === "cliff").map((l) => l.layer));
function sculptBegin(dir, lower, surface) {
  const field = useField.getState().field;
  const at = new THREE.Vector3().fromArray(dir);
  const r = useMap.getState().brush.radius;
  const tier = field && !field.empty ? tierAt(field, at) : null;
  // well inside a tier's edge (half the brush in) takes a storey on it; just inside, or open ground, more of itself
  const onTop = !!tier && tier.field(at) < -r / 2 && layerOf(tier) < MAX_LAYERS;
  return { lower, layer: onTop ? layerOf(tier) + 1 : tier ? layerOf(tier) : 1, base: onTop ? tier.h : null, last: dir };
}
function sculptAt(dir, St, surface) {
  const S = useMap.getState();
  const B = S.brush, R = surface.radius, r = B.radius;
  const at = new THREE.Vector3().fromArray(dir);
  const field = useField.getState().field;
  if (!St.lower) {
    // a storey stays on the tier it began on: not laid within half the brush of that tier's edge
    if (St.base !== null) {
      const base = field && !field.empty ? field.tiers.find((t) => Math.abs(t.h - St.base) < 1e-3) : null;
      if (!base || !(base.field(at) < -r / 2)) return;
    }
    S.placeLive("terrain-cliff", dir, { args: { width: 2 * r, length: 2 * r, corner: r, blend: +(B.soft * r).toFixed(2), height: B.height, wobble: B.wobble, layer: St.layer } });
    return;
  }
  if (!field || field.empty) return;
  const tier = tierAt(field, at);
  if (!tier) return;
  // cliffs of this tier the brush covers (near enough: a stamp of its own size under its middle) go whole; what is left of the tier here is cut
  const gone = new Set();
  for (const l of tier.lobes) if (l.type === "cliff" && l.frame.d.angleTo(at) * R + Math.max(l.hw, l.hl) <= r * 1.5) gone.add(l.id);
  for (const id of gone) S.removeLive(id);
  const left = tier.lobes.some((l) => l.type === "cliff" && !gone.has(l.id) && lobeDistance(l, at) < l.wobble + r);
  if (left) S.placeLive("terrain-cut", dir, { args: { width: 2 * r, length: 2 * r, corner: r, tier: tier.h } });
  else S.beginLive();
}

// The drag in hand: which placement, where the pointer went down, and the
// placements as they were when it began, for one undo step at the end. A
// press that moves under SLACK pixels is a click, and moves nothing.
const SLACK = 4;
let drag = null;
// The press that began on the canvas (Interaction's onDown): where, and
// whether it began on a thing (the thing's own handler has started a drag
// by then). Kept out here, as `drag` is: the listeners are made again
// whenever the surface is — and a road's knot laid live rebuilds it (its
// bridges) — so a stroke in hand must outlive the listeners that began it.
let press = null;
function beginDrag(id, x, y, { knot = null, anchor = null } = {}) {
  const S = useMap.getState();
  const p = S.map.placements.find((q) => q.id === id);
  // a road drags by its knots: one of them, or all of them turned about the ball from where it was grabbed
  const knots0 = p && isRoad(p.entry) ? roadKnots(p, S.map.surface.radius) : null;
  drag = { id, x, y, before: S.map.placements, moved: false, knot, anchor: anchor ?? p?.dir ?? null, knots0 };
}
// A road's knots moved: the one being dragged to `dir`, or all of them with the grab point.
function dragRoad(dir) {
  const S = useMap.getState();
  const to = new THREE.Vector3().fromArray(dir);
  let knots;
  if (drag.knot !== null) knots = drag.knots0.map((k, i) => (i === drag.knot ? to : k));
  else {
    const turn = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3().fromArray(drag.anchor).normalize(), to);
    knots = drag.knots0.map((k) => k.clone().applyQuaternion(turn));
  }
  S.patchLive(drag.id, { knots: knots.map((k) => k.toArray()), dir: knots[0].toArray() });
}

// Pointer and keyboard, on the window rather than on meshes, so a drag
// keeps going off the object and a click places through the ghost.
function Interaction({ surface }) {
  const { camera, gl, controls, setEvents } = useThree();
  // Only what is in view takes the pointer: a thing on the far side of the
  // ball, hidden behind it, is dropped from the hits before they are dealt
  // out, so a click does not pick through the planet.
  useEffect(() => {
    if (surface.kind !== "planet") return;
    setEvents({ filter: (hits) => hits.filter((h) => !behindBall(camera.position, h.point, surface.radius)) });
    return () => setEvents({ filter: undefined });
  }, [setEvents, camera, surface]);
  const ray = useMemo(() => new THREE.Raycaster(), []);
  const ndc = useMemo(() => new THREE.Vector2(), []);

  const hitUnder = (ev) => {
    const r = gl.domElement.getBoundingClientRect();
    ndc.set(((ev.clientX - r.left) / r.width) * 2 - 1, -((ev.clientY - r.top) / r.height) * 2 + 1);
    ray.setFromCamera(ndc, camera);
    return surface.hit(ray.ray);
  };

  useEffect(() => {
    const el = gl.domElement;
    // Drawing a patch (or a plateau, or a ramp): a press on the ground while
    // placing one is its first corner; dragging pulls it out to the pointer,
    // squared to the view, and letting go keeps it. A press that does not
    // move places one of the stock size, as any click does.
    const draw = (ev) => {
      const S = useMap.getState();
      const here = hitUnder(ev);
      if (!here) return;
      const D = press.draw;
      if (!D.id) {
        if (controls) controls.enabled = false;
        // squared to the view: the patch's x along the camera's right, flattened to the ground there
        const { quaternion } = surface.standAt(D.anchor, 0, 0);
        const up = new THREE.Vector3(0, 1, 0).applyQuaternion(quaternion);
        const right = new THREE.Vector3(1, 0, 0).applyQuaternion(camera.quaternion);
        right.addScaledVector(up, -right.dot(up)).normalize().applyQuaternion(quaternion.clone().invert());
        D.yaw = Math.atan2(-right.z, right.x);
        D.frame = frameOf(D.anchor, D.yaw, surface.radius);
        D.id = S.place(S.placing, D.anchor, { yaw: D.yaw });
        S.beginLive();
      }
      const l = toLocal(D.frame, new THREE.Vector3().fromArray(here));
      const w = Math.max(1, Math.round(Math.abs(l.x) * 2) / 2), len = Math.max(1, Math.round(Math.abs(l.z) * 2) / 2);
      // one change to the store per move, not three
      const args = S.map.placements.find((q) => q.id === D.id)?.args ?? {};
      useMap.setState((s) => ({
        status: `${w} × ${len} units`,
        map: { ...s.map, placements: s.map.placements.map((q) => (q.id === D.id ? { ...q, dir: fromLocal(D.frame, l.x / 2, l.z / 2).toArray(), args: { ...args, width: w, length: len } } : q)) },
      }));
    };
    // Drawing a RAMP: a line. A press on the ground while placing one is its
    // foot; dragging runs it out to the pointer, and where the line crosses a
    // cliff's edge the ramp squares up to the edge and docks its head on the
    // lip (ramp.js). Letting go keeps it.
    const line = (ev) => {
      const S = useMap.getState();
      const here = hitUnder(ev);
      if (!here) return;
      const Ln = press.line;
      if (!Ln.id) {
        if (controls) controls.enabled = false;
        Ln.id = S.placeLive(S.placing, Ln.anchor, { yaw: 0 });
      }
      const r = rampAlong(useField.getState().field, new THREE.Vector3().fromArray(Ln.anchor), new THREE.Vector3().fromArray(here), surface.radius);
      const args = S.map.placements.find((q) => q.id === Ln.id)?.args ?? {};
      useMap.setState((s) => ({
        status: `${r.length} units${r.snapped ? " · docked on the lip" : ""}`,
        map: { ...s.map, placements: s.map.placements.map((q) => (q.id === Ln.id ? { ...q, dir: r.dir, yaw: r.yaw, args: { ...args, length: r.length } } : q)) },
      }));
    };
    // Drawing a ROAD: a pen. A press on the ground while placing one starts
    // a stroke there — or carries on an existing road, if the press is on
    // one of its ends — and every few units the pointer travels lays
    // another knot; the road follows live. Letting go keeps it (see onUp):
    // closed into a loop if it came back to its start, smoothed a little.
    const KNOT = 2.5; // units between knots
    const R = surface.radius;
    const pen = (ev) => {
      const S = useMap.getState();
      const here = hitUnder(ev);
      if (!here) return;
      const P = press.pen;
      if (!P.id) {
        if (controls) controls.enabled = false;
        const a = new THREE.Vector3().fromArray(P.anchor);
        let cont = null;
        for (const q of S.map.placements) {
          if (!isRoad(q.entry) || q.closed) continue;
          const ks = roadKnots(q, R);
          const d0 = ks[0].angleTo(a) * R, d1 = ks[ks.length - 1].angleTo(a) * R;
          if (d0 < KNOT && (!cont || d0 < cont.d)) cont = { id: q.id, d: d0, knots: ks.slice().reverse() };
          if (d1 < KNOT && (!cont || d1 < cont.d)) cont = { id: q.id, d: d1, knots: ks };
        }
        if (cont) {
          S.beginLive();
          P.id = cont.id;
          P.knots = cont.knots.map((k) => k.toArray());
        } else {
          P.id = S.placeLive(S.placing, P.anchor, { knots: [P.anchor] });
          P.knots = [P.anchor];
        }
      }
      const last = new THREE.Vector3().fromArray(P.knots[P.knots.length - 1]);
      if (last.angleTo(new THREE.Vector3().fromArray(here)) * R < KNOT) return;
      P.knots = [...P.knots, here];
      S.patchLive(P.id, { knots: P.knots, dir: P.knots[0] });
      S.say(`${P.knots.length} knots`);
    };
    const onMove = (ev) => {
      const S = useMap.getState();
      if (press?.sculpt) {
        const here = hitUnder(ev);
        if (!here) return;
        S.setHover(here);
        const Sc = press.sculpt;
        if (new THREE.Vector3().fromArray(here).angleTo(new THREE.Vector3().fromArray(Sc.last)) * surface.radius < stampSpacing(S.brush.radius)) return;
        Sc.last = here;
        return sculptAt(here, Sc, surface);
      }
      if (press?.pen && !drag) {
        if (Math.hypot(ev.clientX - press.x, ev.clientY - press.y) < SLACK && !press.pen.id) return;
        return pen(ev);
      }
      if (press?.draw && !drag) {
        if (Math.hypot(ev.clientX - press.x, ev.clientY - press.y) < SLACK && !press.draw.id) return;
        return draw(ev);
      }
      if (press?.line && !drag) {
        if (Math.hypot(ev.clientX - press.x, ev.clientY - press.y) < SLACK && !press.line.id) return;
        return line(ev);
      }
      if (drag) {
        if (!drag.moved && Math.hypot(ev.clientX - drag.x, ev.clientY - drag.y) < SLACK) return;
        const dir = hitUnder(ev);
        if (!dir) return;
        if (controls) controls.enabled = false;
        drag.moved = true;
        if (drag.knots0) dragRoad(dir);
        else {
          const p = S.map.placements.find((q) => q.id === drag.id);
          if (p && terrainType(p.entry) === "ramp") {
            // a ramp carried by its middle: its own line laid at the pointer, snapped to any edge it crosses
            const R = surface.radius;
            const F = frameOf(dir, p.yaw ?? 0, R);
            const hl = (p.args?.length ?? RAMP_ARGS.length) / 2;
            const r = rampAlong(useField.getState().field, fromLocal(F, 0, -hl), fromLocal(F, 0, hl), R, { length: hl * 2 });
            S.patchLive(drag.id, { dir: r.dir, yaw: r.yaw });
          } else S.patchLive(drag.id, { dir });
        }
      } else if (S.placing) {
        S.setHover(hitUnder(ev));
      }
    };
    const onUp = (ev) => {
      if (press?.sculpt) {
        // the stroke done: one undo step
        if (controls) controls.enabled = true;
        press = null;
        useMap.getState().endLive();
        return;
      }
      const onThing = !!drag;
      if ((press?.draw && !press.draw.id) || (press?.line && !press.line.id) || (press?.pen && !press.pen.id)) if (controls) controls.enabled = true; // a press that drew nothing
      if (drag) {
        if (controls) controls.enabled = true;
        if (drag.moved) {
          // a road moved runs over new ground: what was placed there goes, in the same step
          const cleared = drag.knots0 ? useMap.getState().clearUnderRoad(drag.id) : 0;
          useMap.setState((s) => ({ undo: [...s.undo.slice(-99), drag.before], redo: [], dirty: true }));
          if (cleared) useMap.getState().say(`${cleared} thing${cleared > 1 ? "s" : ""} under the road cleared`);
        }
        drag = null;
      }
      if (!press) return;
      const still = Math.hypot(ev.clientX - press.x, ev.clientY - press.y) < SLACK;
      const drawn = press.draw?.id ?? press.line?.id;
      const stroke = press.pen;
      press = null;
      if (stroke) {
        // the stroke done: a click lays a short straight piece squared to
        // the view; a drag is closed if it came back to its start, and its
        // knots smoothed once so the hand's wobble goes
        if (controls) controls.enabled = true;
        const S = useMap.getState();
        let id = stroke.id;
        let knots = (stroke.knots ?? []).map((k) => new THREE.Vector3().fromArray(k));
        let closed = false;
        if (knots.length < 2) {
          const { quaternion } = surface.standAt(stroke.anchor, 0, 0);
          const up = new THREE.Vector3(0, 1, 0).applyQuaternion(quaternion);
          const fwd = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion);
          fwd.addScaledVector(up, -fwd.dot(up)).normalize().applyQuaternion(quaternion.clone().invert());
          const F = frameOf(stroke.anchor, Math.atan2(fwd.x, fwd.z), R);
          knots = [fromLocal(F, 0, -6), fromLocal(F, 0, 6)];
          if (!id) id = S.placeLive(S.placing, stroke.anchor, { knots: knots.map((k) => k.toArray()) });
        } else {
          const n = knots.length;
          if (n >= 6 && knots[0].angleTo(knots[n - 1]) * R < KNOT + 0.5) {
            knots.pop();
            closed = true;
          }
          const m = knots.length;
          const sm = knots.map((k) => k.clone());
          for (let i = closed ? 0 : 1; i < (closed ? m : m - 1); i++) sm[i].copy(knots[i]).multiplyScalar(0.5).addScaledVector(knots[(i - 1 + m) % m], 0.25).addScaledVector(knots[(i + 1) % m], 0.25).normalize();
          knots = sm;
        }
        S.patchLive(id, { knots: knots.map((k) => k.toArray()), closed, dir: knots[0].toArray() });
        // whatever was placed where the road now runs goes with it (one undo step with the road)
        const cleared = S.clearUnderRoad(id);
        S.endLive();
        S.say(cleared ? `${cleared} thing${cleared > 1 ? "s" : ""} under the road cleared` : "");
        if (ev.shiftKey) S.setHover(null);
        else useMap.setState({ placing: null, hover: null, selected: id });
        return;
      }
      if (drawn) {
        // a patch drawn out: kept, picked, and the drawing done unless shift holds it
        if (controls) controls.enabled = true;
        const S = useMap.getState();
        S.endLive();
        S.say("");
        if (ev.shiftKey) S.setHover(null);
        else useMap.setState({ placing: null, hover: null, selected: drawn });
        return;
      }
      if (!still) return; // an orbit, or a drag: not a click
      const S = useMap.getState();
      if (S.placing) {
        const dir = hitUnder(ev);
        if (!dir) return;
        // a ramp clicked down near a cliff is aimed at the nearest lip and docked on it
        const near = isTerrain(S.placing) && terrainType(S.placing) === "ramp" ? rampNear(useField.getState().field, new THREE.Vector3().fromArray(dir), surface.radius) : null;
        const id = near ? S.place(S.placing, near.dir, { yaw: near.yaw, args: { length: near.length } }) : S.place(S.placing, dir);
        if (!ev.shiftKey) useMap.setState({ placing: null, hover: null, selected: id });
      } else if (!onThing) {
        S.select(null); // a click on bare ground unpicks
      }
    };
    const onDown = (ev) => {
      const S = useMap.getState();
      if (S.placing === SCULPT) {
        // the brush: left raises, right lowers, from the press on
        if (ev.button !== 0 && ev.button !== 2) return;
        const anchor = hitUnder(ev);
        if (!anchor) return;
        if (controls) controls.enabled = false;
        press = { x: ev.clientX, y: ev.clientY, sculpt: sculptBegin(anchor, ev.button === 2, surface) };
        S.beginLive();
        sculptAt(anchor, press.sculpt, surface);
        return;
      }
      if (ev.button === 2 && S.placing) return S.stopPlacing();
      if (ev.button === 0) {
        press = { x: ev.clientX, y: ev.clientY };
        // placing a patch, a press on the ground may be the start of a drawing (seen
        // here in the capture phase, so the orbit is stopped before it takes the press)
        if (S.placing && (isCover(S.placing) || isTerrain(S.placing))) {
          const anchor = hitUnder(ev);
          if (anchor) {
            if (isRoad(S.placing)) press.pen = { anchor, id: null, knots: null };
            else if (isTerrain(S.placing) && terrainType(S.placing) === "ramp") press.line = { anchor, id: null };
            else press.draw = { anchor, id: null };
            if (controls) controls.enabled = false;
          }
        }
      }
    };
    const onContext = (ev) => ev.preventDefault();
    el.addEventListener("pointerdown", onDown, true);
    el.addEventListener("contextmenu", onContext);
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    return () => {
      el.removeEventListener("pointerdown", onDown, true);
      el.removeEventListener("contextmenu", onContext);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
  }, [gl, camera, controls, surface]);

  // The camera brought round to a placement: looking down at it from a little way off.
  const focus = (id) => {
    const p = useMap.getState().map.placements.find((p) => p.id === id);
    if (!p || !controls) return;
    const { position, quaternion } = surface.standAt(p.dir, p.lift, 0);
    const up = new THREE.Vector3(0, 1, 0).applyQuaternion(quaternion);
    const back = new THREE.Vector3(0, 0, 1).applyQuaternion(quaternion);
    // far enough back to see the whole of it: by what it draws, if it has drawn yet
    const g = GROUPS.get(id);
    const box = g ? new THREE.Box3().setFromObject(g) : null;
    const size = box && !box.isEmpty() && Number.isFinite(box.min.lengthSq() + box.max.lengthSq()) ? box.getSize(new THREE.Vector3()).length() : 0;
    const reach = Math.max(6, size * 1.2);
    controls.target.copy(position).addScaledVector(up, 1.5);
    camera.position.copy(position).addScaledVector(up, reach * 0.9).addScaledVector(back, reach * 1.4);
    controls.update();
  };
  useEffect(() => {
    useMap.setState({ focus });
    // For poking at it from the console, and the headless checks.
    window.__mmScene = { camera, gl, controls, GROUPS, hitUnder, surface, get drag() { return drag; } };
  }, [controls, surface]);

  useEffect(() => {
    const onKey = (ev) => {
      const t = ev.target;
      // Typing in a text box is the box's own (its undo too); a slider, a
      // checkbox or a button that still has focus is not, so the map's keys
      // work after a slider was dragged.
      const typing = t && ((t.tagName === "INPUT" && !["range", "checkbox", "color"].includes(t.type)) || t.tagName === "SELECT" || t.tagName === "TEXTAREA");
      if (typing) return;
      const S = useMap.getState();
      const meta = ev.metaKey || ev.ctrlKey;
      const key = ev.key.toLowerCase();
      const sel = S.selected && S.map.placements.find((p) => p.id === S.selected);
      if (ev.key === "Escape") return S.placing ? S.stopPlacing() : S.select(null);
      // undo: ⌘Z / ctrl-Z · redo: ⌘⇧Z, ⌘Y / ctrl-Y
      if (meta && key === "z") {
        ev.preventDefault();
        return ev.shiftKey ? S.redoStep() : S.undoStep();
      }
      if (meta && key === "y") {
        ev.preventDefault();
        return S.redoStep();
      }
      if (ev.key === "Tab") {
        ev.preventDefault();
        return S.setMode(S.mode === "terrain" ? "objects" : "terrain");
      }
      // the sculpt brush picked: [ ] its size, shift-[ ] its height
      if (S.placing === SCULPT && ["[", "]", "{", "}"].includes(ev.key)) {
        const up = ev.key === "]" || ev.key === "}";
        if (ev.shiftKey) S.setBrush({ height: S.brush.height + (up ? 0.5 : -0.5) });
        else S.setBrush({ radius: S.brush.radius + (up ? 0.5 : -0.5) });
        return S.say(`brush ${S.brush.radius * 2} across · ${S.brush.height} tall`);
      }
      if (!sel) return;
      if (meta && ev.key.toLowerCase() === "d") {
        ev.preventDefault();
        return S.duplicate(sel.id);
      }
      if (ev.key === "Delete" || ev.key === "Backspace") {
        // a road's picked knot comes out (the road goes with its last two)
        if (S.knot !== null && isRoad(sel.entry)) {
          const knots = roadKnots(sel, surface.radius);
          if (knots.length > 2) {
            const left = knots.filter((_, i) => i !== S.knot).map((k) => k.toArray());
            S.patch(sel.id, { knots: left, dir: left[0], closed: !!sel.closed && left.length >= 3 });
            return S.selectKnot(null);
          }
        }
        // a cliff or a cut goes with its whole shape (every stroke run together with it); alt takes the one piece
        if (isTerrain(sel.entry) && !ev.altKey) return S.removeMany(shapeOf(useField.getState().field, sel.id));
        return S.remove(sel.id);
      }
      const turn = ((ev.shiftKey ? 5 : 15) * Math.PI) / 180;
      if (ev.key === "q") return S.patch(sel.id, { yaw: sel.yaw + turn });
      if (ev.key === "e") return S.patch(sel.id, { yaw: sel.yaw - turn });
      const shape = isCover(sel.entry) || isTerrain(sel.entry);
      if (ev.key === "[" && !shape) return S.patch(sel.id, { scale: +(sel.scale / 1.1).toFixed(3) });
      if (ev.key === "]" && !shape) return S.patch(sel.id, { scale: +(sel.scale * 1.1).toFixed(3) });
      if (ev.key === "f") return focus(sel.id);
      const step = ev.shiftKey ? 2 : 0.5;
      // Arrows nudge along the ground in the CAMERA's frame, as the eye reads them.
      if (ev.key.startsWith("Arrow")) {
        ev.preventDefault();
        const { quaternion } = surface.standAt(sel.dir, 0, 0);
        const inv = quaternion.clone().invert();
        const camFwd = new THREE.Vector3();
        camera.getWorldDirection(camFwd);
        const up = new THREE.Vector3(0, 1, 0).applyQuaternion(quaternion);
        camFwd.addScaledVector(up, -camFwd.dot(up)).normalize().applyQuaternion(inv);
        const camRight = new THREE.Vector3().crossVectors(camFwd, new THREE.Vector3(0, 1, 0)).normalize();
        const move = new THREE.Vector3();
        if (ev.key === "ArrowUp") move.copy(camFwd);
        if (ev.key === "ArrowDown") move.copy(camFwd).negate();
        if (ev.key === "ArrowRight") move.copy(camRight);
        if (ev.key === "ArrowLeft") move.copy(camRight).negate();
        return S.patch(sel.id, { dir: surface.nudge(sel.dir, move.x * step, move.z * step) });
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [camera, surface]);

  // Everything casts and takes shadows; the objects do not flag themselves.
  const scene = useThree((s) => s.scene);
  const tick = useRef(0);
  useFrame(() => {
    if (++tick.current % 20) return;
    scene.traverse((o) => {
      if (o.isMesh && !o.userData.shadowed) {
        o.castShadow = o.receiveShadow = true;
        o.userData.shadowed = true;
      }
    });
  });
  return null;
}

// A ring on the ground round the picked placement, sized to it. ringGeometry
// is drawn in xy, so it is laid flat as a child of the stood group.
function FlatRing({ surface }) {
  const p = useMap((s) => s.map.placements.find((p) => p.id === s.selected));
  const [radius, setRadius] = useState(1.5);
  useEffect(() => {
    if (!p) return;
    const id = requestAnimationFrame(() => {
      const g = GROUPS.get(p.id);
      if (!g) return;
      const box = new THREE.Box3().setFromObject(g);
      if (!Number.isFinite(box.min.lengthSq() + box.max.lengthSq()) || box.isEmpty()) return setRadius(1.5);
      const size = box.getSize(new THREE.Vector3());
      setRadius(Math.max(0.8, Math.hypot(size.x, size.z) / 2 + 0.4));
    });
    return () => cancelAnimationFrame(id);
  }, [p?.id, p?.args, p?.scale, p?.dir]);
  if (!p || isCover(p.entry) || isTerrain(p.entry)) return null; // a patch or a piece of terrain draws its own outline
  const { position, quaternion } = surface.standAt(p.dir, 0.06, 0);
  const clearing = p.clearing > 0 ? p.clearing : 0;
  return (
    <group position={position} quaternion={quaternion}>
      <mesh rotation-x={-Math.PI / 2} renderOrder={5}>
        <ringGeometry args={[radius, radius + 0.12, 64]} />
        <meshBasicMaterial color="#6B86A8" side={THREE.DoubleSide} depthTest={false} transparent opacity={0.9} />
      </mesh>
      {/* its clearing: how far round it the groundcover is kept back, a fainter ring (the ball's curve is ignored: it is a guide) */}
      {clearing > 0 && (
        <mesh rotation-x={-Math.PI / 2} renderOrder={5}>
          <ringGeometry args={[clearing, clearing + 0.08, 96]} />
          <meshBasicMaterial color="#8E7352" side={THREE.DoubleSide} depthTest={false} transparent opacity={0.6} />
        </mesh>
      )}
    </group>
  );
}

// The sculpt brush's ring on the ground under the pointer, the brush's size.
function BrushRing({ surface, at }) {
  const radius = useMap((s) => s.brush.radius);
  const geometry = useMemo(() => {
    const F = frameOf(at, 0, surface.radius);
    const pts = [];
    for (let i = 0; i < 64; i++) {
      const a = (i / 64) * Math.PI * 2;
      const d = fromLocal(F, Math.cos(a) * radius, Math.sin(a) * radius);
      pts.push(d.multiplyScalar(surface.radiusAt(d) + 0.12));
    }
    return new THREE.BufferGeometry().setFromPoints(pts);
  }, [at, radius, surface]);
  useEffect(() => () => geometry.dispose(), [geometry]);
  return (
    <lineLoop geometry={geometry} renderOrder={6} raycast={() => {}} userData={{ editorOnly: true }}>
      <lineBasicMaterial color={TERRAIN.cliff.tint} depthTest={false} transparent opacity={0.95} />
    </lineLoop>
  );
}
// The ghost: the entry being placed, following the pointer over the ground.
function Ghost({ surface }) {
  const placing = useMap((s) => s.placing);
  const hover = useMap((s) => s.hover);
  if (!placing || !hover) return null;
  if (placing === SCULPT) return <BrushRing surface={surface} at={hover} />;
  const p = { id: "ghost", entry: placing, args: {}, dir: hover, yaw: 0, scale: 1, lift: 0, role: "prop" };
  return <Placement p={p} surface={surface} ghost />;
}

export const PLACEMENTS = { group: null }; // the exporter reads this
function Placements({ surface }) {
  const placements = useMap((s) => s.map.placements);
  const map = useMap((s) => s.map);
  const ref = useRef();
  useEffect(() => {
    PLACEMENTS.group = ref.current;
  }, []);
  // The map itself rides on the group, so a game reading the file knows the surface it was laid out on.
  const userData = useMemo(() => ({ mm: "map", name: map.name, surface: map.surface, version: map.version }), [map.name, map.surface, map.version]);
  return (
    <group ref={ref} name="map" userData={userData}>
      {placements.map((p) => (
        <Placement key={p.id} p={p} surface={surface} />
      ))}
    </group>
  );
}

// The plain ball, shown when no terrain is: things are placed on it by a
// ray against the ball itself (surface.js), so it needs no handlers.
// The ground's own hollows (the game's: planet.js's PLANET.clay), pressed
// into the ball by `bumpiness` times their stock depth, shown here so the
// slider has something to show. Things are still placed on the plain ball.
const CLAY = { texture: "bumpiness", amount: 0.6, seed: 7, lumps: 3.5, depth: 0.35, detail: 72 };
const CLAY_BUMP = bumpFrom(CLAY.amount, CLAY.seed, { ...textureDefaults, ...textures[CLAY.texture], detail: CLAY.detail });
// …except under the roads and their verge, where it is pressed flat and eased
// back out over BLEND (the game's roadFlat), so a road never sits in a hollow.
const ROAD_FLAT = { verge: 1.5, blend: 1.8 };
// …and sunk into the BASINS under the water patches (surface.dropAt: the
// game digs the same, cover.js's BASIN), the ground there painted sand
// from the waterline out a little, darkening to seabed under the water,
// as the game paints it. The ball is knitted finer with water on it, so
// a basin's slope has vertices to fall through.
function bumpyBall(R, bumpiness, roadDistance = null, basin = null, ground = "#6E9B5E") {
  const dug = !!basin && !basin.empty;
  const dropAt = (d) => (dug ? basin.drop(d) : 0);
  const g = new THREE.SphereGeometry(R, dug ? 256 : 128, dug ? 128 : 64);
  const bumpy = bumpiness > 0 && CLAY_BUMP?.amplitude > 0;
  if (!bumpy && !dug) return g;
  const P = g.attributes.position;
  const d = new THREE.Vector3();
  const grass = new THREE.Color(ground), sand = new THREE.Color(BASIN.colors.sand), seabed = new THREE.Color(BASIN.colors.seabed), wet = new THREE.Color();
  const col = dug ? new Float32Array(P.count * 3) : null;
  const waterR = R - BASIN.water;
  for (let i = 0; i < P.count; i++) {
    d.fromBufferAttribute(P, i).normalize();
    let r = R;
    if (bumpy) {
      const f = bumpAt(CLAY_BUMP, d.x * CLAY.lumps, d.y * CLAY.lumps, d.z * CLAY.lumps) / CLAY_BUMP.amplitude;
      let flat = 0;
      if (roadDistance) {
        const away = roadDistance(d) - ROAD_FLAT.verge;
        flat = away <= 0 ? 1 : away >= ROAD_FLAT.blend ? 0 : (1 - away / ROAD_FLAT.blend) ** 2 * (3 - 2 * (1 - away / ROAD_FLAT.blend));
      }
      r -= CLAY.depth * bumpiness * Math.max(0, -f) * (1 - flat);
    }
    if (dug) {
      r -= dropAt(d);
      // sand from the waterline out `sand`, to seabed as the ground goes under the water (the pond's own level aside)
      const level = basin.levelOf(d);
      const toSea = basin.field(d) - (basin.line + BASIN.sand);
      // (the shore eased over a vertex or so, since the knit is coarse)
      const c = toSea < 0.8 ? wet.copy(sand).lerp(seabed, Math.max(0, Math.min(1, (waterR + level - r) / 1.5))).lerp(grass, Math.max(0, Math.min(1, toSea / 0.8))) : grass;
      col[i * 3] = c.r;
      col[i * 3 + 1] = c.g;
      col[i * 3 + 2] = c.b;
    }
    d.multiplyScalar(r);
    P.setXYZ(i, d.x, d.y, d.z);
  }
  if (col) g.setAttribute("color", new THREE.BufferAttribute(col, 3));
  g.computeVertexNormals();
  return g;
}
function Planet({ surface, color }) {
  const R = surface.radius;
  const shown = true;
  const bumpiness = useMap((s) => s.map.surface.bumpiness ?? 1);
  const placements = useMap((s) => s.map.placements);
  const roads = useMemo(() => {
    if (!(bumpiness > 0)) return null;
    const lobes = coverLobes(placements, R).filter((l) => l.type === "road");
    if (!lobes.length) return null;
    // how far a bearing is from the edge of the nearest road's tarmac (the samples lie 0.4 apart, close enough)
    const p = new THREE.Vector3();
    return (d) => {
      p.copy(d).multiplyScalar(R);
      let best = Infinity;
      for (const l of lobes) {
        if (d.dot(l.centre) < l.cos) continue;
        let near = Infinity;
        for (const q of l.points) near = Math.min(near, p.distanceToSquared(q));
        best = Math.min(best, Math.sqrt(near) - l.width / 2);
      }
      return best;
    };
  }, [placements, R, bumpiness]);
  // (the ball is the base ground and its basins: the terrain stands on it as its own meshes, so a cliff moved does not knit it again)
  const basin = surface.basin;
  const ball = useMemo(() => bumpyBall(R, bumpiness, roads, basin, color), [R, bumpiness, roads, basin, color]);
  useEffect(() => () => ball.dispose(), [ball]);
  const painted = !!ball.attributes.color;
  return (
    <group visible={shown}>
      <mesh receiveShadow geometry={ball} onPointerDown={pickTerrain}>
        {/* (keyed: a material turned to vertex colours after it was made keeps its old shader, and the ball went white until a reload) */}
        <meshStandardMaterial key={painted ? "painted" : "plain"} color={painted ? "#ffffff" : color} vertexColors={painted} {...HOLED} />
      </mesh>
      {/* a faint graticule, for bearings */}
      <mesh scale={1.002}>
        <sphereGeometry args={[R, 24, 12]} />
        <meshBasicMaterial color="#1C1B19" wireframe transparent opacity={0.07} depthWrite={false} />
      </mesh>
    </group>
  );
}

// The top bar's SPIN: the camera, and what it looks at, carried round the
// planet's axis, so the world turns under it — held while a drag is on
// (the controls are off then) so nothing moves under the pointer.
const SPIN_AXIS = new THREE.Vector3(0, 1, 0);
function Spin() {
  const spin = useMap((s) => s.spin);
  const { camera, controls } = useThree();
  useFrame((_, dt) => {
    if (!spin.on || !controls || !controls.enabled) return;
    const a = Math.min(dt, 0.1) * spin.speed * (Math.PI * 2) / 60;
    camera.position.applyAxisAngle(SPIN_AXIS, a);
    controls.target.applyAxisAngle(SPIN_AXIS, a);
    controls.update();
  });
  return null;
}

export default function Scene() {
  const surface = useSurface();
  const look = useMap((s) => s.map.look);
  const t = look.daylight;
  const Look = LOOKS.toon;
  return (
    <div id="world">
      <Canvas flat shadows="pcf" dpr={[1, 2]} camera={{ fov: 40, near: 0.1, far: 2000, position: [0, 40, 110] }}>
        <color attach="background" args={[Look.sky(t)]} />
        <Look.Lights t={t} shadow={SHADOW} />
        <Planet surface={surface} color={look.ground} />
        <TerrainGround surface={surface} onPick={pickTerrain} />
        <TerrainWalls surface={surface} />
        <Placements surface={surface} />
        <Ghost surface={surface} />
        <FlatRing surface={surface} />
        <Interaction surface={surface} />
        {/* minDistance is from the TARGET, which "look at" puts on the ground, so it stays small */}
        <OrbitControls makeDefault minDistance={2} maxDistance={surface.radius * 8} enableDamping={false} />
        <Spin />
      </Canvas>
    </div>
  );
}
