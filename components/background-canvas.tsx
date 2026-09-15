// Background premium: dark charcoal/navy, grid halus, network lines, motif
// batik abstrak (sudut), glow atmosferik. Fixed di belakang konten (z -10).
// Tidak menggangu: pointer-events none, opacity rendah, area kiri/atas bersih.
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
        background:
          "radial-gradient(1200px 800px at 85% -10%, rgba(29,78,216,0.14), transparent 60%), radial-gradient(900px 700px at -10% 110%, rgba(200,16,46,0.10), transparent 55%), linear-gradient(160deg, #0c0e16 0%, #10131f 45%, #0b1220 100%)",
      }}
    >
      {/* Grid geometris halus */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)",
          backgroundSize: "72px 72px",
          maskImage:
            "radial-gradient(ellipse 90% 70% at 50% 0%, black, transparent 75%)",
          WebkitMaskImage:
            "radial-gradient(ellipse 90% 70% at 50% 0%, black, transparent 75%)",
        }}
      />
      {/* Jaringan informasi: garis tipis + titik koneksi (kanan bawah) */}
      <svg
        style={{
          position: "absolute",
          right: "-60px",
          bottom: "-60px",
          width: "640px",
          height: "580px",
          opacity: 0.65,
        }}
        viewBox="0 0 640 580"
        fill="none"
      >
        <g stroke="#ffffff" strokeOpacity="0.26" strokeWidth="1">
          <path d="M80 520 L200 420 L320 470 L470 340 L560 420" />
          <path d="M200 420 L180 300" />
          <path d="M320 470 L340 250" />
          <path d="M470 340 L600 180" />
          <path d="M560 420 L600 300" />
        </g>
        <g fill="#ffffff" fillOpacity="0.3">
          <circle cx="80" cy="520" r="3" />
          <circle cx="200" cy="420" r="4" />
          <circle cx="320" cy="470" r="3" />
          <circle cx="470" cy="340" r="4" />
          <circle cx="560" cy="420" r="3" />
          <circle cx="180" cy="300" r="3" />
          <circle cx="340" cy="250" r="3" />
          <circle cx="600" cy="180" r="4" />
          <circle cx="600" cy="300" r="3" />
        </g>
      </svg>
      {/* Motif kawung abstrak (budaya Indonesia) — pojok kiri bawah, sangat halus */}
      <svg
        style={{
          position: "absolute",
          left: "-40px",
          bottom: "-40px",
          width: "340px",
          height: "340px",
          opacity: 0.32,
        }}
        viewBox="0 0 340 340"
        fill="none"
      >
        <g fill="none" stroke="#ffffff" strokeOpacity="0.28" strokeWidth="1.2">
          <circle cx="80" cy="80" r="34" />
          <circle cx="152" cy="80" r="34" />
          <circle cx="116" cy="146" r="34" />
          <circle cx="80" cy="212" r="34" />
          <circle cx="152" cy="212" r="34" />
          <circle cx="116" cy="278" r="34" />
        </g>
        <g fill="#ffffff" fillOpacity="0.12">
          <circle cx="80" cy="80" r="8" />
          <circle cx="152" cy="80" r="8" />
          <circle cx="116" cy="146" r="8" />
        </g>
      </svg>
      {/* Cahaya lembut atas (kedalaman sinematik) */}
      <div
        style={{
          position: "absolute",
          top: "-20%",
          left: "30%",
          width: "700px",
          height: "500px",
          background:
            "radial-gradient(ellipse, rgba(120,140,220,0.10), transparent 65%)",
        }}
      />
    </div>
  );
}