import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";

import { merge } from "../../world/merge.js";
import { LIGHT } from "../../adjectives/lit/objects.js";
import Primitive from "../primitive/Primitive.jsx";
import Seated from "../primitive/Seated.jsx";
import {
  primitiveExtent,
  primitiveGeometry,
  primitiveTopFace,
} from "../primitive/geometry.js";
import Dial from "../dial/Dial.jsx";
import Door from "../door/Door.jsx";
import Slot from "../slot/Slot.jsx";
import Sign from "../sign/Sign.jsx";
import Feet, { feetLiftOf } from "../feet/Feet.jsx";
import Posts from "../post/Posts.jsx";
import Strung from "../strung/Strung.jsx";
import { useBody } from "../planet/OnPlanet.jsx";
import { registerSolid, unregisterSolid } from "../../player/solids.js";
import { GACHAPON } from "./objects.js";

// Where each part's foot and crown really are once formed, and so where
// each stands: the base's foot on its feet (or the ground at y = 0),
// settled onto them by its `sink`, the globe's foot on the base's crown,
// and the lid's underside `sink` down into the globe's crown.
function stackOf(G) {
  const base = primitiveExtent(
    G.base.shape,
    G.base.radius,
    undefined,
    G.base.detail,
    G.base.form,
    undefined,
    G.base.clay,
  );
  const globe = primitiveExtent(
    G.globe.shape,
    G.globe.radius,
    undefined,
    G.globe.detail,
    G.globe.form,
  );
  const baseLift = feetLiftOf(G.feet) - base.bottom - G.base.sink;
  const baseTop = baseLift + base.top;
  const globeLift = baseTop - globe.bottom;
  const lidLift = globeLift + globe.top - G.lid.sink;
  const lidTop = lidLift + G.lid.depth;
  const B = G.bunting;
  const S = B.spire;
  const height =
    lidTop +
    Math.max(B.count > 0 ? B.height : 0, S ? S.height + S.cap.radius * 2 : 0);
  return { baseLift, globeLift, lidLift, lidTop, height };
}

// How tall the whole machine stands off its ground, for the posts to clear.
export const gachaponHeightOf = (G) => stackOf(G).height;

// How far out from its middle the machine spreads, across (x) and along
// (z), at its widest — base or globe, whichever is bigger — for the player
// to be kept out of and the grass to keep back from.
export function gachaponFootprintOf(G) {
  let x = 0,
    z = 0;
  for (const part of [G.base, G.globe]) {
    const g = primitiveGeometry(
      part.shape,
      part.radius,
      undefined,
      part.detail,
      part.form,
      undefined,
      part.clay,
    );
    if (!g.boundingBox) g.computeBoundingBox();
    const { min, max } = g.boundingBox;
    x = Math.max(x, -min.x, max.x);
    z = Math.max(z, -min.z, max.z);
  }
  return { x, z };
}

// The furthest of that, as one reach.
export function gachaponReachOf(G) {
  const { x, z } = gachaponFootprintOf(G);
  return Math.max(x, z);
}

// How far the lid spreads from its middle, across (x) and along (z): the
// globe's top face plus its overhang.
function lidReachOf(G, globe) {
  const { x, z } = primitiveTopFace(globe);
  return { x: x + G.lid.overhang, z: z + G.lid.overhang };
}

// The lid: a clay cube pulled to the top face plus `overhang`, pressed to
// `depth` thick, built about its own middle. `radius` is half the shorter
// side, so its lumps come out the size of the base's.
function Lid({ G, globe }) {
  const { x, z } = lidReachOf(G, globe);
  const L = G.lid;
  const w = 2 * x;
  const l = 2 * z;
  const r = Math.max(Math.min(w, l), L.depth) / 2;
  return (
    <Primitive
      shape="cube"
      radius={r}
      form={{
        widen: w / (2 * r),
        deepen: l / (2 * r),
        tall: L.depth / (2 * r),
      }}
      clay={L.clay}
      swatch={L.color}
      light={LIGHT}
    />
  );
}

