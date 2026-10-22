import { useMemo } from "react";
import * as THREE from "three";

import { merge } from "../../world/merge.js";
import { LIGHT } from "../../adjectives/lit/objects.js";
import Primitive from "../primitive/Primitive.jsx";
import { SIGN } from "./objects.js";

// The board itself: a clay cube pulled to the sign's proportions — `radius`
// half the height, the form pulling it `width` across and squashing it to
// `depth` along z — lying in its own x/y plane about its middle.
function Board({ S, width }) {
  const form = useMemo(
    () => ({ widen: width / S.height, deepen: S.depth / S.height }),
    [width, S.height, S.depth],
  );
  const light = useMemo(() => merge(LIGHT, S.light), [S.light]);
  return (
    <Primitive
      shape="cube"
      radius={S.height / 2}
      form={form}
      clay={S.clay}
      swatch={S.color}
      light={light}
    />
  );
}

// One sign seated on a face — a board, or a sticker: lying in its own x/y
// plane and standing out along +z — so whoever seats it turns +z along the
// face's normal and it sits flat, floated off the face by `stand`. `config`
// overrides any of SIGN's fields for this one instance.
export default function Sign({ config }) {
  const S = useMemo(() => merge(SIGN, config), [config]);
  return (
    <group position-z={S.stand + S.depth / 2}>
      <Board S={S} width={S.width} />
    </group>
  );
}

// Signs strung between posts: one board hung between each neighboring
// pair of `tops`, its top edge `hang` below them, faced away from `center`
// — out of a ring, or off the front of whatever the posts stand on. `ring`
// says how many runs join the tops (see runsAround), `skip` which of them
// — run i joins top i to top i + 1 — hang nothing; `config` overrides
// SIGN for every board. A rigid board takes the chord between its two
// posts, not the ground's arc — a sign is never wide enough to notice.
const _up = new THREE.Vector3(0, 1, 0);
export function StrungSigns({ tops, runs, skip, centre, config }) {
  const S = useMemo(() => merge(SIGN, config), [config]);
  const boards = useMemo(() => {
    const c = centre ?? new THREE.Vector3();
    return Array.from({ length: runs }, (_, i) => i)
      .filter((i) => !skip?.has(i))
      .map((i) => {
        const a = tops[i];
        const b = tops[(i + 1) % tops.length];
        const across = b.clone().sub(a);
        const span = across.length();
        const x = across.clone().normalize();
        // The board faces square to its run; which way is the way out.
        const normal = x.clone().cross(_up).normalize();
        const mid = a.clone().add(b).multiplyScalar(0.5);
        const out = mid.clone().sub(c).setY(0);
        if (out.lengthSq() > 1e-6 && out.dot(normal) < 0) normal.negate();
        const up = normal.clone().cross(x).normalize();
        const quaternion = new THREE.Quaternion().setFromRotationMatrix(
          new THREE.Matrix4().makeBasis(x, up, normal),
        );
        const width = S.width === "span" ? span - 2 * S.gap : S.width;
        const position = mid.addScaledVector(up, -(S.hang + S.height / 2));
        return { position, quaternion, width };
      });
  }, [tops, runs, skip, centre, S]);
  return boards.map(({ position, quaternion, width }, i) => (
    <group key={i} position={position} quaternion={quaternion}>
      <Board S={S} width={width} />
    </group>
  ));
}
