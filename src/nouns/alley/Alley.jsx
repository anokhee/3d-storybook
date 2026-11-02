import React, { useEffect, useMemo } from "react";
import * as THREE from "three";

import { merge } from "../../world/merge.js";
import { solid } from "../../world/palette.js";
import { unlitMat } from "../../adjectives/unlit/material.js";
import { litMat } from "../../adjectives/lit/material.js";
import MetalDoor, { archOutline } from "../metalDoor/MetalDoor.jsx";
import Shelving from "../shelving/Shelving.jsx";
import Chair from "../chair/Chair.jsx";
import WallClock from "../wallClock/WallClock.jsx";
import PendantLight from "../pendantLight/PendantLight.jsx";
import { ALLEY, alleyPlanOf } from "./objects.js";
import { PlacedObject } from "../shopInterior/ShopInterior.jsx";

// One alleyway — see ALLEY: paving running back from the street with a
// gutter down its middle, a brick wall closing the far end with a Metal
// Door in it and a little lamp over that, wheelie bins against its sides
// (and side walls of its own, when it stands alone); and, with its `room`
// on, the warehouse the door opens on. `swing`, if given, a ref saying how
// far the door is open (-1 to 1, see MetalDoor): the street's walker
// swings it as it comes up to it. `layout`, if given, is laid over the
// bins and the room's things in place of the config's own (ALLEY's
// `layout`; the interiors editor's), and `pickItem(item, event)`, if
// given, is called when one of them is pressed on (the editor picks it up).
export default function Alley({ config, swing, layout, pickItem }) {
  const A = useMemo(() => merge(ALLEY, config), [config]);
  const { width: w, deep, wall: Wl, colors: C } = A;
  const plan = useMemo(() => alleyPlanOf(A, layout ?? A.layout), [A, layout]);
  const { items, warehouse: H } = plan;
  const gate = Wl.gate, dw = plan.room.door.width, dh = plan.room.door.height;
  // the end wall: the alley's width, or the warehouse's front, its width
  // and height; the doorway cut up through it from the ground
  // (the room's, out over its side walls' thickness, so the corners close)
  const EW = H ? H.W + 0.4 : w, EH = H ? Math.max(Wl.height, H.H) : Wl.height;
  const wallGeo = useMemo(() => {
    const s = new THREE.Shape().moveTo(-EW / 2, 0);
    if (gate) archOutline(s, -dw / 2, dw / 2, dh, A.door.curve);
    s.lineTo(EW / 2, 0).lineTo(EW / 2, EH).lineTo(-EW / 2, EH).closePath();
    const g = new THREE.ExtrudeGeometry(s, { depth: Wl.thick, bevelEnabled: false, curveSegments: 16 });
    g.translate(0, 0, -deep);
    return g;
  }, [EW, EH, gate, dw, dh, A.door.curve, Wl.thick, deep]);
  useEffect(() => () => wallGeo.dispose(), [wallGeo]);
  // the mortar lines on its face, across the alley only (the rest of the
  // face is behind the alley's walls), broken round the doorway
  const courses = useMemo(() => {
    const out = [];
    for (let y = Wl.course; y < EH - 0.05; y += Wl.course) {
      if (gate && y < dh) [[-w / 2, -dw / 2 - 0.06], [dw / 2 + 0.06, w / 2]].forEach(([a, b]) => b - a > 0.02 && out.push({ y, x: (a + b) / 2, len: b - a }));
      else out.push({ y, x: 0, len: w });
    }
    return out;
  }, [Wl.course, EH, w, gate, dw, dh]);
  const door = useMemo(() => ({
    width: dw, height: dh, curve: A.door.curve, wall: Wl.thick, hinge: 1,
    frame: { color: C.mortar }, colors: { steel: A.door.steel }, window: { shape: "square", size: 0.2, at: Math.min(1.45, dh - 0.35) },
  }), [dw, dh, A.door, Wl.thick, C.mortar]);
  const m = (c) => unlitMat(c);
  return (
    <group>
      {/* the paving, and the gutter down its middle */}
      <mesh position={[0, -0.005, -deep / 2]} material={m(C.paving)} receiveShadow>
        <boxGeometry args={[w, 0.01, deep]} />
      </mesh>
      <mesh position={[0, 0.002, -deep / 2]} rotation-x={-Math.PI / 2} material={m(C.gutter)}>
        <planeGeometry args={[Math.min(A.gutter, w * 0.2), deep]} />
      </mesh>
      {/* the wall at the far end, its mortar, its door and lamp */}
      <mesh geometry={wallGeo} material={m(C.brick)} castShadow receiveShadow />
      {courses.map((c, i) => (
        <mesh key={i} position={[c.x, c.y, -deep + Wl.thick + 0.005]} material={m(C.mortar)}>
          <boxGeometry args={[c.len, 0.03, 0.01]} />
        </mesh>
      ))}
      {gate && (
        <group position-z={-deep + Wl.thick / 2}>
          <MetalDoor config={door} swing={swing} />
        </group>
      )}
      {Wl.lamp && (
        <mesh position={[0, Math.min(dh + 0.3, EH - 0.2), -deep + Wl.thick + 0.09]} material={litMat(C.lamp)}>
          <sphereGeometry args={[0.08, 12, 10]} />
        </mesh>
      )}
      {/* the bins against its sides, and the room's things (see Thing) */}
      {items.map((it) => {
        const piece = <Thing key={it.id} it={it} R={A.room} H={H} />;
        return pickItem ? <group key={it.id} onPointerDown={(e) => pickItem(it, e)}>{piece}</group> : piece;
      })}
      {/* side walls, for an alley on its own: up to the end wall's face, not
          through it (they would show on the far side, in its room) */}
      {A.sides.on && [-1, 1].map((e) => (
        <mesh key={e} position={[e * (w / 2 + 0.1), A.sides.height / 2, (-deep + Wl.thick) / 2]} material={m(C.side)} castShadow receiveShadow>
          <boxGeometry args={[0.2, A.sides.height, deep - Wl.thick]} />
        </mesh>
      ))}
      {H && <Warehouse H={H} R={A.room} />}
    </group>
  );
}

