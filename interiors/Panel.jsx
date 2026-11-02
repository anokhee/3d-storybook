// THE PANELS: the bar along the top (undo, the grid, what the layout has
// done), the room down the left (which shop to load, its knobs, the things
// to add), and the inspector down the right (the picked item's place, turn
// and fields; or, with nothing picked, the config to copy out — and paste
// back in).
import React, { useEffect, useMemo, useState } from "react";
import { useEditor, summaryOf, trimmed } from "./store.js";
import { ROOMS, ROOM, paletteOf, FIELDS, MIRRORED, WALL_IN, nameOf, getPath, setPath, hexOf, pastedObjectOf, objectFieldsOf } from "./shops.js";
import { emptyLayout } from "../src/world/furnish.js";

const deg = (r) => Math.round(((r ?? 0) * 180) / Math.PI);
const rad = (d) => (d * Math.PI) / 180;

// A slider with its value beside it. `onLive` while it moves, `onDone` when
// it is let go (one undo step for the whole drag)
function Slider({ label, value, min, max, step, onLive, onDone, format = (v) => v }) {
  return (
    <div className="row">
      <label title={label}>{label}</label>
      <input
        type="range" min={min} max={max} step={step} value={value}
        onChange={(e) => onLive(+e.target.value)}
        onPointerDown={() => onDone && useEditor.getState().beginLive()}
        onPointerUp={() => onDone?.()}
        onKeyUp={() => onDone?.()}
        onBlur={() => onDone?.()}
      />
      <span className="val">{format(value)}</span>
    </div>
  );
}

export function TopBar() {
  const layout = useEditor((s) => s.layout);
  const canUndo = useEditor((s) => s.undo.length > 0);
  const canRedo = useEditor((s) => s.redo.length > 0);
  const status = useEditor((s) => s.status);
  const grid = useEditor((s) => s.grid);
  const args = useEditor((s) => s.args);
  const roomId = useEditor((s) => s.roomId);
  const S = useEditor.getState;
  const untouched = useMemo(() => S().untouched(), [layout, args, roomId]);
  return (
    <div id="top" className="panel">
      <h1>Interiors</h1>
      <button disabled={!canUndo} onClick={() => S().undoStep()} title="⌘Z / ctrl-Z">undo</button>
      <button disabled={!canRedo} onClick={() => S().redoStep()} title="⌘⇧Z, ⌘Y / ctrl-Y">redo</button>
      <span style={{ width: 8 }} />
      <button className={grid ? "on" : ""} onClick={() => S().setGrid(!grid)} title="a half-unit grid on the floor (g)">grid</button>
      <div className="seg" title="where the camera stands">
        <button onClick={() => S().focus?.("in")} title="from out front, well above, down into the room (f)">look in</button>
        <button onClick={() => S().focus?.("plan")} title="straight down on the floor">plan</button>
        <button onClick={() => S().focus?.("street")} title="from the pavement, as the storybook's front view">street</button>
      </div>
      <span style={{ width: 8 }} />
      <button className="danger" disabled={untouched} onClick={() => confirm("Put everything back as the storybook has it?") && S().clear()} title="the storybook's own layout for this room again">start over</button>
      <button disabled={emptyLayout(layout)} onClick={() => confirm("Take every layout off, down to the bare plan?") && S().bare()} title="the plan's own furnishing, with no layout over it">bare plan</button>
      <span className="spacer" />
      <span className="status">{status || summaryOf(layout, untouched)}</span>
    </div>
  );
}

