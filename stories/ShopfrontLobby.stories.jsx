// Shopfronts/Lobby: the lobby from the street (Exterior) and from inside
// (Interior: a block of flats' way in: a welcome mat, the concierge at the desk, a wall of mailboxes, a lift's doors, a blue-grey carpet).
// Every kind is made the same way: see stories/helpers/shopfronts.jsx.
import Shopfront from "../src/nouns/shopfront/Shopfront.jsx";
import { exteriorOf, interiorOf } from "./helpers/shopfronts.jsx";

export default { title: "Shopfronts/Lobby", component: Shopfront };

export const Exterior = exteriorOf("lobby");
export const Interior = interiorOf("lobby");
