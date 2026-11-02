import { useEffect, useMemo } from "react";
import * as THREE from "three";

import { merge } from "../../world/merge.js";
import { hue } from "../../world/palette.js";
import { unlitMat } from "../../adjectives/unlit/material.js";
import { toon } from "../../adjectives/unlit/toon.js";
import { SHOPFRONT, SHOP_WIDTHS, shopFloorOf } from "./objects.js";
import Opening from "../../interior/Opening.jsx";
import Molding from "../../interior/Molding.jsx";
import { INDOOR_WINDOW, DWELLING } from "../house/objects.js";
import { Door } from "../house/House.jsx";
import { Arch } from "../house/Panes.jsx";
import { litMat } from "../../adjectives/lit/material.js";
import Sign from "../sign/Sign.jsx";
import { STRAIGHT } from "../lettering/objects.js";
import WindowBox from "../windowBox/WindowBox.jsx";
import Bench from "../bench/Bench.jsx";
import CafeTable from "../cafeTable/CafeTable.jsx";
import { placeAt } from "../tableSetting/cafePlace.jsx";
import Garland from "../garland/Garland.jsx";
import { wallWithHoles, displayOf } from "./display.js";
import SwingLeaf from "./SwingLeaf.jsx";
import Enclosure from "../enclosure/Enclosure.jsx";
import { ENCLOSURE } from "../enclosure/objects.js";
import { FlatGround } from "../planet/OnPlanet.jsx";
import { pavingMat } from "../../world/paving.js";
import { crockery, CROCKERY_SCALE } from "../shelving/crockery.js";
import Crockery from "../shelving/Crockery.jsx";
import { rngOf, hashOf } from "../shopInterior/objects.js";
import ShadowSpirit from "../anthro/ShadowSpirit.jsx";

// The shop's room, seen from inside (through the windows): its own colour
// at any hour, warm, as a lit shop is in the evening. And the display's
// goods, in their vertex colours, likewise.
const rooms = new Map();
const roomMat = (swatch) => {
  if (!rooms.has(swatch.hex)) rooms.set(swatch.hex, new THREE.MeshBasicMaterial({ color: hue(swatch), side: THREE.BackSide }));
  return rooms.get(swatch.hex);
};
const goodsMat = new THREE.MeshBasicMaterial({ vertexColors: true });

// A window: the library's own (Fixtures/Windows/… in the storybook —
// Opening and its Molding, built as stories/helpers/windows.jsx builds
// them), `width` by `height` with its foot at y = 0 and its back on the
// wall at z = 0. `look` says which of the family it is: `style` "plain"
// (one clear pane) or "pane" (`panes` of them, divided by bars),
// `topCurve` and `bottomCurve` its top and bottom edges, each 0 square to
// 1 a half-round arch, `frame` and `trim` how wide its bezel and moulding
// are; both in the `trim` colour. The pane is the house's lit one. A shop
// window and a story window (SHOPFRONT's) are each one of these.
// `glass` ({ light, color }), when given, makes the pane see-through glass
// instead: the vending machine's glowing glass (VENDING_MACHINE.window.glass).
export function ShopfrontWindow({ width, height, look, trim, glass }) {
  const top = Math.min(1, Math.max(0, look.topCurve ?? 0)), bottom = Math.min(1, Math.max(0, look.bottomCurve ?? 0));
  const O = useMemo(() => ({
    ...INDOOR_WINDOW,
    width,
    height,
    topCurve: top,
    bottomCurve: bottom,
    style: look.style,
    panes: look.panes,
    frame: { ...INDOOR_WINDOW.frame, thickness: look.frame, depth: 0.08, color: trim },
    // see-through: no bezel slab behind the glass (it would wall the shop
    // off), the bars in the trim colour on their own, the moulding round it
    ...(glass ? { light: glass.light, color: glass.color, depth: 0.04, frame: null, bars: { color: trim, thickness: look.frame } } : {}),
  }), [width, height, top, bottom, look.style, look.panes, look.frame, trim, glass]);
  const T = useMemo(() => ({ thickness: look.trim, depth: 0.06, color: trim }), [look.trim, trim]);
  return (
    <group>
      <Opening O={O} />
      {/* the moulding springs from the same heights as the bezel */}
      {glass ? (
        <Molding width={width} height={height} topCurve={top} bottomCurve={bottom} closed frame={{ ...T, thickness: look.frame + look.trim, depth: 0.08 }} />
      ) : (
        <group position-y={-look.frame * bottom}>
          <Molding width={width + 2 * look.frame} height={height + look.frame * (top + bottom)} topCurve={top} bottomCurve={bottom} closed frame={T} />
        </group>
      )}
    </group>
  );
}

// One shopfront — see SHOPFRONT for its parts. Plain boxes, toon-lit like
// everything else, with the library's own windows (ShopfrontWindow above) in
// the shop window and upstairs. The door is set back `recess` in its
// doorway, behind the front.

// The glass: the toon light, see-through, one material per colour.
const glasses = new Map();
const glassMat = (swatch) => {
  if (!glasses.has(swatch.hex)) glasses.set(swatch.hex, toon(hue(swatch), { transparent: true, opacity: 0.4, depthWrite: false }));
  return glasses.get(swatch.hex);
};
const shine = toon(new THREE.Color("#FFFFFF"), { transparent: true, opacity: 0.55, depthWrite: false });
const mat = (c) => unlitMat(typeof c === "string" ? { hex: c } : c);

