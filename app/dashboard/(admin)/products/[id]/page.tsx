import Link from "next/link";
import { notFound } from "next/navigation";
import { DeleteProductButton } from "@/components/dashboard/delete-product-button";
import { Icon } from "@/components/dashboard/icons";
import { ProductForm } from "@/components/dashboard/product-form";
import { DashPage } from "@/components/dashboard/runtime";
import { PageHeader } from "@/components/dashboard/ui";
import { requireAdmin } from "@/lib/auth";
import { getDashCopy } from "@/lib/dashboard-lang";

export default function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <DashPage>
      <EditProductBody params={params}/>
    </DashPage>
  );
}

async function EditProductBody({ params }: { params: Promise<{ id: string }> }) {
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
      <PageHeader title={String(product.name)} crumbs={[{ label: t.navProducts, href: "/dashboard/products" }, { label: t.editProductTitle }]}>
        <Link className="dash-btn ghost" href={`/products/${product.slug}`} target="_blank"><Icon name="view" size={17}/> {t.viewOnStore}</Link>
        <DeleteProductButton id={id} label={t.delete} confirmLabel={t.deleteProductConfirm}/>
      </PageHeader>
      <ProductForm product={product} categories={categories ?? []}/>
    </>
  );
}
