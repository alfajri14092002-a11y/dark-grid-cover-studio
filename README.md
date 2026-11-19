# Dark Grid Cover Studio

A small offline web app that turns your photos into a GTA 6-style
multi-panel cover poster. Five photo panels, a bold sunburst title band
with a city skyline, and a one-click PNG export — all in a dark night
theme of near-black, deep violet, ember orange and teal.

## What it does

- **Five panels, one poster.** One hero photo plus four smaller panels,
  arranged in three layouts: Hero Top (portrait), Three Column
  (landscape) and Hero Left (square).
- **Your photos or the built-ins.** Pick any of the five sample photos
  per panel, fill all panels with one photo, upload your own, or drag a
  photo straight onto a panel. Photos are loaded locally and never leave
  the machine.
- **Pan and zoom.** Drag a panel to pan it, scroll to zoom it, or use
  the zoom slider on its card.
- **Four dark grades.** Midnight, Ember, Neon and Noir colour grades
  change the mood of the whole cover at once.
- **Captions.** Edit the kicker, the big title and the subtitle; the
  lettering resizes itself to fit the band.
- **Export PNG.** One click renders the cover at 1080×1080, 1080×1350
  or 1920×1080 and downloads it.

## Run it

The app is plain static files and works fully offline, but ES modules
need HTTP, so serve the `app/` folder:

```sh
cd app
python3 -m http.server 8080
```

Then open <http://localhost:8080>. (Any static server works.)

## Screenshot scenes

The app understands `?shot=` URLs for scripted captures:

- `?shot=editor` — the editor with a sample loaded.
- `?shot=cover` — the cover alone, full-bleed.

Both accept `photo`, `layout`, `grade`, `size`, `kicker`, `title` and
`subtitle` query parameters. `shots.json` lists the four captures used
for this entry. The page sets `window.__shotReady` once it has painted.

## Files

- `app/index.html`, `app/style.css` — the shell and the dark theme.
- `app/src/state.js` — samples, grades, layouts and the default state.
- `app/src/paint.js` — the canvas cover renderer (panels, title band,
  skyline, badges).
- `app/src/editor.js` — the control rail, panel interaction and export.
- `app/src/shots.js` — the `?shot=` scenes.
- `app/src/main.js` — entry point.
- `app/samples/` — five photos made for this entry with an image model.
- `main.ts` — copies `app/` and `screenshots/` to the output directory
  and writes `dossier.json`.

No Rockstar logo, artwork or fonts are used anywhere, and the app makes
no network requests.
