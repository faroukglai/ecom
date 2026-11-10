import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { Icon, type IconName } from "@/components/icons";
import { ProductMedia } from "@/components/product-media";
import { ProductCard } from "@/components/store/product-card";
import { site } from "@/config/site";
import { getStoreCatalog } from "@/lib/catalog";
import { alternatesFor, ogLocale } from "@/lib/seo";
import { categoryName, productText } from "@/lib/store-content";
import { getCopy, hasLang, localePath, type Lang } from "@/lib/store-i18n";

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { lang } = await params;
  if (!hasLang(lang)) return {};
  const t = getCopy(lang);
  return { title: { absolute: `${site.name} — ${t.tagline}` }, description: t.heroText, alternates: alternatesFor(lang, "/"), openGraph: { locale: ogLocale(lang) } };
}

export default function HomePage({ params }: { params: Promise<{ lang: string }> }) {
  return (
    <Suspense fallback={<div className="st-skel" style={{ height: 340 }}/>}>
      <HomeLoader params={params}/>
    </Suspense>
  );
}

async function HomeLoader({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (!hasLang(lang)) notFound();
  return <Home lang={lang}/>;
}

async function Home({ lang }: { lang: Lang }) {
  const t = getCopy(lang);
  const { products, categories } = await getStoreCatalog();
  const cards = products.slice(0, 8).map((product) => ({ ...product, name: productText(product, lang).name }));
  // Only categories that really have products, each shown with a real product photo (never a stock room picture).
  const tiles = categories
    .map((category) => {
      const inCategory = products.filter((product) => product.categorySlug === category.slug);
      return { category, image: inCategory[0]?.image, count: inCategory.length };
    })
    .filter((tile): tile is { category: (typeof categories)[number]; image: string; count: number } => tile.count > 0 && Boolean(tile.image))
    .slice(0, 6);
  const trust: { icon: IconName; title: string; sub: string }[] = [
    { icon: "wallet", title: t.trustCod, sub: t.trustCodSub },
    { icon: "truck", title: t.trustShip, sub: t.trustShipSub },
    { icon: "message", title: t.trustHelp, sub: t.trustHelpSub },
  ];
  const steps: { icon: IconName; text: string }[] = [
    { icon: "grid", text: t.how1 },
    { icon: "note", text: t.how2 },
    { icon: "moneyBag", text: t.how3 },
  ];

  return (
    <>
      <section className="st-hero" aria-label={t.heroTitle}>
        <Image src="/images/hero.webp" alt="" fill priority sizes="(max-width: 1160px) 100vw, 1160px"/>
        <div className="st-hero-in">
          <h1>{t.heroTitle}</h1>
          <p>{t.heroText}</p>
          <Link className="st-btn" href={localePath(lang, "/shop")}>{t.heroCta} <Icon name="arrowRight" size={20} className="st-flip"/></Link>
        </div>
      </section>

      <ul className="st-trust" style={{ marginBlockStart: 16 }}>
        {trust.map((item) => (
          <li key={item.title}>
            <span className="chip"><Icon name={item.icon} size={22}/></span>
            <span><strong>{item.title}</strong><small>{item.sub}</small></span>
          </li>
        ))}
      </ul>

      {tiles.length ? (
        <section className="st-section" aria-labelledby="cats">
          <div className="st-section-head"><h2 id="cats">{t.categories}</h2></div>
          <div className="st-tiles">
            {tiles.map(({ category, image }) => (
              <Link key={category.id} className="st-tile" href={`${localePath(lang, "/shop")}?category=${category.slug}`}>
                <ProductMedia src={image} alt="" fill sizes="(max-width: 720px) 46vw, 370px"/>
                <span>{categoryName(category, lang)}</span>
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      <section className="st-section" aria-labelledby="best">
        <div className="st-section-head">
          <h2 id="best">{t.products}</h2>
          <Link className="st-link" href={localePath(lang, "/shop")}>{t.seeAll} <Icon name="arrowRight" size={18} className="st-flip"/></Link>
        </div>
        {cards.length ? (
          <>
            <div className="st-grid">{cards.map((product, index) => <ProductCard key={product.id} product={product} lang={lang} priority={index < 2}/>)}</div>
            {products.length > cards.length ? (
              <div style={{ marginBlockStart: 18, display: "flex", justifyContent: "center" }}>
                <Link className="st-btn ghost" href={localePath(lang, "/shop")}>{t.seeAllProducts} ({products.length}) <Icon name="arrowRight" size={20} className="st-flip"/></Link>
              </div>
            ) : null}
          </>
        ) : (
          <p className="st-empty">{t.emptyShop}</p>
        )}
      </section>

      <section className="st-section" aria-labelledby="how">
        <div className="st-section-head"><h2 id="how">{t.howTitle}</h2></div>
        <ol className="st-how">
          {steps.map((step) => (
            <li key={step.text}><span className="chip"><Icon name={step.icon} size={24}/></span>{step.text}</li>
          ))}
        </ol>
      </section>
    </>
  );
}