// The bunting: `count` posts stood on the lid's top, on the rectangle `in`
// of its reach the way the feet stand under the base, and the garland
// strung round their tops as one closed ring.
function Bunting({ G, globe }) {
  const B = G.bunting;
  const reach = lidReachOf(G, globe);
  const { stands, tops, ring } = useMemo(() => {
    const stands = Array.from({ length: B.count }, (_, i) => {
      const a = ((B.turn + (360 / B.count) * i) * Math.PI) / 180;
      const out = 1 / Math.max(Math.abs(Math.cos(a)), Math.abs(Math.sin(a)));
      return {
        position: new THREE.Vector3(
          Math.cos(a) * out * reach.x * B.in,
          0,
          Math.sin(a) * out * reach.z * B.in,
        ),
        quaternion: new THREE.Quaternion(),
      };
    });
    const tops = stands.map(({ position }) => position.clone().setY(B.height));
    return { stands, tops, ring: { count: B.count, arc: 360 } };
  }, [B, reach.x, reach.z]);
  // The spire: one post in the middle, its star faced front.
  const middle = useMemo(
    () => [
      { position: new THREE.Vector3(), quaternion: new THREE.Quaternion() },
    ],
    [],
  );
  const S = B.spire;
  return (
    <group>
      {B.count > 0 && (
        <Posts
          stands={stands}
          height={B.height}
          config={{ ...B.posts, sink: B.sink }}
          cap={B.cap}
          capColor={B.capColor}
        />
      )}
      {B.count > 0 && (
        <Strung tops={tops} ring={ring} type={B.strung} configs={B} />
      )}
      {S && (
        <Posts
          stands={middle}
          height={S.height}
          config={{ ...S.posts, sink: B.sink }}
          cap={S.cap}
          capColor={S.capColor}
        />
      )}
    </group>
  );
}

const solidOf = (P) =>
  primitiveGeometry(
    P.shape,
    P.radius,
    undefined,
    P.detail,
    P.form,
    undefined,
    P.clay,
  );

// One gachapon machine, standing on the ground at y = 0 with its dial
// facing +z. `config` overrides any of GACHAPON's fields for this one
// instance.
export default function Gachapon({ config }) {
  const G = useMemo(() => merge(GACHAPON, config), [config]);
  const { baseLift, globeLift, lidLift, lidTop, height } = useMemo(
    () => stackOf(G),
    [G],
  );
  const base = solidOf(G.base);
  const globe = primitiveGeometry(
    G.globe.shape,
    G.globe.radius,
    undefined,
    G.globe.detail,
    G.globe.form,
  );

  // Solid to the player: registered by where it actually IS, as a column
  // its own height and reach — the same way a trampoline's sheet is, so
  // the machine may sit anywhere in the tree.
  const root = useRef();
  const body = useBody();
  useEffect(() => {
    const at = new THREE.Vector3();
    root.current.updateWorldMatrix(true, false);
    root.current.getWorldPosition(at);
    at.sub(body.center);
    const solid = registerSolid({
      body,
      dir: at.clone().normalize(),
      top: at.length() - body.radius + height,
      radius: gachaponReachOf(G),
    });
    return () => unregisterSolid(solid);
  }, [G, height, body]);

  return (
    <group ref={root}>
      <Feet
        config={G.feet}
        footprint={gachaponFootprintOf(G)}
        swatch={G.base.color}
      />
      <group position-y={baseLift}>
        <Primitive
          shape={G.base.shape}
          radius={G.base.radius}
          detail={G.base.detail}
          form={G.base.form}
          clay={G.base.clay}
          swatch={G.base.color}
          light={LIGHT}
        />
        <Seated body={base} spec={G.dial} part={Dial} />
        <Seated body={base} spec={G.door} part={Door} />
        <Seated body={base} spec={G.slot} part={Slot} />
        <Seated body={base} spec={G.sticker} part={Sign} />
      </group>
      <group position-y={globeLift}>
        <Primitive
          shape={G.globe.shape}
          radius={G.globe.radius}
          detail={G.globe.detail}
          form={G.globe.form}
          swatch={G.globe.color}
          light={merge(LIGHT, G.globe.light)}
        />
        <Seated body={globe} spec={G.label} part={Sign} />
      </group>
      <group position-y={lidLift + G.lid.depth / 2}>
        <Lid G={G} globe={globe} />
      </group>
      <group position-y={lidTop}>
        <Bunting G={G} globe={globe} />
      </group>
    </group>
  );
}
