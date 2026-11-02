"use client";

/**
 * Last resort, when even the root layout fails: it replaces the whole page, so
 * it brings its own <html> and plain inline styles (no app CSS is guaranteed).
 */
export default function GlobalError({ retry }: { error: unknown; retry: () => void }) {
  return (
    <html lang="en">
      <title>Bayu couldn&apos;t load</title>
      <body style={{ margin: 0, minHeight: "100svh", background: "#edebe6", color: "#141414", fontFamily: "system-ui, sans-serif", display: "flex", flexDirection: "column", justifyContent: "center", gap: 20, padding: 24 }}>
        <h1 style={{ margin: 0, fontFamily: "Georgia, serif", fontWeight: 500, fontSize: "2.4rem" }}>A gust knocked this over.</h1>
        <p style={{ margin: 0, maxWidth: "30rem", lineHeight: 1.6, opacity: 0.8 }}>Bayu couldn&apos;t load just now. Try again in a moment.</p>
        <button type="button" onClick={() => retry()} style={{ alignSelf: "flex-start", border: 0, borderRadius: 2, padding: "12px 24px", background: "#1f3fb0", color: "#ffffff", fontWeight: 600, fontSize: 17 }}>
          Try again
        </button>
      </body>
    </html>
  );
}
