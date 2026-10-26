// THE SCENE: the planet (or a game's terrain snapshot laid over it), the
// map's own plateaus and ramps raised on that, the placements on it, and
// the pointer and keys that move them about. Lights and sky are the library
// stage's toon look (.storybook/stage.jsx) at the map's hour.
import React, { Suspense, useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { create } from "zustand";
import { Canvas, useThree, useFrame } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { MeshBVH, acceleratedRaycast } from "three-mesh-bvh";

import { LOOKS } from "../.storybook/stage.jsx";
import { HOLED } from "../src/nouns/water/Basin.jsx";
import { componentOf, ENTRY } from "./catalog.js";
import { surfaceOf } from "./surface.js";
import { useMap, ROLES, isAdopted } from "./store.js";
import { Patch } from "./Patch.jsx";
import { TerrainLobe, RISERS } from "./Terrain.jsx";
import { isCover, isRoad, frameOf, toLocal, fromLocal, roadKnots, coverLobes } from "../runtime/cover.js";
import { isTerrain, terrainLobes, terrainField } from "../runtime/terrain.js";
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
  "shadow-normalBias": 0.04,
};

// THE TERRAIN: a game's ground, as it exported it (a glb in the map's
// folder, named by map.terrain), loaded here. Its "ground:…" meshes are what
// things stand on and the pointer hits; the rest is only seen.
//
// Beside it the game may leave adopt.json: its own houses and trees as
// placements, to be picked up and moved here. A map that has none of them
// yet (and has sent none away) takes them all as the terrain loads, so the
// editor shows the world as the game has it; after that they are offered
// by a button (Panel.jsx), in case the game grew new ones.
export const useTerrain = create(() => ({ key: null, object: null, ground: [], status: "", offer: [] }));
function Terrain() {
  const folder = useMap((s) => s.map.folder);
  const name = useMap((s) => s.map.terrain);
  const reload = useTerrain((s) => s.key);
  const object = useTerrain((s) => s.object);
  const seen = useRef(null); // the reload key already answered: a folder or name change is not a reload
  useEffect(() => {
    if (!name) return useTerrain.setState({ object: null, ground: [], status: "", offer: [] });
    let gone = false;
    const asked = reload !== null && reload !== seen.current;
    seen.current = reload;
    const where = folder || "maps";
    useTerrain.setState({ status: `loading ${name}.glb from ${where}…` });
    fetch(`/__maps/load?${new URLSearchParams({ to: folder, name: "adopt" })}&t=${Date.now()}`)
      .then((r) => (r.ok ? r.json() : { placements: [] }))
      .then(({ placements: offer }) => {
        if (gone) return;
        useTerrain.setState({ offer });
        const M = useMap.getState().map;
        const untouched = !M.placements.some((p) => isAdopted(p.id)) && !(M.dismissed ?? []).length;
        if (untouched && offer.length) {
          const n = useMap.getState().adopt(offer);
          useMap.getState().say(`took the game's ${n} houses and trees onto the map: move them as you like`);
        }
      })
      .catch(() => {});
    const url = `/__maps/load?${new URLSearchParams({ to: folder, name, kind: "glb" })}&t=${Date.now()}`;
    new GLTFLoader().loadAsync(url).then(
      (gltf) => {
        if (gone) return;
        const ground = [];
        let meshes = 0;
        gltf.scene.traverse((o) => {
          if (!o.isMesh) return;
          meshes++;
          o.castShadow = o.receiveShadow = true;
          if (o.material) {
            o.material.roughness = 1;
            o.material.metalness = 0;
          }
          if (o.name.startsWith("ground")) {
            // a bounds tree, so the thousand rays a patch drops onto the ground are quick
            o.geometry.boundsTree = new MeshBVH(o.geometry);
            o.raycast = acceleratedRaycast;
            ground.push(o);
          }
        });
        gltf.scene.updateWorldMatrix(true, true);
        // The ground you see is the snapshot's, so the map's radius is the snapshot's:
        // the median distance of its vertices from the middle (the cliffs, if
        // any are in it, are a few points of it). Written into the map, so the
        // game, which builds its ball from the map's radius, matches what is drawn.
        const lengths = [];
        const v = new THREE.Vector3();
        for (const o of ground) {
          const at = o.geometry.attributes.position;
          const step = Math.max(1, Math.floor(at.count / 4000));
          for (let i = 0; i < at.count; i += step) lengths.push(v.fromBufferAttribute(at, i).applyMatrix4(o.matrixWorld).length());
        }
        if (lengths.length) {
          lengths.sort((a, b) => a - b);
          const radius = Math.round(lengths[lengths.length >> 1] * 100) / 100;
          if (radius >= 4 && Math.abs(radius - useMap.getState().map.surface.radius) > 0.01) {
            useMap.getState().setSurface({ radius });
            useMap.getState().say(`planet radius set to ${radius}, the snapshot's: the game builds its ball from it`);
          }
        }
        useTerrain.setState({ object: gltf.scene, ground, status: `${name}.glb from ${where}: ${meshes} meshes, ${ground.length} ground` });
        if (asked) useMap.getState().say(`terrain loaded again from ${where}: ${meshes} meshes`);
      },
      (e) => {
        if (gone) return;
        const msg = String(e.message ?? e);
        const status = /404/.test(msg)
          ? `no ${name}.glb in ${where}: set the folder to the game's maps folder (../Car/maps), or export one from the game at index.html?terrain while this runs`
          : `no terrain: ${msg.split("\n")[0]}`;
        useTerrain.setState({ object: null, ground: [], status });
        if (asked) useMap.getState().say(status);
      },
    );
    return () => {
      gone = true;
    };
  }, [folder, name, reload]);
  return object ? <primitive object={object} /> : null;
}

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
export const useSurface = () => {
  const spec = useMap((s) => s.map.surface);
  const ground = useTerrain((s) => s.ground);
  const terrainKey = useMap((s) => terrainKeyOf(s.map.placements));
  const field = useMemo(() => terrainField(terrainLobes(useMap.getState().map.placements, spec.radius), spec.radius), [terrainKey, spec.radius]);
  useEffect(() => useField.setState({ field }), [field]);
  return useMemo(() => surfaceOf(spec, ground, field, () => [...RISERS]), [spec.kind, spec.radius, ground, field]);
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
// ground under it changes (a cliff dragged, the snapshot reloaded) the group
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
  const userData = ghost ? {} : { mm: 1, entry: p.entry, args: p.args, dir: p.dir, yaw: p.yaw, scale: p.scale, lift: p.lift, role, ...(p.knots ? { knots: p.knots, closed: !!p.closed } : {}) };
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

// The drag in hand: which placement, where the pointer went down, and the
// placements as they were when it began, for one undo step at the end. A
// press that moves under SLACK pixels is a click, and moves nothing.
const SLACK = 4;
let drag = null;
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
  const { camera, gl, controls } = useThree();
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
    // A press that began on the canvas: where, and whether it began on a
    // thing (the thing's own handler has started a drag by then).
    let press = null;
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
      if (press?.pen && !drag) {
        if (Math.hypot(ev.clientX - press.x, ev.clientY - press.y) < SLACK && !press.pen.id) return;
        return pen(ev);
      }
      if (press?.draw && !drag) {
        if (Math.hypot(ev.clientX - press.x, ev.clientY - press.y) < SLACK && !press.draw.id) return;
        return draw(ev);
      }
      if (drag) {
        if (!drag.moved && Math.hypot(ev.clientX - drag.x, ev.clientY - drag.y) < SLACK) return;
        const dir = hitUnder(ev);
        if (!dir) return;
        if (controls) controls.enabled = false;
        drag.moved = true;
        if (drag.knots0) dragRoad(dir);
        else S.patchLive(drag.id, { dir });
      } else if (S.placing) {
        S.setHover(hitUnder(ev));
      }
    };
    const onUp = (ev) => {
      const onThing = !!drag;
      if ((press?.draw && !press.draw.id) || (press?.pen && !press.pen.id)) if (controls) controls.enabled = true; // a press that drew nothing
      if (drag) {
        if (controls) controls.enabled = true;
        if (drag.moved) useMap.setState((s) => ({ undo: [...s.undo.slice(-99), drag.before], redo: [], dirty: true }));
        drag = null;
      }
      if (!press) return;
      const still = Math.hypot(ev.clientX - press.x, ev.clientY - press.y) < SLACK;
      const drawn = press.draw?.id;
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
        S.endLive();
        S.say("");
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
        const id = S.place(S.placing, dir);
        if (!ev.shiftKey) useMap.setState({ placing: null, hover: null, selected: id });
      } else if (!onThing) {
        S.select(null); // a click on bare ground unpicks
      }
    };
    const onDown = (ev) => {
      const S = useMap.getState();
      if (ev.button === 2 && S.placing) return S.stopPlacing();
      if (ev.button === 0) {
        press = { x: ev.clientX, y: ev.clientY };
        // placing a patch, a press on the ground may be the start of a drawing (seen
        // here in the capture phase, so the orbit is stopped before it takes the press)
        if (S.placing && (isCover(S.placing) || isTerrain(S.placing))) {
          const anchor = hitUnder(ev);
          if (anchor) {
            if (isRoad(S.placing)) press.pen = { anchor, id: null, knots: null };
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
  return (
    <group position={position} quaternion={quaternion}>
      <mesh rotation-x={-Math.PI / 2} renderOrder={5}>
        <ringGeometry args={[radius, radius + 0.12, 64]} />
        <meshBasicMaterial color="#6B86A8" side={THREE.DoubleSide} depthTest={false} transparent opacity={0.9} />
      </mesh>
    </group>
  );
}

// The ghost: the entry being placed, following the pointer over the ground.
function Ghost({ surface }) {
  const placing = useMap((s) => s.placing);
  const hover = useMap((s) => s.hover);
  if (!placing || !hover) return null;
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
function bumpyBall(R, bumpiness, roadDistance = null) {
  const g = new THREE.SphereGeometry(R, 128, 64);
  if (!(bumpiness > 0) || !(CLAY_BUMP?.amplitude > 0)) return g;
  const P = g.attributes.position;
  const d = new THREE.Vector3();
  for (let i = 0; i < P.count; i++) {
    d.fromBufferAttribute(P, i).normalize();
    const f = bumpAt(CLAY_BUMP, d.x * CLAY.lumps, d.y * CLAY.lumps, d.z * CLAY.lumps) / CLAY_BUMP.amplitude;
    let flat = 0;
    if (roadDistance) {
      const away = roadDistance(d) - ROAD_FLAT.verge;
      flat = away <= 0 ? 1 : away >= ROAD_FLAT.blend ? 0 : (1 - away / ROAD_FLAT.blend) ** 2 * (3 - 2 * (1 - away / ROAD_FLAT.blend));
    }
    d.multiplyScalar(R - CLAY.depth * bumpiness * Math.max(0, -f) * (1 - flat));
    P.setXYZ(i, d.x, d.y, d.z);
  }
  g.computeVertexNormals();
  return g;
}
function Planet({ surface, color }) {
  const R = surface.radius;
  const shown = !surface.hasTerrain;
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
  const ball = useMemo(() => bumpyBall(R, bumpiness, roads), [R, bumpiness, roads]);
  return (
    <group visible={shown}>
      <mesh receiveShadow geometry={ball}>
        <meshStandardMaterial color={color} {...HOLED} />
      </mesh>
      {/* a faint graticule, for bearings */}
      <mesh scale={1.002}>
        <sphereGeometry args={[R, 24, 12]} />
        <meshBasicMaterial color="#1C1B19" wireframe transparent opacity={0.07} depthWrite={false} />
      </mesh>
    </group>
  );
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
        <Terrain />
        <Placements surface={surface} />
        <Ghost surface={surface} />
        <FlatRing surface={surface} />
        <Interaction surface={surface} />
        {/* minDistance is from the TARGET, which "look at" puts on the ground, so it stays small */}
        <OrbitControls makeDefault minDistance={2} maxDistance={surface.radius * 8} enableDamping={false} />
      </Canvas>
    </div>
  );
}
