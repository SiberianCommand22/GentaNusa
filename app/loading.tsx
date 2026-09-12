export default function Loading() {
  return (
    <div style={{ display: "flex", justifyContent: "center", padding: "80px 20px" }}>
      <div style={{ textAlign: "center" }}>
        <div
          style={{
            width: 40,
            height: 40,
            margin: "0 auto 16px",
            border: "3px solid #e0e0e6",
            borderTopColor: "#c8102e",
            borderRadius: "50%",
            animation: "gn-spin 0.8s linear infinite",
          }}
        />
        <p style={{ color: "#8a8a9a", fontSize: 14 }}>Memuat berita...</p>
        <style>{`@keyframes gn-spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    </div>
  );
}