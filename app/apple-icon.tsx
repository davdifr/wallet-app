import { ImageResponse } from "next/og";

export const size = {
  width: 180,
  height: 180
};

export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          alignItems: "center",
          background: "linear-gradient(160deg, #020617 0%, #0f172a 100%)",
          borderRadius: 44,
          color: "#ffffff",
          display: "flex",
          fontFamily: "system-ui, sans-serif",
          height: "100%",
          justifyContent: "center",
          width: "100%"
        }}
      >
        <div
          style={{
            alignItems: "center",
            border: "8px solid rgba(255, 255, 255, 0.16)",
            borderRadius: 30,
            display: "flex",
            justifyContent: "center",
            padding: 18
          }}
        >
          <div
            style={{
              alignItems: "center",
              border: "8px solid #ffffff",
              borderRadius: 18,
              display: "flex",
              fontSize: 56,
              fontWeight: 700,
              height: 74,
              justifyContent: "center",
              letterSpacing: "-0.06em",
              width: 74
            }}
          >
            W
          </div>
        </div>
      </div>
    ),
    size
  );
}
