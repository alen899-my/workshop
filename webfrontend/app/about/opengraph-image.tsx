// Dynamic OG image for /about
import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "About Repairo — Garage Management Platform Built for Kerala";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OGImage() {
  return new ImageResponse(
    (
      <div
        style={{
          background: "linear-gradient(135deg, #09090b 0%, #0f172a 60%, #134e4a 100%)",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          justifyContent: "center",
          padding: "64px 72px",
          fontFamily: "monospace",
          position: "relative",
        }}
      >
        <div style={{ position: "absolute", top: -100, right: -100, width: 420, height: 420, borderRadius: "50%", background: "radial-gradient(circle, rgba(13,148,136,0.3) 0%, transparent 70%)" }} />

        <div style={{ display: "flex", alignItems: "center", gap: 8, background: "rgba(13,148,136,0.15)", border: "1px solid rgba(13,148,136,0.4)", borderRadius: 999, padding: "6px 18px", marginBottom: 28 }}>
          <div style={{ width: 7, height: 7, borderRadius: "50%", background: "#0d9488" }} />
          <span style={{ color: "#0d9488", fontSize: 13, letterSpacing: "0.25em", textTransform: "uppercase" }}>Our Story</span>
        </div>

        <div style={{ fontSize: 58, fontWeight: 900, color: "#ffffff", lineHeight: 1.1, maxWidth: 700, marginBottom: 24 }}>
          The Workshop Platform<br />
          <span style={{ color: "#0d9488" }}>Kerala Garages Trust</span>
        </div>

        <div style={{ fontSize: 20, color: "rgba(255,255,255,0.55)", maxWidth: 640, lineHeight: 1.6, marginBottom: 40 }}>
          Built to give every garage — big or small — the same digital tools that enterprise workshops enjoy. From job cards to public discovery.
        </div>

        {/* Kerala origin badge */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 12, padding: "10px 22px" }}>
          <span style={{ fontSize: 20 }}>📍</span>
          <span style={{ color: "rgba(255,255,255,0.7)", fontSize: 18, fontWeight: 700 }}>Kerala, India</span>
          <span style={{ color: "rgba(255,255,255,0.3)", fontSize: 18, margin: "0 4px" }}>·</span>
          <span style={{ color: "rgba(255,255,255,0.5)", fontSize: 16 }}>Garage-First Software</span>
        </div>

        <div style={{ position: "absolute", bottom: 48, right: 72, fontSize: 26, fontWeight: 900, color: "#0d9488", letterSpacing: "0.1em", textTransform: "uppercase" }}>
          Repairo
        </div>
      </div>
    ),
    { ...size }
  );
}
