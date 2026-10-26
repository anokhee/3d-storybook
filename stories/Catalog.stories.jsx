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
import { STATUSES, statusOf, loadMeta, saveMeta, tagsOf, SPECIAL_TAGS } from "../.storybook/meta.js";

// Each entry: its sidebar name, section, story id (the picture's name),
// tags (the object's and the story's own), and
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
      // The story's name as Storybook shows it: its own `name`, else the
      // export's, spaced ("LightBox" is "Light Box"). Its id, and so the
      // picture's name, comes from the EXPORT's name alone, whatever it is
      // called: `Picture`, named "Picture Window", is ...--picture.
      const storyName = story.name ?? storyNameFromExport(name);
      out.push({
        id: toId(meta.title, storyNameFromExport(name)),
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

// An entry's status (set in the drawer, kept in public/library-meta.json)
// wears a pill on its picture's top right corner; its tags (set there
// too, or in bulk) go under its category, as small chips, the special
// ones (SPECIAL_TAGS in .storybook/meta.js: "polymorphic") in their colour.
const PILL = { position: "absolute", top: 8, right: 8, padding: "3px 7px", borderRadius: 3, fontSize: 9, letterSpacing: "0.04em", textTransform: "uppercase", color: "#FFFFFF", background: "#3D7BD9", pointerEvents: "none" };

// A card: the picture with the name under it; the picked one outlined.
// In bulk mode (`selecting`) a click ticks it instead, and a ticked card
// wears a check in its bottom left corner.
// (The list form of the catalog is the sidebar, each entry with its picture:
// .storybook/manager.js renderLabel.)
function Card({ entry, meta, picked, onPick, selecting, selected }) {
  const tags = meta?.tags ?? [];
  const status = statusOf(meta?.status);
  const frame = { position: "relative", display: "block", outline: picked || selected ? "2px solid #3D7BD9" : "none", outlineOffset: 2, borderRadius: 4 };
  return (
    <button
      onClick={() => onPick(entry)}
      title={selecting ? `${selected ? "Untick" : "Tick"} ${entry.name}` : meta?.description ? `${entry.name}: ${meta.description}` : `Look at ${entry.name}`}
      aria-pressed={selecting ? selected : undefined}
      style={{ all: "unset", cursor: "pointer", display: "flex", flexDirection: "column", gap: 8 }}
    >
      <span style={frame}>
        <img
          src={`thumbs/${entry.id}.png`}
          alt={entry.name}
          loading="lazy"
          style={{ width: "100%", aspectRatio: "1 / 1", objectFit: "cover", borderRadius: 4, background: "#DDE4EA", display: "block", opacity: selecting && !selected ? 0.7 : 1 }}
        />
        {status.color && <span style={{ ...PILL, background: status.color }}>{status.label}</span>}
        {selecting && (
          <span style={{ position: "absolute", bottom: 8, left: 8, width: 18, height: 18, borderRadius: 3, border: "1px solid #3D7BD9", background: selected ? "#3D7BD9" : "#FFFFFF", color: "#FFFFFF", fontSize: 12, lineHeight: "18px", textAlign: "center", pointerEvents: "none" }}>
            {selected ? "✓" : ""}
          </span>
        )}
      </span>
      <span style={{ fontSize: 12, color: "#2B3A47" }}>{entry.name}</span>
      <span style={{ fontSize: 10, color: "#66788A", marginTop: -4 }}>{entry.section}</span>
      {tags.length > 0 && (
        <span style={{ display: "flex", flexWrap: "wrap", gap: 4, marginTop: -2 }}>
          {tags.map((t) => {
            const special = SPECIAL_TAGS[t];
            return <span key={t} style={{ fontSize: 9, padding: "1px 7px", borderRadius: 999, border: `1px solid ${special?.border ?? "#C3CED7"}`, background: special?.background ?? "#F6F8FA", color: special?.color ?? "#4F6E86" }}>{t}</span>;
          })}
        </span>
      )}
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
// The entry's notes: a description, tags and a status, saved as they are
// changed (to public/library-meta.json, through the dev server).
function Notes({ id, meta, onSaved }) {
  const [text, setText] = useState(meta?.description ?? "");
  const [tags, setTags] = useState((meta?.tags ?? []).join(", "));
  const [note, setNote] = useState("");
  useEffect(() => { setText(meta?.description ?? ""); setTags((meta?.tags ?? []).join(", ")); setNote(""); }, [id]);
  const save = (patch) => saveMeta(id, patch).then((m) => { onSaved(id, m); setNote("saved"); setTimeout(() => setNote(""), 1200); }).catch(() => setNote("not saved: only the dev server can save"));
  const field = { font: "inherit", fontSize: 11, padding: "4px 6px", border: "1px solid #C3CED7", borderRadius: 3, background: "#FFFFFF", color: "#2B3A47", boxSizing: "border-box", width: "100%" };
  const label = { fontSize: 10, letterSpacing: "0.04em", textTransform: "uppercase", color: "#66788A" };
  return (
    <section style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <span style={label}>Description</span>
      <textarea rows={3} value={text} placeholder="What is it, what's left to do…" onChange={(e) => setText(e.target.value)} onBlur={() => text.trim() !== (meta?.description ?? "") && save({ description: text })} style={{ ...field, resize: "vertical" }} />
      <span style={label}>Tags</span>
      <input type="text" value={tags} placeholder="comma, separated" onChange={(e) => setTags(e.target.value)} onBlur={() => tagsOf(tags).join(",") !== (meta?.tags ?? []).join(",") && save({ tags: tagsOf(tags) })} style={field} />
      <span style={label}>Status</span>
      <select value={meta?.status ?? ""} onChange={(e) => save({ status: e.target.value })} style={field}>
        {STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
      </select>
      <span style={{ fontSize: 10, color: note.startsWith("not") ? "#C9504A" : "#66788A", minHeight: 12 }}>{note}</span>
    </section>
  );
}

function Drawer({ entry, meta, onSaved, globals, onClose }) {
  const frame = useRef(null);
  const [args, setArgs] = useState(entry.args);
  useEffect(() => setArgs(entry.args), [entry]);
  const send = (type, payload) => frame.current?.contentWindow?.postMessage(JSON.stringify({ key: CHANNEL, event: { type, args: [payload], from: "manager" } }), "*");
  useEffect(() => { send("updateStoryArgs", { storyId: entry.id, updatedArgs: args }); }, [args]);
  // And back: a story that changes its own args (the duck's kind paints
  // it) tells its frame's shell; the knobs take those up, changed ones only
  useEffect(() => {
    const onMessage = (e) => {
      if (e.source !== frame.current?.contentWindow || typeof e.data !== "string") return;
      let msg;
      try { msg = JSON.parse(e.data); } catch { return; }
      const ev = msg?.key === CHANNEL ? msg.event : null;
      const p = ev?.type === "storyArgsUpdated" ? ev.args?.[0] : null;
      if (p?.storyId !== entry.id || !p.args) return;
      setArgs((a) => (Object.keys(p.args).some((k) => p.args[k] !== a[k] && typeof p.args[k] !== "object") ? { ...a, ...p.args } : a));
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [entry.id]);
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
      <Notes id={entry.id} meta={meta} onSaved={onSaved} />
      {knobs.length ? (
        <section style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          {knobs.map(([name, type]) => <Knob key={name} name={name} type={type} value={args[name]} onChange={(v) => setArgs((a) => ({ ...a, [name]: v }))} />)}
          <button style={{ ...btn, alignSelf: "flex-start", marginTop: 6 }} onClick={() => setArgs(entry.args)}>Reset</button>
        </section>
      ) : <span style={{ fontSize: 11, color: "#66788A" }}>No controls on this one.</span>}
    </aside>
  );
}

// Bulk mode's bar: how many are ticked, ticking all shown or none, and
// what to do to all of them at once: add or take away tags, or set a
// status. Each entry is saved as the drawer saves one (saveMeta).
function BulkBar({ ids, shownIds, metas, onSaved, onSelect }) {
  const [tags, setTags] = useState("");
  const [note, setNote] = useState("");
  const apply = async (label, patchOf) => {
    if (!ids.length) return;
    try {
      const saved = await Promise.all(ids.map((id) => saveMeta(id, patchOf(metas[id] ?? {})).then((m) => [id, m])));
      saved.forEach(([id, m]) => onSaved(id, m));
      setNote(`${label} on ${ids.length} object${ids.length === 1 ? "" : "s"}`);
    } catch { setNote("not saved: only the dev server can save"); }
    setTimeout(() => setNote(""), 2000);
  };
  const addTags = () => { const t = tagsOf(tags); if (t.length) apply(`added ${t.join(", ")}`, (m) => ({ tags: [...new Set([...(m.tags ?? []), ...t])] })).then(() => setTags("")); };
  const removeTags = () => { const t = tagsOf(tags); if (t.length) apply(`removed ${t.join(", ")}`, (m) => ({ tags: (m.tags ?? []).filter((x) => !t.includes(x)) })).then(() => setTags("")); };
  const field = { font: "inherit", fontSize: 11, padding: "4px 6px", border: "1px solid #C3CED7", borderRadius: 3, background: "#FFFFFF", color: "#2B3A47" };
  const btn = { ...field, padding: "4px 9px", cursor: "pointer", background: "#F6F8FA" };
  const off = !ids.length;
  const allShown = shownIds.length > 0 && shownIds.every((id) => ids.includes(id));
  return (
    <section style={{ position: "sticky", top: 0, zIndex: 2, display: "flex", flexWrap: "wrap", alignItems: "center", gap: 8, padding: "10px 12px", marginBottom: 20, background: "#F6F8FA", border: "1px solid #DDE4EA", borderRadius: 6 }}>
      <span style={{ fontSize: 11, color: "#2B3A47", minWidth: 84 }}>{ids.length} selected</span>
      <button style={btn} onClick={() => onSelect(allShown ? ids.filter((id) => !shownIds.includes(id)) : [...new Set([...ids, ...shownIds])])}>
        {allShown ? "Untick shown" : "Tick all shown"}
      </button>
      <button style={btn} disabled={off} onClick={() => onSelect([])}>Clear</button>
      <span style={{ width: 1, alignSelf: "stretch", background: "#DDE4EA" }} />
      <input type="text" value={tags} placeholder="tags, comma separated" onChange={(e) => setTags(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addTags()} style={{ ...field, width: 180 }} />
      <button style={btn} disabled={off || !tagsOf(tags).length} onClick={addTags}>Add tags</button>
      <button style={btn} disabled={off || !tagsOf(tags).length} onClick={removeTags}>Remove tags</button>
      <span style={{ width: 1, alignSelf: "stretch", background: "#DDE4EA" }} />
      <select value="" disabled={off} onChange={(e) => { const s = statusOf(e.target.value); apply(`status "${s.label}"`, () => ({ status: s.value })); }} style={field}>
        <option value="" disabled>Set status…</option>
        {STATUSES.map((s) => <option key={s.value || "none"} value={s.value}>{s.label}</option>)}
      </select>
      <span style={{ fontSize: 10, color: note.startsWith("not") ? "#C9504A" : "#66788A" }}>{note}</span>
    </section>
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
  const [metas, setMetas] = useState({});
  useEffect(() => { loadMeta().then(setMetas); }, []);
  const saved = (id, m) => setMetas((all) => ({ ...all, [id]: m }));
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
  // Bulk mode: clicking a card ticks it; the ticked ones survive changing tab
  const [bulk, setBulk] = useState(false);
  const [selected, setSelected] = useState([]);
  const toggleBulk = () => { setBulk((b) => !b); setSelected([]); setPicked(null); };
  const tick = (e) => setSelected((s) => (s.includes(e.id) ? s.filter((id) => id !== e.id) : [...s, e.id]));
  useEffect(() => {
    if (!bulk) return;
    const onKey = (e) => e.key === "Escape" && toggleBulk();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [bulk]);
  return (
    <main style={{ fontFamily: mono, background: "#EEF2F5", minHeight: "100vh", padding: "28px 32px 48px", boxSizing: "border-box" }}>
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 16 }}>
        <h1 style={{ fontSize: 14, fontWeight: 600, margin: 0, color: "#2B3A47", letterSpacing: "0.04em", textTransform: "uppercase" }}>
          Object catalog
        </h1>
        <span style={{ display: "flex", alignItems: "baseline", gap: 12 }}>
          <span style={{ fontSize: 11, color: "#66788A" }}>{shown.length} of {entries.length} objects</span>
          <button
            onClick={toggleBulk}
            title={bulk ? "Leave bulk mode (Esc)" : "Tick several objects and tag them or set their status at once"}
            style={{ font: "inherit", fontSize: 11, padding: "4px 9px", borderRadius: 3, cursor: "pointer", border: "1px solid #C3CED7", background: bulk ? "#4F6E86" : "#F6F8FA", color: bulk ? "#EEF2F5" : "#2B3A47" }}
          >
            {bulk ? "Done" : "Bulk edit"}
          </button>
        </span>
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
      {bulk && <BulkBar ids={selected} shownIds={shown.map((e) => e.id)} metas={metas} onSaved={saved} onSelect={setSelected} />}
      <div style={{ display: "flex", gap: 24, alignItems: "flex-start" }}>
        <section style={{ flex: 1, minWidth: 0, display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: "20px 16px" }}>
          {shown.map((e) => <Card key={e.id} entry={e} meta={metas[e.id]} picked={!bulk && picked?.id === e.id} onPick={bulk ? tick : setPicked} selecting={bulk} selected={selected.includes(e.id)} />)}
        </section>
        {picked && !bulk && <Drawer entry={picked} meta={metas[picked.id]} onSaved={saved} globals={globals} onClose={() => setPicked(null)} />}
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
