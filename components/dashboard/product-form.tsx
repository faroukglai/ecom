"use client";

import { duplicateProduct, saveProduct } from "@/app/actions/catalog";

type Category = { id: string; name: string };
type ProductRow = {
  id?: string;
  name?: string;
  slug?: string;
  brand?: string;
  category_id?: string | null;
  price?: number | string;
  old_price?: number | string | null;
  image?: string;
  gallery?: string[] | null;
  color?: string;
  material?: string;
  description?: string;
  page_title?: string;
  meta_description?: string;
  is_new?: boolean;
  visibility?: string;
  publish_date?: string | null;
};

export function ProductForm({ product, categories }: { product?: ProductRow; categories: Category[] }) {
  const gallery = (product?.gallery ?? []).filter((src) => src && src !== product?.image).join("\n");
  const preview = product?.image || "/images/cushion.webp";
  return (
    <div>
    {product?.id ? (
      <form action={duplicateProduct.bind(null, product.id)} style={{display:"flex",justifyContent:"flex-end",marginBottom:12}}>
        <button className="dash-btn ghost" type="submit">Duplicate</button>
      </form>
    ) : null}
    <form action={saveProduct} className="dash-form-layout">
      {product?.id ? <input type="hidden" name="id" value={product.id}/> : null}
      <div className="dash-grid">
        <section className="dash-card">
          <h2 style={{fontSize:18,marginBottom:18}}>Basic information</h2>
          <div className="dash-row">
            <label className="dash-field">Brand name
              <input name="brand" defaultValue={product?.brand ?? "Hearth & Hue"}/>
            </label>
            <label className="dash-field">Category
              <select name="category_id" defaultValue={product?.category_id ?? ""}>
                <option value="">Select category</option>
                {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
              </select>
            </label>
            <label className="dash-field">Price (TND)
              <input name="price" type="number" min="0" step="0.01" required defaultValue={product?.price ?? ""}/>
            </label>
          </div>
          <label className="dash-field">Product name
            <input name="name" required defaultValue={product?.name ?? ""} placeholder="Washed linen cushion"/>
          </label>
          <div className="dash-row-2">
            <label className="dash-field">Slug
              <input name="slug" defaultValue={product?.slug ?? ""} placeholder="washed-linen-cushion"/>
            </label>
            <label className="dash-field">Compare-at price
              <input name="old_price" type="number" min="0" step="0.01" defaultValue={product?.old_price ?? ""}/>
            </label>
          </div>
          <label className="dash-field">Description
            <textarea name="description" defaultValue={product?.description ?? ""}/>
          </label>
          <div className="dash-row-2">
            <label className="dash-field">Color
              <input name="color" defaultValue={product?.color ?? ""}/>
            </label>
            <label className="dash-field">Material
              <input name="material" defaultValue={product?.material ?? ""}/>
            </label>
          </div>
        </section>
        <section className="dash-card">
          <h2 style={{fontSize:18,marginBottom:18}}>Search details</h2>
          <label className="dash-field">Page title
            <input name="page_title" defaultValue={product?.page_title ?? ""} placeholder="Get free delivery, or pick up in store"/>
          </label>
          <label className="dash-field">Meta description
            <textarea name="meta_description" defaultValue={product?.meta_description ?? ""}/>
          </label>
        </section>
      </div>
      <div className="dash-grid">
        <section className="dash-card">
          <h2 style={{fontSize:18,marginBottom:18}}>Visibility</h2>
          <div className="dash-vis">
            {[["published","Published"],["scheduled","Schedule"],["hidden","Hidden"]].map(([value, label]) => (
              <label key={value}><input type="radio" name="visibility" value={value} defaultChecked={(product?.visibility ?? "published") === value}/> {label}</label>
            ))}
          </div>
          <label className="dash-field" style={{marginTop:16}}>Publish date
            <input type="datetime-local" name="publish_date" defaultValue={product?.publish_date ? product.publish_date.slice(0,16) : ""}/>
            <small className="dash-help">Hidden or scheduled products stay off the storefront until you publish them.</small>
          </label>
          <label className="dash-check"><input type="checkbox" name="is_new" defaultChecked={Boolean(product?.is_new)}/> Mark as new arrival</label>
        </section>
        <section className="dash-card">
          <h2 style={{fontSize:18,marginBottom:18}}>Product image</h2>
          <label className="dash-field">Main image URL or path
            <input name="image" required defaultValue={product?.image ?? "/images/cushion.webp"} placeholder="/images/cushion.webp"/>
          </label>
          <img className="dash-hero-img" src={preview} alt=""/>
          <div className="dash-thumbs">
            {(product?.gallery ?? [preview]).slice(0,2).map((src) => <img key={src} src={src} alt=""/>)}
          </div>
          <label className="dash-field">Gallery images
            <textarea name="gallery" defaultValue={gallery} placeholder={"One image path per line\n/images/hero.webp"}/>
            <small className="dash-help">Use store files like /images/lamp.webp or a full https image URL.</small>
          </label>
        </section>
        <div className="dash-actions">
          <button className="dash-btn primary" type="submit">Save</button>
        </div>
      </div>
    </form>
    </div>
  );
}
