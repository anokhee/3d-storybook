import Mug from "../mug/Mug.jsx";
import Teapot from "../teapot/Teapot.jsx";
import Bowl from "../bowl/Bowl.jsx";
import Glass from "../glass/Glass.jsx";
import PlateStack from "../plateStack/PlateStack.jsx";
import Shakers from "../shaker/Shakers.jsx";
import { Oil, Vinegar } from "../cruet/Cruet.jsx";

// The pieces `crockery` and `kitchenware` (./crockery.js) set out, drawn:
// each the library's own (Food/Kitchen, Food/Condiments), at the scale `S`
// they were set out at.
const DRAW = { teapot: Teapot, bowl: Bowl, glass: Glass, plates: PlateStack, shakers: Shakers, oil: Oil, vinegar: Vinegar, mug: Mug };
export default function Crockery({ pieces, S }) {
  return pieces.map((p, i) => {
    const Piece = DRAW[p.k] ?? Mug;
    return (
      <group key={i} position={[p.x, p.y, p.z]} rotation-y={p.ry} scale={S}>
        <Piece config={p.cfg} />
      </group>
    );
  });
}
