import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { useFrame, createPortal } from "@react-three/fiber";

import { merge } from "../../world/merge.js";
import { toon } from "../../adjectives/unlit/toon.js";
import Anthro from "./Anthro.jsx";
import { HUMAN, SHADOW_SPIRIT } from "./objects.js";
import { buildMask } from "../mask/build.js";
import { MASK_SHAPE, MASK_STYLES } from "../mask/objects.js";

// THE SHADOW SPIRIT: the Human (src/nouns/anthro), see-through, in one
// soft plum-black, a round white mask shrink-wrapped onto its face with two
// dark eye holes. See SHADOW_SPIRIT in ./objects.js for its look; the crowd
// on the flat street (../../../../crowd) is made of these.
//
// It is drawn from the Human's own figure: the frames Anthro builds, their
// lumps repainted in the spirit's see-through black (its face — eyes, nose,
// mouth — put away under the mask), and the mask laid on over the face.
// A crowd borrows one figure's frames (framesOf) and draws each spirit
// itself; one spirit on its own (ShadowSpirit) wraps an Anthro.

// The materials for a `look` ({ color, mask, holes, opacity }): one set
// per look. The body is see-through (`opacity`); the mask and its eye holes
// are not. The masks are drawn after every body (MASK_ORDER), and the bodies
// leave no depth behind them, so a mask is never dimmed by a see-through
// head — its own seen from behind, or another spirit's in front: it shows
// whole through them. (Anything solid still hides it.)
export const MASK_ORDER = 10;
const looks = new Map();
const hexOf = (c) => c?.hex ?? c; // a "#rrggbb", or a swatch (a knob writes one)
export function spiritMaterials(look) {
  look = { ...look, color: hexOf(look.color), mask: hexOf(look.mask), holes: hexOf(look.holes) };
  const key = `${look.color}|${look.mask}|${look.holes}|${look.opacity}`;
  if (!looks.has(key))
    looks.set(key, {
      body: toon(new THREE.Color(look.color), { transparent: true, opacity: look.opacity, depthWrite: false }),
      mask: toon(new THREE.Color(look.mask), { side: THREE.DoubleSide, transparent: true, opacity: 1 }),
      holes: toon(new THREE.Color(look.holes), { transparent: true, opacity: 1 }),
    });
  return looks.get(key);
}


// The frames out of a figure Anthro built (`root`, its top group): each
// frame's lumps (and, apart, what it holds — `held`, in its own colours), the lift that puts its feet on the ground, where the face
// is (`head` its head's settings), and the mask (`look.maskShape`) built on it.
export function framesOf(root, look = SHADOW_SPIRIT.spirit, head = HUMAN.head) {
  const groups = root.children.filter((g) => g.isGroup && g.children[0]?.isMesh && g.children[0].geometry?.attributes.position.count > 1000);
  if (!groups.length) return null;
  const frames = groups.map((g) => {
    const geos = g.children.filter((m) => m.isMesh && !m.userData?.held).map((m) => m.geometry); // (not what it holds: that keeps its own colours)
    // what it holds (a cigarette), apart: each part its own geometry,
    // material and place in the frame, for whoever draws the frame to draw too
    const held = g.children.filter((m) => m.isMesh && m.userData?.held)
      .map((m) => ({ geometry: m.geometry, material: m.material, position: m.position.toArray(), quaternion: m.quaternion.toArray(), scale: m.scale.toArray() }));
    const box = new THREE.Box3();
    geos.forEach((geo) => { geo.computeBoundingBox(); box.union(geo.boundingBox); });
    return { geos, held, ground: -box.min.y };
  });
  // the face: the front of the head, round the middle of it
  const pos = frames[0].geos[0].attributes.position, faceY = head.y - 0.02;
  let faceZ = 0;
  for (let i = 0; i < pos.count; i++) if (Math.abs(pos.getX(i)) < 0.06 && Math.abs(pos.getY(i) - faceY) < 0.06) faceZ = Math.max(faceZ, pos.getZ(i));
  const face = [0, faceY, faceZ];
  frames[0].geos[0].computeBoundingSphere();
  const walk = { frames, face, lump: frames[0].geos[0] };
  return { ...walk, mask: maskFor(walk, look, look.maskStyle, look.maskExtra) };
}

