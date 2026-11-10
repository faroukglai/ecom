import type { Metadata } from "next";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { site } from "@/config/site";
import { alternatesFor, ogLocale } from "@/lib/seo";
import { getCopy, hasLang } from "@/lib/store-i18n";

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { lang } = await params;
  if (!hasLang(lang)) return {};
  return { title: getCopy(lang).legalTitle, alternates: alternatesFor(lang, "/legal"), openGraph: { locale: ogLocale(lang) } };
}

export default function LegalPage({ params }: { params: Promise<{ lang: string }> }) {
  return (
    <Suspense fallback={<div className="st-skel" style={{ height: 320 }}/>}>
      <Legal params={params}/>
    </Suspense>
  );
}

async function Legal({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (!hasLang(lang)) notFound();
  const t = getCopy(lang);
  const { business } = site;
  const lines = [business.name, business.address, business.taxId].filter(Boolean);
  return (
    <div className="st-doc">
      <h1 className="st-page-title" style={{ marginBottom: 0 }}>{t.legalTitle}</h1>
      <section className="st-box"><h2>{t.terms}</h2><p>{t.termsText}</p></section>
      <section className="st-box"><h2>{t.privacy}</h2><p>{t.privacyText}</p></section>
      {lines.length ? (
        <section className="st-box">
          <h2>{t.legalBusiness}</h2>
          {lines.map((line) => <p key={line}>{line}</p>)}
        </section>
      ) : null}
    </div>
  );
}
