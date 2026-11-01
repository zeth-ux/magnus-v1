import { ImageResponse } from "next/og";

/** The card shown when a Bayu link is shared (WhatsApp, KakaoTalk, Instagram DMs). */
export const alt = "Bayu: books that breeze through. Give and lend English books with readers in Ansan.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// The brand palette (docs/brand.md): spines on the night ground.
const SPINES = [
  { bg: "#2f7a4d", h: 300 },
  { bg: "#c9a24a", h: 360 },
  { bg: "#9cc9e3", h: 260 },
  { bg: "#6e1f1f", h: 330 },
  { bg: "#efe9df", h: 290 },
  { bg: "#7a5838", h: 350 },
];

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", background: "#1c1614", color: "#efe9df", padding: "72px 80px", justifyContent: "space-between", alignItems: "flex-end" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 20, maxWidth: 620, alignSelf: "center" }}>
          <div style={{ fontSize: 120, fontWeight: 700, letterSpacing: -4, lineHeight: 1 }}>Bayu</div>
          <div style={{ fontSize: 44, lineHeight: 1.15, color: "#c9a24a" }}>Books that breeze through.</div>
          <div style={{ fontSize: 30, lineHeight: 1.35, opacity: 0.85 }}>Give and lend English books with readers near you in Ansan.</div>
        </div>
        <div style={{ display: "flex", alignItems: "flex-end", gap: 14 }}>
          {SPINES.map((s, i) => (
            <div key={i} style={{ width: 46, height: s.h, background: s.bg, borderTopLeftRadius: 23, borderTopRightRadius: 23 }} />
          ))}
        </div>
      </div>
    ),
    size,
  );
}
