// THE TOOLBARS. The main one, above the viewport, keeps what is about the
// whole catalog:
//
//   (The search box and the category/tag filter live in the sidebar, in manager.js.)
//   Camera       (at the right) retakes the pictures of whatever changed
//
// The OBJECT BAR, a second row under it that is there only while a single
// object is open (not on the catalog page), carries what is about that
// object: a way back to the catalog, the time of day and the lighting (each
// a button that opens a popover), and at its right the addon panel, open in
// isolation, and the Code panel. It rides on Storybook's preview wrapper
// slot, above the canvas.
//
// Lighting and time of day each write a Storybook "global" (`lighting`,
// `daylight`). preview.jsx reads the globals and hands them to the stage,
// which lights the scene accordingly. To add a look, add it to LOOKS here
// AND in stage.jsx.
import React from "react";
import { addons, types, useGlobals, useStorybookApi, useStorybookState } from "storybook/manager-api";
import { IconButton, WithTooltip, TooltipLinkList } from "storybook/internal/components";

const LOOKS = [
  { value: "toon", title: "Toon · Wooden Dollies" },
  { value: "flat", title: "Flat · Albatross" },
];

// A lightbulb, drawn here so it matches the toolbar's other icons.
const Bulb = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M7 1.25a3.9 3.9 0 0 0-2.4 7c.45.38.75.9.85 1.5l.05.5h3l.05-.5c.1-.6.4-1.12.85-1.5A3.9 3.9 0 0 0 7 1.25z" />
    <path d="M5.6 11.75h2.8M6.1 13h1.8" />
  </svg>
);

// The catalog story's id: its title "Catalog", its one entry "Default".
const GRID_STORY = "catalog--default";

const GridIcon = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" aria-hidden>
    <rect x="1.5" y="1.5" width="4" height="4" /><rect x="8.5" y="1.5" width="4" height="4" />
    <rect x="1.5" y="8.5" width="4" height="4" /><rect x="8.5" y="8.5" width="4" height="4" />
  </svg>
);

// The camera: retakes the catalog's pictures for every entry whose source
// has changed since its picture (or that has none), off the running dev
// server (vite.config.js /__library/retake, scripts/thumbnails.mjs). Dev
// server only. It says what it is doing, and what it did, in a notification.
const CameraIcon = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" aria-hidden>
    <path d="M1.5 4.5h2.2l1-1.5h4.6l1 1.5h2.2v7h-11z" /><circle cx="7" cy="8" r="2.2" />
  </svg>
);
function CameraTool() {
  const api = useStorybookApi();
  const [busy, setBusy] = React.useState(false);
  const notify = (headline, subHeadline, duration = 8000) => api.addNotification({ id: "object-library/camera", content: { headline, subHeadline }, duration });
  const retake = async () => {
    const r = await fetch("/__library/retake", { method: "POST" });
    if (!r.ok) return notify("Camera", r.status === 409 ? "Already retaking pictures." : "The dev server's camera is not answering.");
    setBusy(true);
    const poll = async () => {
      const s = await (await fetch("/__library/retake")).json();
      if (!s.running) {
        setBusy(false);
        notify("Camera", s.ids.length ? `Retook ${s.ids.length} picture${s.ids.length === 1 ? "" : "s"}. Reload the catalog to see them.` : "Nothing has changed since its picture was taken.");
        return;
      }
      notify("Camera", `Retaking ${s.ids.length} picture${s.ids.length === 1 ? "" : "s"}…`, 60000);
      setTimeout(poll, 2000);
    };
    setTimeout(poll, 800);
  };
  return (
    <IconButton title="Retake the pictures of every entry that has changed" active={busy} onClick={busy ? undefined : retake}>
      <CameraIcon />
    </IconButton>
  );
}

function GridTool() {
  const api = useStorybookApi();
  const { storyId } = useStorybookState();
  const away = storyId !== GRID_STORY;
  // Away from the catalog it reads as the way back; the catalog itself
  // remembers the tab, the picked object and the scroll (Catalog.stories.jsx)
  return (
    <IconButton title={away ? "Back to the catalog, where you left it" : "Catalog: every object on one page"} active={!away} onClick={() => api.selectStory(GRID_STORY)}>
      <GridIcon />
      {away && <span style={{ marginLeft: 6 }}>Back to catalog</span>}
    </IconButton>
  );
}

function LightingTool() {
  const [globals, updateGlobals] = useGlobals();
  const current = globals.lighting ?? "toon";
  const label = LOOKS.find((l) => l.value === current)?.title.split(" · ")[0];
  return (
    <WithTooltip
      placement="top"
      closeOnOutsideClick
      tooltip={({ onHide }) => (
        <TooltipLinkList
          links={LOOKS.map((l) => ({
            id: l.value,
            title: l.title,
            active: l.value === current,
            onClick: () => {
              updateGlobals({ lighting: l.value });
              onHide();
            },
          }))}
        />
      )}
    >
      <IconButton title="Lighting" active={current !== LOOKS[0].value}>
        <Bulb />
        <span style={{ marginLeft: 6 }}>{label}</span>
      </IconButton>
    </WithTooltip>
  );
}

