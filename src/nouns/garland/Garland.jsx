import { useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";

import { hue, swatchList } from "../../world/palette.js";
import { runsAround, standOn } from "../../world/layout.js";
import { merge } from "../../world/merge.js";
import { ENCLOSURE } from "../enclosure/objects.js";
import { PLANET } from "../planet/objects.js";
import Ornament, { ornamentOf, dropOf, Facing } from "../ornament/Ornament.jsx";
import { TREAD } from "../../player/tread.js";
import { GARLAND } from "./objects.js";
import { toon } from "../../adjectives/unlit/toon.js";

const rad = (deg) => (deg * Math.PI) / 180;

// Scratch for the swing pass — written before read, every frame.
const _up = new THREE.Vector3();
const _centre = new THREE.Vector3();
const _axis = new THREE.Vector3();
const _near = new THREE.Vector3();
const _push = new THREE.Vector3();
const _q = new THREE.Quaternion();
const _y = new THREE.Vector3(0, 1, 0);

// The point on the segment a-b nearest to p, into `out`.
function nearestOn(a, b, p, out) {
  _axis.subVectors(b, a);
  const len2 = _axis.lengthSq();
  const t =
    len2 > 0 ?
      Math.min(1, Math.max(0, out.subVectors(p, a).dot(_axis) / len2))
    : 0;
  return out.copy(a).addScaledVector(_axis, t);
}

// A sagging run between each neighboring pair of posts, festoons strung
// along it — a fence you bounce inside of, never a canopy over the one place
// you jump from.
// `tops` are the post tops the runs hang between, in the station's space —
// each at its own height, since each post is planted on its own bit of the
// ball. `ring` is the (already merged) enclosure they came from, for the
// run count — its `count` and `arc`. `skip`, given, is a Set of the runs
// to leave empty — run i joins top i to top i + 1 — where a fence has a
// gate. `config` overrides GARLAND's fields for this one garland.
export default function Garland({ tops, ring = ENCLOSURE, skip, config }) {
  const G = useMemo(() => merge(GARLAND, config), [config]);

  // Dealt in the order the config wrote them, so what a station lists is
  // what the string reads left to right. Resolved once here, so a bad color
  // names itself instead of painting a silent black.
  const colors = useMemo(
    () => swatchList(G.festoon.colors, "GARLAND festoon colors"),
    [G],
  );

  const wireMat = useMemo(() => toon(hue(G.wire.color)), [G]);

  // The drop-strings' lengths, dealt round each run, and one geometry per
  // length: every string of a length is the same stick, only hung in a
  // different place. Nothing to build for a length of none.
  const drops = useMemo(() => [].concat(G.festoon.stringLength), [G]);
  const stringGeos = useMemo(
    () =>
      drops.map((drop) =>
        drop > 0 ?
          new THREE.CylinderGeometry(
            G.wire.radius,
            G.wire.radius,
            drop,
            G.wire.sides,
            1,
            true,
          )
        : null,
      ),
    [drops, G],
  );

  // Every festoon as hung, for the swing pass: the group that swings, where
  // its knot is in the world (measured once it is mounted), how it hangs,
  // and how far it is swung right now. Rebuilt with the runs.
  const swinging = useRef([]);

  const runs = useMemo(() => {
    // The ground is a ball, so a run goes the way the ground goes: round
    // the arc between the two tops rather than along the chord, which on a
    // wide fence dives under the surface. Worked in the planet's own frame —
    // the station sits R above its center — as a direction that swings from
    // one top to the other and a radius that sags between their heights.
    const R = PLANET.radius;
    const centre = new THREE.Vector3(0, -R, 0);
    const along = (a, b, t) => {
      const va = a.clone().sub(centre);
      const vb = b.clone().sub(centre);
      const dir = va.clone().normalize();
      const qa = new THREE.Quaternion().setFromUnitVectors(
        va.clone().normalize(),
        vb.clone().normalize(),
      );
      const q = new THREE.Quaternion().slerp(qa, t);
      dir.applyQuaternion(q);
      // 4t(1-t) is zero at both posts and 1 in the middle, so `sag` reads
      // directly as the dip at the lowest point — a dip TOWARD the ground.
      const radius =
        va.length() * (1 - t) +
        vb.length() * t -
        4 * G.sag * a.distanceTo(b) * t * (1 - t);
      return dir.multiplyScalar(radius).add(centre);
    };

    return Array.from({ length: runsAround(ring) }, (_, s) => s)
      .filter((s) => !skip?.has(s))
      .map((s) => {
        const a = tops[s];
        const b = tops[(s + 1) % tops.length];

        // A hanging cable is a catenary; a parabola through the same two ends
        // is the same picture at this sag and one line of arithmetic.
        const curve = new THREE.CatmullRomCurve3(
          Array.from({ length: G.wire.segments + 1 }, (_, i) =>
            along(a, b, i / G.wire.segments),
          ),
        );

        // As many as the run is long, unless a count is set (see
        // GARLAND.festoon), spaced off the half-step so the first and
        // last hang clear of the posts rather than being swallowed by
        // them.
        const count =
          G.festoon.count ??
          Math.max(1, Math.round(a.distanceTo(b) / G.festoon.spacing));
        const ts = Array.from({ length: count }, (_, i) => (i + 0.5) / count);
        // Resolved here rather than at draw time, so a typo in a station's
        // config fails once, by name, instead of per festoon per frame.
        const specs = ts.map((_, i) =>
          ornamentOf(
            G.festoon.type[i % G.festoon.type.length],
            `GARLAND festoon ${i}`,
          ),
        );

        // Each festoon says for itself whether it glows, the way a post's
        // cap does.
        const lit = specs.map((o) => o.light.type === "lit");

        // Which of them are REAL point lights: the lowest lit ones — a light
        // at the bottom of the sag hangs furthest out over the field. Unlit
        // festoons are bunting, so none of them cast.
        const casting = new Set(
          ts
            .map((_, i) => i)
            .filter((i) => lit[i])
            .sort((i, j) => Math.abs(ts[i] - 0.5) - Math.abs(ts[j] - 0.5))
            .slice(0, G.lights),
        );

        const hung = ts.map((t, i) => {
          const at = along(a, b, t);
          return {
            ornament: specs[i],
            at,
            // Hung straight DOWN from where it is on the wire — the ground's
            // down, not the station's, which out on a wide fence differ.
            quaternion: standOn(at.clone().sub(centre)).toArray(),
            casts: casting.has(i),
          };
        });

        return { curve, hung };
      });
  }, [tops, ring, G]);

  // A festoon is solid: where the doll's body overlaps it, it is shoved
  // clear, swinging about its knot on the wire, and a spring pulls it back
  // once the doll has gone — so it pendulums, the way a thing on a string
  // does, rather than easing home like a blade of grass. The festoon is
  // taken as a ball halfway down its hang; the doll as the capsule TREAD
  // says it is.
  useFrame((_, dt) => {
    const S = G.swing;
    const B = TREAD.body;
    const step = Math.min(dt, 1 / 30); // a long frame must not fling it
    for (const f of swinging.current) {
      if (!f?.group) continue;
      if (!f.knot) {
        // Measured once: stations do not move. The outer group is the rest
        // frame — `up` is its own y in the world, and `rest` turns a world
        // direction into that frame.
        f.group.parent.updateWorldMatrix(true, false);
        f.knot = f.group.parent.getWorldPosition(new THREE.Vector3());
        f.rest = f.group.parent.getWorldQuaternion(new THREE.Quaternion());
        f.up = _y.clone().applyQuaternion(f.rest);
        f.rest.invert();
      }

      // The goal lean, in the rest frame's xz: zero unless the doll is in
      // the way, then enough to clear it.
      let gx = 0;
      let gz = 0;
      const half = f.hang / 2;
      _centre.copy(f.knot).addScaledVector(f.up, -half);
      nearestOn(B.foot, B.head, _centre, _near);
      _push.subVectors(_centre, _near);
      const gap = B.radius + f.radius - _push.length();
      if (gap > 0) {
        // Sideways only — a festoon cannot be pushed up its own string.
        _push.addScaledVector(f.up, -_push.dot(f.up));
        if (_push.lengthSq() > 1e-8) {
          _push.normalize().applyQuaternion(f.rest);
          // Small angles: the ball moves `half` per radian of lean.
          const lean = Math.min(rad(S.tilt), gap / half);
          gx = _push.x * lean;
          gz = _push.z * lean;
        }
      }

      // Spring toward the goal, damped.
      f.vx += (S.stiffness * (gx - f.lx) - S.damping * f.vx) * step;
      f.vz += (S.stiffness * (gz - f.lz) - S.damping * f.vz) * step;
      f.lx += f.vx * step;
      f.lz += f.vz * step;

      const amount = Math.hypot(f.lx, f.lz);
      if (
        amount < 1e-3 &&
        gx === 0 &&
        gz === 0 &&
        Math.hypot(f.vx, f.vz) < 1e-3
      ) {
        if (f.moving) {
          f.lx = f.lz = f.vx = f.vz = 0;
          f.group.quaternion.identity();
          f.moving = false;
        }
        continue;
      }
      // Lean the bottom toward (lx, lz): a turn about the axis across that
      // and up, by that much.
      _axis.set(-f.lz, 0, f.lx).normalize();
      f.group.quaternion.copy(
        _q.setFromAxisAngle(_axis, Math.min(amount, rad(S.tilt))),
      );
      f.moving = true;
    }
  });

  return (
    <group>
      {runs.map(({ curve, hung }, s) => (
        <group key={s}>
          <mesh material={wireMat}>
            <tubeGeometry
              args={[
                curve,
                G.wire.segments,
                G.wire.radius,
                G.wire.sides,
                false,
              ]}
            />
          </mesh>

          {hung.map(({ ornament, at, quaternion, casts }, i) => {
            // The string hangs from the wire, and the festoon hangs off the
            // end of it — so its own size still clears the knot, exactly as
            // it cleared the wire before there was a string.
            const drop = drops[i % drops.length];
            const stringGeo = stringGeos[i % drops.length];
            const swatch = colors[i % colors.length];
            const slot = s * hung.length + i;
            return (
              <group key={i} position={at} quaternion={quaternion}>
                {/* The inner group is what swings, about the knot at the
                    outer's origin; string and festoon go with it. */}
                <group
                  ref={(g) => {
                    swinging.current[slot] = g && {
                      group: g,
                      hang: drop + dropOf(ornament) + ornament.radius,
                      radius: ornament.radius,
                      lx: 0,
                      lz: 0,
                      vx: 0,
                      vz: 0,
                    };
                  }}
                >
                  {stringGeo && (
                    <mesh
                      geometry={stringGeo}
                      material={wireMat}
                      position-y={-drop / 2}
                    />
                  )}

                  <group position-y={-drop - dropOf(ornament)}>
                    {/* Aimed from where it hangs, so one on the left and one
                      at the back are both seen flat-on. */}
                    <Facing x={at.x} z={at.z} faceOut={ornament.faceOut}>
                      <Ornament
                        ornament={ornament}
                        swatch={swatch}
                        casts={casts}
                      />
                    </Facing>
                  </group>
                </group>
              </group>
            );
          })}
        </group>
      ))}
    </group>
  );
}
