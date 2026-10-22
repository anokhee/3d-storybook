// Applies theme.js to the Storybook shell, adds our toolbar tools
// (tools.jsx: the search box, the catalog button, the lightbulb and the
// time-of-day slider), and hides the sidebar and the Controls panel to
// start: the catalog is the way in, with its own preview and controls in
// a drawer. The S key shows the sidebar, A the panel, which then sits down
// the right-hand side rather than under the viewport.
import React, { useEffect, useState, useSyncExternalStore } from "react";
import { createRoot } from "react-dom/client";
import { addons } from "storybook/manager-api";
import { STORY_CHANGED } from "storybook/internal/core-events";
import { storyTheme } from "./theme.js";
import "./tools.jsx";
import "./code.jsx"; // the Code panel: the entry's source, editable in place

// THE SIDEBAR'S TWO VIEWS. "tree" is Storybook's own tree of names, left
// as it is. "list" is the catalog as a list down the sidebar: one card per
// object (one entry in the tree — its variants share it), its picture
// large (public/thumbs, the same ones the catalog shows: its first
// variant's) with its name and the section it is from under it, like the
// catalog's own cards. The tree is hidden under it. Clicking a card opens
// the object's first variant on the stage; the open object's card is
// outlined. A toggle in the sidebar's header picks, and the choice is kept
// in the browser.
const VIEW_KEY = "object-catalog-sidebar-view";
const view = {
  mode: (() => { try { return localStorage.getItem(VIEW_KEY) || "list"; } catch { return "list"; } })(),
  listeners: new Set(),
  set(mode) { view.mode = mode; try { localStorage.setItem(VIEW_KEY, mode); } catch { /* no storage */ } view.listeners.forEach((l) => l()); },
  subscribe(l) { view.listeners.add(l); return () => view.listeners.delete(l); },
  get: () => view.mode,
};

// The catalog's own order of sections (Catalog.stories.jsx, ORDER); anything new goes after.
const ORDER = ["Primitives", "Furniture", "Lighting", "Machines", "Machine Parts", "Fixtures", "Buildings", "Nature", "Ornaments", "Sky", "Planets", "Animals", "Characters", "Toys", "Vehicles", "Instruments", "Monuments", "Misc"];
const GRID_STORY = "catalog--default";
const rank = (top) => { const i = ORDER.indexOf(top); return i < 0 ? ORDER.length : i; };

// Every object, from the index Storybook writes (index.json, the same file
// the thumbnail script reads): one per title, with its variants' ids.
let indexPromise = null;
const loadIndex = () => (indexPromise ??= fetch("./index.json").then((r) => r.json()).then((j) => j.entries ?? {}).catch(() => ({})));
function itemsOf(entries) {
  const byTitle = new Map();
  for (const e of Object.values(entries)) {
    if (e.type !== "story" || e.id === GRID_STORY) continue;
    const path = e.title.split("/");
    const it = byTitle.get(e.title) ?? { title: e.title, name: path[path.length - 1], section: path.slice(0, -1).join(" / "), top: path[0], id: e.id, ids: [] };
    it.ids.push(e.id);
    byTitle.set(e.title, it);
  }
  return [...byTitle.values()].sort((a, b) => rank(a.top) - rank(b.top) || a.section.localeCompare(b.section) || a.name.localeCompare(b.name));
}

// The manager's API, once Storybook hands it over (selectStory, the open story)
let listApi = null;
addons.register("object-library/list", (api) => { listApi = api; mountSidebarBits(); });

// One card: the picture, the name, the section under it
function Card({ item, picked }) {
  const [lost, setLost] = useState(false);
  return React.createElement(
    "button",
    {
      onClick: () => listApi?.selectStory(item.id),
      title: `Open ${item.name}` + (item.ids.length > 1 ? ` (${item.ids.length} variants, in the tree)` : ""),
      style: { all: "unset", cursor: "pointer", display: "flex", flexDirection: "column", gap: 6, width: "100%", boxSizing: "border-box" },
    },
    React.createElement("span", { style: { display: "block", outline: picked ? "2px solid #4F6E86" : "none", outlineOffset: 2, borderRadius: 4, background: "#DDE4EA", aspectRatio: "1 / 1", width: "100%", overflow: "hidden" } },
      lost ? null : React.createElement("img", { src: `thumbs/${item.id}.png`, alt: item.name, loading: "lazy", onError: () => setLost(true), style: { width: "100%", height: "100%", objectFit: "cover", display: "block" } })),
    React.createElement("span", { style: { fontSize: 12, color: picked ? "#2F4A5F" : "#2B3A47", fontWeight: picked ? 600 : 400, lineHeight: 1.3 } }, item.name),
    React.createElement("span", { style: { fontSize: 10, color: "#66788A", marginTop: -3, lineHeight: 1.3 } }, item.section),
  );
}