// A box by its middle and its size.
function Box({ at, size, color, material, shadow = true, rotation }) {
  return (
    <mesh position={at} rotation={rotation} material={material ?? mat(color)} castShadow={shadow} receiveShadow>
      <boxGeometry args={size} />
    </mesh>
  );
}

// A pane of glass, `w` by `h` about (x, y), at depth z, with two streaks
// of shine across it so it reads as glass.
export function Glass({ x, y, z, w, h, color }) {
  const s = Math.min(w, h);
  return (
    <group position={[x, y, z]}>
      <mesh material={glassMat(color)}>
        <planeGeometry args={[w, h]} />
      </mesh>
      <mesh position={[-w * 0.18, h * 0.08, 0.002]} rotation-z={0.7} material={shine}>
        <planeGeometry args={[s * 0.07, s * 0.9]} />
      </mesh>
      <mesh position={[-w * 0.05, h * 0.02, 0.002]} rotation-z={0.7} material={shine}>
        <planeGeometry args={[s * 0.035, s * 0.7]} />
      </mesh>
    </group>
  );
}

// The awning: stripes laid down its slope, a scalloped valance along its
// front, a triangle of cheek at each end. Mounted with its top edge at the
// front's y = 0, z = 0; `w` across.
export function Awning({ w, A, colors }) {
  const n = Math.max(3, Math.round(w / A.stripe));
  const sw = w / n;
  const len = Math.hypot(A.depth, A.drop), tilt = Math.atan2(A.drop, A.depth);
  const cheek = useMemo(() => {
    const shape = new THREE.Shape().moveTo(0, 0).lineTo(A.depth, -A.drop).lineTo(A.depth, -A.drop - A.valance).lineTo(0, -A.drop * 0.35);
    return new THREE.ExtrudeGeometry(shape, { depth: 0.03, bevelEnabled: false });
  }, [A.depth, A.drop, A.valance]);
  const colorOf = (i) => (i % 2 ? colors.stripe : colors.awning);
  return (
    <group>
      {Array.from({ length: n }, (_, i) => {
        const x = -w / 2 + (i + 0.5) * sw;
        return (
          <group key={i}>
            <Box at={[x, -A.drop / 2, A.depth / 2]} rotation={[tilt, 0, 0]} size={[sw + 0.002, 0.03, len]} color={colorOf(i)} shadow />
            {/* the valance: a flap, and a scallop hung under it */}
            <group position={[x, -A.drop, A.depth]}>
              <Box at={[0, -A.valance / 2, 0]} size={[sw + 0.002, A.valance, 0.03]} color={colorOf(i)} />
              <mesh position={[0, -A.valance, 0]} rotation-x={Math.PI / 2} material={mat(colorOf(i))} castShadow>
                <cylinderGeometry args={[sw / 2, sw / 2, 0.03, 16, 1, false, -Math.PI / 2, Math.PI]} />
              </mesh>
            </group>
          </group>
        );
      })}
      {[-1, 1].map((s) => (
        <mesh key={s} geometry={cheek} rotation-y={-Math.PI / 2} position={[s * (w / 2) + (s < 0 ? 0.03 : 0), 0, 0]} material={mat(colors.awning)} castShadow />
      ))}
    </group>
  );
}

