// THE SCENE: the room in hand (a Shop Interior, or the Alleyway) with its
// layout laid over it, seen from out front as the storybook's "front" view
// has it; the pointer that picks a piece of furniture up and drags it
// about the floor, and the keys that nudge, turn, copy and delete it.
// Lights and sky are the library stage's toon look at midday.
import React, { Suspense, useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { Canvas, useThree } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";

import { LOOKS } from "../.storybook/stage.jsx";
import ShopInterior from "../src/nouns/shopInterior/ShopInterior.jsx";
import Alley from "../src/nouns/alley/Alley.jsx";
import { useEditor } from "./store.js";
import { ROOM } from "./shops.js";

const SHADOW = {
  "shadow-mapSize": [2048, 2048],
  "shadow-camera-left": -12,
  "shadow-camera-right": 12,
  "shadow-camera-top": 12,
  "shadow-camera-bottom": -12,
  "shadow-camera-near": 1,
  "shadow-camera-far": 120,
  "shadow-bias": -0.0002,
  "shadow-normalBias": 0.04,
};

// A room that throws (a knob turned to a size it cannot build) says so in
// the status line, not a blank page
class Guard extends React.Component {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch(e) {
    useEditor.getState().say(`${String(e.message ?? e).split("\n")[0]}`);
  }
  componentDidUpdate(prev) {
    if (this.state.failed && (prev.config !== this.props.config || prev.layout !== this.props.layout)) this.setState({ failed: false });
  }
  render() {
    return this.state.failed ? null : this.props.children;
  }
}

// The drag in hand: which item, where it was grabbed (the pointer's offset
// from its foot, on the floor), and whether it has moved yet. A press that
// moves under SLACK pixels is a click.
const SLACK = 4;
let drag = null;
let press = null;

// THE ROOM, from the config in hand (the knobs) and the layout: the config
// is made again only when a knob turns, so a drag re-lays only the
// furniture (the Shop Interior draws again just the piece that moved)
function Room() {
  const controls = useThree((s) => s.controls);
  const roomId = useEditor((s) => s.roomId);
  const args = useEditor((s) => s.args);
  const layout = useEditor((s) => s.layout);
  const room = ROOM[roomId];
  const config = useMemo(() => room.configOf(args), [room, args]);
  const pick = (it, e) => {
    const S = useEditor.getState();
    if (S.placing || e.button !== 0) return;
    e.stopPropagation();
    // (the orbit is stopped here, before its own listener sees the press: a thing picked up is not the world turned)
    if (controls) controls.enabled = false;
    S.select(it.id);
    const at = e.point; // where on the thing the pointer landed
    drag = { id: it.id, x: e.clientX, y: e.clientY, moved: false, off: at ? [it.x - at.x, it.z - at.z] : [0, 0], atY: at?.y ?? 0 };
  };
  return (
    <Guard config={config} layout={layout}>
      <Suspense fallback={null}>
        {room.alley ? <Alley config={config} layout={layout} pickItem={pick} /> : <ShopInterior config={config} layout={layout} pickItem={pick} />}
      </Suspense>
    </Guard>
  );
}

// Pointer and keyboard, on the window, so a drag keeps going off the thing
function Interaction() {
  const { camera, gl, controls } = useThree();
  const ray = useMemo(() => new THREE.Raycaster(), []);
  const ndc = useMemo(() => new THREE.Vector2(), []);
  const hit = useMemo(() => new THREE.Vector3(), []);

  // where the pointer's ray meets the floor (y = `atY`: a dragged thing is
  // carried on the level it was grabbed at, so a pendant light's offset holds)
  const floorUnder = (ev, atY = 0) => {
    const r = gl.domElement.getBoundingClientRect();
    ndc.set(((ev.clientX - r.left) / r.width) * 2 - 1, -((ev.clientY - r.top) / r.height) * 2 + 1);
    ray.setFromCamera(ndc, camera);
    const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -atY);
    return ray.ray.intersectPlane(plane, hit) ? [hit.x, hit.z] : null;
  };

  useEffect(() => {
    const el = gl.domElement;
    const onDown = (ev) => {
      const S = useEditor.getState();
      if (ev.button === 2 && S.placing) return S.stopPlacing();
      if (ev.button === 0) press = { x: ev.clientX, y: ev.clientY };
    };
    const onMove = (ev) => {
      const S = useEditor.getState();
      if (drag) {
        if (!drag.moved && Math.hypot(ev.clientX - drag.x, ev.clientY - drag.y) < SLACK) return;
        const at = floorUnder(ev, drag.atY);
        if (!at) return;
        if (!drag.moved) S.beginLive();
        drag.moved = true;
        S.moveLive(drag.id, at[0] + drag.off[0], at[1] + drag.off[1], ev.shiftKey);
      } else if (S.placing) {
        S.setHover(floorUnder(ev));
      }
    };
    const onUp = (ev) => {
      const S = useEditor.getState();
      const onThing = !!drag;
      if (drag) {
        if (controls) controls.enabled = true;
        if (drag.moved) S.endLive();
        drag = null;
      }
      if (!press) return;
      const still = Math.hypot(ev.clientX - press.x, ev.clientY - press.y) < SLACK;
      press = null;
      if (!still) return;
      if (S.placing) {
        const at = floorUnder(ev);
        if (!at) return;
        const B = S.bounds();
        const id = S.add({ t: S.placing.t, ...S.placing.make(B) }, at[0], at[1]);
        if (S.placing.snap) S.snapToWall(id); // (a door goes straight to the nearest wall)
        if (!ev.shiftKey) S.stopPlacing();
        else S.setHover(null);
        return;
      }
      if (!onThing) S.select(null);
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
  }, [gl, camera, controls]);

  // THE VIEWS: "in", from out front and well above, over the awning and
  // down into the room as into a dolls' house; "plan", straight down on
  // it; "street", from the pavement, as the storybook's front view has it
  const view = (which = "in") => {
    const S = useEditor.getState(), B = S.bounds();
    const mid = (B.z0 + Math.min(B.z1, 0)) / 2, span = Math.max(B.x1 - B.x0, Math.min(B.z1, 0) - B.z0);
    if (which === "plan") {
      controls.target.set(0, 0, mid);
      camera.position.set(0, span * 1.35 + 2, mid + 0.01);
    } else if (which === "street") {
      controls.target.set(0, 0.9, mid + 0.5);
      camera.position.set(0, 2.2, Math.max(6, span * 1.1) + 1.5);
    } else {
      controls.target.set(0, 0.4, mid);
      camera.position.set(0, span * 1.1 + 3, span * 0.9 + 3);
    }
    controls.update();
  };
  useEffect(() => {
    if (!controls) return;
    useEditor.setState({ focus: view });
    view();
    window.__ie = { ...(window.__ie ?? {}), camera, gl, controls, floorUnder, get drag() { return drag; } };
  }, [controls]);
  // a new room: the camera back out front
  const roomId = useEditor((s) => s.roomId);
  useEffect(() => { if (controls) view(); }, [roomId]);

  useEffect(() => {
    const onKey = (ev) => {
      const t = ev.target;
      const typing = t && ((t.tagName === "INPUT" && !["range", "checkbox", "color"].includes(t.type)) || t.tagName === "SELECT" || t.tagName === "TEXTAREA");
      if (typing) return;
      const S = useEditor.getState();
      const meta = ev.metaKey || ev.ctrlKey;
      const key = ev.key.toLowerCase();
      if (ev.key === "Escape") return S.placing ? S.stopPlacing() : S.select(null);
      if (meta && key === "z") { ev.preventDefault(); return ev.shiftKey ? S.redoStep() : S.undoStep(); }
      if (meta && key === "y") { ev.preventDefault(); return S.redoStep(); }
      if (key === "g" && !meta) return S.setGrid(!S.grid);
      if (key === "f") return S.focus?.();
      const sel = S.selected && S.item(S.selected);
      if (!sel) return;
      if (meta && key === "d") { ev.preventDefault(); return S.duplicate(sel.id); }
      if (ev.key === "Delete" || ev.key === "Backspace") return S.remove(sel.id);
      const turn = ((ev.shiftKey ? 5 : 15) * Math.PI) / 180;
      if (key === "q") return S.patch(sel.id, { yaw: +((sel.yaw ?? 0) + turn).toFixed(4) });
      if (key === "e") return S.patch(sel.id, { yaw: +((sel.yaw ?? 0) - turn).toFixed(4) });
      if (key === "w") return S.snapToWall(sel.id);
      const step = ev.shiftKey ? 0.25 : 0.05;
      // the arrows nudge along the floor as the eye reads them from out front: up is into the room
      if (ev.key.startsWith("Arrow")) {
        ev.preventDefault();
        const B = S.bounds();
        const dx = ev.key === "ArrowRight" ? step : ev.key === "ArrowLeft" ? -step : 0;
        const dz = ev.key === "ArrowUp" ? -step : ev.key === "ArrowDown" ? step : 0;
        return S.patch(sel.id, { x: +Math.min(B.x1, Math.max(B.x0, sel.x + dx)).toFixed(2), z: +Math.min(B.z1, Math.max(B.z0, sel.z + dz)).toFixed(2) });
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [camera]);
  return null;
}

// A ring on the floor round the picked item, and a fainter one under the
// pointer while placing
function Ring({ at, color, radius = 0.42, opacity = 0.9 }) {
  if (!at) return null;
  return (
    <mesh position={[at[0], 0.025, at[1]]} rotation-x={-Math.PI / 2} renderOrder={5}>
      <ringGeometry args={[radius, radius + 0.05, 48]} />
      <meshBasicMaterial color={color} side={THREE.DoubleSide} depthTest={false} transparent opacity={opacity} />
    </mesh>
  );
}
function Marks() {
  const selected = useEditor((s) => s.selected);
  const layout = useEditor((s) => s.layout);
  const args = useEditor((s) => s.args);
  const roomId = useEditor((s) => s.roomId);
  const hover = useEditor((s) => s.hover);
  const placing = useEditor((s) => s.placing);
  // (the plan, for the picked item's foot; made again when anything in it changes)
  const it = useMemo(() => (selected ? useEditor.getState().item(selected) : null), [selected, layout, args, roomId]);
  return (
    <>
      {it && <Ring at={[it.x, it.z]} color="#4F6E86" />}
      {it && it.y != null && it.y > 0.5 && (
        // what hangs: a thread down from it to its ring, so the eye finds the floor under it
        <mesh position={[it.x, it.y / 2, it.z]}>
          <boxGeometry args={[0.01, it.y, 0.01]} />
          <meshBasicMaterial color="#4F6E86" transparent opacity={0.5} depthTest={false} />
        </mesh>
      )}
      {placing && hover && <Ring at={hover} color="#8E7352" radius={0.3} opacity={0.7} />}
    </>
  );
}

// A faint grid on the floor, half a unit square, over the room's reach
function Grid() {
  const grid = useEditor((s) => s.grid);
  const roomId = useEditor((s) => s.roomId);
  const args = useEditor((s) => s.args);
  const B = useMemo(() => useEditor.getState().bounds(), [roomId, args]);
  if (!grid) return null;
  const size = Math.ceil(Math.max(B.x1 - B.x0, B.z1 - B.z0) * 2) / 2 + 1;
  return (
    <gridHelper args={[size, size * 2, "#6B86A8", "#9FB3C6"]} position={[0, 0.035, (B.z0 + B.z1) / 2]} material-transparent material-opacity={0.4} raycast={() => {}} />
  );
}

export default function Scene() {
  const Look = LOOKS.toon;
  const [t] = useState(1);
  return (
    <div id="world">
      <Canvas flat shadows="pcf" dpr={[1, 2]} camera={{ fov: 40, near: 0.05, far: 200, position: [0, 4.5, 9] }}>
        <color attach="background" args={[Look.sky(t)]} />
        <Look.Lights t={t} shadow={SHADOW} />
        <Room />
        <Grid />
        <Marks />
        <Interaction />
        <OrbitControls makeDefault minDistance={1} maxDistance={40} enableDamping={false} />
      </Canvas>
    </div>
  );
}
