import { Suspense } from "react";
import { Storefront } from "@/components/storefront";
import { getStoreCatalog } from "@/lib/catalog";

export function StorefrontPage({ path }: { path: string[] }) {
  return (
    <Suspense fallback={<div className="page-loading">Making room for something lovely…</div>}>
      <LoadedStorefront path={path}/>
    </Suspense>
  );
}

async function LoadedStorefront({ path }: { path: string[] }) {
  const catalog = await getStoreCatalog();
  return <Storefront path={path} catalog={catalog}/>;
}
