import { ProductForm } from "@/components/dashboard/product-form";
import { requireAdmin } from "@/lib/auth";

export default async function NewProductPage() {
  const { supabase } = await requireAdmin();
  const { data } = await supabase.from("categories").select("id, name").order("sort_order");
  return (
    <>
      <div className="dash-topbar">
        <div>
          <div className="dash-crumb">Products / Product</div>
          <h1>New product</h1>
        </div>
      </div>
      <ProductForm categories={data ?? []}/>
    </>
  );
}