// The list itself, in place of the tree when the view is "list"
function List() {
  const mode = useSyncExternalStore(view.subscribe, view.get);
  const [items, setItems] = useState([]);
  const [current, setCurrent] = useState(() => listApi?.getUrlState?.().storyId ?? null);
  useEffect(() => { loadIndex().then((e) => setItems(itemsOf(e))); }, []);
  useEffect(() => {
    const on = (id) => setCurrent(id);
    listApi?.on(STORY_CHANGED, on);
    return () => listApi?.off(STORY_CHANGED, on);
  }, []);
  // The tree hides while the list shows
  useEffect(() => {
    let style = document.getElementById("object-catalog-list-style");
    if (!style) { style = document.createElement("style"); style.id = "object-catalog-list-style"; document.head.appendChild(style); }
    style.textContent = mode === "list" ? "#storybook-explorer-tree { display: none !important; }" : "";
  }, [mode]);
  if (mode !== "list") return null;
  return React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: 18, padding: "4px 20px 24px" } },
    items.map((it) => React.createElement(Card, { key: it.title, item: it, picked: current != null && it.ids.includes(current) })));
}

// The toggle: two buttons, mounted into the sidebar's header once it exists
// (Storybook 10 has no addon slot there, so it is put there by hand and
// kept there as the sidebar redraws)
function ViewToggle() {
  const mode = useSyncExternalStore(view.subscribe, view.get);
  const btn = (m, label) => React.createElement("button", {
    key: m, onClick: () => view.set(m), title: m === "list" ? "A list of the objects, each with its picture" : "The plain tree of names",
    style: { font: "inherit", fontSize: 11, padding: "3px 10px", border: 0, cursor: "pointer", background: mode === m ? "#4F6E86" : "#F6F8FA", color: mode === m ? "#EEF2F5" : "#2B3A47" },
  }, label);
  return React.createElement("div", { style: { display: "flex", justifyContent: "flex-end", padding: "0 12px 8px" } },
    React.createElement("span", { style: { display: "inline-flex", border: "1px solid #C3CED7", borderRadius: 3, overflow: "hidden" } }, btn("tree", "tree"), btn("list", "list")));
}

// Both are put into the sidebar by hand, and put back whenever it redraws
// without them.
let toggleRoot = null;
let listRoot = null;
function mountSidebarBits() {
  const header = document.querySelector(".sidebar-header");
  if (header && !document.getElementById("object-catalog-view")) {
    const host = document.createElement("div");
    host.id = "object-catalog-view";
    header.insertAdjacentElement("afterend", host);
    toggleRoot?.unmount?.();
    toggleRoot = createRoot(host);
    toggleRoot.render(React.createElement(ViewToggle));
  }
  const tree = document.getElementById("storybook-explorer-tree");
  if (tree && !document.getElementById("object-catalog-list")) {
    const host = document.createElement("div");
    host.id = "object-catalog-list";
    tree.insertAdjacentElement("afterend", host);
    listRoot?.unmount?.();
    listRoot = createRoot(host);
    listRoot.render(React.createElement(List));
  }
}
if (typeof document !== "undefined") {
  new MutationObserver(mountSidebarBits).observe(document.documentElement, { childList: true, subtree: true });
  mountSidebarBits();
}

addons.setConfig({
  theme: storyTheme,
  layout: { panelPosition: "right", showPanel: false, showNav: false },
  // The toolbar lists Storybook's own tools first, then ours in the order
  // tools.jsx adds them. Every built-in but the reload and open-in-editor
  // buttons is hidden, so the search box comes right after them; the panel
  // toggle and isolation mode live on the object bar (tools.jsx) instead.
  toolbar: {
    zoom: { hidden: true },
    addons: { hidden: true },
    isolationMode: { hidden: true },
    fullscreen: { hidden: true },
    eject: { hidden: true },
    copy: { hidden: true },
    "storybook/background": { hidden: true },
    "storybook/grid": { hidden: true },
    "storybook/outline": { hidden: true },
    "storybook/measure": { hidden: true },
    "storybook/viewport": { hidden: true },
  },
});
