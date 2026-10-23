// Applies theme.js to the Storybook shell, adds our toolbar tools
// (tools.jsx: the catalog button, the lightbulb and the time-of-day slider;
// the search box and filter popover are in the sidebar, below), and hides the sidebar and the Controls panel to
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
import { loadMeta } from "./meta.js"; // each entry's description, tags and status

// THE SIDEBAR'S TWO VIEWS. "tree" is Storybook's own tree of names, left
// as it is. "list" is the catalog as a list down the sidebar: one row per
// object (one entry in the tree; its variants share it), its picture
// (public/thumbs, the same ones the catalog shows: its first variant's)
// on the left with its name and the section it is from on the right.
// The tree is hidden under it. Clicking a row opens
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

// Storybook's own tags, which are not the objects' (only the others filter)
const HOUSEKEEPING = new Set(["dev", "test", "manifest", "autodocs", "docs", "story", "unattached-mdx", "attached-mdx", "play-fn", "vitest"]);

// THE FILTER: what the search box and the filter popover (SearchBar, under
// the sidebar's heading) have chosen. An object shows when its name or
// section has the typed text, its category (the section's first part) is
// one of the ticked ones, if any are, and it has every ticked tag.
// Replaced, not changed, on each edit, so React sees it.
const filt = {
  state: { text: "", cats: [], tags: [] },
  listeners: new Set(),
  set(patch) { filt.state = { ...filt.state, ...patch }; filt.listeners.forEach((l) => l()); },
  subscribe(l) { filt.listeners.add(l); return () => filt.listeners.delete(l); },
  get: () => filt.state,
};
const active = (f) => f.text.trim() !== "" || f.cats.length > 0 || f.tags.length > 0;
const matches = (f, it) => {
  const q = f.text.trim().toLowerCase();
  if (q && !`${it.name} ${it.section}`.toLowerCase().includes(q)) return false;
  if (f.cats.length && !f.cats.includes(it.top)) return false;
  return f.tags.every((t) => it.tags.includes(t));
};

// Every object, from the index Storybook writes (index.json, the same file
// the thumbnail script reads): one per title, with its variants' ids.
let indexPromise = null;
const loadIndex = () => (indexPromise ??= fetch("./index.json").then((r) => r.json()).then((j) => j.entries ?? {}).catch(() => ({})));
// The objects, with the tags set in the catalog's drawer (the metadata file) added to Storybook's own
const loadItems = () => Promise.all([loadIndex(), loadMeta()]).then(([entries, meta]) => itemsOf(entries, meta));
function itemsOf(entries, meta = {}) {
  const byTitle = new Map();
  for (const e of Object.values(entries)) {
    if (e.type !== "story" || e.id === GRID_STORY) continue;
    const path = e.title.split("/");
    const it = byTitle.get(e.title) ?? { title: e.title, name: path[path.length - 1], section: path.slice(0, -1).join(" / "), top: path[0], id: e.id, ids: [], tags: [] };
    it.ids.push(e.id);
    for (const t of [...(e.tags ?? []), ...(meta[e.id]?.tags ?? [])]) if (!HOUSEKEEPING.has(t) && !it.tags.includes(t)) it.tags.push(t);
    byTitle.set(e.title, it);
  }
  return [...byTitle.values()].sort((a, b) => rank(a.top) - rank(b.top) || a.section.localeCompare(b.section) || a.name.localeCompare(b.name));
}

// The manager's API, once Storybook hands it over (selectStory, the open story)
let listApi = null;
addons.register("object-library/list", (api) => { listApi = api; mountSidebarBits(); });

// One card, a row: the picture on the left, the name with the section
// under it on the right
function Card({ item, picked }) {
  const [lost, setLost] = useState(false);
  return React.createElement(
    "button",
    {
      onClick: () => listApi?.selectStory(item.id),
      title: `Open ${item.name}` + (item.ids.length > 1 ? ` (${item.ids.length} variants, in the tree)` : ""),
      style: { all: "unset", cursor: "pointer", display: "flex", flexDirection: "row", alignItems: "center", gap: 12, width: "100%", boxSizing: "border-box" },
    },
    React.createElement("span", { style: { display: "block", flex: "0 0 auto", outline: picked ? "2px solid #4F6E86" : "none", outlineOffset: 2, borderRadius: 4, background: "#DDE4EA", width: 56, height: 56, overflow: "hidden" } },
      lost ? null : React.createElement("img", { src: `thumbs/${item.id}.png`, alt: item.name, loading: "lazy", onError: () => setLost(true), style: { width: "100%", height: "100%", objectFit: "cover", display: "block" } })),
    React.createElement("span", { style: { display: "flex", flexDirection: "column", gap: 2, minWidth: 0 } },
      React.createElement("span", { style: { fontSize: 12, color: picked ? "#2F4A5F" : "#2B3A47", fontWeight: picked ? 600 : 400, lineHeight: 1.3 } }, item.name),
      React.createElement("span", { style: { fontSize: 10, color: "#66788A", lineHeight: 1.3 } }, item.section)),
  );
}

