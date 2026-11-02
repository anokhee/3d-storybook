// THE PANELS: the bar along the top (the map's name, saving, undo), the
// catalog down the left (pick a thing to place), and the inspector down the
// right (the picked placement's turn, size and knobs; or, with nothing
// picked, the map's own settings).
import React, { useEffect, useRef, useState } from "react";
import { ENTRIES, ENTRY, TOPS, knobsOf, useEntries, SCULPT } from "./catalog.js";
import { useMap, blankMap, ROLES, MODES, joinNearby, BRUSH_RANGE, SPIN_RANGE } from "./store.js";
import { listMaps, loadMap, saveGlb, saveJson } from "./export.js";
import { PLACEMENTS, useField } from "./Scene.jsx";
import { rampInfo, shapeOf } from "./Terrain.jsx";
import { AMOUNT_RANGE, rollSeed } from "./seed.js";
import { isWater } from "../runtime/cover.js";

const ROLE_HELP = {
  prop: "scenery: baked into the map as it stands here",
  player: "the game starts here, as this character, facing the bar",
};

// Panel titles are in title case, whatever case the entry's name is in.
const titleCase = (t) => t.replace(/(^|[\s-])(\p{Ll})/gu, (m, a, c) => a + c.toUpperCase());
const deg = (r) => Math.round((r * 180) / Math.PI);
const rad = (d) => (d * Math.PI) / 180;

// A slider with its value beside it. `onLive` while it moves, `onDone` when
// it is let go (one undo step for the whole drag).
function Slider({ label, value, min, max, step, onLive, onDone, format = (v) => v }) {
  return (
    <div className="row">
      <label title={label}>{label}</label>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onLive(+e.target.value)}
        onPointerDown={() => onDone && useMap.getState().beginLive()}
        onPointerUp={() => onDone?.()}
        onKeyUp={() => onDone?.()}
        onBlur={() => onDone?.()}
      />
      <span className="val">{format(value)}</span>
    </div>
  );
}

export function TopBar() {
  const map = useMap((s) => s.map);
  const canUndo = useMap((s) => s.undo.length > 0);
  const canRedo = useMap((s) => s.redo.length > 0);
  const status = useMap((s) => s.status);

  return (
    <div id="top" className="panel">
      <h1>Mapmaker</h1>
      <button disabled={!canUndo} onClick={() => useMap.getState().undoStep()} title="⌘Z / ctrl-Z">undo</button>
      <button disabled={!canRedo} onClick={() => useMap.getState().redoStep()} title="⌘⇧Z, ⌘Y / ctrl-Y">redo</button>
      <span style={{ width: 8 }} />
      <ModeSwitch />
      <span style={{ width: 8 }} />
      <SpinSwitch />
      <span className="spacer" />
      <span className="status">{status || `${map.placements.length} placed`}</span>
    </div>
  );
}

// The MODE: objects or terrain. Tab flips it.
function ModeSwitch() {
  const mode = useMap((s) => s.mode);
  return (
    <div className="seg" title="tab flips it">
      {Object.entries(MODES).map(([k, m]) => (
        <button key={k} className={mode === k ? "on" : ""} onClick={() => useMap.getState().setMode(k)} title={m.help}>
          {m.label}
        </button>
      ))}
    </div>
  );
}

// The world turning on its own, and how fast (turns a minute)
function SpinSwitch() {
  const spin = useMap((s) => s.spin);
  const set = useMap((s) => s.setSpin);
  return (
    <div className="row" style={{ gap: 6 }}>
      <button className={spin.on ? "on" : ""} onClick={() => set({ on: !spin.on })} title="turn the world slowly on its own">
        spin
      </button>
      <input type="range" min={SPIN_RANGE[0]} max={SPIN_RANGE[1]} step={0.05} value={spin.speed} onChange={(e) => set({ speed: e.target.value })} style={{ flex: "0 0 90px" }} title="how fast it spins" />
      <span className="muted" style={{ fontSize: 10, minWidth: 54 }}>{spin.speed.toFixed(2)} /min</span>
    </div>
  );
}