// A PITCHED ROOF over the top of the walls (`top`), `roof.pitch` its slope
// (rise over run): facing "front", a gable end to the street — a triangle
// of wall over the front with a round window in it, the slopes running
// back from it; facing "side", the ridge along the street, the slopes to
// the front and back, a triangle of wall at each end. Slabs `thick`, out
// `overhang` past the walls (not past the sides in a terrace), in the roof
// colour, a trim band along the front eave.
function PitchedRoof({ W, D, top, roof: Rf, terrace, C, look }) {
  const front = Rf.facing !== "side";
  const half = front ? W / 2 : D / 2, rise = Rf.pitch * half, a = Math.atan2(rise, half);
  const over = Rf.overhang, sideOver = terrace ? 0 : over;
  const gable = useMemo(() => {
    const shape = new THREE.Shape().moveTo(-half, 0).lineTo(half, 0).lineTo(0, rise).closePath();
    const g = new THREE.ExtrudeGeometry(shape, { depth: front ? D : W, bevelEnabled: false });
    if (front) g.translate(0, 0, -D); // across x, back from the front
    else { g.rotateY(Math.PI / 2); g.translate(-W / 2, 0, -D / 2); } // across z, the length of the shop
    g.computeVertexNormals();
    return g;
  }, [front, half, rise, W, D]);
  useEffect(() => () => gable.dispose(), [gable]);
  // the slope's length, eave to ridge, and on past the eave
  const slope = Math.hypot(half, rise) + (front ? sideOver : over);
  const slabs = [-1, 1].map((e) => {
    // down the slope from the ridge, and out of it
    const dir = front ? [e * Math.cos(a), -Math.sin(a), 0] : [0, -Math.sin(a), e * Math.cos(a)];
    const out = front ? [e * Math.sin(a), Math.cos(a), 0] : [0, Math.cos(a), e * Math.sin(a)];
    const ridge = front ? [0, top + rise, -D / 2] : [0, top + rise, -D / 2];
    const at = ridge.map((v, i) => v + dir[i] * slope / 2 + out[i] * Rf.thick / 2);
    return front
      ? { at, rot: [0, 0, -e * a], size: [slope, Rf.thick, D + 2 * over] }
      : { at, rot: [e * a, 0, 0], size: [W + 2 * sideOver, Rf.thick, slope] };
  });
  const oculus = Math.min(0.55, rise * 0.45);
  // DORMERS, on a ridge along the street: `dormers` of them out of the
  // front slope, `dormer.back` up it from the eave, each a box of wall
  // with a story window in its face and a little gabled roof of its own
  // (this same roof, small, facing front) — no taller than the slope allows.
  const Dm = Rf.dormer, nDorm = front ? 0 : Math.max(0, Math.round(Rf.dormers ?? 0));
  const dormers = useMemo(() => {
    if (!nDorm) return [];
    const run = D / 2, upAt = (z) => top + rise * (z / run); // the slope's height, `z` back from the eave
    const dw = Math.min(Dm.width, (W - 0.4) / nDorm - 0.3);
    const yb = upAt(Dm.back);
    const dh = Math.min(Dm.height, (top + rise - yb) * 0.6);
    const tip = Dm.pitch * (dw / 2);
    const zBack = Math.min(run, ((yb + dh + tip - top) / rise) * run + 0.05);
    return dw < 0.4 || dh < 0.4 ? [] : Array.from({ length: nDorm }, (_, i) => ({
      x: -W / 2 + ((i + 0.5) * W) / nDorm, w: dw, yb, dh, z0: Dm.back, depth: zBack - Dm.back,
    }));
  }, [nDorm, D, top, rise, W, Dm.width, Dm.back, Dm.height, Dm.pitch]);
  return (
    <group>
      <mesh geometry={gable} position-y={top} material={mat(C.wall)} castShadow receiveShadow />
      {slabs.map((sl, i) => <Box key={i} at={sl.at} rotation={sl.rot} size={sl.size} color={C.roof} />)}
      <Box at={[0, top + 0.06, 0.04]} size={[W, 0.12, 0.1]} color={C.trim} />
      {dormers.map((d, i) => (
        <group key={`dormer${i}`} position={[d.x, 0, -d.z0]}>
          {/* its walls, from down inside the roof up to its eaves */}
          <Box at={[0, (top + d.yb + d.dh) / 2, -d.depth / 2]} size={[d.w, d.yb + d.dh - top, d.depth]} color={C.wall} />
          <group position={[0, d.yb + 0.12, 0]}>
            <ShopfrontWindow width={d.w - 2 * (look.frame + look.trim) - 0.12} height={d.dh - 2 * (look.frame + look.trim) - 0.2} look={look} trim={C.frame ?? C.trim} />
          </group>
          <PitchedRoof W={d.w} D={d.depth} top={d.yb + d.dh} terrace={false} C={C} look={look}
            roof={{ ...Rf, facing: "front", pitch: Dm.pitch, overhang: 0.07, thick: 0.06, dormers: 0 }} />
        </group>
      ))}
      {front && oculus > 0.2 && (
        <group position={[0, top + rise * 0.38 - oculus / 2, 0]}>
          <ShopfrontWindow width={oculus} height={oculus} look={{ style: "pane", panes: 4, topCurve: 1, bottomCurve: 1, frame: 0.05, trim: 0.06 }} trim={C.frame ?? C.trim} />
        </group>
      )}
    </group>
  );
}

// The garland along the shopfront: tied at points `every` apart across the
// awning's front edge, just under its valance (or across the sign band's
// foot, without an awning), sagging between them, bulbs on short strings.
export function ShopGarland({ S, W, P, under }) {
  const Gc = S.garland, A = S.awning;
  const w = W - 2 * P - 0.1;
  const { tops, ring } = useMemo(() => {
    const n = Math.max(2, Math.round(w / Gc.every) + 1);
    const y = A.on ? under + A.lift - A.drop - A.valance * 0.6 : under - 0.02;
    const z = A.on ? 0.04 + A.depth + 0.04 : 0.12;
    return {
      tops: Array.from({ length: n }, (_, i) => new THREE.Vector3(-w / 2 + (i * w) / (n - 1), y, z)),
      ring: { count: n, arc: 0 }, // an open string: n - 1 runs, not a ring
    };
  }, [w, Gc.every, A.on, A.lift, A.drop, A.valance, A.depth, under]);
  const config = useMemo(() => ({
    sag: Gc.sag,
    wire: { radius: 0.008, segments: 12, sides: 4 },
    festoon: { spacing: Gc.spacing, count: null, type: [{ shape: "sphere", radius: Gc.bulb, light: { type: "lit" } }], stringLength: Gc.drop, ...(Gc.colors ? { colors: Gc.colors } : {}) },
  }), [Gc]);
  return <Garland tops={tops} ring={ring} config={config} />;
}

