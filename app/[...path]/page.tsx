import { Suspense } from "react";
import { StorefrontPage } from "@/components/storefront-page";
import { products, categories, slugify } from "@/data/catalog";
import { notFound } from "next/navigation";

const valid = ["shop", "wishlist", "checkout", "cart", "about", "inspiration", "faq", "contact", "shipping", "returns", "privacy", "terms", "track-order", "account", "search", "collections", "products"];

export function generateStaticParams() {
  return ["shop", "wishlist", "checkout", "cart", "about", "inspiration", "faq", "contact", "shipping", "returns", "privacy", "terms", "track-order", "account", "search"].map((page) => ({ path: [page] })).concat(
    products.map((product) => ({ path: ["products", product.slug] })),
    categories.map((category) => ({ path: ["collections", slugify(category)] })),
  );
}

export async function generateMetadata({ params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params;
  const product = products.find((entry) => entry.slug === path[1]);
  return { title: product?.name ?? (path[0] ?? "Home").replace(/-/g, " ").replace(/^./, (letter) => letter.toUpperCase()) };
}

export default function Page({ params }: { params: Promise<{ path: string[] }> }) {
  return (
    <Suspense fallback={<div className="page-loading">Making room for something lovely…</div>}>
      <ResolvedPage params={params}/>
    </Suspense>
  );
}

async function ResolvedPage({ params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params;
  if (!valid.includes(path[0] ?? "") || path.length > 2) notFound();
  return <StorefrontPage path={path}/>;
}