// The ground's shapes (cliffs, ramps, groundcover) are the terrain mode's; everything else the objects mode's.
const SHAPE_TOPS = new Set(["Terrain", "Groundcover"]);
export function Catalog() {
  const [cats, setCats] = useState([]);
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const box = useRef(null);
  const mode = useMap((s) => s.mode);
  const terrain = mode === "terrain";
  const tops = TOPS.filter((t) => SHAPE_TOPS.has(t) === terrain);
  useEffect(() => {
    setCats((c) => c.filter((t) => tops.includes(t)));
  }, [mode]);
  // the filter popover closes on a click anywhere outside it
  useEffect(() => {
    if (!open) return;
    const away = (e) => box.current && !box.current.contains(e.target) && setOpen(false);
    window.addEventListener("pointerdown", away);
    return () => window.removeEventListener("pointerdown", away);
  }, [open]);
  const searched = useEntries("", search).filter((e) => SHAPE_TOPS.has(e.top) === terrain);
  const entries = cats.length ? searched.filter((e) => cats.includes(e.top)) : searched;
  const flip = (t) => setCats((c) => (c.includes(t) ? c.filter((x) => x !== t) : [...c, t]));
  const placing = useMap((s) => s.placing);
  return (
    <div id="catalog" className="panel">
      <h2>
        {terrain ? "terrain" : "objects"} · {entries.length}
      </h2>
      <div className="searchbar" ref={box}>
        <input type="search" placeholder="search" value={search} onChange={(e) => setSearch(e.target.value)} />
        <button className={`filter${open || cats.length ? " on" : ""}`} onClick={() => setOpen(!open)} title="filter by category" aria-label="filter by category">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M1.5 3.5h11M3.5 7h7M5.5 10.5h3" />
          </svg>
          {cats.length > 0 && <span className="count">{cats.length}</span>}
        </button>
        {open && (
          <div className="popover">
            <div className="head">category</div>
            {tops.map((t) => (
              <label key={t}>
                <input type="checkbox" checked={cats.includes(t)} onChange={() => flip(t)} />
                <span>{t.toLowerCase()}</span>
                <span className="n">{searched.filter((e) => e.top === t).length}</span>
              </label>
            ))}
            {cats.length > 0 && <button onClick={() => setCats([])}>clear filters</button>}
          </div>
        )}
      </div>
      <div className="grid">
        {entries.map((e) => (
          <Card key={e.id} entry={e} on={placing === e.id} />
        ))}
      </div>
      {terrain && (
        <div className="keys">
            <b>sculpt</b>: <b>left</b> click or drag raises the ground, <b>right</b> click or drag lowers it, <b>[ ]</b> size the brush (its size and height are in the panel on the right) · a <b>ramp</b> is drawn as a line, from its foot toward the cliff: it squares up to the edge and docks on the lip (a click near a cliff does the same at the stock length) · <b>shift</b> keeps going · <b>esc</b> / right-click stops · <b>delete</b> on a picked cliff takes its whole shape (every stroke run together with it), <b>alt-delete</b> just that piece · <b>tab</b> back to objects. Things placed on the map stay out of the way here. Or grow a whole ground at once from a <b>terrain seed</b> (the map panel on the right, with nothing picked) and change what grew by hand.
        </div>
      )}
    </div>
  );
}

function Card({ entry, on }) {
  const [broken, setBroken] = useState(false);
  return (
    <button className={`card${on ? " on" : ""}`} title={`${entry.section} / ${entry.name}`} onClick={() => (on ? useMap.getState().stopPlacing() : useMap.getState().startPlacing(entry.id))}>
      {entry.swatch ? <div className="swatch" style={{ background: entry.swatch }} /> : broken ? <div className="noimg">no picture</div> : <img src={`/thumbs/${entry.id}.png`} alt="" loading="lazy" onError={() => setBroken(true)} />}
      <span>{entry.name}</span>
    </button>
  );
}

