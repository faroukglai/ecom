import Link from "next/link";

// Last-resort 404 outside the storefront layout, so it carries its own minimal styling.
export default function NotFound() {
  return (
    <main style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: 24, textAlign: "center", fontFamily: "system-ui, sans-serif", background: "#fbfaf6", color: "#14281f" }}>
      <div style={{ display: "grid", gap: 14, maxWidth: 420 }}>
        <h1 style={{ fontSize: 28, margin: 0 }}>Page introuvable</h1>
        <p style={{ margin: 0, color: "#5d6a62" }}>Cette page n’existe pas ou a été déplacée.</p>
        <p lang="ar" dir="rtl" style={{ margin: 0 }}>الصفحة غير موجودة</p>
        <Link href="/" style={{ display: "inline-block", padding: "14px 22px", borderRadius: 14, background: "#143f32", color: "#fff", fontWeight: 700, textDecoration: "none" }}>Accueil · الرئيسية</Link>
      </div>
    </main>
  );
}
