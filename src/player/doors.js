// Everywhere the doll can go in, as the player sees it: a door — on which
// ball, where on it (a direction from that ball's center to the spot on
// the ground at the door's foot), how tall it stands, and the room behind
// it (see interior/). Doors register themselves on mount — see Door in
// nouns/house/House.jsx — the way the seats do in seats.js. Press `e` on
// the ground within DOOR.reach of one and the doll goes in: the game
// leaves space for the room, remembering where the doll stood so it can
// be put back there (see game/store.js, enterHouse) — or, at the door in
// a room (see interior/), comes back out — or, at a door between two
// rooms, swings it open or shut. The knobs are DOOR in tuning.js.
import * as THREE from "three";

import { useGameStore } from "../game/store.js";
import { DOOR, SPLAT } from "./tuning.js";

const doors = new Set();

// `room` is what the door opens onto: `{ id, walls, floor, rooms, door,
// window }` — an id that tells this house from every other, the swatches
// its rooms are done in, the rooms themselves and the house's own door
// and window, for the inside to match — or `{ out: true }` for the way
// out — or `{ toggle }` for a door between two rooms, which `e` only
// swings, calling that (see DoorWall in interior/Interior.jsx).
export function registerDoor({ body, dir, top, room }) {
  const door = { body, dir: dir.clone().normalize(), top, room };
  doors.add(door);
  return door;
}

export function unregisterDoor(door) {
  doors.delete(door);
}

// The nearest door to the doll on its own ball, and how far it is along
// the ground from the door's foot — at any distance; the caller decides
// what counts as close.
export function nearestDoor(you) {
  let best = null,
    dist = Infinity;
  for (const door of doors) {
    if (door.body !== you.body) continue;
    const d = you.dir.angleTo(door.dir) * you.body.radius;
    if (d < dist) ((best = door), (dist = d));
  }
  return { door: best, dist };
}

// Where the doll is stood, the way the game puts it back: which ball by
// name, lat/lon there (the inverse of latLonDir), and how far back the
// camera is.
export function whereOf(you) {
  const { x, y, z } = you.dir;
  const deg = THREE.MathUtils.radToDeg;
  return {
    body: you.body.name,
    lat: deg(Math.asin(THREE.MathUtils.clamp(y, -1, 1))),
    lon: deg(Math.atan2(x, z)),
    camDist: you.camDist,
  };
}

// Going in: `e` on the ground within DOOR.reach of a door — on its feet,
// not sat, not mid-jump or flat on its belly. Says whether it did.
export function enterDoor(you) {
  if (!you.body || !you.resting || you.seat) return false;
  if (you.mat !== null || you.splatFor > 0 || you.splat > SPLAT.arms.from)
    return false;
  const { door, dist } = nearestDoor(you);
  if (!door || dist > DOOR.reach) return false;
  const game = useGameStore.getState();
  if (door.room.toggle) door.room.toggle();
  else if (door.room.out) game.returnToSpace();
  else game.enterHouse(door.room, whereOf(you));
  return true;
}
