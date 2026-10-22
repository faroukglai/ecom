import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { money } from "@/lib/pricing";

export default async function ProductsPage() {
  const { supabase } = await requireAdmin();
  const { data } = await supabase.from("products").select("id, name, image, price, visibility, categories(name)").order("created_at", { ascending: false });
  const products = data ?? [];
  return (
    <>
      <div className="dash-topbar">
        <div>
          <div className="dash-crumb">Products / Product list</div>
          <h1>Products</h1>
        </div>
        <Link className="dash-btn primary" href="/dashboard/products/new">Add product</Link>
      </div>
      <section className="dash-card">
        {products.length ? (
          <table className="dash-table">
            <thead><tr><th>Product</th><th>Category</th><th>Price</th><th>Visibility</th><th></th></tr></thead>
            <tbody>
              {products.map((product) => {
                const category = product.categories as { name?: string } | { name?: string }[] | null;
                const categoryName = Array.isArray(category) ? category[0]?.name : category?.name;
                return (
                  <tr key={product.id}>
                    <td style={{display:"flex",gap:12,alignItems:"center"}}>
                      <img src={product.image} alt="" width={48} height={48} style={{width:48,height:48,objectFit:"cover",borderRadius:10,background:"#f3f4f6"}}/>
                      <span>{product.name}</span>
                    </td>
                    <td>{categoryName ?? "—"}</td>
                    <td>{money(Number(product.price))}</td>
                    <td><span className={`dash-status ${product.visibility === "published" ? "delivered" : "new"}`}>{product.visibility}</span></td>
                    <td><Link href={`/dashboard/products/${product.id}`}>Edit</Link></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        ) : <div className="dash-empty">No products yet. Add your first piece.</div>}
      </section>
    </>
  );
}
