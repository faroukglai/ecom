"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Icon } from "@/components/icons";
import { ProductCard, type CardProduct } from "@/components/store/product-card";
import { fill, getCopy, localePath, type Lang } from "@/lib/store-i18n";

type Sort = "new" | "low" | "high";
const DEALS = "deals";
const normalize = (value: string) => value.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();

export function ShopGrid({ products, categories, lang }: { products: CardProduct[]; categories: { slug: string; name: string; count: number }[]; lang: Lang }) {
  const t = getCopy(lang);
  const params = useSearchParams();
  const searchRef = useRef<HTMLInputElement>(null);
  const hasDeals = products.some((product) => product.oldPrice && product.oldPrice > product.price);
  const initial = params.get("category") ?? "";
  const valid = (slug: string) => (slug === DEALS ? hasDeals : categories.some((item) => item.slug === slug));
  const [category, setCategory] = useState(valid(initial) ? initial : "");
  const [query, setQuery] = useState(params.get("q") ?? "");
  const [sort, setSort] = useState<Sort>("new");

  // Tapping the search icon in the header lands here with #search: put the cursor in the box so the customer can type straight away.
  useEffect(() => {
    if (window.location.hash === "#search") searchRef.current?.focus();
  }, []);

  const list = useMemo(() => {
    const term = normalize(query);
    const filtered = products.filter((product) => {
      if (category === DEALS) {
        if (!(product.oldPrice && product.oldPrice > product.price)) return false;
      } else if (category && product.categorySlug !== category) return false;
      return !term || normalize(product.name).includes(term);
    });
    if (sort === "low") return [...filtered].sort((a, b) => a.price - b.price);
    if (sort === "high") return [...filtered].sort((a, b) => b.price - a.price);
    return filtered;
  }, [products, category, query, sort]);

  function choose(slug: string) {
    setCategory(slug);
    const url = new URL(window.location.href);
    if (slug) url.searchParams.set("category", slug);
    else url.searchParams.delete("category");
    window.history.replaceState(null, "", url);
  }

  const showChips = categories.length > 1 || hasDeals;

  return (
    <div>
      <label className="st-search" id="search">
        <Icon name="search" size={22}/>
        <input ref={searchRef} type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder={t.search} aria-label={t.search} autoComplete="off" enterKeyHint="search"/>
      </label>

      {showChips ? (
        <div className="st-chips" role="group" aria-label={t.categories}>
          <button type="button" className="st-chip" aria-pressed={!category} onClick={() => choose("")}>{t.all} <span className="n">{products.length}</span></button>
          {hasDeals ? <button type="button" className="st-chip deals" aria-pressed={category === DEALS} onClick={() => choose(DEALS)}>{t.deals}</button> : null}
          {categories.map((item) => (
            <button key={item.slug} type="button" className="st-chip" aria-pressed={category === item.slug} onClick={() => choose(item.slug)}>{item.name} <span className="n">{item.count}</span></button>
          ))}
        </div>
      ) : null}

      <div className="st-shop-bar">
        <span aria-live="polite">{fill(t.results, { n: list.length })}</span>
        <select className="st-select" value={sort} onChange={(event) => setSort(event.target.value as Sort)} aria-label={t.sortNew}>
          <option value="new">{t.sortNew}</option>
          <option value="low">{t.sortLow}</option>
          <option value="high">{t.sortHigh}</option>
        </select>
      </div>

      {list.length ? (
        <div className="st-grid">
          {list.map((product, index) => <ProductCard key={product.id} product={product} lang={lang} priority={index < 2}/>)}
        </div>
      ) : (
        <div className="st-empty">
          <Icon name="search" size={40}/>
          <h2>{t.emptyTitle}</h2>
          <p>{t.emptyText}</p>
          <button type="button" className="st-btn ghost" onClick={() => { setQuery(""); choose(""); }}>{t.showAll}</button>
          <Link className="st-link" href={localePath(lang, "/")}>{t.home}</Link>
        </div>
      )}
    </div>
  );
}
