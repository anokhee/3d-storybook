import { useMemo } from "react";
import * as THREE from "three";

import { hue } from "../../world/palette.js";
import { LIGHT } from "../../adjectives/lit/objects.js";
import { unlitMat } from "../../adjectives/unlit/material.js";
import { toon } from "../../adjectives/unlit/toon.js";
import Primitive from "../primitive/Primitive.jsx";

// What fills a fence between its posts, one kind per FENCE_TYPE that has
// any (bare posts have none). Each takes `runs`, one per stretch of fence
// between two neighboring posts that is not a gate: `{ position,
// quaternion, length, ups }` in the enclosure's space, a frame stood on
// the middle of the chord between the two posts' feet, its x along the
// chord, its y the two posts' ups averaged — so a panel is built flat in
// its own x-y plane, from -length / 2 to length / 2 and from the ground up
// — and `height` how tall the posts stand, for the panel to stand to.
// `inset` is the posts' radius, so a panel starts clear of the post at
// each end. The chord runs a little under the ball between two posts, so
// a panel is sunk a touch below its own ground to hide the seam (each
// kind's `sink`).
//
// The ground is a ball and the posts lean with it (see ENCLOSURE.splay),
// so a panel is not quite a rectangle: `ups` is which way each post
// leans in the frame, `[[x, y], [x, y]]` for the first post and the
// second, and a panel's two sides follow them — wider at the top than the
// foot by how far they lean apart — or the panels would part from their
// posts in a wedge at the top of each. leanOf(run) carries a point built
// flat, `x` along the chord and `h` up from the ground, to where it lands:
// up the post it is nearer, blended across the run.
const leanOf =
  ({ length, ups: [[ax, ay], [bx, by]] }) =>
  (x, h) => {
    const u = x / length + 0.5;
    return [x + h * (ax + (bx - ax) * u), h * (ay + (by - ay) * u)];
  };
// A bar laid across the run at height `h`, from `x0` to `x1` along the
// chord: where its middle lands and how long it is once it leans with the
// posts.
function barOf(lean, x0, x1, h) {
  const [ax, ay] = lean(x0, h);
  const [bx, by] = lean(x1, h);
  return { x: (ax + bx) / 2, y: (ay + by) / 2, length: bx - ax };
}

// A picket: a board with a pointed top, stood on y = -sink, its face in
// the x-y plane and its thickness centered on it.
function picketGeometry({ width, thickness, point }, height, sink) {
  const w = width / 2;
  const h = height + sink;
  const shape = new THREE.Shape();
  shape.moveTo(-w, 0);
  shape.lineTo(w, 0);
  shape.lineTo(w, h - point);
  shape.lineTo(0, h);
  shape.lineTo(-w, h - point);
  shape.closePath();
  const geo = new THREE.ExtrudeGeometry(shape, {
    depth: thickness,
    bevelEnabled: false,
  });
  geo.translate(0, -sink, -thickness / 2);
  return geo;
}

// The white picket fence: boards `width` across at `gap` apart, as many as
// fit between the posts and centered between them, on `rails` running
// behind them at `at` shares of the height.
export function PicketPanels({ runs, height, inset, config: T }) {
  const board = useMemo(
    () => picketGeometry(T.board, height, T.sink),
    [T.board, height, T.sink],
  );
  const boardMat = unlitMat(T.colors.board);
  const railMat = unlitMat(T.colors.rail);
  const B = T.board,
    R = T.rails;
  const pitch = B.width + B.gap;
  return (
    <group>
      {runs.map((run, i) => {
        const { position, quaternion, length } = run;
        const lean = leanOf(run);
        const avail = length - 2 * inset;
        const count = Math.max(1, Math.floor((avail + B.gap) / pitch));
        const span = count * B.width + (count - 1) * B.gap;
        const x0 = -span / 2 + B.width / 2;
        // Each board stands on the ground and leans the way the posts do
        // where it stands: a turn about z that stands its y along the
        // lean there.
        const leanAt = (x) => {
          const [dx, dy] = lean(x, 1);
          return -Math.atan2(dx - x, dy);
        };
        return (
          <group key={i} position={position} quaternion={quaternion}>
            {Array.from({ length: count }, (_, k) => (
              <mesh
                key={k}
                geometry={board}
                material={boardMat}
                position-x={x0 + k * pitch}
                rotation-z={leanAt(x0 + k * pitch)}
              />
            ))}
            {R.at.map((f, k) => {
              const bar = barOf(lean, -avail / 2, avail / 2, f * height);
              return (
                <mesh
                  key={k}
                  material={railMat}
                  position={[bar.x, bar.y, -(B.thickness + R.thickness) / 2]}
                >
                  <boxGeometry args={[bar.length, R.height, R.thickness]} />
                </mesh>
              );
            })}
          </group>
        );
      })}
    </group>
  );
}

