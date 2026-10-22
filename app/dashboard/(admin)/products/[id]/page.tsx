import { notFound } from "next/navigation";
import { ProductForm } from "@/components/dashboard/product-form";
import { deleteProduct } from "@/app/actions/catalog";
import { requireAdmin } from "@/lib/auth";

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
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
          <div className="dash-crumb">Products / Edit product</div>
          <h1>Edit product</h1>
        </div>
        <form action={async () => { "use server"; await deleteProduct(id); }}>
          <button className="dash-btn danger" type="submit">Delete</button>
        </form>
      </div>
      <ProductForm product={product} categories={categories ?? []}/>
    </>
  );
}