// Time of day: a button like the lighting one, naming the hour; click it for
// a popover with the slider, night (left) to full day (right)
const hourName = (t) => (t < 0.15 ? "Night" : t < 0.4 ? "Twilight" : t < 0.65 ? "Sunrise" : "Day");
function DaylightTool() {
  const [globals, updateGlobals] = useGlobals();
  const t = Number(globals.daylight ?? 1);
  return (
    <WithTooltip
      placement="bottom"
      closeOnOutsideClick
      tooltip={() => (
        <label title="Time of day: night to day" style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", fontSize: 12, cursor: "pointer" }}>
          <span aria-hidden>☾</span>
          <input type="range" min="0" max="1" step="0.01" value={t} onChange={(e) => updateGlobals({ daylight: Number(e.target.value) })} style={{ width: 160, accentColor: "#5F7F98", cursor: "pointer" }} />
          <span aria-hidden>☼</span>
        </label>
      )}
    >
      <IconButton title="Time of day" active={t < 1}>
        <span aria-hidden style={{ fontSize: 13 }}>{t < 0.4 ? "☾" : "☼"}</span>
        <span style={{ marginLeft: 6 }}>{hourName(t)}</span>
      </IconButton>
    </WithTooltip>
  );
}

// The object bar (see the top of this file): under the toolbar, above the
// canvas, only while one object is open
const BackIcon = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M8.5 2.5 4 7l4.5 4.5" />
  </svg>
);
const PanelIcon = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" aria-hidden>
    <rect x="1.5" y="2.5" width="11" height="9" rx="1" /><path d="M8.5 2.5v9" />
  </svg>
);
const IsolateIcon = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M6 2.5H2.5v9h9V8M8.5 2.5h3v3M11.5 2.5 7 7" />
  </svg>
);
const CodeIcon = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="m4.5 4-3 3 3 3M9.5 4l3 3-3 3M8 2.5l-2 9" />
  </svg>
);
function ObjectBar({ children }) {
  const api = useStorybookApi();
  const { storyId, viewMode } = useStorybookState();
  const show = viewMode === "story" && storyId && storyId !== GRID_STORY;
  if (!show) return children;
  const isolate = () => {
    const hrefs = api.getStoryHrefs(storyId, { base: "origin", inheritArgs: true });
    window.open(hrefs.previewHref, "_blank", "noopener,noreferrer");
  };
  const code = () => {
    api.togglePanel(true);
    api.setSelectedPanel("object-library/code-panel");
  };
  return (
    <div style={{ display: "flex", flexDirection: "column", width: "100%", height: "100%" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 2, padding: "0 6px", height: 36, flex: "0 0 36px", borderBottom: "1px solid rgba(0,0,0,0.1)", background: "#F6F8FA", fontSize: 12 }}>
        <IconButton title="Back to the catalog, where you left it" onClick={() => api.selectStory(GRID_STORY)}>
          <BackIcon />
          <span style={{ marginLeft: 6 }}>Back to catalog</span>
        </IconButton>
        <span style={{ width: 1, height: 18, background: "rgba(0,0,0,0.12)", margin: "0 6px" }} />
        <DaylightTool />
        <LightingTool />
        <span style={{ flex: 1 }} />
        <IconButton title="Show or hide the addon panel (Controls, Code)" onClick={() => api.togglePanel()}>
          <PanelIcon />
        </IconButton>
        <IconButton title="Open this object in isolation, in a new tab" onClick={isolate}>
          <IsolateIcon />
        </IconButton>
        <IconButton title="The Code panel: this object's source, editable" onClick={code}>
          <CodeIcon />
          <span style={{ marginLeft: 6 }}>Code</span>
        </IconButton>
      </div>
      <div style={{ flex: 1, minHeight: 0, position: "relative" }}>{children}</div>
    </div>
  );
}

addons.register("object-library/tools", () => {
  const onStories = ({ viewMode }) => viewMode === "story";
  // The object bar, wrapped round the canvas (see ObjectBar)
  addons.add("object-library/object-bar", {
    type: types.PREVIEW,
    title: "Object bar",
    match: onStories,
    render: ({ children }) => <ObjectBar>{children}</ObjectBar>,
  });
  // At the toolbar's right end
  addons.add("object-library/camera", {
    type: types.TOOLEXTRA,
    title: "Camera",
    match: onStories,
    render: () => <CameraTool />,
  });
});