// The wooden fence: `count` square rails of lumpy clay, the bench's, laid
// from post to post, from `from` of the height up to just under the top,
// their ends buried in the posts.
export function WoodenPanels({ runs, height, config: T }) {
  const R = T.rails;
  const ys = useMemo(() => {
    const bottom = R.from * height;
    const top = height - R.radius;
    return Array.from({ length: R.count }, (_, i) =>
      R.count === 1 ? top : bottom + (i * (top - bottom)) / (R.count - 1),
    );
  }, [R, height]);
  // Each run's rails: a cube pressed to a rail, built at half the rail's
  // length so its clay has facets the whole way along, then squashed to
  // its own square through and up (see Bench's slats) — each rail its own
  // lump of clay, and each its own length, since a rail higher up a pair
  // of leaning posts spans further. Kept, so the geometry is not thrown
  // every render.
  const rails = useMemo(
    () =>
      runs.map((run, i) => {
        const lean = leanOf(run);
        return ys.map((y, k) => {
          const bar = barOf(lean, -run.length / 2, run.length / 2, y);
          const side = (2 * R.radius) / bar.length;
          return {
            ...bar,
            form: { widen: 1, deepen: side, tall: side },
            clay: { ...R.clay, seed: R.clay.seed + i * 7 + k },
          };
        });
      }),
    [runs, ys, R],
  );
  return (
    <group>
      {runs.map(({ position, quaternion }, i) => (
        <group key={i} position={position} quaternion={quaternion}>
          {rails[i].map((bar, k) => (
            <group key={k} position={[bar.x, bar.y, 0]}>
              <Primitive
                shape="cube"
                radius={bar.length / 2}
                form={bar.form}
                clay={bar.clay}
                swatch={T.color}
                light={LIGHT}
              />
            </group>
          ))}
        </group>
      ))}
    </group>
  );
}

// The chain link's diamond mesh: one tile of wire, both diagonals of a
// square, drawn once and repeated over each panel — the wire opaque and
// the diamonds cut out, so the fence is seen through.
const TILE = 64;
let chainTexture;
function chainTextureOf() {
  if (chainTexture) return chainTexture;
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = TILE;
  const ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, TILE, TILE);
  ctx.strokeStyle = "#fff";
  ctx.lineCap = "square";
  // Drawn wider than the wire and cut at alphaTest, so the edge is crisp
  // and the gauge comes out about right after filtering.
  ctx.lineWidth = TILE * 0.14;
  for (const [x0, y0, x1, y1] of [
    [0, 0, TILE, TILE],
    [0, TILE, TILE, 0],
    // The corners the tile's diagonals leave open are the neighbors'.
    [-TILE, 0, 0, TILE],
    [TILE, 0, 2 * TILE, TILE],
    [0, -TILE, TILE, 0],
    [0, TILE, TILE, 2 * TILE],
  ]) {
    ctx.beginPath();
    ctx.moveTo(x0, y0);
    ctx.lineTo(x1, y1);
    ctx.stroke();
  }
  chainTexture = new THREE.CanvasTexture(canvas);
  chainTexture.wrapS = chainTexture.wrapT = THREE.RepeatWrapping;
  chainTexture.anisotropy = 4;
  return chainTexture;
}
const chainMats = new Map();
function chainMat(swatch) {
  if (!chainMats.has(swatch.hex))
    chainMats.set(
      swatch.hex,
      toon(hue(swatch), {
        map: chainTextureOf(),
        alphaTest: 0.5,
        side: THREE.DoubleSide,
      }),
    );
  return chainMats.get(swatch.hex);
}

// The chain link fence: the mesh hung from post to post under a top rail,
// with a tension wire along the bottom.
export function ChainLinkPanels({ runs, height, inset, config: T }) {
  const mat = chainMat(T.color);
  const railMat = unlitMat(T.color);
  const tall = height - T.rail * 2 + T.sink;
  return (
    <group>
      {runs.map((run, i) => (
        <ChainPanel
          key={i}
          run={run}
          wide={run.length - 2 * inset}
          tall={tall}
          mid={(height - T.rail * 2 - T.sink) / 2}
          top={height - T.rail}
          T={T}
          mat={mat}
          railMat={railMat}
        />
      ))}
    </group>
  );
}
function ChainPanel({ run, wide, tall, mid, top, T, mat, railMat }) {
  const { position, quaternion } = run;
  // The plane's UVs stretched so each diamond is `cell` wide however big
  // the panel — one texture for every panel — and its corners carried up
  // the posts, so the mesh leans with them.
  const geo = useMemo(() => {
    const lean = leanOf(run);
    const g = new THREE.PlaneGeometry(wide, tall);
    const uv = g.attributes.uv;
    const pos = g.attributes.position;
    for (let i = 0; i < uv.count; i++) {
      uv.setXY(i, (uv.getX(i) * wide) / T.cell, (uv.getY(i) * tall) / T.cell);
      const [x, y] = lean(pos.getX(i), pos.getY(i) + mid);
      pos.setXY(i, x, y);
    }
    uv.needsUpdate = true;
    pos.needsUpdate = true;
    g.computeVertexNormals();
    return g;
  }, [run, wide, tall, mid, T.cell]);
  const rails = useMemo(() => {
    const lean = leanOf(run);
    return {
      top: barOf(lean, -wide / 2, wide / 2, top),
      wire: barOf(lean, -wide / 2, wide / 2, T.wire),
    };
  }, [run, wide, top, T.wire]);
  return (
    <group position={position} quaternion={quaternion}>
      <mesh geometry={geo} material={mat} />
      <mesh
        material={railMat}
        position={[rails.top.x, rails.top.y, 0]}
        rotation-z={Math.PI / 2}
      >
        <cylinderGeometry args={[T.rail, T.rail, rails.top.length, 8]} />
      </mesh>
      <mesh
        material={railMat}
        position={[rails.wire.x, rails.wire.y, 0]}
        rotation-z={Math.PI / 2}
      >
        <cylinderGeometry args={[T.wire, T.wire, rails.wire.length, 6]} />
      </mesh>
    </group>
  );
}
