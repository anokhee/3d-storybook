import { useMemo } from "react";

import { primitiveSeatOn } from "./geometry.js";

// A part seated on the front of a primitive: `spec` is `{ translation,
// ...config }` — where it sits, as primitiveSeatOn reads it (x across, y
// DOWN like a screen's, z out from the face), and the rest handed to
// `part` as its `config`. The part is built lying in x/y and bulging out
// along +z, and is stood here with +z along the face's normal, so it sits
// flush. Nothing where there is no face to seat on.
export default function Seated({ body, spec, part: Part }) {
  // Split once per spec, so the part's override stays one object across
  // renders rather than a fresh spread every time.
  const { translation, config } = useMemo(() => {
    const { translation, ...config } = spec;
    return { translation, config };
  }, [spec]);
  const seat = useMemo(
    () => primitiveSeatOn(body, translation),
    [body, translation],
  );
  if (!seat) return null;
  return (
    <group position={seat.at} quaternion={seat.face}>
      <Part config={config} />
    </group>
  );
}
