import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";

import { merge } from "../../world/merge.js";
import { hue } from "../../world/palette.js";
import { LIGHT } from "../../adjectives/lit/objects.js";
import { litMat } from "../../adjectives/lit/material.js";
import { toon } from "../../adjectives/unlit/toon.js";
import Primitive from "../primitive/Primitive.jsx";
import Seated from "../primitive/Seated.jsx";
import Dial from "../dial/Dial.jsx";
import Door from "../door/Door.jsx";
import Slot from "../slot/Slot.jsx";
import Sign from "../sign/Sign.jsx";
import Posts from "../post/Posts.jsx";
import Strung from "../strung/Strung.jsx";
import Feet, { feetLiftOf } from "../feet/Feet.jsx";
import {
  primitiveExtent,
  primitiveGeometry,
  primitiveSeatOn,
  primitiveTopFace,
} from "../primitive/geometry.js";
import { useBody } from "../planet/OnPlanet.jsx";
import { registerSolid, unregisterSolid } from "../../player/solids.js";
import { VENDING_MACHINE } from "./objects.js";

// Where the body's foot and crown really are once formed: its foot on its
// feet (or the ground at y = 0), settled onto them by `sink`.
function standOf(V) {
  const B = V.body;
  const e = primitiveExtent(
    B.shape,
    B.radius,
    undefined,
    B.detail,
    B.form,
    undefined,
    B.clay,
  );
  const lift = feetLiftOf(V.feet) - e.bottom - B.sink;
  const crown = lift + e.top;
  const M = V.marquee;
  return { lift, crown, height: crown + (M.count > 0 ? M.height : 0) };
}

// How tall the machine stands off its ground, for the posts to clear.
export const vendingMachineHeightOf = (V) => standOf(V).height;

// How far out from its middle it spreads, across (x) and along (z), for
// the player to be kept out of and the grass to keep back from.
export function vendingMachineFootprintOf(V) {
  const B = V.body;
  const g = primitiveGeometry(
    B.shape,
    B.radius,
    undefined,
    B.detail,
    B.form,
    undefined,
    B.clay,
  );
  if (!g.boundingBox) g.computeBoundingBox();
  const { min, max } = g.boundingBox;
  return { x: Math.max(-min.x, max.x), z: Math.max(-min.z, max.z) };
}

// The furthest of that, as one reach.
export function vendingMachineReachOf(V) {
  const { x, z } = vendingMachineFootprintOf(V);
  return Math.max(x, z);
}

const bodyOf = (V) =>
  primitiveGeometry(
    V.body.shape,
    V.body.radius,
    undefined,
    V.body.detail,
    V.body.form,
    undefined,
    V.body.clay,
  );

// The case is cut into the body with the stencil buffer rather than the
// geometry: a plate the size of the opening is drawn first, invisibly,
// writing this machine's number into the stencil where it lies, and the
// body is painted everywhere BUT there. What is behind the body in those
// pixels — the recess, the shelves, the lamp — then shows through, and
// anything that stands in front of the machine still covers it, since the
// depth test is untouched. Each machine takes its own number so one
// machine's opening never cuts another's body; there are 255 to go round.
let nextStencil = 1;
const takeStencil = () => {
  const id = nextStencil;
  nextStencil = (nextStencil % 255) + 1;
  return id;
};

// The body's own toon stock, in its color, told to skip its own opening:
// a fresh one, since the stock one is shared by everything of that color.
function useHoledMat(swatch, id) {
  const mat = useMemo(() => {
    const m = toon(hue(swatch));
    m.stencilWrite = true; // the switch that turns the test on at all
    m.stencilWriteMask = 0; // ...but the body writes nothing itself
    m.stencilRef = id;
    m.stencilFunc = THREE.NotEqualStencilFunc;
    return m;
  }, [swatch, id]);
  useEffect(() => () => mat.dispose(), [mat]);
  return mat;
}

// The plate that marks the opening: paints nothing, writes no depth, and
// drops the machine's number into the stencil wherever it lies. Drawn
// before everything else so the body finds the mark already there.
function useMaskMat(id) {
  const mat = useMemo(() => {
    const m = new THREE.MeshBasicMaterial({
      colorWrite: false,
      depthWrite: false,
    });
    m.stencilWrite = true;
    m.stencilRef = id;
    m.stencilFunc = THREE.AlwaysStencilFunc;
    m.stencilZPass = THREE.ReplaceStencilOp;
    return m;
  }, [id]);
  useEffect(() => () => mat.dispose(), [mat]);
  return mat;
}