// The list itself, in place of the tree when the view is "list"
function List() {
  const mode = useSyncExternalStore(view.subscribe, view.get);
  const f = useSyncExternalStore(filt.subscribe, filt.get);
  const [items, setItems] = useState([]);
  const [current, setCurrent] = useState(() => listApi?.getUrlState?.().storyId ?? null);
  useEffect(() => { loadItems().then(setItems); }, []);
  useEffect(() => {
    const on = (id) => { setCurrent(id); loadItems().then(setItems); }; // tags may have been edited in the catalog
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
  return React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: 10, padding: "4px 16px 24px" } },
    ...(() => {
      const shown = items.filter((it) => matches(f, it));
      if (items.length && !shown.length) return [React.createElement("span", { key: "none", style: { fontSize: 11, color: "#66788A", padding: "8px 12px" } }, "Nothing matches.")];
      return shown.map((it) => React.createElement(Card, { key: it.title, item: it, picked: current != null && it.ids.includes(current) }));
    })());
}

// THE SEARCH BAR, under the heading: a box that narrows the list as you
// type, and at its right a filter button (the same quiet icon-button style
// as the toolbar's reload) that opens a popover of categories and tags.
// The list (and, in the tree view, the tree) shows what the filter lets by.
const FilterIcon = () => React.createElement("svg", { width: 14, height: 14, viewBox: "0 0 14 14", fill: "none", stroke: "currentColor", strokeWidth: 1.3, strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": true },
  React.createElement("path", { d: "M1.5 3.5h11M3.5 7h7M5.5 10.5h3" }));

const checkRow = (key, label, count, on, toggle) => React.createElement("label", { key, style: { display: "flex", alignItems: "center", gap: 8, padding: "3px 4px", fontSize: 11, cursor: "pointer", color: "#2B3A47" } },
  React.createElement("input", { type: "checkbox", checked: on, onChange: toggle, style: { margin: 0, accentColor: "#4F6E86" } }),
  React.createElement("span", { style: { flex: 1 } }, label),
  count != null && React.createElement("span", { style: { color: "#66788A", fontSize: 10 } }, count));

function SearchBar() {
  const f = useSyncExternalStore(filt.subscribe, filt.get);
  const [items, setItems] = useState([]);
  const [open, setOpen] = useState(false);
  const box = React.useRef(null);
  // The search box is as wide as the sidebar's title above it, and starts
  // where its text does
  const [field, setField] = useState(null);
  useEffect(() => {
    const title = document.querySelector(".sidebar-header a[href^='http']");
    if (!title || !box.current) return undefined;
    const measure = () => {
      const range = document.createRange();
      range.selectNodeContents(title);
      const text = range.getBoundingClientRect();
      if (text.width) setField({ w: Math.round(text.width), left: Math.round(text.left - box.current.getBoundingClientRect().left) });
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(title);
    return () => ro.disconnect();
  }, []);
  useEffect(() => {
    const refresh = () => loadItems().then(setItems);
    refresh();
    listApi?.on(STORY_CHANGED, refresh); // tags may have been edited in the catalog
    return () => listApi?.off(STORY_CHANGED, refresh);
  }, []);
  useEffect(() => {
    if (!open) return undefined;
    const away = (e) => { if (box.current && !box.current.contains(e.target)) setOpen(false); };
    const esc = (e) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", away);
    document.addEventListener("keydown", esc);
    return () => { document.removeEventListener("mousedown", away); document.removeEventListener("keydown", esc); };
  }, [open]);
  // The tree view shows the category and tag choices too (Storybook's own filter hook)
  useEffect(() => {
    listApi?.experimental_setFilters?.({ "object-library/filter": (item) => !item.title || matches(f, { name: item.name ?? "", section: item.title, top: item.title.split("/")[0], tags: item.tags ?? [] }) });
  }, [f]);
  const cats = ORDER.concat(items.map((i) => i.top).filter((t) => !ORDER.includes(t))).filter((c, i, a) => a.indexOf(c) === i && items.some((it) => it.top === c));
  const tags = [...new Set(items.flatMap((i) => i.tags))].sort();
  const flip = (key, v) => filt.set({ [key]: f[key].includes(v) ? f[key].filter((x) => x !== v) : [...f[key], v] });
  const chosen = f.cats.length + f.tags.length;
  const head = (t) => React.createElement("div", { style: { fontSize: 10, letterSpacing: "0.04em", textTransform: "uppercase", color: "#66788A", padding: "8px 4px 2px" } }, t);
  return React.createElement("div", { ref: box, style: { position: "relative", display: "flex", alignItems: "center", gap: 6, padding: `0 20px 8px ${field?.left ?? 20}px` } },
    React.createElement("input", {
      type: "search", placeholder: "Search objects…", value: f.text, onChange: (e) => filt.set({ text: e.target.value }), "aria-label": "Search objects",
      style: { flex: field ? "0 0 auto" : 1, width: field?.w, minWidth: 0, boxSizing: "border-box", font: "inherit", fontSize: 12, padding: "4px 8px", border: "1px solid #C3CED7", borderRadius: 3, background: "#F6F8FA", color: "#2B3A47", outline: "none" },
    }),
    React.createElement("button", {
      onClick: () => setOpen((o) => !o), title: "Filter by category or tag", "aria-label": "Filter by category or tag", "aria-expanded": open,
      style: { all: "unset", cursor: "pointer", boxSizing: "border-box", position: "relative", display: "inline-flex", alignItems: "center", justifyContent: "center", width: 28, height: 28, borderRadius: 4, color: chosen || open ? "#2F4A5F" : "#4A5C6C", background: chosen || open ? "#C9D6E0" : "transparent" },
      onMouseEnter: (e) => { if (!chosen && !open) e.currentTarget.style.background = "rgba(79,110,134,0.14)"; },
      onMouseLeave: (e) => { if (!chosen && !open) e.currentTarget.style.background = "transparent"; },
    }, React.createElement(FilterIcon), chosen > 0 && React.createElement("span", { style: { position: "absolute", top: -2, right: -2, minWidth: 14, height: 14, padding: "0 3px", boxSizing: "border-box", borderRadius: 7, background: "#4F6E86", color: "#EEF2F5", fontSize: 9, lineHeight: "14px", textAlign: "center" } }, chosen)),
    open && React.createElement("div", { style: { position: "absolute", top: 34, right: 20, zIndex: 20, width: 220, maxHeight: "60vh", overflowY: "auto", boxSizing: "border-box", padding: "4px 10px 10px", background: "#F6F8FA", border: "1px solid #C3CED7", borderRadius: 4, boxShadow: "0 4px 14px rgba(43,58,71,0.18)" } },
      head("Category"),
      ...cats.map((c) => checkRow(`c-${c}`, c, items.filter((it) => it.top === c).length, f.cats.includes(c), () => flip("cats", c))),
      tags.length > 0 && head("Tag"),
      ...tags.map((t) => checkRow(`t-${t}`, t, items.filter((it) => it.tags.includes(t)).length, f.tags.includes(t), () => flip("tags", t))),
      chosen > 0 && React.createElement("button", { onClick: () => filt.set({ cats: [], tags: [] }), style: { font: "inherit", fontSize: 11, marginTop: 8, padding: "3px 10px", border: "1px solid #C3CED7", borderRadius: 3, background: "#E7EDF1", color: "#2B3A47", cursor: "pointer" } }, "Clear filters")));
}

// The toggle: two buttons, mounted into the sidebar's header (where the
// settings button was, which is hidden in manager-head.html) once it exists
// (Storybook 10 has no addon slot there, so it is put there by hand and
// kept there as the sidebar redraws)
function ViewToggle() {
  const mode = useSyncExternalStore(view.subscribe, view.get);
  const btn = (m, label) => React.createElement("button", {
    key: m, onClick: () => view.set(m), title: m === "list" ? "A list of the objects, each with its picture" : "The plain tree of names",
    style: { font: "inherit", fontSize: 11, padding: "3px 10px", border: 0, cursor: "pointer", background: mode === m ? "#4F6E86" : "#F6F8FA", color: mode === m ? "#EEF2F5" : "#2B3A47" },
  }, label);
  return React.createElement("div", { style: { display: "flex" } },
    React.createElement("span", { style: { display: "inline-flex", border: "1px solid #C3CED7", borderRadius: 3, overflow: "hidden" } }, btn("tree", "tree"), btn("list", "list")));
}

// Both are put into the sidebar by hand, and put back whenever it redraws
// without them.
let toggleRoot = null;
let searchRoot = null;
let listRoot = null;
function mountSidebarBits() {
  const header = document.querySelector(".sidebar-header");
  if (header && !document.getElementById("object-catalog-view")) {
    const host = document.createElement("div");
    host.id = "object-catalog-view";
    host.style.cssText = "margin-left: auto; flex: 0 0 auto; display: flex; align-items: center;";
    header.appendChild(host);
    toggleRoot?.unmount?.();
    toggleRoot = createRoot(host);
    toggleRoot.render(React.createElement(ViewToggle));
  }
  if (header && !document.getElementById("object-catalog-search")) {
    const host = document.createElement("div");
    host.id = "object-catalog-search";
    header.insertAdjacentElement("afterend", host);
    searchRoot?.unmount?.();
    searchRoot = createRoot(host);
    searchRoot.render(React.createElement(SearchBar));
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
