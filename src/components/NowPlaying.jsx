/**
 * Small, unobtrusive strip pinned to the bottom of the screen. Shows what
 * scene's music is playing (if any) and basic transport controls. Deliberately
 * plain — this is ambient underscoring, not a media player the reader should
 * be looking at.
 */
export default function NowPlaying({
  sceneTitle,
  isPlaying,
  isMuted,
  volume,
  onTogglePlay,
  onToggleMute,
  onVolumeChange,
}) {
  return (
    <div className="now-playing" role="status" aria-live="polite">
      <div className="now-playing__scene">
        {sceneTitle ? (
          <>
            <span className="now-playing__dot" aria-hidden="true" />
            {sceneTitle}
          </>
        ) : (
          <span className="now-playing__silent">No scene music here</span>
        )}
      </div>

      <div className="now-playing__controls">
        <button
          onClick={onTogglePlay}
          aria-label={isPlaying ? "Pause music" : "Play music"}
          className="now-playing__button"
        >
          {isPlaying ? "⏸" : "▶"}
        </button>

        <button
          onClick={onToggleMute}
          aria-label={isMuted ? "Unmute" : "Mute"}
          className="now-playing__button"
        >
          {isMuted ? "🔇" : "🔊"}
        </button>

        <input
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={volume}
          onChange={(e) => onVolumeChange(Number(e.target.value))}
          aria-label="Volume"
          className="now-playing__volume"
        />
      </div>
    </div>
  );
}
