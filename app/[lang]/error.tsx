"use client";

export default function StoreError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="st-center st-done" style={{ paddingBlock: 40 }}>
      <h1>Un petit souci</h1>
      <p style={{ color: "var(--muted)" }}>La page n’a pas pu se charger. Réessayez dans un instant.</p>
      <h2 lang="ar" dir="rtl">حدثت مشكلة بسيطة</h2>
      <p lang="ar" dir="rtl" style={{ color: "var(--muted)" }}>تعذّر تحميل الصفحة. حاول بعد قليل.</p>
      <button className="st-btn primary" type="button" onClick={reset}>Réessayer · حاول مجدداً</button>
    </div>
  );
}
