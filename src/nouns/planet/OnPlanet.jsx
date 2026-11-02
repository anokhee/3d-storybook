import { createContext, useContext, useMemo } from "react";

import { latLonDir, standOn } from "../../world/layout.js";
import { BODIES, bodyOf } from "./bodies.js";

// Which ball whatever is inside stands on. Read it with useBody: a thing
// that registers itself with the player (a sheet, a column) measures its
// bearing and height from this, and standAt drops things onto it.
const BodyContext = createContext(BODIES.planet);
export const useBody = () => useContext(BodyContext);

// Flat ground: whatever is inside stands on a ball so big it is flat to
// a hair — for things built to stand on the planet (a fence: its posts
// dropped onto the ball, each upright to its own bit) put up somewhere
// that is not the ball's surface, as a balcony's railing on a shopfront.
const FLAT = { ...BODIES.planet, name: "flat", radius: 1e7 };
export function FlatGround({ children }) {
  return <BodyContext.Provider value={FLAT}>{children}</BodyContext.Provider>;
}

// Stands whatever is inside on the ball — `body` by name, the planet unless
// said otherwise — at lat/lon: moved out to the surface there and turned so
// its +y is the ground's up. Everything inside is plain +y-up with the
// ground at y = 0.
export default function OnPlanet({
  body = "planet",
  lat = 0,
  lon = 0,
  children,
}) {
  const B = bodyOf(body);
  const { position, quaternion } = useMemo(() => {
    const dir = latLonDir(lat, lon);
    return {
      position: dir.clone().multiplyScalar(B.radius).add(B.center).toArray(),
      quaternion: standOn(dir).toArray(),
    };
  }, [B, lat, lon]);

  return (
    <BodyContext.Provider value={B}>
      <group position={position} quaternion={quaternion}>
        {children}
      </group>
    </BodyContext.Provider>
  );
}
