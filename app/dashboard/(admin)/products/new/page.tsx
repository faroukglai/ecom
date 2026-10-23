import { ProductForm } from "@/components/dashboard/product-form";
import { DashPage } from "@/components/dashboard/runtime";
import { requireAdmin } from "@/lib/auth";
import { getDashCopy } from "@/lib/dashboard-lang";

export default function NewProductPage() {
  return (
    <DashPage>
      <NewProductBody/>
    </DashPage>
  );
}

async function NewProductBody() {
  const { t } = await getDashCopy();
  const { supabase } = await requireAdmin();
  const { data } = await supabase.from("categories").select("id, name").order("sort_order");
  return (
    <>
      <div className="dash-topbar">
        <div>
          <div className="dash-crumb">{t.newProductCrumb}</div>
          <h1>{t.newProductTitle}</h1>
        </div>
      </div>
      <ProductForm categories={data ?? []}/>
    </>
  );
}
