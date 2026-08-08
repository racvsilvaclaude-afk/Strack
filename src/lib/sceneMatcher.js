import { EpubCFI } from "epubjs";

const cfi = new EpubCFI();

/**
 * Compares two CFIs. Wrapped because EpubCFI.compare throws on null/undefined
 * input (e.g. a scene whose cfiStart/cfiEnd hasn't been captured yet).
 * Returns null when either side is missing, otherwise -1 / 0 / 1 like
 * EpubCFI.compare (negative = a before b).
 */
function compareCfi(a, b) {
  if (!a || !b) return null;
  return cfi.compare(a, b);
}

/**
 * Finds the scene whose [cfiStart, cfiEnd] range contains the given
 * position. Pure function: position + manifest in, scene (or null) out.
 * No side effects, no dependency on the reader or audio engine, so it can
 * be unit tested with plain strings.
 *
 * @param {string} currentCfi - the CFI reported by the reader right now
 * @param {Array} scenes - manifest.scenes array
 * @returns {object|null} the matching scene object, or null if the
 *   position falls outside every defined range (including scenes whose
 *   CFIs haven't been filled in yet).
 */
export function findSceneForCfi(currentCfi, scenes) {
  if (!currentCfi || !Array.isArray(scenes)) return null;

  for (const scene of scenes) {
    const afterStart = compareCfi(scene.cfiStart, currentCfi);
    const beforeEnd = compareCfi(currentCfi, scene.cfiEnd);

    // afterStart === null means cfiStart is missing/unset for this scene.
    if (afterStart === null || beforeEnd === null) continue;

    // scene.cfiStart <= currentCfi <= scene.cfiEnd
    if (afterStart <= 0 && beforeEnd <= 0) {
      return scene;
    }
  }

  return null;
}

export function loadSceneManifest(manifest) {
  return manifest.scenes.slice().sort((a, b) => a.order - b.order);
}
