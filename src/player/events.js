// What the doll just did, told to whoever is listening — the sound
// effects, the audition panel — without flight.js knowing either exists.
// An event is a name and, sometimes, a detail: how hard it landed, how
// well-timed the press was, how hard the jetpack is firing.
//
//   knock      a click on the shut capsule                { n } 1, 2, ...
//   capsuleLand  the capsule back down from a knock's hop     { speed }
//   hatch      popped out of the capsule: the last knock of a quick run
//   card       the card came up, at the top of that jump
//   cardClose  the card was closed
//   jump       a tap of space on the ground
//   land       came down on bare ground or a column   { speed }
//   splat      a long fall, onto its belly            { speed }
//   bounce     came down on a trampoline sheet        { speed, grade }
//   pump       a landing the sheet lit for: grade > 0  { grade }
//   spin       `r`: the spin that deals the next doll
//   sit, stand `e` on and off a seat
//   enter      `e` at a door: gone indoors            (see doors.js)
//   leave      the "return to world" button: back out
//   float      climbed out of a ball's gravity, into free flight
//   catch      drifted into a ball's gravity          { body }
//   splash     came down into water                   { speed }
//   bump       hit the sky
//   rustle     pushed into a tree's leaves               { speed } (see foliage.js)
//   thrust     the jetpack, every frame it fires      { level } 0..1
//   ring       flew through a ring out in space       { n } the multiplier before
const listeners = new Set();

export function onEvent(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function emit(name, detail = null) {
  for (const fn of listeners) fn(name, detail);
}

// The doll being flown right now — its flight state, as makeFlyer builds
// it — for whoever wants to poke it from outside the Canvas. Player keeps
// it current; the audition panel's buttons jump and spin it.
export const live = { you: null };
