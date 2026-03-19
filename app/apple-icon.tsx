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
          background: "#ffffff",
          borderRadius: 44,
          color: "#111111",
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
            border: "8px solid #d4d4d8",
            borderRadius: 30,
            display: "flex",
            justifyContent: "center",
            padding: 18
          }}
        >
          <div
            style={{
              alignItems: "center",
              border: "8px solid #111111",
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