// THE MASK, worn: the library's Mask (../mask), built onto this figure's
// face in the look's `maskStyle` (one of MASK_STYLES) and colours; each of
// its parts in its own colour, drawn after the bodies (MASK_ORDER).
// `extra` is laid over the style (the Mask prop's horn knobs).
export function maskFor(walk, look = SHADOW_SPIRIT.spirit, styleName = look.maskStyle, extra = {}) {
  const style = { ...(MASK_STYLES[styleName] ?? MASK_STYLES.plain), ...extra };
  return buildMask(walk.lump, walk.face, { ...MASK_SHAPE, ...look.maskShape }, style, { mask: hexOf(look.mask), ink: hexOf(look.holes) });
}
const partMats = new Map();
const partMat = (color, double) => {
  const key = `${color}|${double}`;
  if (!partMats.has(key)) partMats.set(key, toon(new THREE.Color(color), { transparent: true, opacity: 1, ...(double ? { side: THREE.DoubleSide } : {}) }));
  return partMats.get(key);
};
export function Mask({ mask }) {
  return mask.parts.map((p, i) => {
    const material = partMat(p.color, p.double);
    return <mesh key={i} geometry={p.geometry} material={material} renderOrder={MASK_ORDER + p.order} castShadow={p.order === 0} userData={{ spiritMask: material }} />;
  });
}

// WHAT A SPIRIT CAN WEAR over its see-through body (SHADOW_SPIRIT's
// `outfit`), at size 1 about the Human's trunk (the capsule from y 0.58 to
// 0.9, the belly a ball at [0, 0.68, 0.03]): the chef's — a tall white
// hat over the mask, and an apron, its bib up the chest and its skirt
// down over the thighs, tied round the waist. Not repainted with the
// body: it stays its own colour, as the mask does.
const OUTFITS = {
  chef: { cloth: "#F7F4EE", tie: "#D9D3C7" },
};
function Outfit({ name, size }) {
  const O = OUTFITS[name];
  const mats = useMemo(() => O && {
    cloth: new THREE.MeshBasicMaterial({ color: O.cloth, side: THREE.DoubleSide }),
    tie: new THREE.MeshBasicMaterial({ color: O.tie }),
  }, [O]);
  useEffect(() => () => mats && Object.values(mats).forEach((m) => m.dispose()), [mats]);
  if (!O) return null;
  return (
    <group scale={size}>
      {/* the hat: a band round the head's crown, puffed out on top */}
      <group position-y={1.34}>
        <mesh position-y={0.07} material={mats.cloth}><cylinderGeometry args={[0.13, 0.12, 0.14, 18]} /></mesh>
        <mesh position-y={0.19} scale={[1, 0.7, 1]} material={mats.cloth}><sphereGeometry args={[0.17, 18, 12]} /></mesh>
      </group>
      {/* the apron: the skirt round the front of the belly and thighs, the bib up the chest, the tie at the waist */}
      <mesh position={[0, 0.58, 0.03]} material={mats.cloth}>
        <cylinderGeometry args={[0.205, 0.215, 0.32, 20, 1, true, -1.15, 2.3]} />
      </mesh>
      <mesh position={[0, 0.845, 0.0]} material={mats.cloth}>
        <cylinderGeometry args={[0.18, 0.2, 0.21, 16, 1, true, -0.65, 1.3]} />
      </mesh>
      <mesh position={[0, 0.74, 0.02]} rotation-x={Math.PI / 2} material={mats.tie}>
        <torusGeometry args={[0.205, 0.012, 6, 28]} />
      </mesh>
    </group>
  );
}

// THE HEAD, TURNED: a spirit can look round at something (the street's
// Human going by, a shop's customer) with its head alone, the body keeping
// still. Everything of the figure above the neck — eased in from `neck[0]`
// up to `neck[1]` — turns about the upright through the head's middle,
// `axisZ` forward of the body's, the mask with it; up to `most` either side
// of straight ahead, easing round at `turn` a second, at whatever is within
// `look` of it (nothing further: it eases back to straight ahead).
export const HEAD_TURN = { neck: [0.93, 1.02], axisZ: 0.03, most: 1.4, turn: 4, look: 6 };
// A body material whose head turns on its own: `base` (a spirit's see-
// through body) with its shader bending everything above the neck round
// the head's upright by its userData.yaw (a uniform). Every copy compiles to
// the one program; only the angle is each's own.
export function headTurnMaterial(base, H = HEAD_TURN) {
  const m = base.clone(), shade = base.onBeforeCompile;
  m.userData.yaw = { value: 0 };
  const f = (x) => x.toFixed(4);
  m.onBeforeCompile = (sh, renderer) => {
    shade?.(sh, renderer); // the toon's own
    sh.uniforms.uHeadYaw = m.userData.yaw;
    const turn = (v, about) => `{ float hA = uHeadYaw * smoothstep(${f(H.neck[0])}, ${f(H.neck[1])}, position.y); float hc = cos(hA), hs = sin(hA);
      vec2 hp = ${v}.xz - vec2(0.0, ${about}); ${v}.xz = vec2(hp.x * hc + hp.y * hs, -hp.x * hs + hp.y * hc) + vec2(0.0, ${about}); }`;
    sh.vertexShader = "uniform float uHeadYaw;\n" + sh.vertexShader
      .replace("#include <beginnormal_vertex>", "#include <beginnormal_vertex>\n" + turn("objectNormal", "0.0"))
      .replace("#include <begin_vertex>", "#include <begin_vertex>\n" + turn("transformed", f(H.axisZ)));
  };
  m.customProgramCacheKey = () => `spirit-head-turn:${H.neck}:${H.axisZ}`;
  return m;
}
const _target = new THREE.Vector3();

