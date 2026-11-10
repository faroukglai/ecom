import type { Metadata } from "next";
import { site } from "@/config/site";
import { localePath, type Lang } from "@/lib/store-i18n";

export const absoluteUrl = (path: string) => `${site.url}${path.startsWith("/") ? path : `/${path}`}`;

/** Canonical link for this language plus the hreflang alternates, so Google serves the right language. */
export function alternatesFor(lang: Lang, path = "/"): Metadata["alternates"] {
  return {
    canonical: localePath(lang, path),
    languages: { fr: localePath("fr", path), ar: localePath("ar", path), "x-default": localePath("fr", path) },
  };
}

export const ogLocale = (lang: Lang) => (lang === "ar" ? "ar_TN" : "fr_TN");

type JsonLdProduct = { id: string; slug: string; name: string; description: string; image: string; price: number };

export function productJsonLd(product: JsonLdProduct, lang: Lang) {
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description,
    image: [product.image],
    sku: product.id,
    brand: { "@type": "Brand", name: site.name },
    offers: {
      "@type": "Offer",
      url: absoluteUrl(localePath(lang, `/products/${product.slug}`)),
      priceCurrency: site.currency,
      price: product.price.toFixed(2),
      availability: "https://schema.org/InStock",
      itemCondition: "https://schema.org/NewCondition",
    },
  };
}

/** JSON for a <script type="application/ld+json"> tag; "<" is escaped so product text can never close the tag early. */
export const jsonLdString = (data: unknown) => JSON.stringify(data).replace(/</g, "\\u003c");
