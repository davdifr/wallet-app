import { ImageResponse } from "next/og";

export const size = {
  width: 512,
  height: 512
};

export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          alignItems: "center",
          background: "linear-gradient(160deg, #020617 0%, #0f172a 100%)",
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
            border: "18px solid rgba(255, 255, 255, 0.16)",
            borderRadius: 128,
            display: "flex",
            gap: 24,
            padding: "56px 64px"
          }}
        >
          <div
            style={{
              alignItems: "center",
              border: "18px solid #ffffff",
              borderRadius: 40,
              display: "flex",
              fontSize: 132,
              fontWeight: 700,
              height: 176,
              justifyContent: "center",
              letterSpacing: "-0.06em",
              width: 176
            }}
          >
            W
          </div>
          <div
            style={{
              display: "flex",
              flexDirection: "column"
            }}
          >
            <span
              style={{
                fontSize: 92,
                fontWeight: 700,
                letterSpacing: "-0.05em",
                lineHeight: 1
              }}
            >
              Wallet
            </span>
            <span
              style={{
                color: "rgba(255, 255, 255, 0.75)",
                fontSize: 46,
                letterSpacing: "0.18em",
                marginTop: 18,
                textTransform: "uppercase"
              }}
            >
              App
            </span>
          </div>
        </div>
      </div>
    ),
    size
  );
}
