// THE CODE PANEL: the source behind the entry on the stage, to read and to
// edit in place. It shows the story file, the files it imports and the
// files those import (the component, its settings, the primitives it is
// built from), each on a tab. Edit, press save (or Cmd/Ctrl-S), and the
// file is written back through the dev server (vite.config.js), which
// hot-reloads the object: the mesh changes as you type and save. Dev
// server only; the built site has no back end to write to.
import React from "react";
import { addons, types, useStorybookApi, useStorybookState } from "storybook/manager-api";
import { AddonPanel } from "storybook/internal/components";

const mono = '"IBM Plex Mono", ui-monospace, "SF Mono", Menlo, monospace';

function CodePanel({ active }) {
  const api = useStorybookApi();
  const { storyId } = useStorybookState();
  const importPath = api.getData(storyId)?.importPath;
  const [files, setFiles] = React.useState([]);
  const [current, setCurrent] = React.useState(0);
  const [drafts, setDrafts] = React.useState({}); // path -> text being edited
  const [note, setNote] = React.useState("");
  React.useEffect(() => {
    if (!importPath || !active) return;
    let gone = false;
    fetch(`/__library/files?story=${encodeURIComponent(importPath)}`)
      .then((r) => r.json())
      .then((d) => { if (!gone) { setFiles(d.files ?? []); setCurrent(0); setDrafts({}); setNote(d.error ?? ""); } })
      .catch(() => setNote("The dev server's code panel is not answering (the built site has none)."));
    return () => { gone = true; };
  }, [importPath, active]);
  const file = files[current];
  const text = file ? drafts[file.path] ?? file.content : "";
  const dirty = file && file.path in drafts && drafts[file.path] !== file.content;
  const save = async () => {
    if (!file || !dirty) return;
    const r = await fetch("/__library/save", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ file: file.path, content: text }) });
    if (r.ok) {
      setFiles((fs) => fs.map((f) => (f.path === file.path ? { ...f, content: text } : f)));
      setNote(`Saved ${file.path}`);
    } else setNote(`Could not save: ${(await r.json()).error}`);
  };
  const onKey = (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "s") { e.preventDefault(); save(); }
    if (e.key === "Tab") { // two spaces, not a focus change
      e.preventDefault();
      const el = e.target, { selectionStart: a, selectionEnd: b } = el;
      setDrafts((d) => ({ ...d, [file.path]: text.slice(0, a) + "  " + text.slice(b) }));
      requestAnimationFrame(() => el.setSelectionRange(a + 2, a + 2));
    }
  };
  const btn = { font: "inherit", fontSize: 11, padding: "3px 9px", borderRadius: 3, cursor: "pointer", border: "1px solid #C3CED7", background: "#F6F8FA", color: "#2B3A47" };
  return (
    <AddonPanel active={!!active}>
      <div style={{ display: "flex", flexDirection: "column", height: "100%", fontFamily: mono, fontSize: 12 }}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 4, padding: 8, borderBottom: "1px solid #DDE4EA", alignItems: "center" }}>
          {files.map((f, i) => (
            <button key={f.path} onClick={() => setCurrent(i)} title={f.path} style={{ ...btn, background: i === current ? "#4F6E86" : "#F6F8FA", color: i === current ? "#EEF2F5" : "#2B3A47" }}>
              {f.path.split("/").pop()}{f.path in drafts && drafts[f.path] !== f.content ? " •" : ""}
            </button>
          ))}
          <span style={{ flex: 1 }} />
          <button onClick={save} disabled={!dirty} style={{ ...btn, opacity: dirty ? 1 : 0.5 }} title="Write the file back; the object reloads (Cmd/Ctrl-S)">Save</button>
        </div>
        {file ? (
          <textarea
            value={text}
            onChange={(e) => setDrafts((d) => ({ ...d, [file.path]: e.target.value }))}
            onKeyDown={onKey}
            spellCheck={false}
            style={{ flex: 1, width: "100%", boxSizing: "border-box", resize: "none", border: 0, outline: 0, padding: 12, font: "inherit", fontSize: 12, lineHeight: 1.5, color: "#2B3A47", background: "#FBFCFD", tabSize: 2, whiteSpace: "pre", overflow: "auto" }}
          />
        ) : <div style={{ padding: 12, color: "#66788A" }}>{note || "Pick an object."}</div>}
        {file && note && <div style={{ padding: "4px 8px", fontSize: 11, color: "#66788A", borderTop: "1px solid #DDE4EA" }}>{note}</div>}
      </div>
    </AddonPanel>
  );
}

addons.register("object-library/code", () => {
  addons.add("object-library/code-panel", {
    type: types.PANEL,
    title: "Code",
    match: ({ viewMode }) => viewMode === "story",
    render: ({ active }) => <CodePanel active={active} />,
  });
});