// THE BALCONIES (SHOPFRONT's `balconies`): on each of `floors` (a
// storey's floor, up from the ground), one balcony at each window of `xs`
// ({ x, w }, its frame and moulding `edge` past that), `pad` past it each
// side — windows close enough that theirs would come within `join` of
// each other share one (no doubled railing in a gap too small to use), and none
// reaches past the pilasters (`W` across, `P` each). Its floor a slab of
// the pavement's paving out from the wall; on it a railing round its three
// open sides, the gap left along the wall: the library's fence of the
// `railing` type (Enclosure, Fixtures/Fences) — every kind but the wrought
// iron is built at a field's size, so it is shrunk whole to the railing's
// `height`, posts, boards and all (bare posts get a garland strung between
// them, or they would rail nothing) — lower than a person's waist, so
// whoever is out on it is seen. And, `boxes` on, a window box hung on
// the slab's front edge, outside the railing at its foot, as long as the
// balcony, growing the shop's window-box flowers (`S`, for its window boxes)
// or its own `plants`; the story windows then have no boxes of their own.
// And now and then someone out on it (`spirits`: the `chance` each balcony
// has one): a Shadow Spirit stood somewhere along it, facing the street,
// one of the `poses` — just standing there, or having a cigarette — who,
// where and how all fixed by the shop's `seed`, so it is the same each time.
// The fences' own heights, at their own size (bare posts have none: they
// stand as tall as a picket)
const FENCE_HEIGHT = (type) => ENCLOSURE[type]?.height ?? ENCLOSURE.picket.height;
function Balconies({ S, B, xs, edge, W, P, floors }) {
  const spans = useMemo(() => {
    const lim = W / 2 - P - 0.02, out = [];
    xs.map(({ x, w }) => [Math.max(-lim, x - w / 2 - edge - B.pad), Math.min(lim, x + w / 2 + edge + B.pad)])
      .sort((a, b) => a[0] - b[0])
      .forEach(([a, b]) => { const last = out[out.length - 1]; if (last && a <= last[1] + B.join) last[1] = Math.max(last[1], b); else out.push([a, b]); });
    return out;
  }, [xs, edge, B.pad, B.join, W, P]);
  // the railing: its type, and how much it is shrunk (k) to stand `height`
  const type = B.railing ?? "wroughtIron", k = B.height / FENCE_HEIGHT(type);
  const fence = useMemo(() => ({
    type, strung: type === "posts" ? "garland" : false, corner: 0, splay: 0, gate: { clearance: 0 }, spacing: B.spacing / k,
    // (set in their footings only shallowly: a balcony's slab is thin; bare posts as tall as the rest)
    posts: { post: { sink: 0.05 / k, ...(type === "posts" ? { height: FENCE_HEIGHT(type) } : {}) } },
  }), [type, k, B.spacing]);
  const X = S.windowBox.story;
  // its window box: the story windows' size, growing the shop's flowers —
  // or the balcony's own (`plants`), if it names one
  const boxOf = (w) => { const c = windowBoxOf(S, "story", w); return B.plants && B.plants !== "same" ? { ...c, flowers: { ...c.flowers, kind: B.plants } } : c; };
  return floors.map((y, f) => spans.map(([a, b], i) => {
    const len = b - a;
    return (
      <group key={`${f}-${i}`} position={[(a + b) / 2, y + B.lift, 0]}>
        <mesh position={[0, -B.thick / 2, B.depth / 2]} material={pavingMat(B.pavement, len, B.depth)} castShadow receiveShadow>
          <boxGeometry args={[len, B.thick, B.depth]} />
        </mesh>
        {/* the railing, round the slab's edge — open along the wall (a gap
            the slab's width, round at the back: 270 degrees from +x) */}
        <group position={[0, 0, B.depth / 2]} scale={k}>
          {/* (on flat ground: the fence drops its posts onto the planet's ball,
              and spread out at its own size they would sink round its curve) */}
          <FlatGround>
            <Enclosure box={{ width: (len - 0.04) / k, length: (B.depth - 0.04) / k }} top={0} config={fence} gates={[{ angle: 270, width: (len - 0.06) / k }]} />
          </FlatGround>
        </group>
        {/* someone out on it, maybe */}
        <BalconySpirit B={B} seed={`${B.spirits.seed}:${f}:${i}:${len.toFixed(2)}`} len={len} />
        {/* its window box, hung on the slab's front edge outside the railing,
            low, so whoever is out there is seen over it */}
        {B.boxes && (
          <group position={[0, -B.thick * 0.6, B.depth + X.depth / 2 + 0.01]}>
            <WindowBox config={boxOf(len - 0.3)} />
          </group>
        )}
      </group>
    );
  }));
}

// One balcony's someone, if its roll (by `seed`) comes in under the
// chance: stood a random way along it, a little turned, in one of the poses.
const BALCONY_STANDING = { stand: { pose: "stand", animate: false }, smoke: { pose: "smoke", animate: false } };
function BalconySpirit({ B, seed, len }) {
  const who = useMemo(() => {
    const q = rngOf(hashOf(seed)), Sp = B.spirits;
    if (!(q() < Sp.chance)) return null;
    const poses = Sp.poses.filter((p) => BALCONY_STANDING[p]);
    return { x: (q() - 0.5) * Math.max(0, len - 0.7), yaw: (q() - 0.5) * 0.7, pose: poses[Math.floor(q() * poses.length)] ?? "stand" };
  }, [seed, len, B.spirits]);
  if (!who) return null;
  return (
    <group position={[who.x, 0, B.depth * 0.45]} rotation-y={who.yaw}>
      <ShadowSpirit config={BALCONY_STANDING[who.pose]} />
    </group>
  );
}

