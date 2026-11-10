import Link from "next/link";
import { Suspense } from "react";
import { BrandLogo } from "@/components/brand-logo";
import { Icon } from "@/components/icons";
import { LangSwitch } from "@/components/store/lang-switch";
import { site } from "@/config/site";
import { hasPhone, hasWhatsapp, telHref, whatsappHref } from "@/lib/contact";
import { getCopy, localePath, type Lang } from "@/lib/store-i18n";

export function StoreHeader({ lang }: { lang: Lang }) {
  const t = getCopy(lang);
  return (
    <header className="st-header">
      <div className="st-wrap st-header-in">
        <Link className="st-brand" href={localePath(lang, "/")} aria-label={`${site.name} — ${t.home}`}>
          <BrandLogo size={40} priority/>
          <span>{site.name}</span>
        </Link>
        <nav className="st-nav" aria-label={t.menu}>
          <Link href={localePath(lang, "/shop")}>{t.navShop}</Link>
          <Link href={localePath(lang, "/help")}>{t.navHelp}</Link>
        </nav>
        <div className="st-header-actions">
          <Link className="st-icon-btn" href={`${localePath(lang, "/shop")}#search`} aria-label={t.search}><Icon name="search" size={22}/></Link>
          {hasWhatsapp() ? (
            <a className="st-icon-btn" href={whatsappHref()} target="_blank" rel="noreferrer" aria-label={t.whatsapp}><Icon name="whatsapp" size={22}/></a>
          ) : hasPhone() ? (
            <a className="st-icon-btn" href={telHref()} aria-label={t.call}><Icon name="phone" size={22}/></a>
          ) : null}
          <Suspense fallback={<Link className="st-lang" href={localePath(lang === "fr" ? "ar" : "fr", "/")} lang={lang === "fr" ? "ar" : "fr"}>{t.switchTo}</Link>}>
            <LangSwitch lang={lang} label={t.switchTo}/>
          </Suspense>
        </div>
      </div>
    </header>
  );
}
