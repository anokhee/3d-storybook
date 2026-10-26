// THE PANELS: the bar along the top (the map's name, saving, undo), the
// catalog down the left (pick a thing to place), and the inspector down the
// right (the picked placement's turn, size and knobs; or, with nothing
// picked, the map's own settings).
import React, { useEffect, useRef, useState } from "react";
import { ENTRY, TOPS, knobsOf, useEntries } from "./catalog.js";
import { useMap, blankMap, ROLES, MODES, joinNearby } from "./store.js";
import { listMaps, loadMap, saveGlb, saveJson } from "./export.js";
import { PLACEMENTS, useTerrain, useField } from "./Scene.jsx";
import { rampInfo } from "./Terrain.jsx";
import { AMOUNT_RANGE, rollSeed } from "./seed.js";
import { isWater } from "../runtime/cover.js";

const ROLE_HELP = {
  prop: "scenery: baked into the map as it stands here",
  player: "the game starts here, as this character, facing the bar",
};

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
  const dirty = useMap((s) => s.dirty);
  const canUndo = useMap((s) => s.undo.length > 0);
  const canRedo = useMap((s) => s.redo.length > 0);
  const status = useMap((s) => s.status);
  const [sheet, setSheet] = useState(null); // the list of maps to open
  const say = useMap((s) => s.say);

  const save = async () => {
    try {
      say("saving…");
      const j = await saveJson(map);
      const g = await saveGlb(map, PLACEMENTS.group);
      useMap.setState({ dirty: false });
      say(`saved ${map.name}.json and .glb (${(g.bytes / 1024).toFixed(0)} KB) in ${j.file.replace(/\/[^/]+$/, "")}`);
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
      say(`opened ${name}`);
    } catch (e) {
      say(`could not open: ${e.message}`);
    }
  };
  const fresh = () => {
    if (map.placements.length && !confirm("Start a new map? The one in hand is kept only if you saved it.")) return;
    useMap.getState().setMap(blankMap());
  };

  return (
    <div id="top" className="panel">
      <h1>mapmaker</h1>
      <input type="text" value={map.name} onChange={(e) => useMap.getState().setName(e.target.value.replace(/[^\w-]/g, "-"))} style={{ width: 120 }} title="the map's name: its files are <name>.json and <name>.glb" />
      <span className="muted">in</span>
      <input type="text" value={map.folder} onChange={(e) => useMap.getState().setFolder(e.target.value)} style={{ width: 150 }} title="the folder the map is saved to, relative to 3d-storybook (or absolute), anywhere under the Desktop" />
      <button onClick={save}>{dirty ? "save •" : "save"}</button>
      <button onClick={open}>open…</button>
      <button onClick={fresh}>new</button>
      <span style={{ width: 8 }} />
      <button disabled={!canUndo} onClick={() => useMap.getState().undoStep()} title="⌘Z / ctrl-Z">undo</button>
      <button disabled={!canRedo} onClick={() => useMap.getState().redoStep()} title="⌘⇧Z, ⌘Y / ctrl-Y">redo</button>
      <span style={{ width: 8 }} />
      <ModeSwitch />
      <span className="spacer" />
      <span className="status">{status || `${map.placements.length} placed`}</span>
      {sheet && (
        <div className="panel" style={{ position: "absolute", top: 44, left: 300, width: 220 }}>
          <h2>maps in {sheet.folder.replace(/^.*\/Desktop\//, "")}</h2>
          <div className="sheet">
            {sheet.maps.length === 0 && <span className="muted">none yet</span>}
            {sheet.maps.map((n) => (
              <button key={n} onClick={() => pick(n)}>{n}</button>
            ))}
          </div>
          <button onClick={() => setSheet(null)}>close</button>
        </div>
      )}
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

// The ground's shapes (cliffs, ramps, groundcover) are the terrain mode's; everything else the objects mode's.
const SHAPE_TOPS = new Set(["Terrain", "Groundcover"]);
export function Catalog() {
  const [top, setTop] = useState("");
  const [search, setSearch] = useState("");
  const mode = useMap((s) => s.mode);
  const terrain = mode === "terrain";
  const tops = TOPS.filter((t) => SHAPE_TOPS.has(t) === terrain);
  useEffect(() => {
    if (top && !tops.includes(top)) setTop("");
  }, [mode]);
  const entries = useEntries(top, search).filter((e) => SHAPE_TOPS.has(e.top) === terrain);
  const placing = useMap((s) => s.placing);
  return (
    <div id="catalog" className="panel">
      <h2>
        {terrain ? "terrain" : "objects"} · {entries.length}
      </h2>
      <input type="search" placeholder="search" value={search} onChange={(e) => setSearch(e.target.value)} />
      <div className="tabs">
        <button className={top === "" ? "on" : ""} onClick={() => setTop("")}>all</button>
        {tops.map((t) => (
          <button key={t} className={top === t ? "on" : ""} onClick={() => setTop(t)}>{t.toLowerCase()}</button>
        ))}
      </div>
      <div className="grid">
        {entries.map((e) => (
          <Card key={e.id} entry={e} on={placing === e.id} />
        ))}
      </div>
      <div className="keys">
        {terrain ? (
          <>
            pick a shape, then <b>drag</b> on the ground to draw it out, or <b>click</b> for the stock size · <b>shift</b> keeps going · <b>esc</b> / right-click stops · <b>tab</b> back to objects. Things placed on the map stay out of the way here. Or grow a whole ground at once from a <b>terrain seed</b> (the map panel on the right, with nothing picked) and change what grew by hand.
          </>
        ) : (
          <>
            pick a thing, then <b>click</b> the ground to place it · <b>shift-click</b> keeps placing · <b>esc</b> / right-click stops · <b>tab</b> for terrain (cliffs, ramps, roads, grass). Cliffs, roads and patches stay out of the way here.
          </>
        )}
      </div>
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
  return <div id="inspector" className="panel">{p ? <Picked p={p} /> : <MapSettings />}</div>;
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
  return (
    <>
      <h1>{entry?.name ?? p.entry}</h1>
      <div className="muted" style={{ marginTop: -6 }}>{entry?.section}</div>
      <div className="seg">
        <button onClick={() => S().focus?.(p.id)}>look at</button>
        <button onClick={() => S().duplicate(p.id)}>duplicate</button>
        <button className="danger" onClick={() => S().remove(p.id)}>delete</button>
      </div>
      {terrain === "cliff" && (
        <div className="field">
          <h2>cliff</h2>
          <div className="muted">
            a flat top <b>height</b> above the ground, with a wall round its edge. Cliffs of one height run together where they meet (by blend); one of a greater height laid over another is a second storey. A ramp drawn over the edge climbs onto it.
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
                climbs {ramp.h0.toFixed(1)} → {ramp.h1.toFixed(1)} over {ramp.L.toFixed(1)} units ({Math.round(ramp.slope * 100)}% grade)
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
  const [radius, setRadius] = useState(map.surface.radius);
  useEffect(() => setRadius(map.surface.radius), [map.surface.radius]);
  const [terrain, setTerrainName] = useState(map.terrain ?? "");
  useEffect(() => setTerrainName(map.terrain ?? ""), [map.terrain]);
  const terrainStatus = useTerrain((s) => s.status);
  const hasTerrain = useTerrain((s) => s.ground.length > 0);
  const offer = useTerrain((s) => s.offer);
  const have = new Set(map.placements.map((p) => p.id));
  const gone = new Set(map.dismissed ?? []);
  const offered = offer.filter((p) => !have.has(p.id) && !gone.has(p.id));
  const starts = map.placements.filter((p) => p.role && p.role !== "prop");
  const player = starts.find((p) => p.role === "player");
  return (
    <>
      <h1>map</h1>
      <div className="field">
        <h2>terrain</h2>
        <div className="row">
          <label>snapshot</label>
          <input
            type="text"
            placeholder="none"
            value={terrain}
            onChange={(e) => setTerrainName(e.target.value.replace(/[^\w-]/g, ""))}
            onBlur={() => terrain !== (map.terrain ?? "") && S().setTerrain(terrain)}
            onKeyDown={(e) => e.key === "Enter" && e.target.blur()}
            style={{ flex: 1 }}
            title="a glb in the map's folder: a game's ground, as it exported it (the car page's ?terrain)"
          />
          <button
            onClick={() => {
              if (terrain !== (map.terrain ?? "")) S().setTerrain(terrain);
              useTerrain.setState({ key: Date.now() });
            }}
            title="load it again after the game exported a new one"
          >
            reload
          </button>
        </div>
        <div className="muted">{terrainStatus || "a game's ground, exported by it into the map's folder; the car game does it at index.html?terrain"}</div>
        <div className="muted">the map's own cliffs and ramps (the terrain tab) rise on top of it, here and in the game alike</div>
        {offered.length > 0 && (
          <div className="row">
            <span className="muted" style={{ flex: 1 }}>the game has {offered.length} houses and trees not on this map</span>
            <button onClick={() => S().say(`adopted ${S().adopt(offer)}`)}>adopt</button>
          </div>
        )}
      </div>
      <TerrainSeed />
      <div className="field">
        <h2>start</h2>
        <div className="muted">
          {player ? <>player: {ENTRY[player.entry]?.name ?? player.entry} <button onClick={() => S().focus?.(player.id)} style={{ padding: "1px 6px", fontSize: 9 }}>look at</button></> : "no player start yet: place a character"}
          <br />
          cars and animals placed here are scenery, like anything else
        </div>
      </div>
      <div className="field">
        <h2>surface</h2>
        <div className="row">
          <label>planet radius</label>
          <input
            type="number"
            min={4}
            max={400}
            step={1}
            value={radius}
            disabled={hasTerrain}
            onChange={(e) => setRadius(e.target.value)}
            onBlur={() => Number.isFinite(+radius) && +radius >= 4 && S().setSurface({ radius: +radius })}
            onKeyDown={(e) => e.key === "Enter" && e.target.blur()}
            style={{ width: 70 }}
          />
          <span className="muted">{hasTerrain ? "(the terrain snapshot's, so the game matches what is drawn; export a new snapshot from the game to change it)" : "(the car game's is 36)"}</span>
        </div>
        <div className="row">
          <label>ground</label>
          <input type="color" value={map.look.ground} onChange={(e) => S().setLook({ ground: e.target.value })} />
          <span className="val">{map.look.ground}</span>
        </div>
        <Slider label="daylight" value={map.look.daylight} min={0} max={1} step={0.01} onLive={(v) => S().setLook({ daylight: v })} format={(v) => (v < 0.15 ? "night" : v > 0.85 ? "day" : (+v).toFixed(2))} />
      </div>
      <div className="field">
        <h2>placed · {map.placements.length}</h2>
        <div className="seg">
          <button className="danger" disabled={!map.placements.length} onClick={() => confirm("Remove everything from the map?") && S().clear()}>clear all</button>
        </div>
      </div>
      <div className="keys">
        <b>drag</b> orbit · <b>scroll</b> zoom · <b>click</b> a thing to pick it · <b>tab</b> objects / terrain · <b>⌘Z</b> undo · <b>⌘⇧Z</b> / <b>⌘Y</b> redo
        <br />
        bearings are kept, not positions: a game stands each thing on its own ground at that bearing.
      </div>
    </>
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
        <Slider key={k} label={label} value={seed[k]} min={AMOUNT_RANGE[k][0]} max={AMOUNT_RANGE[k][1]} step={1} onLive={(v) => S().setSeed({ [k]: v })} format={(v) => (scale === 1 ? v : `${v} → ${Math.round(v * scale)}`)} />
      ))}
      <Slider label="bumpiness" value={bumpiness} min={0} max={3} step={0.05} onLive={(v) => S().setSurface({ bumpiness: v })} format={(v) => (+v === 0 ? "smooth" : `×${(+v).toFixed(2)}`)} />
      <div className="row">
        <label>drawn by hand</label>
        <div className="seg">
          <button className={!keep ? "on" : ""} onClick={() => setKeep(false)} title="the cliffs, ramps, roads and patches on the map now go; things placed on it stay">replace</button>
          <button className={keep ? "on" : ""} onClick={() => setKeep(true)} title="what grows is added to what is on the map">keep</button>
        </div>
      </div>
      <div className="seg">
        <button onClick={() => grow()} disabled={!word.trim()}>grow</button>
      </div>
      <div className="muted">
        grows a whole ground from the word: cliffs with a ramp up each (some with a second storey), ponds, roads winding between the cliffs and bridging the ponds, and grass, flowers and pebbles. The same word grows the same ground; <b>roll</b> picks a new one. What grows is ordinary cliffs, ramps, roads and patches: pick any of it in the terrain tab and move, reshape or delete it, or draw more. <b>⌘Z</b> takes it all back.
        {scale !== 1 && <> On this ball the amounts scale by its size (shown after the arrow).</>}
      </div>
    </div>
  );
}

export function Hint() {
  const placing = useMap((s) => s.placing);
  if (!placing) return null;
  return (
    <div className="hint">
      placing <b>{ENTRY[placing]?.name}</b> · click the ground · shift keeps going · esc stops
    </div>
  );
}
