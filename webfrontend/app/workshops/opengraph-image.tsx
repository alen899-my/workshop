// Dynamic OG image for /workshops
import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Find a Workshop Near You — Repairo Garage Finder";
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

        {/* Badge */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, background: "rgba(13,148,136,0.15)", border: "1px solid rgba(13,148,136,0.4)", borderRadius: 999, padding: "6px 18px", marginBottom: 28 }}>
          <div style={{ width: 7, height: 7, borderRadius: "50%", background: "#0d9488" }} />
          <span style={{ color: "#0d9488", fontSize: 13, letterSpacing: "0.25em", textTransform: "uppercase" }}>Workshop Finder</span>
        </div>

        <div style={{ fontSize: 60, fontWeight: 900, color: "#ffffff", lineHeight: 1.1, maxWidth: 760, marginBottom: 24 }}>
          Find a <span style={{ color: "#0d9488" }}>Verified Garage</span> Near You
        </div>

        <div style={{ fontSize: 22, color: "rgba(255,255,255,0.55)", maxWidth: 620, lineHeight: 1.5, marginBottom: 40 }}>
          Search workshops across Kerala &amp; India by city, state or service. Call now or get directions instantly.
        </div>

        {/* Feature pills */}
        <div style={{ display: "flex", gap: 12 }}>
          {["📍 Location Search", "🔧 Service Filter", "📞 Call Now", "🗺 Directions"].map((f) => (
            <div key={f} style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 10, padding: "8px 16px", color: "rgba(255,255,255,0.7)", fontSize: 15 }}>
              {f}
            </div>
          ))}
        </div>

        <div style={{ position: "absolute", bottom: 48, right: 72, fontSize: 26, fontWeight: 900, color: "#0d9488", letterSpacing: "0.1em", textTransform: "uppercase" }}>
          Repairo
        </div>
      </div>
    ),
    { ...size }
  );
}
