import type { Metadata } from "next";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { ShopGrid } from "@/components/store/shop-grid";
import { site } from "@/config/site";
import { getStoreCatalog } from "@/lib/catalog";
import { alternatesFor, ogLocale } from "@/lib/seo";
import { categoryName, productText } from "@/lib/store-content";
import { getCopy, hasLang, type Lang } from "@/lib/store-i18n";

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { lang } = await params;
  if (!hasLang(lang)) return {};
  return { title: getCopy(lang).shopTitle, description: `${site.name} — ${getCopy(lang).trustCod}`, alternates: alternatesFor(lang, "/shop"), openGraph: { locale: ogLocale(lang) } };
}

export default function ShopPage({ params }: { params: Promise<{ lang: string }> }) {
  return (
    <Suspense fallback={<div className="st-skel" style={{ height: 320 }}/>}>
      <ShopLoader params={params}/>
    </Suspense>
  );
}

async function ShopLoader({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (!hasLang(lang)) notFound();
  return <Shop lang={lang}/>;
}

async function Shop({ lang }: { lang: Lang }) {
  const t = getCopy(lang);
  const { products, categories } = await getStoreCatalog();
  const cards = products.map((product) => ({
    id: product.id,
    slug: product.slug,
    name: productText(product, lang).name,
    image: product.image,
    price: product.price,
    oldPrice: product.oldPrice,
    isNew: product.isNew,
    categorySlug: product.categorySlug,
  }));
  // Only categories that have products, with how many.
  const chips = categories
    .map((category) => ({ slug: category.slug, name: categoryName(category, lang), count: products.filter((product) => product.categorySlug === category.slug).length }))
    .filter((chip) => chip.count > 0);

  return (
    <>
      <h1 className="st-page-title">{t.shopTitle}</h1>
      <Suspense fallback={<div className="st-grid">{Array.from({ length: 4 }, (_, index) => <div className="st-skel" key={index}/>)}</div>}>
        <ShopGrid products={cards} categories={chips} lang={lang}/>
      </Suspense>
    </>
  );
}
