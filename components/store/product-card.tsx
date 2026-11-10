import Link from "next/link";
import { Icon } from "@/components/icons";
import { ProductMedia } from "@/components/product-media";
import { discountPercent, money } from "@/lib/format";
import { getCopy, localePath, type Lang } from "@/lib/store-i18n";

export type CardProduct = {
  id: string;
  slug: string;
  name: string;
  image: string;
  price: number;
  oldPrice?: number;
  isNew?: boolean;
  categorySlug: string;
};

export function ProductCard({ product, lang, priority = false }: { product: CardProduct; lang: Lang; priority?: boolean }) {
  const t = getCopy(lang);
  const href = localePath(lang, `/products/${product.slug}`);
  const off = discountPercent(product.price, product.oldPrice);
  return (
    <article className="st-card">
      <Link className="st-card-img" href={href} aria-label={product.name}>
        <ProductMedia src={product.image} alt="" fill sizes="(max-width: 720px) 46vw, (max-width: 1000px) 31vw, 270px" priority={priority}/>
        {off ? <span className="st-badge"><bdi className="st-ltr">−{off}%</bdi></span> : product.isNew ? <span className="st-badge new">{t.newBadge}</span> : null}
      </Link>
      <div className="st-card-body">
        <Link className="st-card-name" href={href}>{product.name}</Link>
        <div className="st-price">
          <strong>{money(product.price, lang)}</strong>
          {product.oldPrice && off ? <del>{money(product.oldPrice, lang)}</del> : null}
        </div>
        <Link className="st-btn primary" href={href}>{t.order} <Icon name="arrowRight" size={18} className="st-flip"/></Link>
      </div>
    </article>
  );
}
