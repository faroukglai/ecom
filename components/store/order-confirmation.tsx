"use client";

import { useEffect, useMemo, useSyncExternalStore } from "react";
import Link from "next/link";
import { Icon } from "@/components/icons";
import { track } from "@/lib/analytics";
import { hasPhone, hasWhatsapp, telHref, whatsappHref } from "@/lib/contact";
import { money } from "@/lib/format";
import { fill, getCopy, localePath, type Lang } from "@/lib/store-i18n";

type SavedOrder = { orderNumber: string; total: number; shipping: number; lines: { name: string; quantity: number; unitPrice: number }[] };

const noop = () => () => {};
const read = () => {
  try {
    return localStorage.getItem("darivo-last-order");
  } catch {
    return null;
  }
};

export function OrderConfirmation({ number, lang }: { number: string; lang: Lang }) {
  const t = getCopy(lang);
  const raw = useSyncExternalStore(noop, read, () => null);
  const order = useMemo<SavedOrder | null>(() => {
    if (!raw) return null;
    try {
      const parsed = JSON.parse(raw) as SavedOrder;
      return parsed.orderNumber === number ? parsed : null;
    } catch {
      return null;
    }
  }, [raw, number]);

  // Report the sale once per order, even if the customer refreshes this page.
  useEffect(() => {
    if (!order) return;
    try {
      const key = `darivo-purchase-${order.orderNumber}`;
      if (sessionStorage.getItem(key)) return;
      sessionStorage.setItem(key, "1");
    } catch {
      // Without storage we may report twice on refresh; better than not at all.
    }
    track("Purchase", { value: order.total, currency: "TND", content_type: "product", num_items: order.lines.reduce((sum, line) => sum + line.quantity, 0) });
  }, [order]);

  const message = fill(t.waOrder, { number });
  const contact = (
    <div className="st-actions">
      {hasWhatsapp() ? <a className="st-btn wa" href={whatsappHref(message)} target="_blank" rel="noreferrer"><Icon name="whatsapp" size={20}/> {t.whatsapp}</a> : null}
      {hasPhone() ? <a className="st-btn ghost" href={telHref()}><Icon name="phone" size={20}/> {t.call}</a> : null}
    </div>
  );

  if (!order) {
    return (
      <div className="st-center st-done">
        <div className="st-done-icon"><Icon name="note" size={34}/></div>
        <h1>{t.orderMissing}</h1>
        <p style={{ color: "var(--muted)" }}>{t.orderMissingText}</p>
        <span className="st-order-number st-ltr">{number}</span>
        {contact}
        <Link className="st-btn primary" href={localePath(lang, "/shop")}>{t.keepShopping}</Link>
      </div>
    );
  }

  return (
    <div className="st-center st-done">
      <div className="st-done-icon"><Icon name="checkCircle" size={38}/></div>
      <h1>{t.thanks}</h1>
      <p style={{ color: "var(--muted)" }}>{t.thanksText}</p>
      <div>
        <div style={{ color: "var(--muted)", fontSize: 14, marginBottom: 4 }}>{t.orderNumber}</div>
        <span className="st-order-number st-ltr">{order.orderNumber}</span>
      </div>

      <section className="st-box">
        <h2>{t.nextTitle}</h2>
        <ol className="st-steps">
          <li>{t.next1}</li>
          <li>{t.next2}</li>
          <li>{t.next3}</li>
        </ol>
      </section>

      <section className="st-box">
        <h2>{t.summary}</h2>
        <ul className="st-lines">
          {order.lines.map((line) => (
            <li key={line.name}><span>{line.name} × {line.quantity}</span><span>{money(line.unitPrice * line.quantity, lang)}</span></li>
          ))}
          <li><span>{t.shipping}</span><span>{money(order.shipping, lang)}</span></li>
          <li style={{ fontWeight: 800, borderBlockEnd: 0 }}><span>{t.total}</span><span>{money(order.total, lang)}</span></li>
        </ul>
      </section>

      {contact}
      <Link className="st-btn primary block" href={localePath(lang, "/shop")}>{t.keepShopping}</Link>
    </div>
  );
}