// One knob of the picked placement, drawn by its kind.
function Knob({ k, value, onLive, onDone }) {
  if (k.kind === "color") {
    const hex = typeof value === "string" && /^#[0-9a-f]{6}$/i.test(value) ? value : "#888888";
    return (
      <div className="row">
        <label title={k.label}>{k.label}</label>
        <input type="color" value={hex} onChange={(e) => onLive(e.target.value)} onPointerDown={() => useMap.getState().beginLive()} onBlur={onDone} />
        <span className="val">{hex}</span>
      </div>
    );
  }
  if (k.kind === "select" || k.kind === "radio" || k.kind === "inline-radio") {
    return (
      <div className="row">
        <label title={k.label}>{k.label}</label>
        <select value={value ?? ""} onChange={(e) => { useMap.getState().beginLive(); onLive(e.target.value); onDone(); }} style={{ flex: 1 }}>
          {(k.options ?? []).map((o) => (
            <option key={String(o)} value={o}>{String(o)}</option>
          ))}
        </select>
      </div>
    );
  }
  if (k.kind === "boolean") {
    return (
      <div className="row">
        <label title={k.label}>{k.label}</label>
        <input type="checkbox" checked={!!value} onChange={(e) => { useMap.getState().beginLive(); onLive(e.target.checked); onDone(); }} />
      </div>
    );
  }
  if (k.kind === "range" || k.kind === "number" || typeof value === "number") {
    const step = k.step ?? 0.1;
    const v = typeof value === "number" ? value : 0;
    return <Slider label={k.label} value={v} min={k.min ?? Math.min(0, v * 3)} max={k.max ?? Math.max(step * 24, v * 3)} step={step} onLive={onLive} onDone={onDone} format={(x) => +(+x).toFixed(3)} />;
  }
  return (
    <div className="row">
      <label title={k.label}>{k.label}</label>
      <input type="text" value={value ?? ""} onChange={(e) => { useMap.getState().beginLive(); onLive(e.target.value); }} onBlur={onDone} style={{ flex: 1 }} />
    </div>
  );
}

export function Inspector() {
  const p = useMap((s) => s.map.placements.find((p) => p.id === s.selected));
  const sculpting = useMap((s) => s.placing === SCULPT);
  return <div id="inspector" className="panel">{p ? <Picked p={p} /> : sculpting ? <Sculpt /> : <MapSettings />}</div>;
}

// THE SCULPT BRUSH's knobs, shown while it is picked (Scene.jsx's sculpt).
function Sculpt() {
  const brush = useMap((s) => s.brush);
  const set = (patch) => useMap.getState().setBrush(patch);
  const wall = brush.height > 2.9;
  return (
    <>
      <h1>Sculpt</h1>
      <div className="muted" style={{ marginTop: -6 }}>Terrain</div>
      <div className="field">
        <h2>brush</h2>
        <Slider label="size" value={brush.radius} min={BRUSH_RANGE.radius[0]} max={BRUSH_RANGE.radius[1]} step={0.5} onLive={(v) => set({ radius: v })} format={(v) => `${(+v * 2).toFixed(0)} across`} />
        <Slider label="height" value={brush.height} min={BRUSH_RANGE.height[0]} max={BRUSH_RANGE.height[1]} step={0.1} onLive={(v) => set({ height: v })} format={(v) => `${(+v).toFixed(1)} ${+v > 2.9 ? "· wall" : "· bank"}`} />
        <Slider label="softness" value={brush.soft} min={BRUSH_RANGE.soft[0]} max={BRUSH_RANGE.soft[1]} step={0.1} onLive={(v) => set({ soft: v })} format={(v) => (+v === 0 ? "none" : `×${(+v).toFixed(1)}`)} />
        <Slider label="edge wobble" value={brush.wobble} min={BRUSH_RANGE.wobble[0]} max={BRUSH_RANGE.wobble[1]} step={0.05} onLive={(v) => set({ wobble: v })} format={(v) => (+v).toFixed(2)} />
        <div className="muted">
          <b>left</b> click or drag: the ground rises here by the brush's height — on open ground or a cliff's bank, more of that cliff; on a cliff's flat top, a storey on it. <b>right</b> click or drag: it goes back down a tier. <b>[ ]</b> size the brush, <b>shift [ ]</b> its height · <b>esc</b> / tab puts it down.
          <br />
          {wall ? (
            <>at this height the edge is a <b>wall</b>: a cliff with a flat top, climbed by ramps only (as the game builds it).</>
          ) : (
            <>at this height the edge is a <b>bank</b> a character or car can walk up; past about 2.9 it is a wall.</>
          )}{" "}
          Softness is how far strokes of one height run together; the same height everywhere keeps one landmass to one tier.
        </div>
      </div>
    </>
  );
}

