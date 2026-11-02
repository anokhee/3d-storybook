// CYCLIST: a bicycle (src/nouns/bicycle) with one of the drivers (see
// driver.jsx) sat on its saddle in the "cycle" pose, feet on the pedals,
// hands on the grips. With `pedalling` the rider's legs and the bicycle's
// cranks go round together: the pose's frames and the cranks' steps are
// the same (Anthro.jsx's PEDAL), and the two are mounted at the same
// moment (keyed on the rider), so their clocks start together. The rider
// is drawn at size 1, the size the bicycle is built to; each kind sits a
// little higher or lower so their hips, not their seat, are where the
// pedals were worked out from. `rider` "none" draws only the bicycle.
// `stopped`: waiting with a foot down (the "cycle stop" pose), the cranks
// held where its right foot is, at CYCLE_STOP_FRAME.
import { PEDAL, seatOf, CYCLE_STOP_FRAME } from "../../src/nouns/anthro/Anthro.jsx";
import { ANTHRO } from "../../src/nouns/anthro/objects.js";
import Bicycle from "../../src/nouns/bicycle/Bicycle.jsx";
import { BICYCLE_SEAT } from "../../src/nouns/bicycle/objects.js";
import { merge } from "../../src/world/merge.js";
import { KINDS, Character } from "./driver.jsx";

const HELD = { current: true };
export function Cyclist({ rider = "none", pedalling = true, stopped = false, config }) {
  const base = KINDS[rider];
  const lift = base ? seatOf(merge(ANTHRO, base)) - PEDAL.nominal : 0;
  return (
    <group key={`${rider}-${pedalling}-${stopped}`}>
      {stopped
        ? <Bicycle config={config} pedalling phase={CYCLE_STOP_FRAME * PEDAL.hold + 0.01} hold={HELD} />
        : <Bicycle config={config} pedalling={pedalling} />}
      {base && (
        <group position={[BICYCLE_SEAT[0], BICYCLE_SEAT[1] + lift, BICYCLE_SEAT[2]]}>
          <Character config={{ ...base, pose: stopped ? "cycle stop" : "cycle", animate: pedalling && !stopped, size: 1 }} />
        </group>
      )}
    </group>
  );
}
