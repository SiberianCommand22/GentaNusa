// Background premium: mode terang — gradien hangat merah-biru-emas,
// grid geometris, motif kawung & parang (budaya Indonesia), glow lembut.
// Fixed di belakang konten (z -10). Area kiri/atas bersih untuk baca.
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
          "linear-gradient(160deg, #fff 0%, #f8f6f4 30%, #f0eef0 60%, #f5f3f6 100%)",
      }}
    >
      {/* Gradien warna GentaNusa — pojok kanan atas (hangat) */}
      <div
        style={{
          position: "absolute",
          top: "-15%",
          right: "-10%",
          width: "700px",
          height: "500px",
          background:
            "radial-gradient(ellipse at center, rgba(200,16,46,0.10), rgba(29,78,216,0.06) 50%, transparent 70%)",
        }}
      />
      {/* Gradien kedua — pojok kiri bawah (hijau kebumian lembut) */}
      <div
        style={{
          position: "absolute",
          bottom: "-10%",
          left: "-5%",
          width: "600px",
          height: "400px",
          background:
            "radial-gradient(ellipse at center, rgba(200,160,60,0.08), rgba(200,16,46,0.04) 50%, transparent 70%)",
        }}
      />

      {/* Grid geometris halus */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage:
            "linear-gradient(rgba(200,16,46,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(200,16,46,0.05) 1px, transparent 1px)",
          backgroundSize: "96px 96px",
          maskImage:
            "radial-gradient(ellipse 85% 65% at 50% 0%, black, transparent 80%)",
          WebkitMaskImage:
            "radial-gradient(ellipse 85% 65% at 50% 0%, black, transparent 80%)",
        }}
      />

      {/* Jaringan informasi: garis tipis + titik koneksi (kanan bawah) */}
      <svg
        style={{
          position: "absolute",
          right: "-60px",
          bottom: "-80px",
          width: "640px",
          height: "580px",
          opacity: 0.5,
        }}
        viewBox="0 0 640 580"
        fill="none"
      >
        <g stroke="#c8102e" strokeOpacity="0.22" strokeWidth="1">
          <path d="M80 520 L200 420 L320 470 L470 340 L560 420" />
          <path d="M200 420 L180 300" />
          <path d="M320 470 L340 250" />
          <path d="M470 340 L600 180" />
          <path d="M560 420 L600 300" />
        </g>
        <g fill="#c8102e" fillOpacity="0.28">
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

      {/* Motif kawung (budaya Indonesia) — pojok kiri bawah, sangat halus */}
      <svg
        style={{
          position: "absolute",
          left: "-40px",
          bottom: "-40px",
          width: "340px",
          height: "340px",
          opacity: 0.3,
        }}
        viewBox="0 0 340 340"
        fill="none"
      >
        <g fill="none" stroke="#c8102e" strokeOpacity="0.25" strokeWidth="1.2">
          <circle cx="80" cy="80" r="34" />
          <circle cx="152" cy="80" r="34" />
          <circle cx="116" cy="146" r="34" />
          <circle cx="80" cy="212" r="34" />
          <circle cx="152" cy="212" r="34" />
          <circle cx="116" cy="278" r="34" />
        </g>
        <g fill="#c8102e" fillOpacity="0.12">
          <circle cx="80" cy="80" r="8" />
          <circle cx="152" cy="80" r="8" />
          <circle cx="116" cy="146" r="8" />
        </g>
      </svg>

      {/* Motif parang halus (diagonal — budaya Yogyakarta) — pojok kanan atas */}
      <svg
        style={{
          position: "absolute",
          right: "-20px",
          top: "-20px",
          width: "280px",
          height: "280px",
          opacity: 0.18,
        }}
        viewBox="0 0 280 280"
        fill="none"
      >
        <g stroke="#1d4ed8" strokeOpacity="0.4" strokeWidth="1.5">
          <path d="M0 280 L280 0" />
          <path d="M40 280 L280 40" />
          <path d="M80 280 L280 80" />
          <path d="M0 240 L240 0" />
          <path d="M0 200 L200 0" />
        </g>
      </svg>

      {/* Cahaya lembut atas (kedalaman sinematik, warna hangat) */}
      <div
        style={{
          position: "absolute",
          top: "-20%",
          left: "25%",
          width: "700px",
          height: "500px",
          background:
            "radial-gradient(ellipse, rgba(200,16,46,0.07), transparent 65%)",
        }}
      />
      {/* Cahaya kedua — biru lembut (kiri atas) */}
      <div
        style={{
          position: "absolute",
          top: "5%",
          left: "-5%",
          width: "500px",
          height: "400px",
          background:
            "radial-gradient(ellipse, rgba(29,78,216,0.06), transparent 60%)",
        }}
      />
    </div>
  );
}