// A window box's config for shop `S`, `which` "shop" or "story", `width`
// across: the shop's own (SHOPFRONT.windowBox) at that size, plants spaced along it.
const windowBoxOf = (S, which, width) => {
  const X = S.windowBox, size = X[which];
  return {
    width, height: size.height, depth: size.depth, color: X.color, soil: X.soil,
    flowers: { ...X.flowers, radius: size.radius, stem: size.stem, forward: size.forward, count: Math.max(2, Math.round(width / size.every)) },
  };
};

// THE SHOP DECORATION (the shop windows' `decoration`), on the pavement in
// front of them: a window box under each, or a bench or café tables along
// each stretch of them (the library's Wooden Bench, at the characters'
// size, its back to the shop; its Café Table). `S` the shop's whole
// config, `F` its shop floor's layout (shopFloorOf: its `slots`,
// `show`, `stretches` and `edge`), `cafeSeat` as the Shopfront's. In the shop's
// own frame, its front at z = 0: the Shopfront stands it out on the
// street, the Shop Interior out past its front.
export function ShopDecoration({ S, F, cafeSeat }) {
  const { show, slots, stretches, edge } = F;
  return (
    <>
      {show.decoration === "window box" && slots.map((o, i) => (
        <group key={`box${i}`} position={[o.x, 0, S.windowBox.shop.depth / 2 + 0.01]}>
          <WindowBox config={windowBoxOf(S, "shop", o.w + 2 * edge)} />
        </group>
      ))}
      {show.decoration === "bench" && stretches.map((z, k) => {
        const B = S.bench, w = Math.min(B.width, (z.x1 - z.x0 - 0.3) / B.scale);
        return w >= 3 && (
          <group key={`bench${k}`} position={[(z.x0 + z.x1) / 2, 0, B.out]} scale={B.scale}>
            <Bench config={{
              seat: { width: w, ...(B.colors ? { color: B.colors.wood } : {}) }, backFrame: { apart: w / 2 - 0.5, ...(B.colors ? { color: B.colors.frame } : {}) }, legs: { apart: { x: w / 2 - 0.5, z: 1 }, ...(B.colors ? { color: B.colors.frame } : {}) },
              ...(B.colors ? { back: { color: B.colors.wood }, armrests: { color: B.colors.frame } } : {}),
            }} />
          </group>
        );
      })}
      {(show.decoration === "café tables" || show.decoration === "umbrella tables") && stretches.map((z, k) => {
        const n = Math.floor((z.x1 - z.x0) / S.cafeTables.every);
        return Array.from({ length: n }, (_, i) => (
          <group key={`cafe${k}-${i}`} position={[z.x0 + (z.x1 - z.x0) * ((i + 0.5) / n), 0, S.cafeTables.out]}>
            <CafeTable config={{ parasol: { on: show.decoration === "umbrella tables" && !S.awning.on }, ...(S.cafeTables.chairs ? { chairs: S.cafeTables.chairs } : {}) }} seat={cafeSeat && ((c) => {
              // a café's: a place laid for whoever sits down (cafePlace.jsx)
              const key = `${k}-${i}-${c}`, who = cafeSeat(key);
              return S.goods.style === "cafe" ? placeAt(who, `out:${key}`, S.goods) : who;
            })} />
          </group>
        ));
      })}
    </>
  );
}

