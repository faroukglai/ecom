import Link from "next/link";
import { DeleteProductButton } from "@/components/dashboard/delete-product-button";
import { Icon } from "@/components/dashboard/icons";
import { DashPage } from "@/components/dashboard/runtime";
import { EmptyState, PageHeader } from "@/components/dashboard/ui";
import { VisibilityToggle } from "@/components/dashboard/visibility-toggle";
import { requireAdmin } from "@/lib/auth";
import { dashMoney, fill } from "@/lib/dashboard-i18n";
import { getDashCopy } from "@/lib/dashboard-lang";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;
type ProductRow = {
  id: string; slug: string; name: string; image: string; price: number | string; old_price: number | string | null; visibility: string;
  categories: { name?: string } | { name?: string }[] | null;
};

const one = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value) ?? "";
const safe = (value: string) => value.replace(/[,()%*\\:"']/g, " ").replace(/\s+/g, " ").trim();

export default function ProductsPage({ searchParams }: { searchParams: SearchParams }) {
  return (
    <DashPage>
      <ProductsBody searchParams={searchParams}/>
    </DashPage>
  );
}

async function ProductsBody({ searchParams }: { searchParams: SearchParams }) {
  const [{ lang, t }, raw] = await Promise.all([getDashCopy(), searchParams]);
  const { supabase } = await requireAdmin();
  const q = safe(one(raw.q)).slice(0, 80);
  const category = one(raw.category);
  const vis = ["published", "hidden"].includes(one(raw.vis)) ? one(raw.vis) : "";

  let query = supabase.from("products").select("id, slug, name, image, price, old_price, visibility, categories(name)").order("created_at", { ascending: false }).limit(300);
  if (q) query = query.or(`name.ilike.%${q}%,slug.ilike.%${q}%`);
  if (category) query = query.eq("category_id", category);
  if (vis) query = query.eq("visibility", vis);

  const [productsRes, categoriesRes, allRes] = await Promise.all([
    query,
    supabase.from("categories").select("id, name").order("sort_order"),
    supabase.from("products").select("visibility").limit(2000),
  ]);
  const products = (productsRes.data ?? []) as unknown as ProductRow[];
  const categories = (categoriesRes.data ?? []) as { id: string; name: string }[];
  const all = (allRes.data ?? []) as { visibility: string }[];
  const counts = { all: all.length, published: all.filter((p) => p.visibility === "published").length, hidden: all.filter((p) => p.visibility !== "published").length };
  const hasFilters = Boolean(q || category || vis);
  const tabHref = (value: string) => {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (category) params.set("category", category);
    if (value) params.set("vis", value);
    const text = params.toString();
    return `/dashboard/products${text ? `?${text}` : ""}`;
  };

  return (
    <>
      <PageHeader title={t.productsTitle} subtitle={fill(t.productsCount, { n: counts.all })}>
        <Link className="dash-btn primary" href="/dashboard/products/new"><Icon name="plus" size={17}/> {t.addProduct}</Link>
      </PageHeader>

      <section className="dash-card flush">
        <nav className="dash-tabs" aria-label={t.colVisibility}>
          <Link href={tabHref("")} className={!vis ? "active" : ""}>{t.filterAll} <span className="n">{counts.all}</span></Link>
          <Link href={tabHref("published")} className={vis === "published" ? "active" : ""}>{t.visPublished} <span className="n">{counts.published}</span></Link>
          <Link href={tabHref("hidden")} className={vis === "hidden" ? "active" : ""}>{t.visHidden} <span className="n">{counts.hidden}</span></Link>
        </nav>

        <div className="dash-toolbar">
          <form method="get" role="search" style={{ display: "contents" }}>
            {vis ? <input type="hidden" name="vis" value={vis}/> : null}
            <label className="dash-search">
              <Icon name="search" size={17}/>
              <input name="q" type="search" defaultValue={q} placeholder={t.searchProducts} aria-label={t.searchProducts} autoComplete="off"/>
            </label>
            <select className="dash-select" name="category" defaultValue={category} aria-label={t.category}>
              <option value="">{t.allCategories}</option>
              {categories.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
            </select>
            <button className="dash-btn ghost" type="submit"><Icon name="filter" size={16}/> {t.colCategory}</button>
          </form>
          {hasFilters ? <Link className="dash-link" href="/dashboard/products"><Icon name="close" size={14}/> {t.clearFilters}</Link> : null}
        </div>

        {products.length ? (
          <div className="dash-table-wrap">
            <table className="dash-table stack">
              <thead>
                <tr><th>{t.colProduct}</th><th>{t.colCategory}</th><th className="end">{t.colPrice}</th><th>{t.colVisibility}</th><th className="end">{t.actions}</th></tr>
              </thead>
              <tbody>
                {products.map((product) => {
                  const joined = Array.isArray(product.categories) ? product.categories[0] : product.categories;
                  const price = Number(product.price);
                  const old = product.old_price == null ? 0 : Number(product.old_price);
                  const sale = old > price ? Math.round((1 - price / old) * 100) : 0;
                  return (
                    <tr key={product.id}>
                      <td className="primary">
                        <div className="dash-cell">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img className="dash-thumb" src={product.image} alt="" width={44} height={44}/>
                          <span>
                            <Link className="dash-order-link" href={`/dashboard/products/${product.id}`}>{product.name}</Link>
                            <small><bdi className="dash-ltr">/{product.slug}</bdi></small>
                          </span>
                        </div>
                      </td>
                      <td data-label={t.colCategory}><span className="dash-muted">{joined?.name ?? "—"}</span></td>
                      <td className="num end" data-label={t.colPrice}>
                        <strong>{dashMoney(price, lang)}</strong>
                        {sale ? <><span className="dash-old-price">{dashMoney(old, lang)}</span> <span className="dash-badge-sale">−{sale}%</span></> : null}
                      </td>
                      <td data-label={t.colVisibility}><VisibilityToggle id={product.id} visibility={product.visibility}/></td>
                      <td className="end actions">
                        <div className="dash-row-actions">
                          <Link className="dash-btn ghost dash-btn-compact dash-btn-icon" href={`/products/${product.slug}`} target="_blank" aria-label={t.viewOnStore} title={t.viewOnStore}><Icon name="view" size={15}/></Link>
                          <Link className="dash-btn ghost dash-btn-compact dash-btn-icon" href={`/dashboard/products/${product.id}`} aria-label={t.edit} title={t.edit}><Icon name="edit" size={15}/></Link>
                          <DeleteProductButton id={product.id} label={t.delete} confirmLabel={t.deleteProductConfirm} iconOnly className="dash-btn danger dash-btn-compact dash-btn-icon"/>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState icon="package" title={hasFilters ? t.noResults : t.noProducts}>
            {hasFilters ? <Link className="dash-btn ghost" href="/dashboard/products">{t.clearFilters}</Link> : <Link className="dash-btn primary" href="/dashboard/products/new"><Icon name="plus" size={17}/> {t.addProduct}</Link>}
          </EmptyState>
        )}
      </section>
    </>
  );
}