// One of the room's knobs (the story's), by its kind
function Knob({ k, value }) {
  const set = (v) => useEditor.getState().setArg(k.name, v);
  const label = k.label ?? k.name;
  if (k.kind === "color") {
    const hex = typeof value === "string" && /^#[0-9a-f]{6}$/i.test(value) ? value : "#888888";
    return (
      <div className="row">
        <label title={label}>{label}</label>
        <input type="color" value={hex} onChange={(e) => set(e.target.value)} />
        <span className="val">{value ? hex : "—"}</span>
        {value != null && value !== "" && <button onClick={() => set(undefined)} style={{ padding: "2px 6px", fontSize: 9 }} title="unset: the style's own">×</button>}
      </div>
    );
  }
  if (k.kind === "options") {
    return (
      <div className="row">
        <label title={label}>{label}</label>
        <select value={value ?? ""} onChange={(e) => set(k.options.find((o) => String(o) === e.target.value))} style={{ flex: 1 }}>
          {(value == null || value === "") && <option value="">— the style's own —</option>}
          {k.options.map((o) => <option key={String(o)} value={o}>{String(o)}</option>)}
        </select>
      </div>
    );
  }
  if (k.kind === "bool") {
    return (
      <div className="row">
        <label title={label}>{label}</label>
        <input type="checkbox" checked={!!value} onChange={(e) => set(e.target.checked)} />
        {value == null && <span className="muted">(the style's own)</span>}
      </div>
    );
  }
  const v = typeof value === "number" ? value : k.min ?? 0;
  return <Slider label={label} value={v} min={k.min ?? 0} max={k.max ?? 10} step={k.step} onLive={set} format={(x) => +(+x).toFixed(3)} />;
}

// THE ROOM down the left: a card for each shop (the catalog's own
// picture), the loaded one's knobs under them, then the palette
export function Catalog() {
  const roomId = useEditor((s) => s.roomId);
  const args = useEditor((s) => s.args);
  const layout = useEditor((s) => s.layout);
  const placing = useEditor((s) => s.placing);
  const room = ROOM[roomId];
  const palette = paletteOf(room);
  const groups = useMemo(() => [...new Set(palette.map((p) => p.group))], [palette]);
  const S = useEditor.getState;
  const load = (id) => id !== roomId && S().setRoom(id);
  return (
    <div id="catalog" className="panel">
      <h2>room</h2>
      <div className="shops">
        {ROOMS.map((r) => (
          <button key={r.id} className={`card${r.id === roomId ? " on" : ""}`} title={r.label} onClick={() => load(r.id)}>
            <img src={r.thumb} alt="" loading="lazy" />
            <span>{r.label}</span>
          </button>
        ))}
      </div>
      <div className="scroll">
        <div className="field">
          <h2>{room.label} · knobs</h2>
          <div className="knobs">
            {room.knobs.map((k) => <Knob key={k.name} k={k} value={args[k.name]} />)}
          </div>
          <div className="muted">the storybook's own knobs. Each size, door side and style has a layout of its own, kept while you work on another. A layout moves the plan's items by id, so a new seed (which can lay the room out afresh) may leave some moves with nothing to move.</div>
        </div>
        <div className="field">
          <h2>add</h2>
          <PasteObject />
          <div className="palette">
            {groups.map((g) => (
              <div className="group" key={g}>
                <h3>{g}</h3>
                {palette.filter((p) => p.group === g).map((p) => (
                  <button key={p.label} className={`chip${placing === p ? " on" : ""}`} onClick={() => (placing === p ? S().stopPlacing() : S().startPlacing(p))}>{p.label}</button>
                ))}
              </div>
            ))}
          </div>
          <div className="muted">pick one, then click the floor to set it down · shift keeps going · esc stops</div>
        </div>
      </div>
    </div>
  );
}

// AN OBJECT FROM THE CATALOG: open it in the storybook, turn its knobs,
// press "Copy knobs" there, then this — and click the floor to set it down
function PasteObject() {
  const placing = useEditor((s) => s.placing);
  const [note, setNote] = useState(null);
  const S = useEditor.getState;
  const paste = async () => {
    let text;
    try { text = await navigator.clipboard.readText(); } catch { return setNote("could not read the clipboard"); }
    let data;
    try { data = JSON.parse(text); } catch { return setNote("the clipboard has no copied object (copy its knobs in the storybook first)"); }
    const p = pastedObjectOf(data);
    if (!p) return setNote(data?.id ? `no "${data.id}" in the catalog` : "the clipboard has no copied object (copy its knobs in the storybook first)");
    setNote(null);
    S().startPlacing(p);
  };
  return (
    <div className="field">
      <div className="seg">
        <button className={placing?.group === "pasted" ? "on" : ""} onClick={paste} title="an object copied in the storybook (its Copy knobs button): paste it here, then click the floor to set it down">paste from the catalog</button>
        {placing?.group === "pasted" && <span className="muted" style={{ alignSelf: "center" }}>placing {placing.label} · click the floor</span>}
      </div>
      {note && <div className="bad" style={{ fontSize: 11 }}>{note}</div>}
    </div>
  );
}

export function Inspector() {
  const selected = useEditor((s) => s.selected);
  const layout = useEditor((s) => s.layout);
  const args = useEditor((s) => s.args);
  const roomId = useEditor((s) => s.roomId);
  const it = useMemo(() => (selected ? useEditor.getState().item(selected) : null), [selected, layout, args, roomId]);
  return <div id="inspector" className="panel">{it ? <Picked it={it} /> : <Config />}</div>;
}

// One field of the picked item, by its kind
function Field({ it, f }) {
  const S = useEditor.getState;
  const value = getPath(it, f.path);
  const write = (v, live) => {
    // (a patch into an object field carries only that field: furnish.js merges it in)
    let patch = setPath({}, f.path, v);
    if (MIRRORED[f.path]) patch = setPath(patch, MIRRORED[f.path], -v);
    live ? S().patchLive(it.id, patch) : S().patch(it.id, patch);
  };
  if (f.kind === "range") return <Slider label={f.label} value={typeof value === "number" ? value : f.min} min={f.min} max={f.max} step={f.step} onLive={(v) => write(v, true)} onDone={() => S().endLive()} format={(v) => +(+v).toFixed(2)} />;
  if (f.kind === "options") {
    return (
      <div className="row">
        <label title={f.label}>{f.label}</label>
        <select value={value ?? ""} onChange={(e) => write(e.target.value)} style={{ flex: 1 }}>
          {value == null && <option value="">—</option>}
          {f.options.map((o) => <option key={o} value={o}>{o}</option>)}
        </select>
      </div>
    );
  }
  if (f.kind === "bool") {
    return (
      <div className="row">
        <label title={f.label}>{f.label}</label>
        <input type="checkbox" checked={!!value} onChange={(e) => write(e.target.checked)} />
      </div>
    );
  }
  if (f.kind === "color") {
    return (
      <div className="row">
        <label title={f.label}>{f.label}</label>
        <input type="color" value={hexOf(value)} onChange={(e) => write(e.target.value, true)} onPointerDown={() => S().beginLive()} onBlur={() => S().endLive()} />
        <span className="val">{value ? hexOf(value) : "—"}</span>
      </div>
    );
  }
  return null;
}

function Picked({ it }) {
  const S = useEditor.getState;
  const layout = useEditor((s) => s.layout);
  const B = useMemo(() => S().bounds(), [layout]);
  const added = /^add\d+$/.test(it.id), moved = !!layout.move[it.id];
  const live = (patch) => S().patchLive(it.id, patch);
  const done = () => S().endLive();
  const fields = it.t === "object" ? objectFieldsOf(it) : FIELDS[it.t] ?? [];
  return (
    <>
      <h1>{nameOf(it)}</h1>
      <div className="muted" style={{ marginTop: -6 }}>{it.id} · {added ? "added by the layout" : moved ? "moved by the layout" : "where the plan put it"}</div>
      <div className="seg">
        <button onClick={() => S().duplicate(it.id)} title="one more of it, a step over (⌘D)">duplicate</button>
        {WALL_IN[it.t] != null && <button onClick={() => S().snapToWall(it.id)} title="against the nearest wall, facing in (w)">to the wall</button>}
        {moved && <button onClick={() => S().reset(it.id)} title="back where the plan had it">put back</button>}
        <button className="danger" onClick={() => S().remove(it.id)} title="delete / backspace">{added ? "delete" : "take out"}</button>
      </div>
      <div className="field">
        <h2>place</h2>
        <Slider label="across" value={it.x} min={+B.x0.toFixed(2)} max={+B.x1.toFixed(2)} step={0.01} onLive={(v) => live({ x: v })} onDone={done} format={(v) => (+v).toFixed(2)} />
        <Slider label="back" value={it.z} min={+B.z0.toFixed(2)} max={+B.z1.toFixed(2)} step={0.01} onLive={(v) => live({ z: v })} onDone={done} format={(v) => (+v).toFixed(2)} />
        <Slider label="turn" value={deg(it.yaw)} min={-180} max={180} step={1} onLive={(v) => live({ yaw: +rad(v).toFixed(4) })} onDone={done} format={(v) => `${v}°`} />
        {it.y != null && <Slider label="height" value={it.y} min={0} max={+B.h.toFixed(2)} step={0.01} onLive={(v) => live({ y: v })} onDone={done} format={(v) => (+v).toFixed(2)} />}
      </div>
      {fields.length > 0 && (
        <div className="field">
          <h2>{nameOf(it)}</h2>
          {fields.map((f) => <Field key={f.path} it={it} f={f} />)}
        </div>
      )}
      <div className="keys">
        <b>drag</b> move (<b>shift</b> snaps to a tenth) · <b>arrows</b> nudge · <b>q / e</b> turn · <b>w</b> to the wall · <b>⌘D</b> duplicate · <b>⌫</b> delete · <b>f</b> look in · <b>g</b> grid · <b>⌘Z</b> undo · <b>⌘⇧Z</b> redo · click the floor to put it down
      </div>
    </>
  );
}

// THE CONFIG: the room's config with the layout in it — what the Shop
// Interior (or Alleyway) takes — as text to copy out; or one pasted in and
// taken up (its layout, and its knobs where they can be read back)
function Config() {
  const roomId = useEditor((s) => s.roomId);
  const args = useEditor((s) => s.args);
  const layout = useEditor((s) => s.layout);
  const room = ROOM[roomId];
  const S = useEditor.getState;
  const json = useMemo(() => {
    // (only the knobs turned from the story's starting values, and the
    // ones that say which room this is: its style, size, door and seed)
    const keep = new Set(["cafeStyle", "floristStyle", "size", "doorSide", "seed", "roomKind", "width", "deep"]);
    const turned = Object.fromEntries(Object.entries(args).filter(([k, v]) => keep.has(k) || v !== room.args[k]));
    const cfg = room.configOf(turned);
    const L = trimmed(layout);
    return JSON.stringify({ ...(room.alley ? { alley: true } : {}), ...cfg, ...(L ? { layout: L } : {}) }, null, 2);
  }, [room, args, layout]);
  const [text, setText] = useState(json);
  const [note, setNote] = useState(null);
  useEffect(() => setText(json), [json]);
  const edited = text !== json;
  const dropped = layout.drop;
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(json);
      setNote({ ok: true, text: "copied — paste it to Claude to put in the storybook" });
    } catch {
      setNote({ ok: false, text: "could not reach the clipboard: select the text and copy it" });
    }
  };
  const apply = () => {
    try {
      const cfg = JSON.parse(text);
      // an object copied in the storybook: a thing to set down, not a room
      const obj = pastedObjectOf(cfg);
      if (obj) { S().startPlacing(obj); setText(json); return setNote({ ok: true, text: `placing ${obj.label}: click the floor to set it down` }); }
      // the room it is for, if it says
      const id = cfg.alley ? "alleyway" : cfg.kind;
      if (id && ROOM[id] && id !== roomId) S().setRoom(id);
      const R = ROOM[id] ?? room;
      // its knobs, read back off the config by their paths
      const next = { ...S().args };
      for (const k of R.knobs) {
        const v = k.paths.map((p) => p.split(".").reduce((o, key) => o?.[key], cfg)).find((v) => v !== undefined);
        if (v === undefined) continue;
        next[k.name] = k.kind === "color" ? (v?.hex ?? v) : k.kind === "bool" ? v === k.on : v;
      }
      S().setArgs(next);
      S().setLayout(cfg.layout ?? {});
      setNote({ ok: true, text: "taken up" });
    } catch (e) {
      setNote({ ok: false, text: `not JSON: ${e.message}` });
    }
  };
  return (
    <>
      <h1>{room.label}</h1>
      <div className="muted" style={{ marginTop: -6 }}>{summaryOf(layout, S().untouched())}</div>
      <div className="field">
        <h2>config</h2>
        <div className="muted">the room's config as the storybook's noun takes it, its <b>layout</b> inside: <b>move</b> by item id, <b>drop</b>, <b>add</b>. Copy it and send it to Claude to bake into the storybook (a café style's layout, a story preset…); or paste one here and take it up.</div>
        <textarea className="config" value={text} onChange={(e) => { setText(e.target.value); setNote(null); }} spellCheck={false} />
        <div className="seg">
          <button onClick={copy}>copy</button>
          <button disabled={!edited} onClick={apply} title="take up the config in the box: its knobs and its layout">take up pasted</button>
          {edited && <button onClick={() => setText(json)}>revert</button>}
        </div>
        {note && <div className={note.ok ? "ok" : "bad"} style={{ fontSize: 11 }}>{note.text}</div>}
      </div>
      {dropped.length > 0 && (
        <div className="field">
          <h2>taken out · {dropped.length}</h2>
          <div className="seg">
            {dropped.map((id) => <button key={id} onClick={() => S().restore(id)} title="put it back">{id} ↩</button>)}
          </div>
        </div>
      )}
      <div className="keys">
        <b>click</b> a piece of furniture to pick it up · <b>drag</b> it about the floor · <b>orbit</b> with the right button or on the floor · the panel on the left loads another shop and adds things
      </div>
    </>
  );
}

export function Hint() {
  const placing = useEditor((s) => s.placing);
  if (!placing) return null;
  return (
    <div className="hint">
      placing <b>{placing.label}</b> · click the floor · shift keeps going · esc stops
    </div>
  );
}
