import { ImageResponse } from "next/og";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OgImage() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(135deg, #0d453d, #14725d)",
        color: "#f1f7f4",
      }}
    >
      <div style={{ fontSize: 120 }}>☾</div>
      <div style={{ fontSize: 72, fontWeight: 800 }}>Wird — Daily Companion</div>
      <div style={{ fontSize: 34, opacity: 0.85, marginTop: 12 }}>
        Prayers · Adhkar · Quran — private by design
      </div>
    </div>,
    { ...size },
  );
}
