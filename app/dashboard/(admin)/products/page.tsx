import Link from "next/link";
import { DeleteProductButton } from "@/components/dashboard/delete-product-button";
import { DashPage } from "@/components/dashboard/runtime";
import { requireAdmin } from "@/lib/auth";
import { dashMoney, visibilityLabel } from "@/lib/dashboard-i18n";
import { getDashCopy } from "@/lib/dashboard-lang";

export default function ProductsPage() {
  return (
    <DashPage>
      <ProductsBody/>
    </DashPage>
  );
}

async function ProductsBody() {
  const { lang, t } = await getDashCopy();
  const { supabase } = await requireAdmin();
  const { data } = await supabase.from("products").select("id, name, image, price, visibility, categories(name)").order("created_at", { ascending: false });
  const products = data ?? [];
  return (
    <>
      <div className="dash-topbar">
        <div>
          <div className="dash-crumb">{t.productsCrumb}</div>
          <h1>{t.productsTitle}</h1>
        </div>
        <Link className="dash-btn primary" href="/dashboard/products/new">{t.addProduct}</Link>
      </div>
      <section className="dash-card">
        {products.length ? (
          <div className="dash-table-wrap">
          <table className="dash-table">
            <thead><tr><th>{t.colProduct}</th><th>{t.colCategory}</th><th>{t.colPrice}</th><th>{t.colVisibility}</th><th>{t.actions}</th></tr></thead>
            <tbody>
              {products.map((product) => {
                const category = product.categories as { name?: string } | { name?: string }[] | null;
                const categoryName = Array.isArray(category) ? category[0]?.name : category?.name;
                return (
                  <tr key={product.id}>
                    <td style={{display:"flex",gap:12,alignItems:"center"}}>
                      <img src={product.image} alt="" width={48} height={48} style={{width:48,height:48,objectFit:"cover",borderRadius:2,background:"#f3f4f6"}}/>
                      <span>{product.name}</span>
                    </td>
                    <td>{categoryName ?? "—"}</td>
                    <td>{dashMoney(Number(product.price), lang)}</td>
                    <td><span className={`dash-status ${product.visibility === "published" ? "delivered" : "new"}`}>{visibilityLabel(t, product.visibility)}</span></td>
                    <td>
                      <div className="dash-row-actions">
                        <Link className="dash-btn ghost dash-btn-compact" href={`/dashboard/products/${product.id}`}>{t.edit}</Link>
                        <DeleteProductButton id={product.id} label={t.delete} confirmLabel={t.deleteProductConfirm} className="dash-btn danger dash-btn-compact"/>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          </div>
        ) : <div className="dash-empty">{t.noProducts}</div>}
      </section>
    </>
  );
}