// The recess itself, lying in x/y about the opening's middle and running
// back along -z from it: the walls are a box seen from inside, the panel a
// flat sheet just off its back that is its own color at any hour, so the
// whole case reads as lit even before the lamp throws anything.
function Recess({ W }) {
  const { width: w, height: h, depth: d } = W;
  const walls = useMemo(() => new THREE.BoxGeometry(w, h, d), [w, h, d]);
  const wallMat = useMemo(
    () => toon(hue(W.walls.color), { side: THREE.BackSide }),
    [W.walls.color],
  );
  useEffect(() => () => wallMat.dispose(), [wallMat]);
  useEffect(() => () => walls.dispose(), [walls]);
  const P = W.panel;
  const panel = useMemo(
    () => new THREE.PlaneGeometry(w - 2 * P.in, h - 2 * P.in),
    [w, h, P.in],
  );
  useEffect(() => () => panel.dispose(), [panel]);
  return (
    <group>
      <mesh geometry={walls} material={wallMat} position-z={-d / 2} />
      <mesh
        geometry={panel}
        material={litMat(P.color)}
        position-z={-d + 0.02}
      />
    </group>
  );
}

// The bezel round the opening: four bars of clay, the top and bottom ones
// the full width and the sides stood between them, each standing `stand`
// proud of the face and sunk `sink` into the recess, and lapping `lip`
// over the opening so its cut edge never shows.
function Frame({ W }) {
  const F = W.frame;
  const b = F.thickness + F.lip; // each bar, edge to edge
  const deep = F.stand + F.sink;
  const z = (F.stand - F.sink) / 2;
  const across = W.width + 2 * F.thickness;
  const between = W.height - 2 * F.lip;
  const bars = useMemo(
    () => [
      // Top and bottom, the full width.
      ...[1, -1].map((s) => ({
        position: [0, s * (W.height / 2 - F.lip + b / 2), z],
        form: { widen: across / b, deepen: deep / b },
        seed: F.clay ? F.clay.seed + (s > 0 ? 0 : 1) : 0,
      })),
      // Left and right, between them.
      ...[1, -1].map((s) => ({
        position: [s * (W.width / 2 - F.lip + b / 2), 0, z],
        form: { tall: between / b, deepen: deep / b },
        seed: F.clay ? F.clay.seed + (s > 0 ? 2 : 3) : 0,
      })),
    ],
    [W.width, W.height, F.lip, F.clay, b, z, across, between, deep],
  );
  return bars.map(({ position, form, seed }, i) => (
    <group key={i} position={position}>
      <Primitive
        shape="cube"
        radius={b / 2}
        form={form}
        clay={F.clay ? { ...F.clay, seed } : F.clay}
        swatch={F.color}
      />
    </group>
  ));
}

// The lamp: a tube lying across under the recess's top, lit its own color,
// and — when `cast` says — one real light beside it to fall down the
// shelves and out of the front onto whatever stands there.
function Lamp({ W }) {
  const L = W.lamp;
  const length = W.width - 2 * L.in;
  const form = useMemo(
    () => ({ tall: length / (2 * L.radius) }),
    [length, L.radius],
  );
  const rotation = useMemo(() => ({ z: 90 }), []);
  const light = useMemo(() => merge(LIGHT, L.light), [L.light]);
  return (
    <group position={[0, W.height / 2 - L.drop, -L.back]}>
      <Primitive
        shape="cylinder"
        radius={L.radius}
        form={form}
        rotation={rotation}
        swatch={L.color}
        light={light}
      />
      {L.cast && (
        <pointLight
          color={hue(L.color)}
          intensity={L.cast.intensity}
          distance={L.cast.distance}
        />
      )}
    </group>
  );
}

