import { Suspense } from "react";
import { Cairo } from "next/font/google";
import { notFound } from "next/navigation";
import { StoreFooter } from "@/components/store/footer";
import { StoreHeader } from "@/components/store/header";
import { MetaPixel } from "@/components/store/pixel";
import { WhatsAppFab } from "@/components/store/whatsapp-fab";
import { LANGS, getCopy, hasLang } from "@/lib/store-i18n";
import "./store.css";

// Not preloaded: French pages never need it, and Arabic pages fetch it on demand with a system-font fallback meanwhile.
const cairo = Cairo({ subsets: ["arabic", "latin"], variable: "--font-cairo", display: "swap", preload: false });

export function generateStaticParams() {
  return LANGS.map((lang) => ({ lang }));
}

type Props = { children: React.ReactNode; params: Promise<{ lang: string }> };

// The language param is read inside the Suspense boundary so Next can serve an instant shell for any URL.
export default function StoreLayout({ children, params }: Props) {
  return (
    <Suspense fallback={<div className={`st-root ${cairo.variable}`}><div className="st-wrap st-main"><div className="st-skel" style={{ height: 320 }}/></div></div>}>
      <LocalizedShell params={params}>{children}</LocalizedShell>
    </Suspense>
  );
}

async function LocalizedShell({ children, params }: Props) {
  const { lang } = await params;
  if (!hasLang(lang)) notFound();
  const t = getCopy(lang);

  return (
    <div className={`st-root ${cairo.variable}`} dir={t.dir} lang={t.htmlLang}>
      <a className="st-skip" href="#main">{t.skip}</a>
      <StoreHeader lang={lang}/>
      <main id="main" className="st-wrap st-main">{children}</main>
      <StoreFooter lang={lang}/>
      <WhatsAppFab lang={lang}/>
      <MetaPixel/>
    </div>
  );
}
