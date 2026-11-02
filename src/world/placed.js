// PLACED OBJECTS: any entry of the catalog (a story in ../../stories) stood
// in a room as a piece of its furniture — an "object" item in a Shop
// Interior's or an Alleyway's layout (world/furnish.js):
//
//   { t: "object", entry: "furniture-seating-basic-chair--default", args: { … }, x, z, yaw, scale, y }
//
// `entry` the story's id (the catalog's, as its picture is named in
// public/thumbs), `args` its knobs as the storybook has them (what "Copy
// knobs" there puts on the clipboard), `scale` how much it is shrunk to
// stand beside the characters (the library's furniture, built in its own
// units, by the shop's `scale`; a character or an animal, 1).
//
// The library's nouns cannot read the stories themselves (the stories
// read them), so whoever shows a room — the interiors editor, the street
// — hands the catalog in here first: `PLACED.set(componentOf)`, with the
// mapmaker's catalog.js's componentOf (a story's id → a component drawing
// it from `args`). Until then an object item draws nothing; a room shown
// before the catalog is in draws it as soon as it is (usePlaced).
import { useSyncExternalStore } from "react";

const listeners = new Set();
let of = null;
export const PLACED = {
  set(fn) { of = fn; listeners.forEach((l) => l()); },
  of: (id) => of?.(id) ?? null,
  ready: () => !!of,
};
const subscribe = (l) => { listeners.add(l); return () => listeners.delete(l); };
const snapshot = () => of;
// The component drawing the catalog entry `id`, or null; a hook, so the
// room draws again when the catalog comes in
export function usePlaced(id) {
  const fn = useSyncExternalStore(subscribe, snapshot, snapshot);
  return id && fn ? fn(id) ?? null : null;
}
