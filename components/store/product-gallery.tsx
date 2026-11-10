"use client";

import { useRef, useState } from "react";
import { Icon } from "@/components/icons";
import { ProductMedia } from "@/components/product-media";
import { fill, getCopy, type Lang } from "@/lib/store-i18n";

export function ProductGallery({ images, alt, lang }: { images: string[]; alt: string; lang: Lang }) {
  const t = getCopy(lang);
  const track = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);
  const list = images.slice(0, 8);

  function go(next: number) {
    const el = track.current;
    if (!el) return;
    const target = Math.max(0, Math.min(list.length - 1, next));
    const rtl = getComputedStyle(el).direction === "rtl";
    el.scrollTo({ left: (rtl ? -1 : 1) * target * el.clientWidth, behavior: "smooth" });
    setIndex(target);
  }

  return (
    <div className="st-gallery">
      <div
        className="st-gallery-track"
        ref={track}
        onScroll={(event) => {
          const el = event.currentTarget;
          if (!el.clientWidth) return;
          const next = Math.round(Math.abs(el.scrollLeft) / el.clientWidth);
          if (next !== index) setIndex(Math.max(0, Math.min(list.length - 1, next)));
        }}
      >
        {list.map((src, position) => (
          <div className="st-gallery-slide" key={`${src}-${position}`}>
            <ProductMedia src={src} alt={position === 0 ? alt : ""} fill sizes="(max-width: 1000px) 100vw, 560px" objectFit="contain" priority={position === 0}/>
          </div>
        ))}
      </div>
      {list.length > 1 ? (
        <>
          <button type="button" className="st-gallery-nav prev" onClick={() => go(index - 1)} aria-label={t.prevPhoto} disabled={index === 0}><Icon name="arrowLeft" size={20} className="st-flip"/></button>
          <button type="button" className="st-gallery-nav next" onClick={() => go(index + 1)} aria-label={t.nextPhoto} disabled={index === list.length - 1}><Icon name="arrowRight" size={20} className="st-flip"/></button>
          <div className="st-dots">
            {list.map((_, position) => <button key={position} type="button" aria-label={fill(t.photo, { n: position + 1 })} aria-current={index === position} onClick={() => go(position)}/>)}
          </div>
          <div className="st-thumbs">
            {list.map((src, position) => (
              <button key={`${src}-${position}`} type="button" className="st-thumb" aria-label={fill(t.photo, { n: position + 1 })} aria-current={index === position} onClick={() => go(position)}>
                <ProductMedia src={src} alt="" fill sizes="72px"/>
              </button>
            ))}
          </div>
        </>
      ) : null}
    </div>
  );
}
