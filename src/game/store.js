// The game's phase: where the story is up to, for whatever changes with it
// — the player, the capsule, the card, later the scenes after this one.
// One store rather than props threaded through the world, so a noun on the
// moon and the doll inside it can both read it without knowing each other.
//
//   "capsule"   the opening: the doll is shut in its capsule on the moon,
//               unseen and taking no keys; the camera sits on the capsule.
//               Each click on the capsule is a knock; KNOCK.count of
//               them in quick succession hatch it
//   "hatching"  it has popped out — a jump — and the capsule is going
//   "card"      held at the top of that jump, in the air, while the card
//               is up; still taking no keys
//   "playing"   the card is closed, the doll drops to the moon, and the
//               game is on
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

import { emit } from "../player/events.js";

export const PHASES = ["capsule", "hatching", "card", "playing"];

// How many knocks on the capsule it takes to hatch, and how close
// together they have to come, in ms: a knock later than `within` after
// the last starts the count over at one.
export const KNOCK = { count: 3, within: 700 };

// Each step is taken only from the phase before it, so a double-click
// after hatching, or a card closed twice, is nothing. A step that is
// taken is an event, for the sounds — see player/events.js.
const step = (from, to, event) => (s) => {
  if (s.phase !== from) return s;
  emit(event);
  return { phase: to };
};

