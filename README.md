# Strack — Gatsby Reading Music (proof of concept)

This is a small app that plays mood-matched background music that changes
automatically as you read through *The Great Gatsby* — five hand-picked
scenes, five tracks, smooth fades between them. It runs entirely in your
browser: no server, no account, no data collection. It can also be
"installed" like a real app on a phone, tablet, or desktop.

This README is written as a step-by-step walkthrough for someone who
hasn't done this kind of setup before. A couple of terms come up
repeatedly, defined once here so you don't have to look them up:

- **Terminal** — a text-based window where you type commands instead of
  clicking things. On a Mac it's called "Terminal" (in Applications →
  Utilities); on Windows it's usually "PowerShell" or "Command Prompt".
- **Node.js** — a program that lets JavaScript (the language this app is
  written in) run outside a browser, on your own computer. You need it
  installed to build and run this project.
- **npm** — a tool that comes bundled with Node.js. It downloads the
  pieces of code ("packages") this project depends on, and it runs the
  project's scripts (like "start the app").
- **Dev server** — a temporary local web server that npm starts for you.
  It serves the app at an address like `http://localhost:5173` that only
  your own computer can see — nothing is public or on the internet.

Work through the sections in order the first time. Each one tells you
what to check before moving to the next.

---

## 1. Check whether Node.js is already installed

Open a terminal and run:

```
node --version
```

- **If you see something like `v20.11.0` or `v22.x.x`** — you already
  have it, skip to [step 2](#2-download-the-project-and-install-its-pieces).
- **If you see "command not found" (or similar)** — you need to install
  it first:
  1. Go to [nodejs.org](https://nodejs.org) and download the **LTS**
     version (LTS = "long-term support", the stable recommended one — not
     the "Current" version).
  2. Run the installer, clicking through with the default options.
  3. Close and reopen your terminal, then run `node --version` again to
     confirm it worked.

## 2. Download the project and install its pieces

If you haven't already, get this project onto your computer (clone or
download the repository), then in a terminal, move into the project
folder and run:

```
npm install
```

**What this does:** reads the project's list of dependencies (React, the
EPUB reader library, etc.) and downloads them into a folder called
`node_modules`. This only needs to happen once (or again later if the
dependency list changes). It can take a minute or two — you'll see a
progress bar and then a summary line when it's done.

**How to check it worked:** a `node_modules` folder now exists inside the
project, and the command exits without red "error" text (some yellow
"warn" lines are normal and safe to ignore).

## 3. Start the app

```
npm run dev
```

**What this does:** starts the dev server described above. Leave this
terminal window open and running — closing it (or pressing Ctrl+C in it)
stops the app.

**How to check it worked:** the terminal prints something like:

```
  VITE ready in 250 ms
  ➜  Local:   http://localhost:5173/
```

Open that address in your browser (Chrome, Safari, or Edge all work).
You should see a page titled **"The Great Gatsby"** with a line
underneath reading "Reading with dynamic underscoring — a proof of
concept," and below that a box inviting you to **choose an EPUB file**.
No book text yet, no music yet — that's expected at this stage.

If instead you see a browser error like "This site can't be reached,"
double check the terminal is still running `npm run dev` without errors,
and that you typed the exact address it printed (the port number — the
`5173` part — can occasionally differ).

## 4. Get a copy of the book as an EPUB file

The app needs an EPUB file (a common ebook format) of *The Great Gatsby*.
Since the book is in the public domain in the US, you can get a free,
legal copy from **Project Gutenberg** (gutenberg.org) — search their site
for "The Great Gatsby" and download the **EPUB** version (not the plain
text version). Save it somewhere easy to find, like your Desktop or
Downloads folder — the app never uploads it anywhere, it just reads the
file directly from your computer.

## 5. Load the book and confirm reading position is tracked

Back in the app in your browser, click **"Choose an EPUB file to start
reading"** and select the file you downloaded. You should see the actual
book text appear, styled like a real reading app, with **Prev** / **Next**
buttons at the bottom to turn pages.

Now click the **"Show position"** button near those page-turn buttons.
A thin strip appears showing something like:

```
Current CFI: epubcfi(/6/4[chapter01]!/4/2/1:0)
```

That code (called a **CFI**, "Canonical Fragment Identifier") is epub.js's
way of pointing at an exact spot in the book — like a page number, but
precise down to the character. Turn a page with **Next** and confirm the
CFI value changes. That confirms the reader is correctly reporting your
position as you read — the piece the rest of the app depends on.

## 6. How the app matches your position to a scene

