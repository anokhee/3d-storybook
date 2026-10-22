// THE CATALOGUE: every object on one page, as cards in a grid with its
// name under each, sorted by category: buy mode. The grid button in the
// toolbar jumps here. Clicking a card opens that object in a drawer down
// the right: a live preview of it (its own entry, in a frame, under the
// toolbar's light and hour) with its controls under that; a button in the
// drawer opens the entry itself on the stage.
//
// Each card is a PICTURE, taken by `npm run thumbs` (scripts/thumbnails.mjs)
// and kept in public/thumbs/. A browser allows only a handful of live 3D
// views at once, and sixty is well past it; pictures are what a catalog
// is anyway. Rerun the script after adding or changing an object.
//
// The list of cards is not kept here: it comes from every other story file
// in this folder, so a new story shows up on its own (its picture once the
// script has run).
import { useEffect, useMemo, useRef, useState } from "react";
import { addons } from "storybook/preview-api";
import { toId, storyNameFromExport } from "storybook/internal/csf";
// (the list of story modules is in helpers/entries.js)

import { modules } from "./helpers/entries.js";

// Each entry: its sidebar name, section, story id (the picture's name),
// tags (the object's and the story's own: "polymorphic" earns a pill), and
// its knobs (argTypes) with their starting values (args), for the drawer.
function entriesOf() {
  const out = [];
  for (const [file, mod] of Object.entries(modules)) {
    if (file.endsWith("/Catalog.stories.jsx")) continue;
    const meta = mod.default;
    if (!meta) continue;
    for (const [name, story] of Object.entries(mod)) {
      // Storybook adds a __namedExportsOrder array to every story module.
      if (name === "default" || name.startsWith("__") || !story || typeof story !== "object" || Array.isArray(story)) continue;
      const path = meta.title.split("/");
      // The story's name as Storybook has it: its own `name`, else the
      // export's, spaced ("LightBox" is "Light Box"); the id, and so the
      // picture's name, comes from that
      const storyName = story.name ?? storyNameFromExport(name);
      out.push({
        id: toId(meta.title, storyName),
        name: path[path.length - 1] + (name === "Default" ? "" : ` · ${storyName}`),
        section: path.slice(0, -1).join(" / "),
        top: path[0],
        tags: [...(meta.tags ?? []), ...(story.tags ?? [])],
        argTypes: { ...(meta.argTypes ?? {}), ...(story.argTypes ?? {}) },
        args: { ...(meta.args ?? {}), ...(story.args ?? {}) },
      });
    }
  }
  return out.sort((a, b) => a.section.localeCompare(b.section) || a.name.localeCompare(b.name));
}

// The tabs, in the sidebar's order; anything new goes after.
const ORDER = ["Primitives", "Furniture", "Lighting", "Machines", "Machine Parts", "Fixtures", "Buildings", "Nature", "Ornaments", "Sky", "Planets", "Animals", "Characters", "Toys", "Vehicles", "Instruments", "Monuments", "Misc"];

// Clicking a card: the preview asks the shell to open that story.
const open = (id) => addons.getChannel().emit("selectStory", { storyId: id });

const mono = '"IBM Plex Mono", ui-monospace, "SF Mono", Menlo, monospace';

// A polymorphic object (one dealt from many knobs: the dolly, the statue
// head) wears a pill on its picture's top right corner.
const PILL = { position: "absolute", top: 8, right: 8, padding: "3px 7px", borderRadius: 3, fontSize: 9, letterSpacing: "0.04em", textTransform: "uppercase", color: "#FFFFFF", background: "#3D7BD9", pointerEvents: "none" };

// A card: the picture with the name under it; the picked one outlined.
// (The list form of the catalog is the sidebar, each entry with its picture:
// .storybook/manager.js renderLabel.)
function Card({ entry, picked, onPick }) {
  const pill = entry.tags.includes("polymorphic");
  const frame = { position: "relative", display: "block", outline: picked ? "2px solid #3D7BD9" : "none", outlineOffset: 2, borderRadius: 4 };
  return (
    <button
      onClick={() => onPick(entry)}
      title={`Look at ${entry.name}`}
      style={{ all: "unset", cursor: "pointer", display: "flex", flexDirection: "column", gap: 8 }}
    >
      <span style={frame}>
        <img
          src={`thumbs/${entry.id}.png`}
          alt={entry.name}
          loading="lazy"
          style={{ width: "100%", aspectRatio: "1 / 1", objectFit: "cover", borderRadius: 4, background: "#DDE4EA", display: "block" }}
        />
        {pill && <span style={PILL}>Very Customizable</span>}
      </span>
      <span style={{ fontSize: 12, color: "#2B3A47" }}>{entry.name}</span>
      <span style={{ fontSize: 10, color: "#66788A", marginTop: -4 }}>{entry.section}</span>
    </button>
  );
}