// The stickers stacked on one shelf: `count` stacks spread across it the
// way the labels are, each starting `back` behind the lip, dealt its
// depth and color in turn. A sheet is a Sign as built — stood on edge,
// facing out of the glass — lifted to stand on its bottom edge and tipped
// back by `lean`, and the ones behind it stand a thickness further back,
// each nudged off the last by up to `scatter` and turned by up to
// `twist`, so a stack reads as put there by hand rather than by a
// machine. `deal` is where in the run of stacks this shelf's start, so no
// two shelves come out the same.
function Stacks({ W, slab, deal }) {
  const K = W.stacks;
  const T = K.sticker;
  const rad = (deg) => (deg * Math.PI) / 180;
  const stacks = useMemo(() => {
    const span = K.many.max - K.many.min + 1;
    return Array.from({ length: K.count }, (_, j) => {
      const n = deal + j;
      const many = K.many.min + ((n * 5 + 2) % span);
      const color = K.colors[n % K.colors.length];
      const sheets = Array.from({ length: many }, (_, k) => {
        // A little two-way wobble from the sheet's place in the stack.
        const a = Math.sin(n * 3.7 + k * 2.3);
        const b = Math.cos(n * 1.9 + k * 4.1);
        return {
          // Each sheet's group sits at its foot, its own thickness behind
          // the one in front, since the Sign stands its board out along
          // +z from there.
          position: [a * K.scatter, 0, -(k + 1) * T.depth - b * K.scatter],
          rotation: [-rad(K.lean), ((a - b) / 2) * rad(K.twist), 0],
        };
      });
      return {
        x: ((j - (K.count - 1) / 2) * slab.width) / K.count,
        config: { ...T, color },
        sheets,
      };
    });
  }, [K, T, slab.width, deal]);
  if (!(K.count > 0)) return null;
  const z = -W.shelves.setback - K.back;
  return stacks.map(({ x, config, sheets }, j) => (
    <group key={j} position={[x, W.shelves.thickness / 2, z]}>
      {sheets.map(({ position, rotation }, k) => (
        <group key={k} position={position} rotation={rotation}>
          <group position-y={T.height / 2}>
            <Sign config={config} />
          </group>
        </group>
      ))}
    </group>
  ));
}

// The shelves: `count` slabs across the recess, spread evenly between the
// margins, each running from `setback` behind the opening to the back
// wall, with `labels.count` labels along its front lip and the sticker
// piles behind them.
function Shelves({ W }) {
  const S = W.shelves;
  const Lb = W.labels;
  const slab = useMemo(() => {
    const width = W.width - 2 * S.in;
    const depth = W.depth - S.setback;
    return {
      width,
      depth,
      form: { widen: width / S.thickness, deepen: depth / S.thickness },
      z: -S.setback - depth / 2,
    };
  }, [W.width, W.depth, S.in, S.setback, S.thickness]);
  const ys = useMemo(() => {
    const lo = -W.height / 2 + S.margin.bottom;
    const hi = W.height / 2 - S.margin.top;
    return Array.from({ length: S.count }, (_, i) =>
      S.count > 1 ? lo + ((hi - lo) * i) / (S.count - 1) : (lo + hi) / 2,
    );
  }, [W.height, S.margin, S.count]);
  const label = useMemo(() => {
    const { count, drop, ...config } = Lb;
    return {
      config,
      // The label's top `drop` under the shelf's, hanging off its lip.
      y: S.thickness / 2 - drop - config.height / 2,
      xs: Array.from(
        { length: count },
        (_, j) => ((j - (count - 1) / 2) * slab.width) / count,
      ),
    };
  }, [Lb, S.thickness, slab.width]);
  if (!(S.count > 0)) return null;
  return ys.map((y, i) => (
    <group key={i} position-y={y}>
      <group position-z={slab.z}>
        <Primitive
          shape="cube"
          radius={S.thickness / 2}
          form={slab.form}
          clay={S.clay}
          swatch={S.color}
        />
      </group>
      {label.xs.map((x, j) => (
        <group key={j} position={[x, label.y, -S.setback]}>
          <Sign config={label.config} />
        </group>
      ))}
      <Stacks W={W} slab={slab} deal={i * W.stacks.count} />
    </group>
  ));
}