// Where the doll is — the scene, the house it is in, where it left space,
// and whether it is editing indoors — is KEPT, in the browser's
// localStorage under GAME_KEY, so a reload (every change to the code is
// one) puts it back where it was rather than out in space at the start.
const GAME_KEY = "dollies-game";
const game = (set) => ({
  // TEMPORARY, for the refactor: opens already "playing" — no capsule, no
  // card — to go with scenes.js's TEMP_START. Was "capsule".
  phase: "playing",
  // The doll you are, as the Player has it — for the card, which draws its
  // portrait off the doll's config (see Card.jsx) and lives outside the
  // Canvas the doll does.
  doll: null,
  // And which deal it was — the Player's `seed` — so the same doll can be
  // dealt again in the next scene (see interior/).
  seed: null,
  setDoll: (doll, seed = null) => set({ doll, seed }),
  // The doll shut in the capsule: its palette (the hexes of the blocks it
  // was pinched from — see buildOneDolly), so the capsule can be colored
  // like what hatches out of it. Null until the player has dealt one.
  hatchling: null,
  setHatchling: (palette) => set({ hatchling: palette }),
  // The run of knocks so far on the shut capsule, and when the last one
  // was. Each is a click on it and a "knock", until the KNOCK.count-th in
  // a row, which is the "hatch"; a pause longer than KNOCK.within breaks
  // the run, and the next click is a first knock again.
  knocks: 0,
  knockedAt: 0,
  knock: () =>
    set((s) => {
      if (s.phase !== "capsule") return s;
      const now = performance.now();
      const stale = now - s.knockedAt > KNOCK.within;
      const knocks = (stale ? 0 : s.knocks) + 1;
      if (knocks < KNOCK.count) {
        emit("knock", { n: knocks });
        return { knocks, knockedAt: now };
      }
      emit("hatch");
      return { knocks, knockedAt: now, phase: "hatching" };
    }),
  // Straight out, knocks or no — the audition panel's.
  hatch: () => set(step("capsule", "hatching", "hatch")),
  // The top of the hatching jump — see Player.
  showCard: () => set(step("hatching", "card", "card")),
  // The card's X.
  closeCard: () =>
    set((s) => ({ ...step("card", "playing", "cardClose")(s), subject: null })),
  // The card again, mid-game: a click on superspace's star brings up
  // yours, a click on one of its heads that head's — `subject`, or null
  // for your own doll. Closed the same way, and the subject let go.
  subject: null,
  openCard: (subject = null) =>
    set((s) =>
      s.phase === "playing" ?
        { ...step("playing", "card", "card")(s), subject }
      : s,
    ),
  // Which scene is up: "space" (the planet and the moon), "loading" (the
  // beat between, `bound` for the next), "superspace" (see superspace/),
  // or "house" (indoors — see interior/). Flying out to the edge of the
  // sky is the way from space to superspace; flying into superspace's
  // star is the way back. `e` at a door is the way into a house (see
  // player/doors.js), and its "return to world" button the way out.
  scene: "space",
  bound: null,
  enterSuperspace: () =>
    set((s) =>
      s.scene === "space" ? { scene: "loading", bound: "superspace" } : s,
    ),
  returnToSpace: () =>
    set((s) => {
      if (s.scene !== "superspace" && s.scene !== "house") return s;
      if (s.scene === "house") emit("leave");
      return {
        scene: "loading",
        bound: "space",
        house: null,
        editing: false,
        editPick: null,
      };
    }),
  // Indoors: the room the doll has gone into — a door's `room` (see
  // player/doors.js) — while it is in one. And where it was stood when it
  // left space, to be put back there on its return: `{ body, lat, lon,
  // camDist, seed }` as whereOf reads it, plus the doll's deal — or null,
  // for the opening's spot (see scenes.js).
  house: null,
  spawn: null,
  // The edit mode indoors (see interior/DwellingPanel.jsx):
  // on, the rooms' objects are dragged about rather than the view.
  editing: false,
  setEditing: (editing) => set({ editing, editPick: null }),
  // And which object is picked in it, `{ room, object }` — or null.
  editPick: null,
  setEditPick: (editPick) => set({ editPick }),
  enterHouse: (room, where) =>
    set((s) => {
      if (s.scene !== "space") return s;
      emit("enter");
      return {
        scene: "loading",
        bound: "house",
        house: room,
        spawn: { ...where, seed: s.seed },
      };
    }),
  // Leaving the world view for another tab (see App.jsx) with the doll
  // stood in space: where it was, kept the same way, so it is put back
  // there when the world is next up.
  leaveWorld: (where) =>
    set((s) =>
      s.scene === "space" ? { spawn: { ...where, seed: s.seed } } : s,
    ),
  arrive: () =>
    set((s) => (s.scene === "loading" ? { scene: s.bound, bound: null } : s)),
  // The multiplier: one more for every ring flown through — see
  // refactored/nouns/ring/ and Multiplier.jsx. Nothing spends it yet.
  multiplier: 1,
  ringHit: () =>
    set((s) => {
      emit("ring", { n: s.multiplier });
      return { multiplier: s.multiplier + 1 };
    }),
  // How bright the day is on the planet, 0 night to 1 full day — the
  // atmosphere fills in with it while the doll is on the planet (see
  // refactored/nouns/planet/Atmosphere.jsx). A preference, kept in
  // localStorage; the daylight slider sets it (see Daylight.jsx).
  daylight: readDaylight(),
  setDaylight: (daylight) => {
    try {
      localStorage.setItem(DAYLIGHT, String(daylight));
    } catch {}
    set({ daylight });
  },
  // The keys the other way round: the arrows travel and WASD turns the
  // camera (see player/tuning.js, KEYS and LOOK). A preference, so it is
  // kept in localStorage; the sfx panel's checkbox sets it.
  reverseArrows: readReverse(),
  setReverseArrows: (on) => {
    try {
      localStorage.setItem(REVERSE, on ? "1" : "0");
    } catch {}
    set({ reverseArrows: on });
  },
});

export const useGameStore = create(
  persist(game, {
    name: GAME_KEY,
    storage: createJSONStorage(() =>
      typeof window === "undefined" ? undefined : window.localStorage,
    ),
    partialize: (s) => ({
      scene: s.scene,
      bound: s.bound,
      house: s.house,
      spawn: s.spawn,
      editing: s.editing,
    }),
    // Read back, a scene caught loading is taken as arrived.
    merge: (kept, current) => ({
      ...current,
      ...kept,
      scene:
        kept?.scene === "loading" ?
          (kept.bound ?? "space")
        : (kept?.scene ?? current.scene),
      bound: null,
    }),
  }),
);

const DAYLIGHT = "daylight";
function readDaylight() {
  try {
    const v = Number(localStorage.getItem(DAYLIGHT));
    return Number.isFinite(v) ? Math.min(1, Math.max(0, v)) : 0;
  } catch {
    return 0;
  }
}

const REVERSE = "reverse-arrows";
function readReverse() {
  try {
    return localStorage.getItem(REVERSE) === "1";
  } catch {
    return false;
  }
}