// How an arg goes into a story's URL (Storybook's own rules: booleans
// as !true, hex colors as !hex(...), the rest as they are)
const argValue = (v) => (typeof v === "boolean" ? `!${v}` : typeof v === "string" && /^#[0-9a-f]{6}$/i.test(v) ? `!hex(${v.slice(1)})` : encodeURIComponent(String(v)));
const argsParam = (args) => Object.entries(args).filter(([, v]) => v !== undefined && v !== null && typeof v !== "object").map(([k, v]) => `${k}:${argValue(v)}`).join(";");

// One knob, from its argType's control: a color picker, a slider with its
// number, a switch, a pick list, or a text box.
function Knob({ name, type, value, onChange }) {
  const c = type.control, kind = typeof c === "string" ? c : c?.type;
  const label = type.name ?? name;
  const row = { display: "flex", alignItems: "center", gap: 8, fontSize: 11, color: "#2B3A47", minHeight: 24 };
  const title = <span style={{ flex: "0 0 112px", color: "#66788A", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={label}>{label}</span>;
  if (kind === "color") return <label style={row}>{title}<input type="color" value={value ?? "#ffffff"} onChange={(e) => onChange(e.target.value)} /></label>;
  if (kind === "range") return <label style={row}>{title}<input type="range" min={c.min} max={c.max} step={c.step} value={value ?? c.min} onChange={(e) => onChange(Number(e.target.value))} style={{ flex: 1, accentColor: "#4F6E86" }} /><span style={{ flex: "0 0 40px", textAlign: "right" }}>{value}</span></label>;
  if (kind === "boolean") return <label style={row}>{title}<input type="checkbox" checked={!!value} onChange={(e) => onChange(e.target.checked)} /></label>;
  if ((kind === "select" || kind === "radio") && c.options) return <label style={row}>{title}<select value={value ?? ""} onChange={(e) => onChange(e.target.value)} style={{ flex: 1, font: "inherit", fontSize: 11 }}>{c.options.map((o) => <option key={o} value={o}>{o}</option>)}</select></label>;
  if (typeof value === "number") return <label style={row}>{title}<input type="number" value={value} onChange={(e) => onChange(Number(e.target.value))} style={{ width: 70, font: "inherit", fontSize: 11 }} /></label>;
  if (typeof value === "string") return <label style={row}>{title}<input type="text" value={value} onChange={(e) => onChange(e.target.value)} style={{ flex: 1, font: "inherit", fontSize: 11 }} /></label>;
  return null;
}

// The drawer: the picked object's entry in a frame, under the toolbar's
// light and hour, its knobs under it. The frame is loaded once per object;
// every change after that is pushed into it over Storybook's own channel
// (the message a manager sends its preview), so the frame never reloads
// and the object just moves.
const CHANNEL = "storybook-channel";
function Drawer({ entry, globals, onClose }) {
  const frame = useRef(null);
  const [args, setArgs] = useState(entry.args);
  useEffect(() => setArgs(entry.args), [entry]);
  const send = (type, payload) => frame.current?.contentWindow?.postMessage(JSON.stringify({ key: CHANNEL, event: { type, args: [payload], from: "manager" } }), "*");
  useEffect(() => { send("updateStoryArgs", { storyId: entry.id, updatedArgs: args }); }, [args]);
  useEffect(() => { send("updateGlobals", { globals: { lighting: globals.lighting ?? "toon", daylight: globals.daylight ?? 1 } }); }, [globals.lighting, globals.daylight]);
  // The address the frame opens at: the object as its entry has it, under the light and hour of the moment
  const src = useMemo(() => `iframe.html?id=${entry.id}&viewMode=story&globals=lighting:${globals.lighting ?? "toon"};daylight:${globals.daylight ?? 1}&args=${argsParam(entry.args)}`, [entry.id]);
  const knobs = Object.entries(entry.argTypes).filter(([, t]) => t && t.control !== false);
  const btn = { font: "inherit", fontSize: 11, padding: "4px 9px", borderRadius: 3, cursor: "pointer", border: "1px solid #C3CED7", background: "#F6F8FA", color: "#2B3A47" };
  return (
    <aside style={{ flex: "0 0 380px", position: "sticky", top: 28, alignSelf: "flex-start", maxHeight: "calc(100vh - 56px)", overflowY: "auto", display: "flex", flexDirection: "column", gap: 12, padding: 14, background: "#F6F8FA", border: "1px solid #DDE4EA", borderRadius: 6, boxSizing: "border-box" }}>
      <header style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
        <span style={{ fontSize: 12, color: "#2B3A47", flex: 1 }}>{entry.name}<span style={{ color: "#66788A", marginLeft: 8, fontSize: 10 }}>{entry.section}</span></span>
        <button style={btn} onClick={() => open(entry.id)} title="Open this object on the stage, with the full controls">Open</button>
        <button style={btn} onClick={onClose} title="Close">×</button>
      </header>
      <iframe ref={frame} title={entry.name} src={src} style={{ width: "100%", aspectRatio: "1 / 1", border: 0, borderRadius: 4, background: "#DDE4EA" }} />
      {knobs.length ? (
        <section style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          {knobs.map(([name, type]) => <Knob key={name} name={name} type={type} value={args[name]} onChange={(v) => setArgs((a) => ({ ...a, [name]: v }))} />)}
          <button style={{ ...btn, alignSelf: "flex-start", marginTop: 6 }} onClick={() => setArgs(entry.args)}>Reset</button>
        </section>
      ) : <span style={{ fontSize: 11, color: "#66788A" }}>No controls on this one.</span>}
    </aside>
  );
}

// Where you were in the catalog, kept across leaving it (the preview keeps
// its sessionStorage while the shell moves between stories): the tab, the
// picked object and how far down the page you were.
const PLACE = "catalog-place";
const savedPlace = () => { try { return JSON.parse(sessionStorage.getItem(PLACE) || "{}"); } catch { return {}; } };
const savePlace = (patch) => { try { sessionStorage.setItem(PLACE, JSON.stringify({ ...savedPlace(), ...patch })); } catch { /* no storage */ } };

function Catalog({ globals = {} }) {
  const entries = useMemo(entriesOf, []);
  const place = useMemo(savedPlace, []);
  const [picked, setPicked] = useState(() => entries.find((e) => e.id === place.picked) ?? null);
  // Back where you were: the scroll, once the cards are laid out (and once
  // more a beat later, when their pictures have come in and moved things)
  useEffect(() => {
    if (!place.scrollY) return;
    const go = () => window.scrollTo(0, place.scrollY);
    requestAnimationFrame(go);
    const t = setTimeout(go, 400);
    return () => clearTimeout(t);
  }, []);
  useEffect(() => {
    let raf = 0;
    const onScroll = () => { cancelAnimationFrame(raf); raf = requestAnimationFrame(() => savePlace({ scrollY: window.scrollY })); };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => { window.removeEventListener("scroll", onScroll); cancelAnimationFrame(raf); };
  }, []);
  useEffect(() => savePlace({ picked: picked?.id ?? null }), [picked]);
  const tabs = useMemo(() => {
    const seen = new Set(entries.map((e) => e.top));
    return ["All", ...ORDER.filter((o) => seen.has(o)), ...[...seen].filter((x) => !ORDER.includes(x)).sort()];
  }, [entries]);
  const [tab, setTab] = useState(place.tab ?? "All");
  useEffect(() => savePlace({ tab }), [tab]);
  const shown = tab === "All" ? entries : entries.filter((e) => e.top === tab);
  return (
    <main style={{ fontFamily: mono, background: "#EEF2F5", minHeight: "100vh", padding: "28px 32px 48px", boxSizing: "border-box" }}>
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 16 }}>
        <h1 style={{ fontSize: 14, fontWeight: 600, margin: 0, color: "#2B3A47", letterSpacing: "0.04em", textTransform: "uppercase" }}>
          Object catalog
        </h1>
        <span style={{ fontSize: 11, color: "#66788A" }}>{shown.length} of {entries.length} objects</span>
      </header>
      <nav style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 20 }}>
        {tabs.map((name) => (
          <button
            key={name}
            onClick={() => setTab(name)}
            style={{
              font: "inherit", fontSize: 11, padding: "5px 10px", borderRadius: 3, cursor: "pointer",
              border: "1px solid #C3CED7",
              background: tab === name ? "#4F6E86" : "#F6F8FA",
              color: tab === name ? "#EEF2F5" : "#2B3A47",
            }}
          >
            {name}
          </button>
        ))}
      </nav>
      <div style={{ display: "flex", gap: 24, alignItems: "flex-start" }}>
        <section style={{ flex: 1, minWidth: 0, display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: "20px 16px" }}>
          {shown.map((e) => <Card key={e.id} entry={e} picked={picked?.id === e.id} onPick={setPicked} />)}
        </section>
        {picked && <Drawer entry={picked} globals={globals} onClose={() => setPicked(null)} />}
      </div>
    </main>
  );
}

export default {
  title: "Catalog",
  // Plain DOM: the shared stage switches itself off for this story.
  parameters: { stage: { off: true }, layout: "fullscreen" },
  // The toolbar's light and hour, handed on to the drawer's preview.
  render: (_, ctx) => <Catalog globals={ctx.globals} />,
};

export const Default = {};
