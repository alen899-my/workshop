// Dynamic OG image for /pricing
import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Repairo Pricing — ₹2,999/month, Everything Included";
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
          <span style={{ color: "#0d9488", fontSize: 13, letterSpacing: "0.25em", textTransform: "uppercase" }}>Simple Pricing</span>
        </div>

        <div style={{ fontSize: 56, fontWeight: 900, color: "#ffffff", lineHeight: 1.1, maxWidth: 700, marginBottom: 16 }}>
          One Price. <span style={{ color: "#0d9488" }}>Everything Included.</span>
        </div>

        {/* Price display */}
        <div style={{ display: "flex", alignItems: "flex-end", gap: 12, marginBottom: 24 }}>
          <span style={{ fontSize: 80, fontWeight: 900, color: "#0d9488" }}>₹2,999</span>
          <span style={{ fontSize: 24, color: "rgba(255,255,255,0.5)", marginBottom: 14 }}>/month · ≈ $36 USD</span>
        </div>

        <div style={{ fontSize: 20, color: "rgba(255,255,255,0.55)", maxWidth: 600, lineHeight: 1.5, marginBottom: 36 }}>
          Job cards · GST invoicing · Inventory · Public garage finder · Unlimited staff. No tiers, no lock-in.
        </div>

        {/* Custom plan note */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 12, padding: "12px 24px" }}>
          <span style={{ color: "rgba(255,255,255,0.5)", fontSize: 16 }}>Custom build from</span>
          <span style={{ color: "#ffffff", fontSize: 18, fontWeight: 800 }}>₹20,000 one-time</span>
          <span style={{ color: "rgba(255,255,255,0.4)", fontSize: 16 }}>≈ $240 USD</span>
        </div>

        <div style={{ position: "absolute", bottom: 48, right: 72, fontSize: 26, fontWeight: 900, color: "#0d9488", letterSpacing: "0.1em", textTransform: "uppercase" }}>
          Repairo
        </div>
      </div>
    ),
    { ...size }
  );
}
