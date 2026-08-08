import { useCallback, useEffect, useRef, useState } from "react";
import EpubReader from "./components/EpubReader.jsx";
import NowPlaying from "./components/NowPlaying.jsx";
import { AudioEngine } from "./lib/audioEngine.js";
import { findSceneForCfi, loadSceneManifest } from "./lib/sceneMatcher.js";
import manifest from "./data/scene_manifest.json";
import "./App.css";

const scenes = loadSceneManifest(manifest);

function App() {
  const audioEngineRef = useRef(null);
  if (!audioEngineRef.current) {
    audioEngineRef.current = new AudioEngine();
  }

  const [audioEnabled, setAudioEnabled] = useState(false);
  const [activeScene, setActiveScene] = useState(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(0.8);

  // Decode the audio files as soon as the app mounts — this doesn't need a
  // user gesture, only *starting playback* does (handled by "Enable music").
  useEffect(() => {
    audioEngineRef.current.loadScenes(scenes);
  }, []);

  const handleLocationChange = useCallback(
    (cfi) => {
      const scene = findSceneForCfi(cfi, scenes);
      setActiveScene(scene);

      if (!audioEnabled) return;
      if (isPlaying) {
        audioEngineRef.current.crossfadeTo(scene);
      }
    },
    [audioEnabled, isPlaying]
  );

  const enableAudio = () => {
    audioEngineRef.current.enable();
    setAudioEnabled(true);
    if (activeScene) {
      audioEngineRef.current.crossfadeTo(activeScene);
    }
  };

  const togglePlay = () => {
    setIsPlaying((prev) => {
      const next = !prev;
      audioEngineRef.current.crossfadeTo(next ? activeScene : null, 1);
      return next;
    });
  };

  const toggleMute = () => {
    setIsMuted((prev) => {
      const next = !prev;
      audioEngineRef.current.setMuted(next);
      return next;
    });
  };

  const handleVolumeChange = (value) => {
    setVolume(value);
    audioEngineRef.current.setVolume(value);
  };

  return (
    <div className="app">
      <div className="app__intro">
        <h1>The Great Gatsby</h1>
        <p>Reading with dynamic underscoring — a proof of concept.</p>
      </div>

      <EpubReader onLocationChange={handleLocationChange} />

      {!audioEnabled && (
        <div className="app__enable-audio">
          <span>Tap to enable the scene music (required once by your browser)</span>
          <button onClick={enableAudio}>Enable music</button>
        </div>
      )}

      <NowPlaying
        sceneTitle={activeScene?.title ?? null}
        isPlaying={isPlaying}
        isMuted={isMuted}
        volume={volume}
        onTogglePlay={togglePlay}
        onToggleMute={toggleMute}
        onVolumeChange={handleVolumeChange}
      />
    </div>
  );
}

export default App;
