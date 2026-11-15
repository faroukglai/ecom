import { Icon } from "@/components/icons";
import { displayWhatsapp, hasWhatsapp, whatsappHref } from "@/lib/contact";
import { getCopy, type Lang } from "@/lib/store-i18n";

/** Round WhatsApp button pinned to the corner of every page. Hidden until a WhatsApp number is set in config/site.ts. */
export function WhatsAppFab({ lang }: { lang: Lang }) {
  if (!hasWhatsapp()) return null;
  const t = getCopy(lang);
  return (
    <a className="st-fab" href={whatsappHref(t.waHello)} target="_blank" rel="noreferrer" aria-label={`${t.whatsapp} ${displayWhatsapp()}`}>
      <Icon name="whatsapp" size={30}/>
      <span className="st-fab-label">
        <small>{t.whatsapp}</small>
        <strong className="st-ltr">{displayWhatsapp()}</strong>
      </span>
    </a>
  );
}