Inside `src/data/scene_manifest.json` is a list of the 5 scenes, each with
a `cfiStart` and `cfiEnd` — the range of positions where that scene's
music should play. Right now those are all set to `null` as placeholders,
which is why no music plays yet even once you have audio files in place
— the app doesn't yet know where each scene begins and ends *for this
specific EPUB file* (different EPUB editions can paginate slightly
differently, so these values have to be captured from the actual file
you're using).

`src/lib/sceneMatcher.js` is the small function that does this matching —
given your current CFI and the manifest, it returns which scene (if any)
you're currently in. It's deliberately simple and self-contained so it's
easy to test on its own, separate from the reading UI or the audio code.

### Filling in the real CFI values

For each of the 5 scenes:

1. Use the chapter/line references in the scene table below (or in the
   original build spec) to navigate to roughly the right spot in the book
   using **Next**/**Prev**.
2. Click **"Show position"** and copy the CFI shown.
3. Open `src/data/scene_manifest.json` in a text editor, find that scene's
   entry, and paste the value into `cfiStart` (replacing `null` — keep the
   quotation marks around it, since it needs to stay a piece of text).
4. Navigate to where the scene ends, copy that CFI, and paste it into
   `cfiEnd` the same way.
5. Save the file. The dev server picks up the change automatically —
   no restart needed.

| # | Scene | Chapter | Approx. source lines |
|---|---|---|---|
| 1 | Opening — Nick's introduction | I | 63–200 |
| 2 | First Gatsby party | III | 1327–1600 |
| 3 | Tea reunion — Gatsby & Daisy | V | 2762–3219 |
| 4 | Plaza Hotel confrontation | VII | 4400–4408+ |
| 5 | Myrtle's death through the end of the book | VII–IX | 4871–6431 |

This is manual, one-time work — repeat for all 5, then move on. It's fine
to do this a few scenes at a time and come back later.

## 7. Add your music files

Music tracks (generated with ElevenLabs Music) go in `public/audio/`.
There's a README inside that folder with the exact filenames the app
expects and how to drop files in correctly — read that before adding
files, it explains a couple of easy-to-miss details (like not creating a
subfolder).

The app works fine with some files missing — it just stays silent for any
scene whose track hasn't been added yet, so you don't need all 5 before
testing.

## 8. Hear it work

With at least one scene's `cfiStart`/`cfiEnd` filled in and its audio file
in place:

1. Refresh the app in your browser and reload your EPUB.
2. You'll see a purple bar at the bottom prompting **"Enable music"** —
   tap it once. (Browsers require one manual tap before letting a page
   play sound — after that first tap, everything else happens
   automatically.)
3. Turn pages until you reach that scene's range. The **now-playing**
   strip at the bottom should show the scene's title and start playing
   its track on a loop.
4. Turn pages into a different scene (once that one's CFIs and audio are
   also set up) and confirm you hear a smooth crossfade rather than an
   abrupt cut.

If you turn a page and nothing changes, the most common cause is a CFI
range that doesn't quite line up — re-check step 6, particularly that
`cfiStart` comes before `cfiEnd` in reading order.

## 9. Install it as an app (PWA)

Once the site is running (either via `npm run dev` for testing, or a
proper deployed URL later):

- **Desktop Chrome/Edge:** look for an install icon (a small monitor with
  a down arrow) in the address bar, or the browser's menu → "Install
  Strack…".
- **iPad Safari:** tap the Share icon → "Add to Home Screen".

This gives it its own icon and a full-screen window without browser
address-bar chrome, like a native app.

Note: installing while running on `localhost` works for testing, but for
a link you can install from another device, the app needs to be hosted
somewhere reachable (e.g. Vercel or Netlify) — deliberately out of scope
for this local proof-of-concept phase.

## 10. If something goes wrong

- **"npm: command not found"** — Node.js isn't installed or your terminal
  needs to be reopened after installing it (see step 1).
- **Blank page / errors in red in the browser** — open the browser's
  developer console (right-click the page → "Inspect" → "Console" tab) to
  see the actual error message, which is usually more specific than "it's
  broken."
- **EPUB won't open** — make sure it's a `.epub` file and not
  DRM-protected (a book bought from a store like Kindle or Apple Books
  usually has DRM and won't open in any non-store reader, including this
  one). Project Gutenberg's files are DRM-free.
- **No sound at all** — check you tapped "Enable music" once, and that
  your device's volume/mute switch isn't the culprit — that trips people
  up more often than the app.

---

## Project structure

```
src/
  components/
    EpubReader.jsx     # loads + renders the EPUB, reports reading position
    NowPlaying.jsx      # bottom bar: scene name, play/pause, mute, volume
  lib/
    sceneMatcher.js      # pure function: CFI position -> matching scene
    audioEngine.js        # Web Audio playback, looping, crossfades
  data/
    scene_manifest.json    # the 5 (soon 6) scenes and their CFI ranges
  App.jsx                    # wires the reader, matcher, and audio engine together
public/
  audio/       # drop your .mp3 tracks here (see README inside)
  books/       # currently unused — book is loaded via the file picker instead
```

## Adding the 6th scene later

The build spec calls for a future closing-elegy track that will eventually
carry the very end of the book, instead of scene 5 stretching all the way
to the last page. When that track is ready:

1. Add a new object to the `scenes` array in `src/data/scene_manifest.json`
   — copy an existing scene's shape, set `"id": "scene_06_..."`,
   `"order": 6`, and its own `cfiStart`/`cfiEnd`/`audioFile`.
2. Shorten scene 5's `cfiEnd` to end where scene 6 now begins.
3. Drop the new track into `public/audio/` under the filename you chose.

No other code changes are needed — the matcher and audio engine both work
off the manifest array generically, regardless of how many scenes are in
it.

## What's deliberately not in this PoC

- No backend, database, sign-in, or analytics of any kind.
- No automatic scene detection — all 5 (soon 6) ranges are placed by hand.
- No saved settings between sessions (volume/mute reset each time you
  reload) — this was an explicit scope decision, not an oversight.
- No streaming-service integration (Spotify/Apple Music) — a possible
  later phase, not part of this proof of concept.
