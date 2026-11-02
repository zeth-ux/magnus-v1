import { ImageResponse } from "next/og";

/** The card shown when a Bayu link is shared (WhatsApp, KakaoTalk, Instagram DMs). */
export const alt = "Bayu: books that breeze through. Give and lend English books with readers in Ansan.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// The brand palette (docs/brand.md): spines on the night ground.
const SPINES = [
  { bg: "#c23a1e", h: 300 },
  { bg: "#1f3fb0", h: 360 },
  { bg: "#e2b23a", h: 260 },
  { bg: "#141414", h: 330 },
  { bg: "#f1e9d6", h: 290 },
  { bg: "#d9cdb4", h: 350 },
];

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", background: "#edebe6", color: "#141414", padding: "72px 80px", justifyContent: "space-between", alignItems: "flex-end" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 20, maxWidth: 620, alignSelf: "center" }}>
          <div style={{ fontSize: 120, fontWeight: 400, letterSpacing: -4, color: "#1f3fb0", lineHeight: 1 }}>Bayu</div>
          <div style={{ fontSize: 44, lineHeight: 1.15, color: "#1f3fb0" }}>Books that breeze through.</div>
          <div style={{ fontSize: 30, lineHeight: 1.35, opacity: 0.85 }}>Give and lend English books with readers near you in Ansan.</div>
        </div>
        <div style={{ display: "flex", alignItems: "flex-end", gap: 14 }}>
          {SPINES.map((s, i) => (
            <div key={i} style={{ width: 46, height: s.h, background: s.bg, borderRadius: 2, border: "1px solid rgba(20,20,20,.2)" }} />
          ))}
        </div>
      </div>
    ),
    size,
  );
}
