// Background canvas: terang (default) atau gelap (dark mode)
export function BackgroundCanvas() {
  return (
    <div
      aria-hidden="true"
      className="bg-canvas"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: -10,
        pointerEvents: "none",
        overflow: "hidden",
        background: "linear-gradient(180deg, #fafafa 0%, #f5f5f7 50%, #f0f0f2 100%)",
        transition: "background 0.5s ease",
      }}
    >
      {/* Grid sangat halus (hanya di terang) */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage:
            "linear-gradient(rgba(0,0,0,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.03) 1px, transparent 1px)",
          backgroundSize: "96px 96px",
          opacity: 0.3,
        }}
      />
      {/* Glow merah lembut (kanan atas) */}
      <div
        style={{
          position: "absolute",
          top: "-15%",
          right: "-10%",
          width: "500px",
          height: "400px",
          background:
            "radial-gradient(ellipse at center, rgba(200,16,46,0.06), transparent 65%)",
        }}
      />
      {/* Glow hijau kebumian (kiri bawah) */}
      <div
        style={{
          position: "absolute",
          bottom: "-10%",
          left: "-5%",
          width: "400px",
          height: "350px",
          background:
            "radial-gradient(ellipse at center, rgba(39,91,57,0.05), transparent 60%)",
        }}
      />
    </div>
  );
}