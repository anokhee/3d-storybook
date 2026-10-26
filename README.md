# 3d-storybook

A catalogue of every 3D object I have made, each one standing alone on a
shared stage. One entry per object, and each kind of a thing (a conifer, a
picket fence, a tulip in a pot) is its own entry, so the sidebar reads as a
flat list of things built from the same few primitives. Built on
[Storybook](https://storybook.js.org) with React Three Fiber.

The toolbar has two tools: the **lightbulb** picks the look (Toon, the
Wooden Dollies cel shading, or Flat, the albatross matte light) and the
**slider** sets the time of day, night on the left to full day on the
right. Drag to orbit, scroll to zoom. Controls, where an object has them,
are in the panel on the right.

The object code lives here, in `src/`. It was copied out of the projects it
was made for and is its own thing now: editing it here changes the library
and nothing else.

## The catalogue

The grid button in the toolbar opens the Catalogue: every object as a
picture in a grid, sorted by category, click one to open it. The pictures
are taken by a script, under the flat light at full day:

```bash
npm run build-storybook   # the pictures are taken from the built site
npm run thumbs            # writes public/thumbs/<entry>.png, one per entry
```

Rerun both after adding or changing an object, and commit the pictures;
the published site needs no browser.

## Run it

```bash
npm install
npm run storybook       # opens http://localhost:6006
```

Everything is a plain text file. Open the folder in VS Code and edit; the
browser updates as you save.

## How the folder is laid out

```
.storybook/          the shell: looks, stage, settings
  theme.js           colours and fonts of the sidebar, panels, docs  ← look & feel
  stage.jsx          the one 3D scene: looks, hours, ground, camera    ← scene
  tools.jsx          the toolbar: the lightbulb menu and the day slider
  preview.jsx        settings for every story, sidebar order, what is hidden
  main.js            where to find stories, which addons are on
  manager-head.html  loads the font for the shell
  preview-head.html  loads the font for the docs pages
stories/             one story file per object (or per kind of one)    ← add stories here
  About.mdx          the landing page (Markdown)
  Bench.stories.jsx  ...
  helpers/           shared bits stories use: mounts (a wall panel, a slab),
                     hung (an ornament on a string), water (a pool on its own),
                     albatross (each albatross builder wrapped as a component)
  Catalogue.stories.jsx  the picture grid; lists every other story by itself
public/thumbs/       the catalogue's pictures (made by `npm run thumbs`)
scripts/thumbnails.mjs the script that takes them
src/                 the objects themselves                           ← the code
  nouns/             one folder per object: Component.jsx + objects.js (its defaults)
  albatross/         the albatross game's objects: plain three.js builders
                     (trees, stones and lamps, the bird, daisies, statue heads, arms)
  adjectives/        the materials: unlit (toon), lit, glowing, and flat (albatross,
                     with its hours of the day in flat/daylight.js)
  interior/          the house indoors: Opening (a door or a window, arched, round
                     or paned) and Molding (the trim ringing one), from the game's rooms
  world/             palette, merge, layout, random — shared by every noun
  world/clay.js      the clay switch: objects were modelled lumpy; this shows them flat
  player/, game/, ui/, cutout.js, lighting.js, presets/, parts/
                     small things some nouns lean on; nothing to edit
.github/workflows/   builds and publishes to GitHub Pages on push
```

## Give an object knobs

Every object in `src/nouns/` that can stand on its own has a story. Most
are bare: one entry, no sliders. Wooden Bench, Tree, Vending Machine and
Pot Plant show the full pattern with colour pickers and sliders (Pot Plant
also shows one entry per kind instead of a Default); copy from those. Say
you want knobs on the lamp.

1. Look in `src/nouns/lamp/`. There is `Lamp.jsx` (the component) and
   `objects.js` (its defaults, e.g. `LAMP`).

3. Change the two imports to `../src/nouns/lamp/Lamp.jsx` and
   `../src/nouns/lamp/objects.js`, and the `title` to `"Furniture/Lamp"`.
   The part before the slash is the sidebar category.
4. Open the lamp's `objects.js`, pick the fields worth a knob, and list them in
   `argTypes` (the widget), `args` (the start value), and `render` (where it
   goes in the nested config). The nesting in `render` must match `objects.js`
   exactly, or the knob does nothing.
5. Save. It appears in the sidebar.

Colours in these objects are `{ hex, vary }` objects, not strings. Wrap a
picked colour with `solid(hex)` (exact) or `block(hex)` (clay, with a little
drift), whichever the default uses.

## Things that need a setting

Some parts only make sense attached to something: the machine parts sit
on a panel, the feet under a slab, the wall hanging on a wall
(`stories/helpers/mounts.jsx`). Ornaments hang from a string, facing the
camera (`helpers/hung.jsx`). Water features are laid out by a lot in the
game, so `helpers/water.jsx` stands one lot at the planet's pole and brings
the pool down to the stage; the pond, spring and pool ask the stage for
the planet's curved ground (`parameters.stage.ground`), which their coping
is built to. A story can also ask to be seen square-on
(`parameters.stage.view: "front"`).

## Clay or flat

The objects were modelled in lumpy clay. The library shows them flat.
`src/world/clay.js` is the one switch; set `CLAY_ON` to true for the lumps.

## Add an object from another project

Copy its source into `src/` (a folder per project or per object), fix any
imports so they point at files inside this repo, and write a story for it.
The albatross objects show the pattern for plain three.js code: each
builder returns a geometry or a group, and a small component in
`stories/helpers/albatross.jsx` builds it once (`useMemo`) and hands it to
a `<mesh>` or a `<primitive>`. Leave out anything that patches three.js
globally (albatross's flatlight.js): the library applies that look per
material instead.

## The mapmaker

`npm run mapmaker` opens a second page (http://localhost:6007) that lays the
catalogue out on a planet: pick a thing on the left, click the ground to
place it, drag it about, and turn its knobs on the right — the same knobs
its story has, within the same bounds — plus its turn, size and lift.
Nothing here needs Storybook; it reads the story files directly.

**Save** writes two files into the folder named in the top bar (this repo's
`maps/` by default; `../Car/maps` to save straight into a game — anywhere
under the Desktop): `<name>.json`, the map as the editor keeps it, and
`<name>.glb`, the placed objects baked, one node per placement carrying
its bearing, turn, size, lift, entry and knob values as extras.

A game loads the `.glb` with `runtime/mapLoader.js` (plain three.js, no
React — copy it beside the game's code):

```js
const { group, placements } = await loadMap("maps/world.glb", {
  finish: (m) => myToonMaterial(m.color),   // the game's own materials, optional
  radiusAt: (dir) => groundRadiusAt(dir),  // stand each on the game's ground, optional
});
scene.add(group);
```

A placement is kept as a **bearing** (a unit direction from the planet's
middle), not a position, so a game with hills stands each thing on its own
ground there. A flat ground, when a game wants one, is the same interface
with up always +y — see `mapmaker/surface.js`.

**Roles.** Each placement is scenery (baked as it stands — a placed car or
animal too) or the one `player start`: where you begin, and as which
character. The first character placed gets it; the inspector moves it. The
start wears a coloured ring and a bar the way it faces. The loader returns
it as `starts.player` with a `heading`, and keeps its mesh out of `group`.

**Groundcover.** The `groundcover` tab holds patches of grass, flowers,
pebbles, bare ground, water and road. Pick one and **drag on the ground to
draw it out** (a click places one of the stock size), then shape it in the
inspector: width, length and corner in world units, how thickly it is
planted, and `blend`, how near another patch of the same kind must come
for the two to run together, the way the dollies' pools do. Patches lie in
the order they are placed, later on top, and a patch laid over one of
another kind clears it where they overlap: bare ground over grass is a
clearing, pebbles over grass are pebbles with no grass under them. "On
top" and "underneath" in the inspector reorder them. The editor plants a
preview; a game plants its own things from the patches' shapes with
`runtime/cover.js` (`coverLobes`, `coverField`, `sampleCover`), which
deals a bearing for every tuft, so both agree on where the grass is. The
car game grows its grass, pebbles and daisies only inside these patches.
A **water** patch is a pond: a game sinks a basin under it, and a **road**
laid across it is a bridge — the editor shows those pieces in timber, and
the game is to build a deck on piers there, as it does for its own sea.
(The car game's copy of `cover.js` has yet to learn `water`.)

**Terrain seed.** Instead of drawing every cliff, pond and road, the map
panel (nothing picked) has a `terrain seed`: a word the whole ground is
grown from — cliffs with a ramp up each, some with a second storey; ponds;
roads winding between the cliffs and running straight across the ponds as
bridges; grass, flowers and pebbles. `roll` picks a new word and grows it;
the sliders say how much of each (scaled by the ball's size); `replace` or
`keep` says what happens to the shapes drawn by hand (things placed stay
either way). What grows is ordinary placements — pick any of it in the
terrain tab and move, reshape or delete it, or draw more — and ⌘Z takes it
all back. The same word on the same ball grows the same ground; the word
and amounts are saved with the map. See `mapmaker/seed.js`.

**Terrain.** To lay things out against a game's real ground, the game
exports a snapshot: the car game does it at `index.html?terrain` while the
mapmaker is running (it posts `terrain.glb` into `../Car/maps`; with no
server it downloads instead). The map's `terrain` setting names that file
in the map's folder; the editor shows it, raycasts against its `ground:`
meshes, and stands things at the real height. Re-export after changing the
game's terrain. Without one, the editor's ball is a plain sphere at the
map's radius (the car game's is 36).

**Adopting a game's houses and trees.** The car game's houses and trees
are left out of the snapshot and offered instead, as placements, in
`adopt.json` beside it. A map that has none of them yet takes them all as
the terrain loads (ids `adopt-…`), so the world looks as the game has it
and the first save changes nothing; after that an `adopt` button offers
any new ones, and deleted ones stay deleted. Once a map holds any houses
the game builds ALL its houses from the map (likewise trees), with its
own code: a house flattens its lot and keeps the fields clear as before,
a tree is instanced and kept out of. Their knobs in the editor are not
read by the game — only where they stand, their turn, a tree's size and
the two-storey house's garage side. Other buildings (the cupcake house,
the trailer) are plain scenery from the glb.

Keys: drag moves · arrows nudge · q / e turn · [ ] size · ⌘D duplicate ·
⌫ delete · f look at · ⌘Z undo · shift-click keeps placing · esc stops ·
drag on the ground draws a groundcover patch.
Planets and the sky are left out of the catalogue; everything else is in.

## Deploy

Pushing to `main` builds the site and publishes it to GitHub Pages. Turn on
Pages once in the repo settings (Settings → Pages → Source: GitHub Actions).

To build locally: `npm run build-storybook` writes a static site to
`storybook-static/`. Any static host can serve it.
# 3d-storybook
# 3d-storybook