// ONE SHADOW SPIRIT: the Human as Anthro draws it (any pose, animated or
// not — `config` over SHADOW_SPIRIT), repainted each frame — its lumps in
// the see-through black, its face put away — with the mask laid into its
// figure, so it moves with whatever frame is showing. `lookAt`, if given,
// is a ref to a point in the world (a THREE.Vector3, or null) its head
// turns to look at (see HEAD_TURN)
export default function ShadowSpirit({ config, lookAt }) {
  const C = useMemo(() => merge(SHADOW_SPIRIT, config), [config]);
  const look = C.spirit;
  const M0 = spiritMaterials(look);
  // its own body material when it looks round, so its head turns on its own
  const turned = useMemo(() => (lookAt ? headTurnMaterial(M0.body) : null), [lookAt, M0.body]);
  useEffect(() => () => turned?.dispose(), [turned]);
  const M = turned ? { ...M0, body: turned } : M0;
  const holder = useRef(), maskTurn = useRef(), head = useRef(0), since = useRef(0);
  const [walk, setWalk] = useState(null);
  useEffect(() => setWalk(null), [C]); // a new figure: its mask again
  useFrame((_, dt) => {
    if (turned && holder.current) {
      // the head round toward what it looks at, if that's near enough
      const at = lookAt.current, H = HEAD_TURN;
      let want = 0;
      if (at) {
        holder.current.worldToLocal(_target.copy(at));
        const d = Math.hypot(_target.x, _target.z);
        if (d < H.look && d > 1e-3) want = THREE.MathUtils.clamp(Math.atan2(_target.x, _target.z - H.axisZ), -H.most, H.most);
      }
      head.current += (want - head.current) * Math.min(1, Math.min(dt, 0.1) * H.turn);
      turned.userData.yaw.value = head.current;
      if (maskTurn.current) maskTurn.current.rotation.y = head.current;
    }
    const root = holder.current?.children[0];
    if (!root) return;
    if (!walk) {
      const w = framesOf(root, look, C.head);
      if (w) setWalk({ ...w, root });
      return;
    }
    // (a still spirit — not walking, not looking round — needs it only now
    // and then, once it has had it: in case a stage has repainted it in its
    // looks; balconies of them along a street would otherwise each repaint
    // every frame for nothing)
    if (!C.animate && !turned && since.current++ % 60 !== 0) return;
    // repaint: the frames' lumps see-through, everything else of the face away
    for (const g of root.children) {
      const isFrame = g.isGroup && g.children[0]?.isMesh && g.children[0].geometry?.attributes.position.count > 1000;
      if (isFrame) g.children.forEach((m) => { if (m.isMesh && !m.userData?.held) { m.material = M.body; m.castShadow = true; } }); // (what it holds — a cigarette — its own colours)
      else if (!g.userData?.spiritMask && !(g.isGroup && g.userData?.spiritMaskHolder)) g.visible = false;
    }
    // and the mask its own again (a stage that repaints everything — the
    // storybook's looks — would otherwise have it in its colours)
    root.traverse((o) => { if (o.userData?.spiritMask?.isMaterial) o.material = o.userData.spiritMask; });
  });
  return (
    <group ref={holder}>
      <Anthro config={C} />
      <Outfit name={C.outfit} size={C.size} />
      {walk && createPortal(
        <group userData={{ spiritMaskHolder: true }} position-z={HEAD_TURN.axisZ} ref={maskTurn}>
          <group position-z={-HEAD_TURN.axisZ}><Mask mask={walk.mask} /></group>
        </group>, walk.root)}
    </group>
  );
}
