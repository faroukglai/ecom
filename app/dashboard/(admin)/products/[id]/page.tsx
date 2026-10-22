import { notFound } from "next/navigation";
import { ProductForm } from "@/components/dashboard/product-form";
import { deleteProduct } from "@/app/actions/catalog";
import { requireAdmin } from "@/lib/auth";
import { getDashCopy } from "@/lib/dashboard-lang";

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { t } = await getDashCopy();
  const { supabase } = await requireAdmin();
  const [{ data: product }, { data: categories }] = await Promise.all([
    supabase.from("products").select("*").eq("id", id).maybeSingle(),
    supabase.from("categories").select("id, name").order("sort_order"),
  ]);
  if (!product) notFound();
  return (
    <>
      <div className="dash-topbar">
        <div>
          <div className="dash-crumb">{t.editProductCrumb}</div>
          <h1>{t.editProductTitle}</h1>
        </div>
        <form action={async () => { "use server"; await deleteProduct(id); }}>
          <button className="dash-btn danger" type="submit">{t.delete}</button>
        </form>
      </div>
      <ProductForm product={product} categories={categories ?? []}/>
    </>
  );
}