// ONE OF THE ALLEY'S THINGS, from its plan (alleyPlanOf's items): a wheelie
// bin ("bin": `size` across, in its `color`), the warehouse's shelving of
// boxes (Furniture/Storage/Shelving), a stack of crates (`n` high), the
// interrogation room's chair (Furniture/Seating/Chair), the bare bulb
// (Lighting/Pendant Light: on its `cord` from the ceiling `y`, dimmer when
// `dim`) and the clock on the back wall that has stopped. Drawn again only
// when its own item changes (by content, as a Shop Interior's furniture is)
const S = 0.27; // the library's furniture, at the size the shops have it
const crateEdge = new THREE.MeshBasicMaterial({ color: "#5E4630" });
const Thing = React.memo(ThingOf, (a, b) => a.R === b.R && a.H === b.H && (a.it === b.it || JSON.stringify(a.it) === JSON.stringify(b.it)));
function ThingOf({ it, R, H }) {
  const m = (c) => unlitMat(typeof c === "string" ? solid(c) : c);
  const shelving = useMemo(() => (it.t === "shelving" ? { width: it.width, depth: it.depth, style: "boxes", shelves: { count: 4, from: 0.25, every: 0.5 }, seed: it.seed } : null), [it.t, it.width, it.depth, it.seed]);
  const bulb = useMemo(() => (it.t === "bulb" ? { cord: { length: it.cord }, glow: it.dim ? { ...R.glow, intensity: R.glow.intensity * 0.7 } : R.glow } : null), [it.t, it.cord, it.dim, R.glow]);
  const clock = useMemo(() => ({ hang: (it.y ?? 2.0) / S, radius: 0.9, run: false }), [it.y]);
  switch (it.t) {
    case "object":
      // any object of the catalog (see world/placed.js), at the shops' furniture scale unless it says
      return <PlacedObject it={it} S={S} />;
    case "bin":
      return (
        <group position={[it.x, 0, it.z]} rotation-y={it.yaw}>
          <mesh position-y={0.42} material={m(it.color)} castShadow>
            <boxGeometry args={[it.size, 0.84, it.size]} />
          </mesh>
          <mesh position-y={0.87} material={m(it.color)} castShadow>
            <boxGeometry args={[it.size + 0.05, 0.05, it.size + 0.05]} />
          </mesh>
        </group>
      );
    case "shelving":
      return <group position={[it.x, 0, it.z]} rotation-y={it.yaw}><Shelving config={shelving} /></group>;
    case "crate":
      return (
        <group position={[it.x, 0, it.z]} rotation-y={it.yaw}>
          {Array.from({ length: it.n }, (_, k) => (
            <group key={k} position-y={it.size * (k + 0.5)} rotation-y={(k % 2) * 0.12}>
              <mesh material={m(R.crate)} castShadow receiveShadow><boxGeometry args={[it.size, it.size * 0.98, it.size]} /></mesh>
              <mesh material={crateEdge}><boxGeometry args={[it.size * 1.01, it.size * 0.12, it.size * 1.01]} /></mesh>
            </group>
          ))}
        </group>
      );
    case "chair":
      return <group position={[it.x, 0, it.z]} rotation-y={it.yaw} scale={S}><Chair config={{}} /></group>;
    case "bulb":
      return <group position={[it.x, it.y ?? H?.H ?? R.height, it.z]}><PendantLight config={bulb} /></group>;
    case "clock":
      return <group position={[it.x, 0, it.z]} rotation-y={it.yaw} scale={S}><WallClock config={clock} /></group>;
    default:
      return null;
  }
}

// THE ROOM behind an alley's door (see ALLEY's `room`): its concrete floor
// and walls. What stands in it — the shelving of boxes, the crates in the
// corners, the bare bulb, the interrogation room's chair and stopped clock
// — are the plan's items, drawn with the bins (see Thing).
function Warehouse({ H, R }) {
  const m = (c) => unlitMat(c);
  return (
    <group>
      <mesh position={[0, -0.005, (H.z0 + H.zb) / 2]} material={m(R.floor)} receiveShadow>
        <boxGeometry args={[H.W, 0.01, H.D]} />
      </mesh>
      {[-1, 1].map((e) => (
        <mesh key={e} position={[e * (H.W / 2 + 0.1), H.H / 2, (H.z0 + H.zb) / 2]} material={m(R.walls)} castShadow receiveShadow>
          <boxGeometry args={[0.2, H.H, H.D]} />
        </mesh>
      ))}
      <mesh position={[0, H.H / 2, H.zb - 0.1]} material={m(R.walls)} castShadow receiveShadow>
        <boxGeometry args={[H.W + 0.4, H.H, 0.2]} />
      </mesh>
    </group>
  );
}
