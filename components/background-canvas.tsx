// Background canvas: terang (siluet Indonesia) + gelap (sunset city dari referensi)
export function BackgroundCanvas() {
  return (
    <div aria-hidden="true" className="bg-canvas" style={{ position: "fixed", inset: 0, zIndex: -10, pointerEvents: "none", overflow: "hidden", background: "transparent" }}>
      {/* ===== MODE TERANG: siluet Indonesia ===== */}
      <div style={{ position: "absolute", inset: 0, backgroundImage: "linear-gradient(rgba(0,0,0,0.035) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.035) 1px, transparent 1px)", backgroundSize: "72px 72px" }} />
      <svg style={{ position: "absolute", bottom: 0, left: 0, width: "100%", height: "220px", opacity: 0.12 }} viewBox="0 0 1200 220" fill="none" preserveAspectRatio="none">
        <path d="M0 220 L0 160 L80 140 L120 100 L160 120 L200 80 L250 60 L300 90 L350 50 L400 70 L450 40 L500 80 L550 60 L600 100 L650 50 L700 70 L750 90 L800 40 L850 60 L900 100 L950 70 L1000 110 L1050 80 L1100 120 L1150 90 L1200 130 L1200 220 Z" fill="#1a1a2e" />
        <path d="M0 220 L0 180 L60 170 L140 150 L220 165 L300 140 L380 155 L460 135 L540 150 L620 140 L700 155 L780 135 L860 150 L940 140 L1020 155 L1100 145 L1200 160 L1200 220 Z" fill="#1a1a2e" opacity="0.5" />
      </svg>
      <svg style={{ position: "absolute", bottom: "30px", left: "50%", transform: "translateX(-50%)", width: "500px", height: "120px", opacity: 0.04 }} viewBox="0 0 500 120" fill="none">
        <path d="M20 60 Q60 40 100 50 Q140 30 180 40 Q220 20 260 35 Q300 25 340 40 Q380 30 420 45 Q460 35 480 50 Q490 70 470 80 Q430 90 390 85 Q350 100 310 90 Q270 105 230 95 Q190 110 150 100 Q110 110 70 100 Q30 90 20 60 Z" fill="#1a1a2e" />
      </svg>
      <svg style={{ position: "absolute", right: "-30px", top: "-30px", width: "300px", height: "300px", opacity: 0.04 }} viewBox="0 0 300 300" fill="none">
        <g stroke="#1a1a2e" strokeWidth="0.8"><circle cx="60" cy="60" r="28" /><circle cx="120" cy="60" r="28" /><circle cx="90" cy="110" r="28" /><circle cx="60" cy="160" r="28" /><circle cx="120" cy="160" r="28" /><circle cx="90" cy="210" r="28" /></g>
      </svg>
      <div style={{ position: "absolute", top: "-10%", right: "-5%", width: "500px", height: "400px", background: "radial-gradient(ellipse, rgba(200,16,46,0.02), transparent 65%)" }} />

      {/* ===== MODE GELAP: sunset city (dari image referensi) ===== */}
      <div className="bg-dark">
        {/* Langit sore biru tua */}
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, #1a1a2e 0%, #3d2e4a 45%, #2a1f3a 70%, #1a1a2e 100%)" }} />
        {/* City silhouette at bottom */}
        <svg style={{ position: "absolute", bottom: 0, left: 0, width: "100%", height: "35%", opacity: 0.6 }} viewBox="0 0 1920 300" preserveAspectRatio="none" fill="none">
          <rect x="0" y="180" width="60" height="120" fill="#0d0d1a" />
          <rect x="70" y="140" width="45" height="160" fill="#0d0d1a" />
          <rect x="130" y="160" width="80" height="140" fill="#0d0d1a" />
          <rect x="220" y="120" width="55" height="180" fill="#0d0d1a" />
          <rect x="290" y="170" width="70" height="130" fill="#0d0d1a" />
          <rect x="370" y="100" width="40" height="200" fill="#0d0d1a" />
          <rect x="420" y="150" width="90" height="150" fill="#0d0d1a" />
          <rect x="520" y="130" width="65" height="170" fill="#0d0d1a" />
          <rect x="600" y="160" width="50" height="140" fill="#0d0d1a" />
          <rect x="660" y="90" width="35" height="210" fill="#0d0d1a" />
          <rect x="710" y="140" width="85" height="160" fill="#0d0d1a" />
          <rect x="810" y="110" width="55" height="190" fill="#0d0d1a" />
          <rect x="880" y="170" width="70" height="130" fill="#0d0d1a" />
          <rect x="960" y="130" width="60" height="170" fill="#0d0d1a" />
          <rect x="1030" y="150" width="80" height="150" fill="#0d0d1a" />
          <rect x="1120" y="100" width="45" height="200" fill="#0d0d1a" />
          <rect x="1180" y="160" width="75" height="140" fill="#0d0d1a" />
          <rect x="1270" y="120" width="50" height="180" fill="#0d0d1a" />
          <rect x="1330" y="140" width="90" height="160" fill="#0d0d1a" />
          <rect x="1430" y="170" width="60" height="130" fill="#0d0d1a" />
          <rect x="1500" y="110" width="40" height="190" fill="#0d0d1a" />
          <rect x="1550" y="150" width="80" height="150" fill="#0d0d1a" />
          <rect x="1640" y="130" width="65" height="170" fill="#0d0d1a" />
          <rect x="1720" y="160" width="50" height="140" fill="#0d0d1a" />
          <rect x="1780" y="100" width="80" height="200" fill="#0d0d1a" />
          <rect x="1870" y="140" width="50" height="160" fill="#0d0d1a" />
        </svg>
        {/* Warm city lights (scattered amber/orange dots) */}
        <div style={{ position: "absolute", bottom: "12%", left: "5%", width: "4px", height: "4px", background: "#f5c842", borderRadius: "50%", opacity: 0.7, boxShadow: "0 0 6px #f5c842" }} />
        <div style={{ position: "absolute", bottom: "8%", left: "12%", width: "3px", height: "3px", background: "#d4a574", borderRadius: "50%", opacity: 0.6, boxShadow: "0 0 5px #d4a574" }} />
        <div style={{ position: "absolute", bottom: "15%", left: "18%", width: "4px", height: "4px", background: "#f5c842", borderRadius: "50%", opacity: 0.7, boxShadow: "0 0 6px #f5c842" }} />
        <div style={{ position: "absolute", bottom: "6%", left: "25%", width: "3px", height: "3px", background: "#d4a574", borderRadius: "50%", opacity: 0.6, boxShadow: "0 0 5px #d4a574" }} />
        <div style={{ position: "absolute", bottom: "11%", left: "35%", width: "4px", height: "4px", background: "#f5c842", borderRadius: "50%", opacity: 0.7, boxShadow: "0 0 6px #f5c842" }} />
        <div style={{ position: "absolute", bottom: "9%", left: "42%", width: "3px", height: "3px", background: "#d4a574", borderRadius: "50%", opacity: 0.6, boxShadow: "0 0 5px #d4a574" }} />
        <div style={{ position: "absolute", bottom: "14%", left: "50%", width: "4px", height: "4px", background: "#f5c842", borderRadius: "50%", opacity: 0.7, boxShadow: "0 0 6px #f5c842" }} />
        <div style={{ position: "absolute", bottom: "7%", left: "58%", width: "3px", height: "3px", background: "#d4a574", borderRadius: "50%", opacity: 0.6, boxShadow: "0 0 5px #d4a574" }} />
        <div style={{ position: "absolute", bottom: "13%", left: "65%", width: "4px", height: "4px", background: "#f5c842", borderRadius: "50%", opacity: 0.7, boxShadow: "0 0 6px #f5c842" }} />
        <div style={{ position: "absolute", bottom: "5%", left: "72%", width: "3px", height: "3px", background: "#d4a574", borderRadius: "50%", opacity: 0.6, boxShadow: "0 0 5px #d4a574" }} />
        <div style={{ position: "absolute", bottom: "10%", left: "80%", width: "4px", height: "4px", background: "#f5c842", borderRadius: "50%", opacity: 0.7, boxShadow: "0 0 6px #f5c842" }} />
        <div style={{ position: "absolute", bottom: "8%", left: "88%", width: "3px", height: "3px", background: "#d4a574", borderRadius: "50%", opacity: 0.6, boxShadow: "0 0 5px #d4a574" }} />
        <div style={{ position: "absolute", bottom: "12%", left: "95%", width: "4px", height: "4px", background: "#f5c842", borderRadius: "50%", opacity: 0.7, boxShadow: "0 0 6px #f5c842" }} />
        {/* Additional warm lights in mid-range */}
        <div style={{ position: "absolute", bottom: "20%", left: "8%", width: "2px", height: "2px", background: "#f5c842", borderRadius: "50%", opacity: 0.5, boxShadow: "0 0 4px #f5c842" }} />
        <div style={{ position: "absolute", bottom: "18%", left: "30%", width: "2px", height: "2px", background: "#d4a574", borderRadius: "50%", opacity: 0.5, boxShadow: "0 0 4px #d4a574" }} />
        <div style={{ position: "absolute", bottom: "22%", left: "45%", width: "2px", height: "2px", background: "#f5c842", borderRadius: "50%", opacity: 0.5, boxShadow: "0 0 4px #f5c842" }} />
        <div style={{ position: "absolute", bottom: "16%", left: "60%", width: "2px", height: "2px", background: "#d4a574", borderRadius: "50%", opacity: 0.5, boxShadow: "0 0 4px #d4a574" }} />
        <div style={{ position: "absolute", bottom: "19%", left: "78%", width: "2px", height: "2px", background: "#f5c842", borderRadius: "50%", opacity: 0.5, boxShadow: "0 0 4px #f5c842" }} />
        <div style={{ position: "absolute", bottom: "21%", left: "92%", width: "2px", height: "2px", background: "#d4a574", borderRadius: "50%", opacity: 0.5, boxShadow: "0 0 4px #d4a574" }} />
        {/* Horizon warm glow */}
        <div style={{ position: "absolute", bottom: "0", left: 0, width: "100%", height: "25%", background: "linear-gradient(0deg, rgba(212,165,116,0.08) 0%, transparent 100%)" }} />
        {/* Warm glow upper right */}
        <div style={{ position: "absolute", top: "10%", right: "10%", width: "400px", height: "300px", background: "radial-gradient(ellipse, rgba(245,200,66,0.04), transparent 65%)" }} />
      </div>
    </div>
  );
}