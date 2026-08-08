# Putting your music files here

This folder (`public/audio`) is where the app looks for the 5 music
tracks. When you generate a track with ElevenLabs Music, download it, and
put it **directly inside this folder** — don't create a new folder inside
`audio` and put it there, and don't put it in any other folder. "Directly
inside" means: if you're looking at this `audio` folder's contents in your
file browser, the `.mp3` file should sit right next to this README file,
not nested one level deeper.

## The exact filenames the app expects

The app looks for these exact names. Renaming your downloaded file to
match is the only step required — no code changes.

| Scene | File name it must have |
|---|---|
| 1 — Opening, Nick's introduction | `scene_01_opening.mp3` |
| 2 — First Gatsby party | `scene_02_party.mp3` |
| 3 — Tea reunion, Gatsby & Daisy | `scene_03_tea_reunion.mp3` |
| 4 — Plaza Hotel confrontation | `scene_04_plaza_confrontation.mp3` |
| 5 — Myrtle's death through the end of the book | `scene_05_death_and_closing.mp3` |

Capitalization and underscores matter — `Scene_01_Opening.mp3` or
`scene-01-opening.mp3` will **not** be found. Copy-paste the names above
if you can, to avoid typos.

## A few things worth knowing

- **File format:** `.mp3` is expected. If ElevenLabs gives you a `.wav`
  file instead, you'll need to convert it to `.mp3` first (or ask for help
  updating the filename reference in `src/data/scene_manifest.json` if you'd
  rather keep `.wav`).
- **You don't need all 5 right away.** The app checks for each file when
  it starts, and if one is missing it just stays silent for that scene
  instead of crashing — you'll see a note about it in the browser's
  developer console (a technical log window, safe to ignore if you're not
  debugging).
- **A 6th track is coming later.** The build spec calls for a future
  `scene_06` (a softer closing-elegy track) that will eventually replace
  part of what scene 5 currently covers. When that's ready, it'll get its
  own filename here too — you don't need to do anything about it now.
- **Nothing here gets uploaded anywhere.** This whole app runs in your
  browser; these files are only ever read from your own computer's disk
  when the app is running locally.
