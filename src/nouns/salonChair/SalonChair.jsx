import { useEffect, useMemo } from "react";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";

import { merge } from "../../world/merge.js";
import { unlitMat } from "../../adjectives/unlit/material.js";
import { SALON_CHAIR } from "./objects.js";

// A padded block `size` [x, y, z], its corners rounded `round`, its middle at `at`
function Pad({ at, size, round, swatch, rot = [0, 0, 0] }) {
  const geo = useMemo(() => new RoundedBoxGeometry(size[0], size[1], size[2], 3, Math.min(round, Math.min(...size) / 2 - 1e-3)), [size[0], size[1], size[2], round]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => () => geo.dispose(), [geo]);
  return <mesh geometry={geo} position={at} rotation={rot} material={unlitMat(swatch)} castShadow />;
}
const Rod = ({ at, r, len, swatch, rot = [0, 0, 0] }) => (
  <mesh position={at} rotation={rot} material={unlitMat(swatch)} castShadow>
    <cylinderGeometry args={[r, r, len, 14]} />
  </mesh>
);

// THE HOOD DRYER over a salon chair (SALON_CHAIR's `dryer`): the dome, tipped
// forward, open underneath, a chrome rim round its mouth and a vent on
// top; an arm back from its crown to a chrome pole — down from the ceiling,
// or up from a round foot behind the chair
function Dryer({ D, top, back, chrome }) {
  const tilt = (D.tilt * Math.PI) / 180, R = D.radius;
  const hy = top + D.up, hz = -D.back;
  const crown = hy + R * 0.9; // where the arm meets it, about its top
  const pz = -back / 2 - 0.9; // the pole, behind the chair's back
  const pole = D.mount === "stand" ? [0, crown + 0.15] : [crown, D.ceiling];
  return (
    <group>
      <group position={[0, hy, hz]} rotation-x={-tilt}>
        <mesh material={unlitMat(D.color)} castShadow>
          <sphereGeometry args={[R, 28, 14, 0, Math.PI * 2, 0, Math.PI * 0.55]} />
        </mesh>
        <mesh position-y={R * Math.cos(Math.PI * 0.55)} rotation-x={Math.PI / 2} material={unlitMat(chrome)}>
          <torusGeometry args={[R * Math.sin(Math.PI * 0.55), 0.06, 8, 32]} />
        </mesh>
        <Rod at={[0, R + 0.02, 0]} r={R * 0.3} len={0.1} swatch={chrome} />
      </group>
      {/* the arm, back from the crown to the pole */}
      <Rod at={[0, crown, (hz + pz) / 2]} r={0.06} len={hz - pz} rot={[Math.PI / 2, 0, 0]} swatch={chrome} />
      <Rod at={[0, (pole[0] + pole[1]) / 2, pz]} r={0.08} len={pole[1] - pole[0]} swatch={chrome} />
      {D.mount === "stand"
        ? <Rod at={[0, 0.06, pz]} r={0.7} len={0.12} swatch={chrome} />
        : <Rod at={[0, D.ceiling - 0.04, pz]} r={0.35} len={0.08} swatch={chrome} />}
    </group>
  );
}

// One salon chair (see SALON_CHAIR), standing on the ground facing +z.
// `seat`, if given, is set on its cushion (someone sitting in it), its
// origin at the middle of the cushion's top, facing the chair's front.
export default function SalonChair({ config, seat }) {
  const C = useMemo(() => merge(SALON_CHAIR, config), [config]);
  const { base: B, seat: T, back: K, head: H, arms: A, foot: F, colors: P } = C;
  const top = T.height, under = top - T.thickness;
  const lean = (K.lean * Math.PI) / 180, bz = -T.depth / 2 + K.thickness / 2;
  return (
    <group>
      {/* the foot and the column up to the seat */}
      <Rod at={[0, B.height / 2, 0]} r={B.radius} len={B.height} swatch={P.chrome} />
      <Rod at={[0, (B.height + under) / 2, 0]} r={B.column} len={under - B.height} swatch={P.chrome} />
      <Rod at={[0, under - 0.06, 0]} r={T.width * 0.32} len={0.12} swatch={P.piping} />
      {/* the cushion */}
      <Pad at={[0, under + T.thickness / 2, 0]} size={[T.width, T.thickness, T.depth]} round={T.round} swatch={P.cushion} />
      {/* the back, leaning, and the headrest on its bar over it */}
      <group position={[0, top - 0.05, bz]} rotation-x={-lean}>
        <Pad at={[0, K.height / 2, 0]} size={[T.width * 0.94, K.height, K.thickness]} round={T.round} swatch={P.cushion} />
        <Pad at={[0, K.height * 0.55, K.thickness / 2 + 0.005]} size={[T.width * 0.6, 0.05, 0.02]} round={0.01} swatch={P.piping} />
        {H.on && !C.dryer.on && (
          <>
            <Rod at={[0, K.height + H.gap / 2, -0.02]} r={0.05} len={H.gap + 0.1} swatch={P.chrome} />
            <Pad at={[0, K.height + H.gap + H.height / 2, 0]} size={[H.width, H.height, K.thickness * 0.85]} round={T.round} swatch={P.cushion} />
          </>
        )}
      </group>
      {/* the arms, each on two chrome struts up from the seat's sides */}
      {[-1, 1].map((e) => {
        const x = e * (T.width / 2 + A.width / 2 - 0.02), y = top + A.height;
        return (
          <group key={e}>
            {[-0.35, 0.35].map((f) => <Rod key={f} at={[x, (under + 0.1 + y) / 2, f * A.length]} r={0.05} len={y - under - 0.1} swatch={P.chrome} />)}
            <Pad at={[x, y + 0.08, -0.05]} size={[A.width, 0.18, A.length]} round={0.08} swatch={P.cushion} />
          </group>
        );
      })}
      {/* the footrest: a chrome plate out ahead on a bent rod */}
      <Rod at={[0, (F.up + under) / 2, T.depth / 2 + F.out / 2]} r={0.045} len={Math.hypot(under - F.up, F.out)} rot={[-Math.atan2(F.out, under - F.up), 0, 0]} swatch={P.chrome} />
      <Pad at={[0, F.up, T.depth / 2 + F.out]} size={[F.width, 0.06, 0.45]} round={0.025} swatch={P.chrome} />
      {C.dryer.on && <Dryer D={C.dryer} top={top} back={T.depth} chrome={P.chrome} />}
      {seat && <group position={[0, top, 0]}>{seat}</group>}
    </group>
  );
}
