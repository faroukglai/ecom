import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { Icon } from "@/components/icons";
import { OrderForm, type OrderProduct } from "@/components/store/order-form";
import { ProductGallery } from "@/components/store/product-gallery";
import { StickyBuyBar } from "@/components/store/sticky-buy-bar";
import { TrackEvent } from "@/components/store/track-event";
import { getStoreCatalog } from "@/lib/catalog";
import { alternatesFor, jsonLdString, ogLocale, productJsonLd } from "@/lib/seo";
import { discountPercent, money } from "@/lib/format";
import { productText, shortText } from "@/lib/store-content";
import { getCopy, hasLang, localePath, type Lang } from "@/lib/store-i18n";

type Props = { params: Promise<{ lang: string; slug: string }> };

export async function generateStaticParams() {
  try {
    const { products } = await getStoreCatalog();
    // Only clean slugs are prerendered; a malformed slug saved by mistake must not break the build.
    const params = products.filter((product) => /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(product.slug)).map((product) => ({ slug: product.slug }));
    if (params.length) return params;
  } catch {
    // Fall through: the build must still succeed if the database is unreachable at that moment.
  }
  // Cache Components needs at least one prerendered value; a placeholder renders the "not found" page and real products still work on demand.
  return [{ slug: "produit" }];
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang, slug } = await params;
  if (!hasLang(lang)) return {};
  const { products } = await getStoreCatalog();
  const product = products.find((item) => item.slug === slug);
  if (!product) return {};
  const text = productText(product, lang);
  return {
    title: text.name,
    description: shortText(text.description, 160),
    alternates: alternatesFor(lang, `/products/${slug}`),
    openGraph: { type: "website", locale: ogLocale(lang), title: text.name, description: shortText(text.description, 160), images: [product.image] },
    twitter: { card: "summary_large_image", title: text.name, images: [product.image] },
  };
}

export default function ProductPage({ params }: Props) {
  return (
    <Suspense fallback={<div className="st-skel" style={{ height: 420 }}/>}>
      <Product params={params}/>
    </Suspense>
  );
}

async function Product({ params }: Props) {
  const { lang, slug } = await params;
  if (!hasLang(lang)) notFound();
  const { products } = await getStoreCatalog();
  const product = products.find((item) => item.slug === slug);
  if (!product) notFound();
  // Up to three other products to add to the same delivery: same category first, then the newest.
  const others = products.filter((item) => item.id !== product.id);
  const related = [...others.filter((item) => item.categoryId === product.categoryId), ...others.filter((item) => item.categoryId !== product.categoryId)]
    .slice(0, 3)
    .map((item) => ({ id: item.id, name: productText(item, lang).name, price: item.price, image: item.image }));
  return <ProductView lang={lang} product={product} addons={related}/>;
}

type CatalogProduct = Awaited<ReturnType<typeof getStoreCatalog>>["products"][number];

function ProductView({ lang, product, addons }: { lang: Lang; product: CatalogProduct; addons: OrderProduct[] }) {
  const t = getCopy(lang);
  const text = productText(product, lang);
  const off = discountPercent(product.price, product.oldPrice);
  const images = product.gallery.length ? product.gallery : [product.image];
  const specs = [
    product.material ? { label: t.material, value: product.material } : null,
    product.color ? { label: t.color, value: product.color } : null,
  ].filter((item): item is { label: string; value: string } => Boolean(item));

  return (
    <>
      <Link className="st-back" href={localePath(lang, "/shop")}><Icon name="arrowLeft" size={18} className="st-flip"/> {t.back}</Link>
      <div className="st-product">
        <ProductGallery images={images} alt={text.name} lang={lang}/>
        <div className="st-info">
          <h1>{text.name}</h1>
          <div className="st-price">
            <strong>{money(product.price, lang)}</strong>
            {product.oldPrice && off ? <><del>{money(product.oldPrice, lang)}</del><span className="st-sale-tag"><bdi className="st-ltr">−{off}%</bdi></span></> : null}
          </div>
          <p className="st-promise"><Icon name="truck" size={22}/> {t.deliveryLine}</p>
          <a className="st-btn primary block" href="#order-form">{t.orderNow} <Icon name="arrowRight" size={20} className="st-flip"/></a>
          <p className="st-desc">{shortText(text.description, 220)}</p>
          <OrderForm product={{ id: product.id, name: text.name, price: product.price, image: product.image }} addons={addons} lang={lang}/>
          {specs.length ? (
            <details>
              <summary style={{ fontWeight: 700, cursor: "pointer", minHeight: 44, display: "flex", alignItems: "center" }}>{t.details}</summary>
              <p className="st-desc" style={{ marginBlock: "8px 12px" }}>{text.description}</p>
              <ul className="st-specs">
                {specs.map((spec) => <li key={spec.label}><span>{spec.label}</span><span>{spec.value}</span></li>)}
              </ul>
            </details>
          ) : null}
        </div>
      </div>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdString(productJsonLd({ id: product.id, slug: product.slug, name: text.name, description: shortText(text.description, 300), image: product.image, price: product.price }, lang)) }}/>
      <TrackEvent name="ViewContent" data={{ content_ids: [product.id], content_name: text.name, content_type: "product", value: product.price, currency: "TND" }}/>
      <StickyBuyBar price={product.price} lang={lang}/>
      <div className="st-sticky-space" aria-hidden="true"/>
    </>
  );
}
