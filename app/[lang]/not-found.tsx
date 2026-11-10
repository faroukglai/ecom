import Link from "next/link";

// Shown inside the storefront layout. It cannot know the language, so it speaks both.
export default function StoreNotFound() {
  return (
    <div className="st-center st-done" style={{ paddingBlock: 40 }}>
      <h1>Page introuvable</h1>
      <p style={{ color: "var(--muted)" }}>Cette page n’existe pas ou a été déplacée.</p>
      <h2 lang="ar" dir="rtl">الصفحة غير موجودة</h2>
      <div className="st-actions">
        <Link className="st-btn primary" href="/">Retour à l’accueil</Link>
        <Link className="st-btn ghost" href="/ar" lang="ar">العودة إلى الرئيسية</Link>
      </div>
    </div>
  );
}
