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

        // Pass real measured pixel numbers rather than "100%" — epub.js's
        // paginated layout needs concrete pixels to compute column widths,
        // and (per testing) its own percentage-height resolution against a
        // flex-grow ancestor unreliably measures 0. The picker overlay
        // above means this container's size doesn't change once we start
        // reading, so this measurement stays valid.
        const { width, height } = viewerRef.current.getBoundingClientRect();

        const rendition = book.renderTo(viewerRef.current, {
          width: Math.floor(width),
          height: Math.floor(height),
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

  // iPad Safari reflows this on rotation — keep epub.js's pagination in
  // sync with the container's actual current size.
  useEffect(() => {
    function handleResize() {
      if (!renditionRef.current || !viewerRef.current) return;
      const { width, height } = viewerRef.current.getBoundingClientRect();
      renditionRef.current.resize(Math.floor(width), Math.floor(height));
    }
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

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
        // Always occupies its final layout space (the picker above is an
        // absolutely-positioned overlay, not a flex sibling competing for
        // room) so the size we measure at renderTo time never changes.
        style={{ visibility: status === "ready" ? "visible" : "hidden" }}
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