function Picked({ p }) {
  const S = useMap.getState;
  const entry = ENTRY[p.entry];
  const knobs = entry ? knobsOf(entry) : [];
  const live = (patch) => S().patchLive(p.id, patch);
  const done = () => S().endLive();
  const changed = Object.keys(p.args).length > 0;
  const cover = !!entry?.cover;
  const terrain = entry?.terrain ?? null;
  const shape = cover || !!terrain; // drawn on the ground: no size, lift or role
  const order = useMap((s) => s.map.placements.findIndex((q) => q.id === p.id));
  const count = useMap((s) => s.map.placements.length);
  const field = useField((s) => s.field);
  const placementsNow = useMap((s) => s.map.placements);
  const radiusNow = useMap((s) => s.map.surface.radius);
  const joinable = React.useMemo(() => (entry?.cover === "road" ? !!joinNearby(placementsNow, p.id, radiusNow) : false), [placementsNow, radiusNow, p.id, entry]);
  const ramp = terrain === "ramp" ? rampInfo(field, p.id) : null;
  const pieces = React.useMemo(() => (terrain === "cliff" || terrain === "cut" ? shapeOf(field, p.id).length : 1), [field, p.id, terrain]);
  return (
    <>
      <h1>{titleCase(entry?.name ?? p.entry)}</h1>
      <div className="muted" style={{ marginTop: -6 }}>{entry?.section}</div>
      <div className="seg">
        <button onClick={() => S().focus?.(p.id)}>look at</button>
        <button onClick={() => S().duplicate(p.id)}>duplicate</button>
        {pieces > 1 ? (
          <>
            <button className="danger" onClick={() => S().removeMany(shapeOf(field, p.id))} title="this cliff and every stroke run together with it (delete / backspace)">delete shape · {pieces}</button>
            <button onClick={() => S().remove(p.id)} title="only this one stroke's piece (alt-delete)">delete piece</button>
          </>
        ) : (
          <button className="danger" onClick={() => S().remove(p.id)}>delete</button>
        )}
      </div>
      {terrain === "cliff" && (
        <div className="field">
          <h2>cliff</h2>
          <div className="muted">
            a flat top <b>height</b> above the ground, with a bank round its edge (a wall, past about twice the stock height). Cliffs of one height run together where they meet (by blend); one of a greater height laid over another is a second storey. A ramp drawn over the edge climbs onto it.
          </div>
        </div>
      )}
      {terrain === "cut" && (
        <div className="field">
          <h2>cut</h2>
          <div className="muted">
            takes the ground away inside it, down to whatever stands under the tier it was cut into (its <b>cut into</b> height: a cliff's own height, or two cliffs' for a storey). The sculpt brush's right click lays these; a cliff laid after it fills it back in. With no cliff of that height left it does nothing, and only this outline shows.
          </div>
        </div>
      )}
      {terrain === "ramp" && (
        <div className="field">
          <h2>ramp</h2>
          <div className="muted">
            {!ramp || ramp.flat ? (
              <>lies level, so it makes no ground (only this outline shows): drag one end over a cliff (or a higher one) and the other onto lower ground, either way round, and it climbs between them, cut into the cliff where it overlaps</>
            ) : (
              <>
                climbs {ramp.h0.toFixed(1)} → {ramp.h1.toFixed(1)} over {ramp.L.toFixed(1)} units ({Math.round(ramp.grade * 100)}% grade at the steepest)
                {ramp.steep && <b style={{ color: "var(--red)" }}> · too steep to drive up: make it longer</b>}
              </>
            )}
          </div>
        </div>
      )}
      {!shape && (
        <div className="field">
          <h2>role</h2>
          <div className="seg">
            {Object.entries(ROLES).map(([k, r]) => (
              <button key={k} className={(p.role ?? "prop") === k ? "on" : ""} onClick={() => S().setRole(p.id, k)} style={r.color && (p.role ?? "prop") === k ? { borderColor: r.color } : undefined}>
                {r.label}
              </button>
            ))}
          </div>
          <div className="muted">{ROLE_HELP[p.role ?? "prop"]}</div>
        </div>
      )}
      {cover && (
        <div className="field">
          <h2>stacking</h2>
          <div className="seg">
            <button disabled={order === count - 1} onClick={() => S().toTop(p.id)}>on top</button>
            <button disabled={order === 0} onClick={() => S().toBottom(p.id)}>underneath</button>
          </div>
          <div className="muted">
            patches of one kind run together where they meet (by blend); a patch laid over one of another kind clears it where they overlap — bare ground over grass is a clearing. Later-placed lies on top. A road lies over everything, whenever it was laid: the game paints it tarmac and presses the ground flat under it.
          </div>
          {entry?.cover === "road" && (
            <div className="seg">
              <button
                disabled={!joinable}
                onClick={() => S().say(S().joinRoad(p.id) ? "joined the two roads" : "no road end close enough to join")}
                title="where an end of this road overlaps an end of another, make the two one road, smoothed at the join"
              >
                join
              </button>
            </div>
          )}
          {entry?.cover === "road" && (
            <div className="muted">
              drawn like a pen stroke: with the road picked, <b>press and drag</b> on the ground and let go. Start a stroke on the end of a road to carry it on; bring it back to its start to close a loop; a <b>click</b> lays a short straight piece. Picked, the road shows a <b>handle</b> at each knot: drag one to bend it there, <b>⌫</b> with one picked takes it out, and a drag on the road itself moves the whole road. Over water it is a <b>bridge</b> (shown in timber): the game builds a deck on piers there. The game draws the dashes.
            </div>
          )}
          {isWater(entry?.cover) && (
            <div className="muted">
              a pond: the game sinks a basin here, the water a little under the grass with a shore of sand round it. Laid over grass it clears the grass under it (stacking, as any patch; put it on top if grass shows through). Lay a <b>road</b> across it and the road is a bridge over the water.
            </div>
          )}
        </div>
      )}
      <div className="field">
        <h2>placement</h2>
        <Slider label="turn" value={deg(p.yaw)} min={-180} max={180} step={1} onLive={(v) => live({ yaw: rad(v) })} onDone={done} format={(v) => `${v}°`} />
        {!shape && <Slider label="size" value={p.scale} min={0.1} max={5} step={0.05} onLive={(v) => live({ scale: v })} onDone={done} format={(v) => `×${(+v).toFixed(2)}`} />}
        {!shape && <Slider label="lift" value={p.lift} min={-3} max={8} step={0.05} onLive={(v) => live({ lift: v })} onDone={done} format={(v) => (+v).toFixed(2)} />}
        {!shape && <Slider label="clearing" value={p.clearing ?? 0} min={0} max={20} step={0.5} onLive={(v) => live({ clearing: v })} onDone={done} format={(v) => (+v > 0 ? `${(+v).toFixed(1)} units` : "none")} />}
        {!shape && <div className="muted">the groundcover (grass, flowers, pebbles) is kept back this far round it, here and in the game; a building starts with a lot's worth. The ring shows it while it is picked.</div>}
      </div>
      {knobs.length > 0 && (
        <div className="field">
          <div className="row" style={{ justifyContent: "space-between" }}>
            <h2>knobs</h2>
            {changed && <button onClick={() => S().resetArgs(p.id)} style={{ padding: "2px 6px", fontSize: 9 }}>reset</button>}
          </div>
          <div className="knobs">
            {knobs.map((k) => (
              <Knob key={k.name} k={k} value={p.args[k.name] ?? entry.args[k.name]} onLive={(v) => S().patchArgsLive(p.id, { [k.name]: v })} onDone={done} />
            ))}
          </div>
        </div>
      )}
      {knobs.length === 0 && <div className="muted">this one has no knobs yet</div>}
      <div className="keys">
        <b>drag</b> move · <b>arrows</b> nudge · <b>q / e</b> turn · <b>[ ]</b> size · <b>⌘D</b> duplicate · <b>⌫</b> delete · <b>f</b> look at · <b>⌘Z</b> undo · <b>⌘⇧Z</b> / <b>⌘Y</b> redo
      </div>
    </>
  );
}

function MapSettings() {
  const map = useMap((s) => s.map);
  const S = useMap.getState;
  const starts = map.placements.filter((p) => p.role && p.role !== "prop");
  const player = starts.find((p) => p.role === "player");
  // Placed things the catalog has no entry for (a story renamed or taken
  // out since they were placed): nothing is drawn for them here, but a game
  // may still build them, so they are named and offered for removal.
  const unknown = map.placements.filter((p) => !ENTRY[p.entry]);
  return (
    <>
      <h1>Map</h1>
      {unknown.length > 0 && (
        <div className="field">
          <h2>not in the catalog</h2>
          <div className="row">
            <span className="muted" style={{ flex: 1 }}>
              {unknown.length} placed thing{unknown.length > 1 ? "s" : ""} with no catalog entry, drawn nowhere here but maybe in a game: {unknown.map((p) => p.entry.replace(/--default$/, "")).join(", ")}
            </span>
            <button
              onClick={() => {
                S().commit(map.placements.filter((p) => ENTRY[p.entry]));
                S().say(`removed ${unknown.length}; save to take ${unknown.length > 1 ? "them" : "it"} out of the game too`);
              }}
            >
              remove
            </button>
          </div>
        </div>
      )}
      <Planet />
      <TerrainSeed />
      <Start player={player} />
      <div className="field">
        <h2>surface</h2>
        <div className="row">
          <label>ground</label>
          <input type="color" value={map.look.ground} onChange={(e) => S().setLook({ ground: e.target.value })} />
          <span className="val">{map.look.ground}</span>
        </div>
      </div>
      <div className="field">
        <h2>placed · {map.placements.length}</h2>
        <div className="seg">
          <button className="danger" disabled={!map.placements.length} onClick={() => confirm("Remove everything from the map?") && S().clear()}>clear all</button>
        </div>
      </div>
    </>
  );
}

// THE MAP'S FILES: its name and folder, and saving, opening and starting
// over; in the planet section of the map panel.
function Files() {
  const map = useMap((s) => s.map);
  const dirty = useMap((s) => s.dirty);
  const [sheet, setSheet] = useState(null); // the list of maps to open
  const say = useMap((s) => s.say);

  const save = async () => {
    try {
      await saveJson(map);
      await saveGlb(map, PLACEMENTS.group);
      useMap.setState({ dirty: false });
      say("");
    } catch (e) {
      say(`save failed: ${e.message}`);
    }
  };
  const open = async () => {
    try {
      const { maps, folder } = await listMaps(map.folder);
      setSheet({ maps, folder });
    } catch (e) {
      say(`could not list: ${e.message}`);
    }
  };
  const pick = async (name) => {
    try {
      const m = await loadMap(map.folder, name);
      useMap.getState().setMap({ ...blankMap(), ...m, folder: map.folder });
      setSheet(null);
      say("");
    } catch (e) {
      say(`could not open: ${e.message}`);
    }
  };
  const fresh = () => {
    if (map.placements.length && !confirm("Start a new map? The one in hand is kept only if you saved it.")) return;
    useMap.getState().setMap(blankMap());
  };

  return (
    <>
      <div className="row">
        <label>name</label>
        <input type="text" value={map.name} onChange={(e) => useMap.getState().setName(e.target.value.replace(/[^\w-]/g, "-"))} style={{ flex: 1 }} title="the map's name: its files are <name>.json and <name>.glb" />
      </div>
      <div className="row">
        <label>folder</label>
        <input type="text" value={map.folder} onChange={(e) => useMap.getState().setFolder(e.target.value)} style={{ flex: 1 }} title="the folder the map is saved to, relative to 3d-storybook (or absolute), anywhere under the Desktop" />
      </div>
      <div className="seg">
        <button onClick={save}>{dirty ? "save •" : "save"}</button>
        <button className={sheet ? "on" : ""} onClick={() => (sheet ? setSheet(null) : open())}>open…</button>
        <button onClick={fresh}>new</button>
      </div>
      {sheet && (
        <div className="sheet">
          <span className="muted">maps in {sheet.folder.replace(/^.*\/Desktop\//, "")}</span>
          {sheet.maps.length === 0 && <span className="muted">none yet</span>}
          {sheet.maps.map((n) => (
            <button key={n} onClick={() => pick(n)}>{n}</button>
          ))}
        </div>
      )}
    </>
  );
}

// THE PLANET: its radius and the daylight, in a popover.
function Planet() {
  const radiusNow = useMap((s) => s.map.surface.radius);
  const daylight = useMap((s) => s.map.look.daylight);
  const S = useMap.getState;
  const day = (v) => (v < 0.15 ? "night" : v > 0.85 ? "day" : (+v).toFixed(2));
  return (
    <div className="field">
      <h2>planet</h2>
      <Files />
      <Flyout
        title="planet"
        trigger={(open) => (
          <button className={`seedbtn${open ? " on" : ""}`} title="the planet's size and light">
            <span>radius {radiusNow} · {day(daylight)}</span>
            <span className="muted">▸</span>
          </button>
        )}
      >
        {() => (
          <>
            <Radius />
            <Slider label="daylight" value={daylight} min={0} max={1} step={0.01} onLive={(v) => S().setLook({ daylight: v })} format={day} />
          </>
        )}
      </Flyout>
    </div>
  );
}

// The radius is typed, and taken on Enter, on leaving the box, or when the
// popover closes round it (a new radius rebuilds the ground, so not per key).
function Radius() {
  const now = useMap((s) => s.map.surface.radius);
  const [radius, setRadius] = useState(now);
  useEffect(() => setRadius(now), [now]);
  const typed = useRef(radius);
  typed.current = radius;
  const take = () => {
    const r = +typed.current;
    if (Number.isFinite(r) && r >= 4 && r <= 400 && r !== useMap.getState().map.surface.radius) useMap.getState().setSurface({ radius: r });
  };
  useEffect(() => take, []);
  return (
    <div className="row">
      <label>radius</label>
      <input
        type="number"
        min={4}
        max={400}
        step={1}
        value={radius}
        onChange={(e) => setRadius(e.target.value)}
        onBlur={take}
        onKeyDown={(e) => e.key === "Enter" && e.target.blur()}
        style={{ width: 70 }}
      />
    </div>
  );
}

// A FLYOUT: a button in the inspector that opens a popover out to its left,
// over the world, level with the button. A click anywhere else closes it.
function Flyout({ trigger, title, children }) {
  const [at, setAt] = useState(null); // the button's top, while open
  const box = useRef(null);
  useEffect(() => {
    if (at == null) return;
    const away = (e) => box.current && !box.current.contains(e.target) && setAt(null);
    const esc = (e) => e.key === "Escape" && setAt(null);
    window.addEventListener("pointerdown", away);
    window.addEventListener("keydown", esc);
    return () => { window.removeEventListener("pointerdown", away); window.removeEventListener("keydown", esc); };
  }, [at]);
  return (
    <div ref={box}>
      <div onClick={(e) => setAt(at == null ? e.currentTarget.getBoundingClientRect().top : null)}>{trigger(at != null)}</div>
      {at != null && (
        <div className="flyout" style={{ top: Math.max(52, Math.min(at, window.innerHeight - 420)) }}>
          {title && <h2>{title}</h2>}
          {children(() => setAt(null))}
        </div>
      )}
    </div>
  );
}

// THE START: the player's character, its picture from the object library;
// a click opens every character to swap it for (or, with none placed yet,
// to place one).
const CHARACTERS = ENTRIES.filter((e) => e.top === "Characters" && !e.hidden);
function Start({ player }) {
  const S = useMap.getState;
  const now = player && ENTRY[player.entry];
  return (
    <div className="field">
      <h2>start</h2>
      <Flyout
        title="characters"
        trigger={(open) => (
          <button className={`startcard${open ? " on" : ""}`} title={now ? "swap the player's character" : "pick a character to place as the player"}>
            {now ? <img src={`/thumbs/${now.id}.png`} alt="" /> : <div className="noimg">?</div>}
            <span>{now ? now.name : "no player yet"}</span>
          </button>
        )}
      >
        {(close) => (
          <div className="chargrid">
            {CHARACTERS.map((e) => (
              <button
                key={e.id}
                className={`card${player?.entry === e.id ? " on" : ""}`}
                title={e.name}
                onClick={() => {
                  if (player) S().setEntry(player.id, e.id);
                  else S().startPlacing(e.id);
                  close();
                }}
              >
                <img src={`/thumbs/${e.id}.png`} alt="" loading="lazy" />
                <span>{e.name}</span>
              </button>
            ))}
          </div>
        )}
      </Flyout>
    </div>
  );
}

// THE TERRAIN SEED: a word the whole ground is grown from (seed.js) —
// cliffs with ramps, ponds, roads (bridges where they cross the ponds) and
// groundcover — in place of drawing each piece. What grows is ordinary
// placements, to be changed by hand after; drawing by hand still works as
// it did. The word and the amounts are the map's, saved with it.
const AMOUNT_LABELS = { cliffs: "cliffs", ponds: "ponds", roads: "roads", patches: "groundcover" };
function TerrainSeed() {
  const seed = useMap((s) => s.map.seed);
  const radius = useMap((s) => s.map.surface.radius);
  const bumpiness = useMap((s) => s.map.surface.bumpiness ?? 1);
  const S = useMap.getState;
  const [word, setWord] = useState(seed.word);
  useEffect(() => setWord(seed.word), [seed.word]);
  const [keep, setKeep] = useState(false);
  const grow = (w = word) => {
    const used = w.trim() || rollSeed();
    S().setSeed({ word: used });
    const n = S().grow(keep);
    S().say(`grew ${n} pieces of ground from "${used}"`);
  };
  const roll = () => grow(rollSeed());
  const scale = Math.min(4, Math.max(0.2, (radius / 36) ** 2));
  return (
    <div className="field">
      <h2>terrain seed</h2>
      <Flyout
        title="terrain seed"
        trigger={(open) => (
          <button className={`seedbtn${open ? " on" : ""}`} title="grow the whole ground from a word">
            <span>{seed.word || "no seed yet"}</span>
            <span className="muted">▸</span>
          </button>
        )}
      >
        {() => (
          <>
      <div className="row">
        <label>seed</label>
        <input
          type="text"
          placeholder="a word, any word"
          value={word}
          onChange={(e) => setWord(e.target.value)}
          onBlur={() => word !== seed.word && S().setSeed({ word })}
          onKeyDown={(e) => e.key === "Enter" && grow()}
          style={{ flex: 1 }}
          title="the same word grows the same ground; change a letter for another. Enter grows it."
        />
        <button onClick={roll} title="a new word, and the ground grown from it">roll</button>
      </div>
      {Object.entries(AMOUNT_LABELS).map(([k, label]) => (
        <Slider key={k} label={label} value={seed[k]} min={AMOUNT_RANGE[k][0]} max={AMOUNT_RANGE[k][1]} step={1} onLive={(v) => S().setSeed({ [k]: v })} onDone={() => !keep && word.trim() && grow()} format={(v) => (scale === 1 ? v : `${v} → ${Math.round(v * scale)}`)} />
      ))}
      <Slider label="bumpiness" value={bumpiness} min={0} max={3} step={0.05} onLive={(v) => S().setSurface({ bumpiness: v })} format={(v) => (+v === 0 ? "smooth" : `×${(+v).toFixed(2)}`)} />
      <div className="row">
        <label>drawn by hand</label>
        <div className="seg">
          <button className={!keep ? "on" : ""} onClick={() => setKeep(false)} title="the cliffs, ramps, roads and patches on the map now go; things placed on it stay">replace</button>
          <button className={keep ? "on" : ""} onClick={() => setKeep(true)} title="what grows is added to what is on the map">keep</button>
        </div>
      </div>
          </>
        )}
      </Flyout>
    </div>
  );
}

export function Hint() {
  const placing = useMap((s) => s.placing);
  const brush = useMap((s) => s.brush);
  if (!placing) return null;
  if (placing === SCULPT)
    return (
      <div className="hint">
        <b>sculpt</b> · left raises · right lowers · brush {brush.radius * 2} across, {brush.height} tall · <b>[ ]</b> size · <b>shift [ ]</b> height · esc stops
      </div>
    );
  return (
    <div className="hint">
      placing <b>{ENTRY[placing]?.name}</b> · click the ground · shift keeps going · esc stops
    </div>
  );
}
