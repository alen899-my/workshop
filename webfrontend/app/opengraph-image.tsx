// app/opengraph-image.tsx — dynamically generated OG image for the homepage
import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Repairo — #1 Garage Management Software in Kerala";
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
        {/* Teal accent circle */}
        <div
          style={{
            position: "absolute",
            top: -120,
            right: -120,
            width: 480,
            height: 480,
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(13,148,136,0.35) 0%, transparent 70%)",
          }}
        />

        {/* Badge */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            background: "rgba(13,148,136,0.15)",
            border: "1px solid rgba(13,148,136,0.4)",
            borderRadius: 999,
            padding: "6px 18px",
            marginBottom: 28,
          }}
        >
          <div style={{ width: 7, height: 7, borderRadius: "50%", background: "#0d9488" }} />
          <span style={{ color: "#0d9488", fontSize: 13, letterSpacing: "0.25em", textTransform: "uppercase" }}>
            Garage Management
          </span>
        </div>

        {/* Headline */}
        <div
          style={{
            fontSize: 62,
            fontWeight: 900,
            color: "#ffffff",
            lineHeight: 1.1,
            maxWidth: 740,
            marginBottom: 24,
          }}
        >
          India's{" "}
          <span style={{ color: "#0d9488" }}>#1</span>{" "}
          Workshop Management Platform
        </div>

        {/* Subtitle */}
        <div
          style={{
            fontSize: 22,
            color: "rgba(255,255,255,0.55)",
            maxWidth: 620,
            lineHeight: 1.5,
            marginBottom: 40,
          }}
        >
          Job cards · GST invoicing · Inventory · Public garage finder. Built for modern garages in Kerala.
        </div>

        {/* Domain pill */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            background: "rgba(255,255,255,0.06)",
            border: "1px solid rgba(255,255,255,0.12)",
            borderRadius: 12,
            padding: "10px 22px",
          }}
        >
          <span style={{ color: "#0d9488", fontSize: 20, fontWeight: 800 }}>⚙</span>
          <span style={{ color: "rgba(255,255,255,0.7)", fontSize: 18, fontWeight: 700, letterSpacing: "0.05em" }}>
            repairo.in
          </span>
        </div>

        {/* Bottom-right logo text */}
        <div
          style={{
            position: "absolute",
            bottom: 48,
            right: 72,
            fontSize: 28,
            fontWeight: 900,
            color: "#0d9488",
            letterSpacing: "0.1em",
            textTransform: "uppercase",
          }}
        >
          Repairo
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
