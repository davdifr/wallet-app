type WalletIconArtProps = {
  canvasSize: number;
  borderRadius?: number;
};

const APP_BACKGROUND = "#111626";

export function WalletIconArt({
  canvasSize,
  borderRadius = 0
}: WalletIconArtProps) {
  return (
    <div
      style={{
        alignItems: "center",
        background: APP_BACKGROUND,
        borderRadius,
        color: "#f8fafc",
        display: "flex",
        fontFamily: "system-ui, sans-serif",
        height: "100%",
        justifyContent: "center",
        width: "100%"
      }}
    >
      <span
        style={{
          display: "flex",
          fontSize: Math.round(canvasSize * 0.58),
          fontWeight: 800,
          letterSpacing: `${Math.round(canvasSize * -0.08)}px`,
          lineHeight: 1,
          transform: `translateX(${Math.round(canvasSize * -0.035)}px)`
        }}
      >
        W
      </span>
    </div>
  );
}
