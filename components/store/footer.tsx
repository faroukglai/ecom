import Link from "next/link";
import { Icon } from "@/components/icons";
import { site } from "@/config/site";
import { displayPhone, hasPhone, hasWhatsapp, telHref, whatsappHref } from "@/lib/contact";
import { getCopy, localePath, type Lang } from "@/lib/store-i18n";

export function StoreFooter({ lang }: { lang: Lang }) {
  const t = getCopy(lang);
  return (
    <footer className="st-footer">
      <div className="st-wrap st-footer-in">
        <div style={{ display: "grid", gap: 10 }}>
          <strong style={{ fontSize: 18 }}>{site.name}</strong>
          <p>{t.tagline}</p>
          {hasPhone() ? <a className="st-link" href={telHref()}><Icon name="phone" size={18}/> <span className="st-ltr">{displayPhone()}</span></a> : null}
          {hasWhatsapp() ? <a className="st-link" href={whatsappHref()} target="_blank" rel="noreferrer"><Icon name="whatsapp" size={18}/> {t.whatsapp}</a> : null}
        </div>
        <nav className="st-footer-links" aria-label={t.menu}>
          <Link href={localePath(lang, "/shop")}>{t.navShop}</Link>
          <Link href={localePath(lang, "/help")}>{t.navHelp}</Link>
          <Link href={localePath(lang, "/legal")}>{t.legalTitle}</Link>
        </nav>
        <p>{t.footerRights}</p>
      </div>
    </footer>
  );
}
