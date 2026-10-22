import { useMemo } from "react";
import * as THREE from "three";

import { fencePosts, runsAround } from "../../world/layout.js";
import { merge } from "../../world/merge.js";
import { useBody } from "../planet/OnPlanet.jsx";
import { standAt } from "../planet/standAt.js";
import { GARLAND } from "../garland/objects.js";
import { POSTS } from "../post/objects.js";
import Posts from "../post/Posts.jsx";
import Strung from "../strung/Strung.jsx";
import { ENCLOSURE, FENCE_TYPES } from "./objects.js";
import { PicketPanels, WoodenPanels, ChainLinkPanels } from "./Panels.jsx";

// What fills each kind of fence between its posts (see Panels.jsx); bare
// posts, nothing.
const PANELS = {
  posts: null,
  picket: PicketPanels,
  wooden: WoodenPanels,
  chainlink: ChainLinkPanels,
};
// How far each kind's panels stand proud of the chord between the posts,
// on the outside — the picket's rails are behind its boards, the wooden
// rails and the chain link's top rail centered on it — for the garland to
// hang clear of (see GARLAND.stand).
const PROUD = {
  posts: () => 0,
  picket: (T) => T.board.thickness / 2 + T.rails.thickness,
  wooden: (T) => T.rails.radius,
  chainlink: (T) => T.rail,
};

// The fence round a station and whatever is strung along it, in the
// station's own space: plain +y-up with the ground at y = 0 under its
// middle. `box` is the station's `{ width, length }` the posts stand on the
// edge of, `top` how high the tallest thing inside stands, for bare posts
// to clear by their `headroom` unless a height is set outright — any
// other kind of fence stands its own height unless one is set. `config`
// overrides ENCLOSURE for this one enclosure: its `type` says what kind
// (see FENCE_TYPES), and the panels of that kind go between the posts
// (see Panels.jsx). `gates` are where the fence
// opens for a path — each `{ angle, width }`, where on the edge in
// degrees round from +x and how wide the path is — an opening that wide
// plus the gate's `clearance` either side, a post stood at each side of
// it and nothing strung across (see fencePosts).
//
// Each post is planted on its own bit of ground, leaning with it as far
// as `splay` says (see ENCLOSURE), and its top is where the garland's run
// starts — measured, since a post at the far end of a long station stands
// lower than one in the middle. On a fence with panels the garland is tied
// out on the fence's OUTER face rather than in the post's middle — out by
// what the panels stand proud of the chord, plus the widest festoon's
// radius, plus the garland's own `stand`, mitred at each post so a run
// stays parallel to its panel, and `drop` down the post — so it and its
// festoons hang down the outside of the panels, every one clear of them,
// instead of sagging through them (see GARLAND).
const _q = new THREE.Quaternion();
// The outward normal, in the station's plane, of the edge from `a` to `b`
// — the posts run anticlockwise seen from above (see perimeterPath).
const outwardOf = (a, b) =>
  new THREE.Vector3(b.z - a.z, 0, -(b.x - a.x)).normalize();
