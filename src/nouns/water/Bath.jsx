import Primitive from "../primitive/Primitive.jsx";
import Tub from "./Tub.jsx";

// A bath, in the pool's frame — see BATH in objects.js: the tub (see
// Tub.jsx, its shape reset by KINDS.bath) stood up on four clawed feet,
// each a ball on the floor with a stem up from it to the tub's
// underside, a tap on the rim at the tub's +x end, and a duck afloat.
// The pool's frame is lifted onto the feet already (see pools.js's
// lift), so the feet reach down from y = 0 to the floor, `stand` under
// it. Everything but the tub is stood in the first lobe's own frame —
// the bath is the one lobe, turned as the object is.
const CORNERS = [
  { x: -1, z: -1 },
  { x: 1, z: -1 },
  { x: -1, z: 1 },
  { x: 1, z: 1 },
];
export default function Bath({ pool }) {
  const W = pool.W;
  const T = W.tub;
  const { feet: F, tap: P, duck: D } = W.bath;
  const lobe = pool.lobes[0];
  const stand = 2 * F.ball + F.height - F.sink;
  const rim = T.height + T.rim.thickness;
  const water = T.height - T.waterline;
  return (
    <group>
      <Tub pool={pool} />
      <group position={[lobe.x, 0, lobe.z]} rotation-y={lobe.rad}>
        {CORNERS.map(({ x, z }, i) => (
          <group
            key={i}
            position={[
              x * (lobe.halfWidth - F.in),
              -stand,
              z * (lobe.halfLength - F.in),
            ]}
          >
            <group position-y={F.ball}>
              <Primitive
                shape="sphere"
                radius={F.ball}
                clay={F.clay}
                swatch={F.color}
              />
            </group>
            {/* The stem, from a little into the ball's top up into the
              tub's underside. */}
            <group position-y={2 * F.ball - 0.08 + (F.height + 0.08) / 2}>
              <Primitive
                shape="cylinder"
                radius={F.radius}
                form={{ tall: (F.height + 0.08) / (2 * F.radius) }}
                clay={F.clay}
                swatch={F.color}
              />
            </group>
          </group>
        ))}
        {P && (
          <group position={[lobe.halfWidth - P.in, rim, 0]}>
            <group position-y={P.height / 2}>
              <Primitive
                shape="cylinder"
                radius={P.radius}
                form={{ tall: P.height / (2 * P.radius) }}
                swatch={P.color}
              />
            </group>
            <group position={[-P.reach / 2, P.height - P.radius, 0]}>
              <Primitive
                shape="cylinder"
                radius={P.radius}
                form={{ tall: P.reach / (2 * P.radius) }}
                rotation={{ z: 90 }}
                swatch={P.color}
              />
            </group>
          </group>
        )}
        {D && (
          <group position={[D.at.x, water + D.radius * 0.5, D.at.z]}>
            <Primitive
              shape="sphere"
              radius={D.radius}
              form={{ tall: 0.8 }}
              swatch={D.color}
            />
            <group position={[D.radius * 0.6, D.radius * 0.9, 0]}>
              <Primitive
                shape="sphere"
                radius={D.radius * 0.6}
                swatch={D.color}
              />
              <group position={[D.radius * 0.6, -D.radius * 0.05, 0]}>
                <Primitive
                  shape="sphere"
                  radius={D.radius * 0.25}
                  form={{ widen: 1.4, tall: 0.6 }}
                  swatch={D.beak}
                />
              </group>
            </group>
          </group>
        )}
      </group>
    </group>
  );
}
