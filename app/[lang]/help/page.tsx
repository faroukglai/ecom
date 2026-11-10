import type { Metadata } from "next";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { Icon } from "@/components/icons";
import { site } from "@/config/site";
import { displayPhone, hasPhone, hasWhatsapp, telHref, whatsappHref } from "@/lib/contact";
import { alternatesFor, ogLocale } from "@/lib/seo";
import { fill, getCopy, hasLang } from "@/lib/store-i18n";

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { lang } = await params;
  if (!hasLang(lang)) return {};
  return { title: getCopy(lang).helpTitle, alternates: alternatesFor(lang, "/help"), openGraph: { locale: ogLocale(lang) } };
}

export default function HelpPage({ params }: { params: Promise<{ lang: string }> }) {
  return (
    <Suspense fallback={<div className="st-skel" style={{ height: 320 }}/>}>
      <Help params={params}/>
    </Suspense>
  );
}

async function Help({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (!hasLang(lang)) notFound();
  const t = getCopy(lang);
  const { policy } = site;

  // Only facts the owner has filled in (config/site.ts) are shown. Nothing here is invented.
  const delivery = [t.helpDeliveryText];
  if (policy.deliveryTime[lang]) delivery.push(fill(t.helpDeliveryTime, { value: policy.deliveryTime[lang] }));
  if (policy.confirmationCall[lang]) delivery.push(fill(t.helpConfirmCall, { value: policy.confirmationCall[lang] }));
  const payment = [t.helpPaymentText];
  if (policy.inspectBeforePay) payment.push(t.helpInspect);
  const returns = [policy.returns[lang] || t.helpReturnsText];

  const sections = [
    { id: "delivery", title: t.helpDelivery, text: delivery },
    { id: "payment", title: t.helpPayment, text: payment },
    { id: "returns", title: t.helpReturns, text: returns },
  ];

  return (
    <div className="st-doc">
      <h1 className="st-page-title" style={{ marginBottom: 0 }}>{t.helpTitle}</h1>
      {sections.map((section) => (
        <section key={section.id} id={section.id} className="st-box">
          <h2>{section.title}</h2>
          {section.text.map((line) => <p key={line}>{line}</p>)}
        </section>
      ))}
      {hasPhone() || hasWhatsapp() ? (
        <section id="contact" className="st-box">
          <h2>{t.helpContact}</h2>
          <p style={{ marginBottom: 14 }}>{t.helpContactText}</p>
          <div className="st-actions">
            {hasWhatsapp() ? <a className="st-btn wa" href={whatsappHref()} target="_blank" rel="noreferrer"><Icon name="whatsapp" size={20}/> {t.whatsapp}</a> : null}
            {hasPhone() ? <a className="st-btn ghost" href={telHref()}><Icon name="phone" size={20}/> <span className="st-ltr">{displayPhone()}</span></a> : null}
          </div>
        </section>
      ) : null}
    </div>
  );
}