export default function Enclosure({ box, top = 0, config, gates }) {
  const E = useMemo(() => merge(ENCLOSURE, config), [config]);
  if (!FENCE_TYPES.includes(E.type))
    throw new Error(
      `ENCLOSURE type must be one of ${FENCE_TYPES.map((t) => `"${t}"`).join(", ")}, got ${JSON.stringify(E.type)}`,
    );
  // The kind's own look, and its posts' under the enclosure's own.
  const T = E.type === "posts" ? null : E[E.type];
  const P = useMemo(
    () => merge(POSTS, T ? merge(T.posts, config?.posts) : E.posts),
    [T, config, E],
  );
  const height = P.post.height ?? (T ? T.height : top + P.post.headroom);
  const body = useBody();
  const Panels = PANELS[E.type];

  const { stands, tops, skip } = useMemo(() => {
    const up = new THREE.Vector3(0, height, 0);
    const openings = (gates ?? []).map(({ angle, width }) => ({
      angle,
      width: width + 2 * E.gate.clearance,
    }));
    const posts = fencePosts(
      box.width / 2,
      box.length / 2,
      E.corner,
      E,
      openings,
    );
    const splay = Math.max(0, Math.min(1, E.splay));
    const stands = posts.stands.map((c) => {
      const stand = standAt(c.x, c.z, 0, body);
      if (splay < 1)
        stand.quaternion = new THREE.Quaternion()
          .slerp(_q.fromArray(stand.quaternion), splay)
          .toArray();
      return stand;
    });
    // Where the garland is tied on each post: its top, or out on the
    // fence's face — the mitre no more than twice the offset, so a sharp
    // corner is not flung out.
    const G = merge(GARLAND, E.garland);
    const widest = Math.max(
      0,
      ...[].concat(G.festoon.type ?? []).map((f) => f?.radius ?? 0),
    );
    const out =
      Panels && E.strung === "garland" ?
        Math.max(P.post.baseRadius * P.post.taper, PROUD[E.type](T)) +
        widest +
        G.stand
      : 0;
    const drop = E.strung === "garland" && Panels ? G.drop : 0;
    const flat = posts.stands;
    const n = flat.length;
    const closed = E.arc >= 360;
    const tieOf = (i) => {
      const tie = up.clone().setY(height - drop);
      if (out <= 0 || n < 2) return tie;
      const prev = closed || i > 0 ? flat[(i - 1 + n) % n] : null;
      const next = closed || i < n - 1 ? flat[(i + 1) % n] : null;
      const n1 = prev && outwardOf(prev, flat[i]);
      const n2 = next && outwardOf(flat[i], next);
      const m =
        n1 && n2 ? n1.clone().add(n2).normalize()
        : n1 ? n1
        : n2;
      const reach = out / Math.max(0.5, m.dot(n1 ?? n2));
      return tie.addScaledVector(m, reach);
    };
    const tops = stands.map(({ position, quaternion }, i) =>
      tieOf(i)
        .applyQuaternion(new THREE.Quaternion().fromArray(quaternion))
        .add(position),
    );
    return { stands, tops, skip: posts.skip };
  }, [box, E, height, body, gates, Panels, P, T]);
  // The ring as strung: however many posts there are once the gates have
  // had their say.
  const ring = useMemo(
    () => ({ count: stands.length, arc: E.arc }),
    [stands, E.arc],
  );
  // The stretches of fence between neighboring posts that are not gates,
  // each as a frame on the chord between the two posts' feet, and which
  // way each post leans in it (see Panels.jsx) — only for a kind that has
  // panels to hang there.
  const runs = useMemo(() => {
    if (!Panels) return [];
    const n = stands.length;
    const up = new THREE.Vector3();
    const upA = new THREE.Vector3();
    const upB = new THREE.Vector3();
    const x = new THREE.Vector3();
    const z = new THREE.Vector3();
    const out = [];
    for (let i = 0; i < runsAround(ring); i++) {
      if (skip.has(i)) continue;
      const a = stands[i],
        b = stands[(i + 1) % n];
      upA.set(0, 1, 0).applyQuaternion(_q.fromArray(a.quaternion));
      upB.set(0, 1, 0).applyQuaternion(_q.fromArray(b.quaternion));
      up.addVectors(upA, upB).normalize();
      x.subVectors(b.position, a.position);
      const length = x.length();
      x.addScaledVector(up, -x.dot(up)).normalize();
      z.crossVectors(x, up);
      out.push({
        position: a.position.clone().lerp(b.position, 0.5).toArray(),
        quaternion: new THREE.Quaternion()
          .setFromRotationMatrix(new THREE.Matrix4().makeBasis(x, up, z))
          .toArray(),
        length,
        ups: [
          [upA.dot(x), upA.dot(up)],
          [upB.dot(x), upB.dot(up)],
        ],
      });
    }
    return out;
  }, [Panels, stands, skip, ring]);

  return (
    <group>
      <Posts
        stands={stands}
        height={height}
        config={P.post}
        cap={P.cap}
        capColor={P.capColor}
      />
      {Panels && (
        <Panels
          runs={runs}
          height={height}
          inset={P.post.baseRadius}
          config={T}
        />
      )}
      <Strung tops={tops} ring={ring} skip={skip} type={E.strung} configs={E} />
    </group>
  );
}
