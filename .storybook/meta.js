// EDITABLE METADATA: a description, some tags and a status for each entry,
// kept in public/library-meta.json, keyed by story id:
//
//   { "props-umbrella--default": { "description": "...", "tags": ["rain"], "status": "wip" } }
//
// The catalog's drawer edits it (Catalog.stories.jsx) and the sidebar's tag
// filter reads it (manager.js). Saving goes through the dev server
// (vite.config.js, POST /__library/meta), which writes the file; on a
// built Storybook it can be read but not changed.

// An entry's status: shown as a pill at the top right of its card, and
// in the drawer's pick list.
export const STATUSES = [
  { value: "", label: "No status", color: null },
  { value: "idea", label: "Idea", color: "#8A6FD1" },
  { value: "wip", label: "In progress", color: "#D9923D" },
  { value: "needs-work", label: "Needs work", color: "#C9504A" },
  { value: "done", label: "Done", color: "#3E9B63" },
];
export const statusOf = (value) => STATUSES.find((s) => s.value === value) ?? STATUSES[0];

// Every entry's metadata, afresh from the file (never from the cache)
export const loadMeta = () =>
  fetch(`library-meta.json?t=${Date.now()}`).then((r) => (r.ok ? r.json() : {})).catch(() => ({}));

// Change some of one entry's fields ({ description?, tags?, status? });
// resolves to the entry's metadata as saved
export async function saveMeta(id, patch) {
  const r = await fetch("/__library/meta", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ id, patch }) });
  if (!r.ok) throw new Error("the dev server did not save it");
  return (await r.json()).meta;
}

// "a, b ,c" -> ["a", "b", "c"]
export const tagsOf = (text) => [...new Set(text.split(",").map((t) => t.trim().toLowerCase()).filter(Boolean))];
