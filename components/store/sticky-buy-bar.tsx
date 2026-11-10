"use client";

import { useEffect, useState } from "react";
import { Icon } from "@/components/icons";
import { site } from "@/config/site";
import { money } from "@/lib/format";
import { getCopy, type Lang } from "@/lib/store-i18n";

/** Phone-only bar pinned to the bottom. It disappears while the order form is on screen. */
export function StickyBuyBar({ price, lang }: { price: number; lang: Lang }) {
  const t = getCopy(lang);
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    const form = document.getElementById("order-form");
    if (!form) return;
    const observer = new IntersectionObserver(([entry]) => setHidden(Boolean(entry?.isIntersecting)), { threshold: 0.05 });
    observer.observe(form);
    return () => observer.disconnect();
  }, []);

  return (
    <div className="st-sticky" data-hidden={hidden} aria-hidden={hidden}>
      <div className="st-sticky-in st-wrap">
        <div className="st-sticky-price">
          <strong>{money(price + site.shipping, lang)}</strong>
          <small>{t.stickyTotal}</small>
        </div>
        <a className="st-btn primary" href="#order-form" tabIndex={hidden ? -1 : 0}>{t.orderNow} <Icon name="arrowRight" size={18} className="st-flip"/></a>
      </div>
    </div>
  );
}
