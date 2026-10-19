import { Storefront } from "@/components/storefront";
import { products, categories, slugify } from "@/data/catalog";
import { notFound } from "next/navigation";
export function generateStaticParams() {
  return ["shop", "wishlist", "checkout", "cart", "about", "inspiration", "faq", "contact", "shipping", "returns", "privacy", "terms", "track-order", "account", "search"].map(p => ({path:[p]})).concat(products.map(p => ({path:["products",p.slug]})), categories.map(c => ({path:["collections",slugify(c)]})));
}
export async function generateMetadata({params}: {params:Promise<{path:string[]}>}) {
  const {path} = await params;
  const product = products.find(p => p.slug === path[1]);
  return { title: product?.name ?? (path[0] ?? "Home").replace(/-/g," ").replace(/^./, c => c.toUpperCase()) };
}
export default async function Page({params}: {params:Promise<{path:string[]}>}) {
  const {path} = await params;
  const valid = ["shop", "wishlist", "checkout", "cart", "about", "inspiration", "faq", "contact", "shipping", "returns", "privacy", "terms", "track-order", "account", "search", "collections", "products"];
  if (!valid.includes(path[0] ?? "") || (path[0] === "products" && !products.some(p => p.slug === path[1])) || (path[0] === "collections" && !categories.some(c => slugify(c) === path[1]))) notFound();
  return <Storefront path={path} />;
}
