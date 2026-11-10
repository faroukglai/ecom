import { ProductForm } from "@/components/dashboard/product-form";
import { DashPage } from "@/components/dashboard/runtime";
import { PageHeader } from "@/components/dashboard/ui";
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
      <PageHeader title={t.newProductTitle} crumbs={[{ label: t.navProducts, href: "/dashboard/products" }, { label: t.newProductTitle }]}/>
      <ProductForm categories={data ?? []}/>
    </>
  );
}
