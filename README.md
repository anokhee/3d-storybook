# 3d-storybook

A catalogue of every 3D object I have made, each one standing alone on a
shared stage with sliders and colour pickers for its parameters. Built on
[Storybook](https://storybook.js.org) with React Three Fiber.

## Run it

```bash
npm install
git submodule update --init     # fetches the project source (first time only)
npm run storybook               # opens http://localhost:6006
```

Everything is a plain text file. Open the folder in VS Code and edit; the
browser updates as you save.

## How the folder is laid out

```
.storybook/          the shell: looks, stage, settings
  theme.js           colours and fonts of the sidebar, panels, docs  ← look & feel
  stage.jsx          the one 3D scene: sky, lights, ground, camera    ← scene
  preview.jsx        settings for every story, sidebar order
  main.js            where to find stories, which addons are on
  manager-head.html  loads the font for the shell
  preview-head.html  loads the font for the docs pages
stories/             one file per object                              ← add objects here
  About.mdx          the landing page (Markdown)
  wooden-dollies/    objects from that project
projects/            the source projects, as git submodules (read-only)
  wooden-dollies/
vite.config.js       the aliases: @dollies, @world → folders in projects/
.github/workflows/   builds and publishes to GitHub Pages on push
```

## Add an object from an existing project

Say you want the `Lamp` from wooden-dollies.

1. Find it: `projects/wooden-dollies/r3f/src/refactored/nouns/lamp/`. There is a
   `Lamp.jsx` (the component) and an `objects.js` (its defaults, e.g. `LAMP`).
2. Copy `stories/wooden-dollies/Bench.stories.jsx` to `Lamp.stories.jsx`.
3. Change the imports to the lamp's files and the `title` to
   `"Wooden Dollies/Furniture/Lamp"`.
4. Open the lamp's `objects.js`, pick the fields worth a knob, and list them in
   `argTypes` (the widget), `args` (the start value), and `render` (where it
   goes in the nested config). The nesting in `render` must match `objects.js`
   exactly, or the knob does nothing.
5. Save. It appears in the sidebar.

Colours in the dollies project are `{ hex, vary }` objects, not strings.
Wrap a picked colour with `solid(hex)` (exact) or `block(hex)` (clay, with
drift), whichever the default uses.

## Add a preset

In any story file, add a line like

```js
export const Midnight = { args: { seatColor: "#2B3A47" } };
```

The name becomes the sidebar entry. Only the args you list change.

## Add a whole new project

1. Add it as a submodule: `git submodule add <repo url> projects/<name>`.
2. Give it an alias in `vite.config.js`, next to `@dollies`.
3. Make `stories/<name>/` and write story files that import through the alias.
4. Add its title to `storySort.order` in `.storybook/preview.jsx` so it sits
   where you want in the sidebar.

If the project's objects are plain three.js builders (a function that adds
meshes to a scene), make a `THREE.Group`, pass it to the builder in place of
the scene, and render it with `<primitive object={group} />` in the story.

## Pull in the latest from the projects

```bash
npm run update-projects
```

That moves each submodule to the tip of its tracked branch. Commit the
result to pin the new version.

## Deploy

Pushing to `main` builds the site and publishes it to GitHub Pages.
One-time setup is described at the top of `.github/workflows/storybook.yml`:
turn on Pages, and add a `PROJECTS_TOKEN` secret so the private project
repos can be cloned.

To build locally: `npm run build-storybook` writes a static site to
`storybook-static/`. Any static host can serve it.
