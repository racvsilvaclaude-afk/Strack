import { useCallback, useEffect, useRef, useState } from "react";
import ePub from "epubjs";

/**
 * Loads a local EPUB file (chosen via the browser's native file picker —
 * the file never leaves the device, nothing is uploaded) and renders it
 * with epub.js. Reports the current reading position (an epub.js "CFI",
 * a string that points at an exact spot in the book) to the parent every
 * time the reader moves, via onLocationChange.
 */
export default function EpubReader({ onLocationChange, onBookLoaded }) {
  const viewerRef = useRef(null);
  const bookRef = useRef(null);
  const renditionRef = useRef(null);

  const [status, setStatus] = useState("idle"); // idle | loading | ready | error
  const [errorMessage, setErrorMessage] = useState("");
  const [currentCfi, setCurrentCfi] = useState(null);
  const [showDebug, setShowDebug] = useState(false);

  useEffect(() => {
    return () => {
      renditionRef.current?.destroy();
      bookRef.current?.destroy();
    };
  }, []);

  const handleFileChange = useCallback(
    async (event) => {
      const file = event.target.files?.[0];
      if (!file) return;

      setStatus("loading");
      setErrorMessage("");

      try {
        const arrayBuffer = await file.arrayBuffer();

        renditionRef.current?.destroy();
        bookRef.current?.destroy();

        const book = ePub(arrayBuffer);
        bookRef.current = book;
        await book.ready;

        const rendition = book.renderTo(viewerRef.current, {
          width: "100%",
          height: "100%",
          flow: "paginated",
          spread: "auto",
        });
        renditionRef.current = rendition;

        rendition.on("relocated", (location) => {
          const cfi = location?.start?.cfi ?? null;
          setCurrentCfi(cfi);
          onLocationChange?.(cfi);
        });

        await rendition.display();

        const metadata = await book.loaded.metadata;
        onBookLoaded?.(metadata);
        setStatus("ready");
      } catch (err) {
        console.error("[EpubReader] failed to load EPUB", err);
        setErrorMessage(
          "Couldn't open that file. Make sure it's a DRM-free .epub file."
        );
        setStatus("error");
      }
    },
    [onLocationChange, onBookLoaded]
  );

  const goPrev = () => renditionRef.current?.prev();
  const goNext = () => renditionRef.current?.next();

  return (
    <div className="epub-reader">
      {status !== "ready" && (
        <div className="epub-reader__picker">
          <label className="epub-reader__picker-label">
            <input
              type="file"
              accept=".epub,application/epub+zip"
              onChange={handleFileChange}
            />
            <span>Choose an EPUB file to start reading</span>
          </label>
          {status === "loading" && <p>Opening book…</p>}
          {status === "error" && (
            <p className="epub-reader__error">{errorMessage}</p>
          )}
        </div>
      )}

      <div
        className="epub-reader__viewer"
        ref={viewerRef}
        style={{ display: status === "ready" ? "block" : "none" }}
      />

      {status === "ready" && (
        <div className="epub-reader__nav">
          <button onClick={goPrev} aria-label="Previous page">
            ‹ Prev
          </button>
          <button
            className="epub-reader__debug-toggle"
            onClick={() => setShowDebug((v) => !v)}
          >
            {showDebug ? "Hide position" : "Show position"}
          </button>
          <button onClick={goNext} aria-label="Next page">
            Next ›
          </button>
        </div>
      )}

      {showDebug && (
        <div className="epub-reader__debug">
          <strong>Current CFI:</strong>{" "}
          <code>{currentCfi ?? "(none yet — turn a page)"}</code>
        </div>
      )}
    </div>
  );
}