// `cafeSeat`, if given, is handed on to each café table's chairs (see
// CafeTable's `seat`), called with a key for the chair: `cafeSeat(key)`.
// `door`, if given, a ref (0 shut … 1 open) the front door swings to on its
// hinge, inward (see SwingLeaf): the street opens it as someone comes up.
export default function Shopfront({ config, cafeSeat, door }) {
  const S = useMemo(() => merge(SHOPFRONT, config), [config]);
  const C = S.colors;
  const { depth: D, ground: G, storey: U, pilaster: P, recess: R, pier } = S.body;
  const W = S.body.width ?? SHOP_WIDTHS[S.body.size] ?? SHOP_WIDTHS[2];
  const stories = Math.max(1, Math.round(S.body.stories));
  const top = G + U * (stories - 1);
  const F = S.sign.height, under = G - F; // the shop floor's openings run up to the sign
  const t = 0.07; // the window frames' bars

  // the shop floor's front: its door, piers and windows (see shopFloorOf)
  const { hinge, inner, dw, doorX, piers, stall, show, edge, stretches, slots, showH, showFoot } = shopFloorOf(S);
  const seeThrough = !!show.glass;
  const glass = useMemo(() => (seeThrough ? { light: show.glassLight, color: C.glass } : null), [seeThrough, show.glassLight, C.glass]);
  const layoutKey = JSON.stringify([stretches, slots, stall, under, R, showFoot, showH, show.topCurve, show.bottomCurve]);
  // the wall round the windows, with their shapes cut out of it, per stretch
  const infills = useMemo(() => (seeThrough
    ? stretches.map((z) => wallWithHoles(z.x0, z.x1, stall, under, R, slots.filter((o) => o.x > z.x0 && o.x < z.x1).map((o) => ({ cx: o.x, foot: showFoot, w: o.w, h: showH, top: show.topCurve, bottom: show.bottomCurve }))))
    : []), [seeThrough, layoutKey]);
  useEffect(() => () => infills.forEach((g) => g.dispose()), [infills]);
  // the display behind them: shelves of goods across each stretch (a
  // café's, "cafe": bare boards, the library's crockery set out on them
  // as on its kitchen's shelf — see shelving/crockery.js)
  // (`bySize`, as the shop windows': any of its fields laid over for a shop of that size)
  const G8 = useMemo(() => ({ ...S.goods, ...(S.goods.bySize?.[S.body.size] ?? {}) }), [S.goods, S.body.size]), cafe = G8.style === "cafe";
  const displays = useMemo(() => (seeThrough && G8.on
    ? stretches.map((z, k) => displayOf({
        x0: z.x0 + 0.05, x1: z.x1 - 0.05, z: -R - 0.08, depth: G8.depth,
        shelves: G8.shelves.map((f) => showFoot + f * showH), style: cafe ? "none" : G8.style, colors: G8.colors, wood: G8.wood, seed: G8.seed + (z.x1 - z.x0) * 7 + k * 13,
      }))
    : []), [seeThrough, G8, layoutKey]);
  useEffect(() => () => displays.forEach((g) => g.dispose()), [displays]);
  const cups = useMemo(() => (seeThrough && G8.on && cafe
    ? stretches.flatMap((z, k) => crockery({
        x0: z.x0 + 0.1, x1: z.x1 - 0.1, z: -R - 0.08 - G8.depth / 2, ys: G8.shelves.map((f) => showFoot + f * showH),
        S: CROCKERY_SCALE, r: rngOf(G8.seed + k * 13), colors: G8.colors, bowls: G8.bowls, teapots: 2,
      }))
    : []), [seeThrough, cafe, G8, layoutKey]);

  // A window box's config, `which` "shop" or "story", `width` across:
  // the shop's own (SHOPFRONT.windowBox) at that size, plants spaced along it.
  const boxConfig = (which, width) => windowBoxOf(S, which, width);

  // The quoins: blocks up each front corner over the shop floor.
  const Q = S.quoins;
  const quoins = Q.on && stories > 1;
  const courses = quoins ? Math.floor((top - G) / (Q.course + Q.joint)) : 0;

  // The windows upstairs, along each storey: two groups, one each side of
  // the middle, `count` in all, spaced `between` within a group and
  // `middle` between the groups, inside the quoins and a `margin`; each
  // window as wide as its slot allows, up to `width`. Too narrow a shop
  // for four keeps one a side. An odd count (three, five) spaces them
  // evenly across instead, the middle one on the middle.
  // (`match`: the shop windows' over again — their size, their shape, one
  // straight over each — no taller than `most` of a storey)
  // (`bySize`, as the shop windows': any of these laid over for a shop of
  // that size; `count` 1, one window in the middle, as wide as a standard
  // shop's would be)
  const upOwn = { ...S.storyWindow, ...(S.storyWindow.bySize?.[S.body.size] ?? {}) };
  const match = upOwn.match;
  const up = match
    ? { ...upOwn, ...Object.fromEntries(["style", "panes", "topCurve", "bottomCurve", "frame", "trim"].map((k) => [k, show[k]])), height: Math.min(showH, U * upOwn.most) }
    : upOwn;
  const upEdge = up.frame + up.trim;
  const upRow = useMemo(() => {
    const spanOf = (w) => w - 2 * (quoins ? Q.long : 0) - 2 * up.margin;
    let span = spanOf(W);
    const fit = (count) => {
      const per = count / 2;
      const slot = (span - up.middle - 2 * (per - 1) * up.between) / count;
      return { count, per, slot, w: Math.min(up.width, slot - 2 * upEdge) };
    };
    if (up.count === 1) {
      // one, in the middle: as wide as a standard shop's row would make it
      span = spanOf(SHOP_WIDTHS[2]);
      let r = fit(Math.max(2, Math.round(S.storyWindow.count / 2) * 2));
      while (r.count > 2 && r.w < up.least) r = fit(r.count - 2);
      return { xs: [0], w: Math.max(0.2, Math.min(r.w, spanOf(W) - 2 * upEdge)) };
    }
    if (up.count > 1 && up.count % 2 === 1) {
      // an odd count, three or more: evenly spaced across, `between` apart
      // at the least, the middle one on the middle (as many as fit)
      let n = up.count;
      const wOf = (k) => Math.min(up.width, (span - (k - 1) * up.between) / k - 2 * upEdge);
      while (n > 1 && wOf(n) < up.least) n -= 2;
      const slot = span / n;
      return { xs: Array.from({ length: n }, (_, i) => -span / 2 + (i + 0.5) * slot), w: Math.max(0.2, wOf(n)) };
    }
    let r = fit(Math.max(2, Math.round(up.count / 2) * 2));
    while (r.count > 2 && r.w < up.least) r = fit(r.count - 2);
    const xs = [];
    for (const e of [-1, 1])
      for (let i = 0; i < r.per; i++) {
        const fromMiddle = up.middle / 2 + r.slot / 2 + i * (r.slot + up.between);
        xs.push(e * fromMiddle);
      }
    return { xs: xs.sort((a, b) => a - b), w: Math.max(0.2, r.w) };
  }, [W, quoins, Q.long, up.margin, up.middle, up.between, up.width, up.count, up.least, upEdge, S.storyWindow.count]);

  return (
    <group>
      {/* the body behind the shop floor, and the storeys over it */}
      {seeThrough ? (
        <>
          {/* over the shop: the storeys' body; the shop floor a room, lit
              warm, its outside walls round it */}
          <Box at={[0, (under + top) / 2, -R - (D - R) / 2]} size={[W, top - under, D - R]} color={C.wall} />
          {/* the room, seen from inside: kept clear of every other face
              (a few hundredths off the walls, floor and ceiling round it),
              or the two fight over the same plane and flicker */}
          <mesh position={[0, (0.02 + under - 0.06) / 2, (-D + 0.1 + -R - 0.02) / 2]} material={roomMat(C.room)}>
            <boxGeometry args={[W - 0.2, under - 0.08, D - R - 0.12]} />
          </mesh>
          {[-1, 1].map((e) => <Box key={e} at={[e * (W / 2 - 0.015), under / 2, -R - (D - R) / 2]} size={[0.03, under, D - R]} color={C.wall} />)}
          <Box at={[0, under / 2, -D + 0.015]} size={[W, under, 0.03]} color={C.wall} />
          {/* a lamp across the ceiling, just in from the windows */}
          <mesh position={[0, under - 0.1, -R - 0.45]} rotation-z={Math.PI / 2} material={litMat(C.lamp)}>
            <cylinderGeometry args={[0.035, 0.035, inner * 1.6, 10]} />
          </mesh>
          {displays.map((g, k) => <mesh key={k} geometry={g} material={goodsMat} />)}
          {cups.length > 0 && <Crockery pieces={cups} S={CROCKERY_SCALE} />}
        </>
      ) : (
        <Box at={[0, top / 2, -R - (D - R) / 2]} size={[W, top, D - R]} color={C.wall} />
      )}
      {stories > 1 && <Box at={[0, G + (top - G) / 2, -R / 2]} size={[W, top - G, R]} color={C.wall} />}
      {S.roof.style === "pitched" || S.roof.style === "dormer" ? (
        <PitchedRoof W={W} D={D} top={top} terrace={S.terrace} C={C} look={up}
          roof={S.roof.style === "dormer" ? { ...S.roof, facing: "side" } : { ...S.roof, dormers: 0 }} />
      ) : (
        // the cornice along the top (in a terrace, no wider than the shop:
        // past its sides it would run into the neighbours' walls)
        <Box at={[0, top + 0.11, -D / 2 + 0.06]} size={[W + (S.terrace ? 0 : 0.2), 0.22, D + 0.12]} color={C.trim} />
      )}

      {/* the sign band and its board */}
      <Box at={[0, under + F / 2, -R / 2 + 0.02]} size={[W, F, R + 0.04]} color={C.trim} />
      {/* the board sits on the band over where the awning hangs */}
      {(() => {
        const from = S.awning.on ? under + S.awning.lift + 0.06 : under + 0.08, h = Math.min(S.sign.tall, G - from - 0.06);
        return h > 0.08 && (
          <group position={[0, (from + G) / 2, 0.04]}>
            <Sign config={{ width: W * S.sign.board, height: h, depth: 0.09, stand: 0.01, clay: S.sign.clay, color: C.sign, text: S.sign.say ? merge({ say: S.sign.say, color: C.lettering ?? C.trim, thick: 0.05, wrong: STRAIGHT }, S.sign.text) : null }} />
          </group>
        );
      })()}

      {/* the pilasters at the ends, and the pier between door and window */}
      {[-1, 1].map((e) => <Box key={e} at={[e * (W / 2 - P / 2), G / 2, -R / 2 + 0.03]} size={[P, G, R + 0.06]} color={C.trim} />)}
      {piers.map((x, k) => <Box key={k} at={[x, under / 2, -R / 2]} size={[pier, under, R]} color={C.trim} />)}

      {/* THE WINDOWS: the low wall under them, the wall round them, and
          the library's window (Fixtures/Windows) in each slot */}
      {stretches.map((z, k) => (
        <group key={k}>
          <Box at={[(z.x0 + z.x1) / 2, stall / 2, -R / 2]} size={[z.x1 - z.x0, stall, R]} color={C.trim} />
          {infills[k] ? (
            <mesh geometry={infills[k]} material={mat(C.wall)} castShadow receiveShadow />
          ) : (
            <Box at={[(z.x0 + z.x1) / 2, (stall + under) / 2, -R / 2]} size={[z.x1 - z.x0, under - stall, R]} color={C.wall} />
          )}
        </group>
      ))}
      {/* THE SHOP DECORATION, on the pavement in front of the shop windows */}
      <ShopDecoration S={S} F={{ show, slots, stretches, edge }} cafeSeat={cafeSeat} />

      {slots.map((o, i) => (
        <group key={i} position={[o.x, showFoot, 0]}>
          <ShopfrontWindow width={o.w} height={showH} look={show} trim={C.frame ?? C.trim} glass={glass} />
        </group>
      ))}

      {/* THE DOOR: on a step, set back in its doorway, one of the
          library's doors — the House Door with a fanlight of glass over it,
          or the Arched Door in its frame — its knob on the side away from
          the hinge */}
      <Box at={[doorX, 0.04, -R / 2]} size={[dw, 0.08, R]} color={C.trim} />
      <group position={[doorX, 0.08, -R + 0.01]}>
        {S.door.style === "arched" ? (
          <group position-y={(S.door.height + 0.15) / 2}>
            <SwingLeaf hinge={hinge} width={dw - 0.22} swing={door}>
              <Arch config={{
                width: dw - 0.22, height: S.door.height + 0.15, depth: 0.08, detail: 1.5, clay: null,
                frame: { thickness: 0.08, depth: 0.05, color: C.trim },
                knob: { radius: 0.06, side: -hinge * 0.6, color: DWELLING.door.knob.color },
                color: C.door,
              }} />
            </SwingLeaf>
          </group>
        ) : (
          <SwingLeaf hinge={hinge} width={dw - 0.08} swing={door}>
            <Door face={0} D={{
              ...DWELLING.door, width: dw - 0.08, height: S.door.height, depth: 0.08,
              knob: { ...DWELLING.door.knob, radius: 0.06, side: -hinge * 0.7 },
              color: C.door,
            }} />
          </SwingLeaf>
        )}
      </group>
      {(() => {
        // over the door: a short fanlight of glass (the House Door), then
        // panelling up to the sign; behind the Arched Door, panelling the
        // whole doorway, so the shop's hollow room does not show round it
        const doorTop = 0.08 + S.door.height;
        const fan = S.door.style === "arched" ? 0 : Math.min(S.door.fanlight, under - doorTop - 0.05);
        const panelFrom = S.door.style === "arched" ? 0.08 : doorTop + Math.max(0, fan) + t;
        return (
          <>
            {fan > 0.1 && (
              <>
                <Box at={[doorX, doorTop + fan / 2, -R + 0.01]} size={[dw, fan, 0.02]} color={C.interior} shadow={false} />
                <Glass x={doorX} y={doorTop + fan / 2} z={-R + 0.05} w={dw} h={fan} color={C.glass} />
                <Box at={[doorX, doorTop + t / 2, -R + 0.06]} size={[dw, t, t]} color={C.trim} />
                <Box at={[doorX, doorTop + fan + t / 2, -R + 0.06]} size={[dw, t, t]} color={C.trim} />
              </>
            )}
            {under - panelFrom > 0.02 && (
              <Box at={[doorX, (panelFrom + under) / 2, S.door.style === "arched" ? -R - 0.005 : -R + 0.02]} size={[dw, under - panelFrom, 0.04]} color={C.trim} />
            )}
          </>
        );
      })()}

      {/* THE AWNING, over the door and the window, just under the sign */}
      {S.awning.on && (
        <group position={[0, under + S.awning.lift, 0.04]}>
          <Awning w={W - 2 * P} A={S.awning} colors={C} />
        </group>
      )}

      {/* THE GARLAND, if it has one: the library's Garland of lit bulbs,
          looped along the front edge of the awning (or, with none, under
          the sign band), tied up every `every` across */}
      {S.garland.on && <ShopGarland S={S} W={W} P={P} under={under} />}

      {/* THE BALCONIES, if the flats have them: one at each storey's windows */}
      {S.balconies.on && stories > 1 && (
        <Balconies S={S} B={S.balconies} xs={(match ? slots : upRow.xs.map((x) => ({ x, w: upRow.w })))} edge={upEdge} W={W} P={P}
          floors={Array.from({ length: stories - 1 }, (_, k) => G + k * U)} />
      )}

      {/* UPSTAIRS: a row of windows on each storey, with sills */}
      {Array.from({ length: stories - 1 }, (_, k) =>
        (match ? slots : upRow.xs.map((x) => ({ x, w: upRow.w }))).map(({ x, w }, j) => {
          const y = G + k * U + U * 0.52;
          return (
            <group key={`${k}-${j}`}>
              <group position={[x, y - up.height / 2, 0]}>
                <ShopfrontWindow width={w} height={up.height} look={up} trim={C.frame ?? C.trim} />
              </group>
              {/* (no box under it where a balcony's box hangs in front) */}
              {up.box && !(S.balconies.on && S.balconies.boxes) ? (
                <group position={[x, y - up.height / 2 - upEdge - S.windowBox.story.height, S.windowBox.story.depth / 2 + 0.02]}>
                  <WindowBox config={boxConfig("story", w + 2 * upEdge + 0.06)} />
                </group>
              ) : (
                <Box at={[x, y - up.height / 2 - upEdge - 0.035, 0.09]} size={[w + 2 * upEdge + 0.12, 0.07, 0.18]} color={C.trim} />
              )}
            </group>
          );
        }),
      )}

      {/* QUOINS: up each front corner over the shop floor, blocks long and
          short in turn on the front, short and long round the side (when
          they `wrap`: a shop in a terrace has a neighbour there) */}
      {Array.from({ length: courses }, (_, k) => {
        const y = G + Q.joint + k * (Q.course + Q.joint) + Q.course / 2;
        const long = k % 2 === 0, w = long ? Q.long : Q.short, side = long ? Q.short : Q.long;
        return [-1, 1].map((e) => (
          <group key={`${k}${e}`}>
            <Box at={[e * (W / 2 - w / 2), y, (Q.out - 0.02) / 2]} size={[w, Q.course, Q.out + 0.02]} color={C.quoin} />
            {Q.wrap && !S.terrace && <Box at={[e * (W / 2 + (Q.out - 0.02) / 2), y, Q.out - side / 2]} size={[Q.out + 0.02, Q.course, side]} color={C.quoin} />}
          </group>
        ));
      })}
    </group>
  );
}