// The case, seated on the body's front at the window's `translation` and
// turned to its face, +z out of it: the mask that cuts the opening, the
// recess behind it, the frame round it, the lamp, the shelves and the
// glass over the lot. It is seated on the body as thrown, BEFORE the clay
// — a case this wide would sit askew on whichever lump its middle landed
// on, and the lumps are shallower than the frame stands, so it lies flat
// on the face they ride on and they never show through.
function Case({ V, stencil }) {
  const W = V.window;
  const B = V.body;
  const face = useMemo(
    () => primitiveGeometry(B.shape, B.radius, undefined, B.detail, B.form),
    [B.shape, B.radius, B.detail, B.form],
  );
  const seat = useMemo(
    () => primitiveSeatOn(face, W.translation),
    [face, W.translation],
  );
  const mask = useMemo(
    () => new THREE.PlaneGeometry(W.width, W.height),
    [W.width, W.height],
  );
  useEffect(() => () => mask.dispose(), [mask]);
  const maskMat = useMaskMat(stencil);
  const glass = useMemo(
    () => ({ ...W.glass, width: W.width, height: W.height }),
    [W.glass, W.width, W.height],
  );
  if (!seat) return null;
  return (
    <group position={seat.at} quaternion={seat.face}>
      <mesh geometry={mask} material={maskMat} renderOrder={-10} />
      <Recess W={W} />
      <Frame W={W} />
      <Lamp W={W} />
      <Shelves W={W} />
      <Sign config={glass} />
    </group>
  );
}

// The marquee: `count` posts stood on the body's crown, `in` of its half
// width apart and `back` of its half depth behind its front edge, with the
// sign (or a garland) strung between them, faced out over the front.
function Marquee({ V, body }) {
  const M = V.marquee;
  const face = primitiveTopFace(body);
  const { stands, tops, ring, centre } = useMemo(() => {
    const z = face.z * (1 - M.back);
    const stands = Array.from({ length: M.count }, (_, i) => {
      // Spread across from -x to +x, so a pair sits at the two sides.
      const t = M.count > 1 ? i / (M.count - 1) : 0.5;
      return {
        position: new THREE.Vector3(face.x * M.in * (2 * t - 1), 0, z),
        quaternion: new THREE.Quaternion(),
      };
    });
    const tops = stands.map(({ position }) => position.clone().setY(M.height));
    return {
      stands,
      tops,
      ring: { count: M.count, arc: 180 },
      centre: new THREE.Vector3(0, 0, z - 1),
    };
  }, [M, face.x, face.z]);
  if (!(M.count > 0)) return null;
  return (
    <group>
      <Posts
        stands={stands}
        height={M.height}
        config={{ ...M.posts, sink: M.sink }}
        cap={M.cap}
        capColor={M.capColor}
      />
      <Strung
        tops={tops}
        ring={ring}
        type={M.strung}
        configs={M}
        centre={centre}
      />
    </group>
  );
}

// One vending machine, standing on the ground at y = 0 with its case
// facing +z, the door under it, the sticker, coin slot and dial down the
// side, and the marquee over the top. `config` overrides any of
// VENDING_MACHINE's fields for this one instance.
export default function VendingMachine({ config }) {
  const V = useMemo(() => merge(VENDING_MACHINE, config), [config]);
  const { lift, crown, height } = useMemo(() => standOf(V), [V]);
  const stencil = useMemo(takeStencil, []);
  const bodyMat = useHoledMat(V.body.color, stencil);

  // Solid to the player: registered by where it actually IS, as a column
  // its own height and reach, so it may sit anywhere in the tree.
  const root = useRef();
  const ball = useBody(); // the ground it stands on — `body` is the cabinet
  useEffect(() => {
    const at = new THREE.Vector3();
    root.current.updateWorldMatrix(true, false);
    root.current.getWorldPosition(at);
    at.sub(ball.center);
    const solid = registerSolid({
      body: ball,
      dir: at.clone().normalize(),
      top: at.length() - ball.radius + height,
      radius: vendingMachineReachOf(V),
    });
    return () => unregisterSolid(solid);
  }, [V, height, ball]);

  const B = V.body;
  const body = bodyOf(V);
  return (
    <group ref={root}>
      <Feet
        config={V.feet}
        footprint={vendingMachineFootprintOf(V)}
        swatch={B.color}
      />
      <group position-y={lift}>
        <mesh geometry={body} material={bodyMat} />
        <Case V={V} stencil={stencil} />
        <Seated body={body} spec={V.door} part={Door} />
        <Seated body={body} spec={V.sticker} part={Sign} />
        <Seated body={body} spec={V.slot} part={Slot} />
        <Seated body={body} spec={V.dial} part={Dial} />
      </group>
      <group position-y={crown}>
        <Marquee V={V} body={body} />
      </group>
    </group>
  );
}
