import { createContext, useContext } from "react";

// Which thing, in which station, whatever is inside is: `{ station, index }`
// — the station's index in the level and the object's in the station —
// for a thing that has to be told from its twins, the way a house's door
// has to know which house it opens (see player/doors.js). Station provides
// it round each of its objects; outside a station there is none.
export const ThingContext = createContext(null);
export const useThing = () => useContext(ThingContext);
