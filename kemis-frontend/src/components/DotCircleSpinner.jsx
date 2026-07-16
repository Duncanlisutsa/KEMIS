const BRAND_COLOR = "#2563eb";

function DotCircleSpinner({ size = 60, dotSize = 10, color = BRAND_COLOR, label }) {
  const dotCount = 8;
  const radius = size / 2 - dotSize / 2;

  const dots = Array.from({ length: dotCount }, (_, i) => {
    const angle = (360 / dotCount) * i;
    const delay = (1.2 / dotCount) * i;

    return (
      <div
        key={i}
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          width: dotSize,
          height: dotSize,
          borderRadius: "50%",
          background: color,
          transform: `rotate(${angle}deg) translate(${radius}px) translate(-50%, -50%)`,
          animation: "dotCircleFade 1.2s infinite",
          animationDelay: `${delay}s`,
        }}
      />
    );
  });

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "14px",
      }}
    >
      <div
        style={{
          position: "relative",
          width: size,
          height: size,
        }}
      >
        {dots}
      </div>

      {label && (
        <span style={{ color: "#64748b", fontSize: "14px" }}>{label}</span>
      )}
    </div>
  );
}

export default DotCircleSpinner;