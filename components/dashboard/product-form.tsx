"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { duplicateProduct, saveProduct } from "@/app/actions/catalog";
import { ProductImages, type ProductMediaItem } from "@/components/dashboard/product-images";
import { useDashLocale } from "@/components/dashboard/locale";

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
};

function initialImages(product?: ProductRow): ProductMediaItem[] {
  const urls = [product?.image, ...(product?.gallery ?? [])].filter((src): src is string => Boolean(src));
  return [...new Set(urls)].map((src) => ({ id: src, src, remote: src }));
}

export function ProductForm({ product, categories }: { product?: ProductRow; categories: Category[] }) {
  const { t } = useDashLocale();
  const [images, setImages] = useState<ProductMediaItem[]>(() => initialImages(product));
  const [state, action, pending] = useActionState(saveProduct, undefined);
  const imagesRef = useRef(images);
  imagesRef.current = images;
  useEffect(() => () => {
    imagesRef.current.forEach((image) => {
      if (image.src.startsWith("blob:")) URL.revokeObjectURL(image.src);
    });
  }, []);

  function submit(formData: FormData) {
    formData.delete("image_files");
    formData.delete("image_list");
    const plan = images.map((image) => {
      if (image.file) {
        formData.append("image_files", image.file);
        return { kind: "file" };
      }
      return { kind: "url", src: image.remote || image.src };
    });
    formData.set("image_list", JSON.stringify(plan));
    action(formData);
  }

  return (
    <div>
      {product?.id ? (
        <form action={duplicateProduct.bind(null, product.id)} className="dash-duplicate">
          <button className="dash-btn ghost" type="submit">{t.duplicate}</button>
        </form>
      ) : null}
      <form action={submit} className="dash-form-layout">
        {product?.id ? <input type="hidden" name="id" value={product.id}/> : null}
        <div className="dash-grid">
          <section className="dash-card">
            <h2 style={{fontSize:18,marginBottom:18}}>{t.basicInfo}</h2>
            {state?.error ? <p className="dash-login-error" role="alert">{state.error}</p> : null}
            <div className="dash-row">
              <label className="dash-field">{t.brandName}
                <input name="brand" defaultValue={product?.brand ?? "Darivo"}/>
              </label>
              <label className="dash-field">{t.category}
                <select name="category_id" defaultValue={product?.category_id ?? ""}>
                  <option value="">{t.selectCategory}</option>
                  {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
                </select>
              </label>
              <label className="dash-field">{t.priceTnd}
                <input name="price" type="number" min="0" step="0.01" required defaultValue={product?.price ?? ""} inputMode="decimal"/>
              </label>
            </div>
            <label className="dash-field">{t.productName}
              <input name="name" required defaultValue={product?.name ?? ""} placeholder="Washed linen cushion"/>
            </label>
            <div className="dash-row-2">
              <label className="dash-field">{t.slug}
                <input name="slug" defaultValue={product?.slug ?? ""} placeholder="washed-linen-cushion"/>
              </label>
              <label className="dash-field">{t.compareAt}
                <input name="old_price" type="number" min="0" step="0.01" defaultValue={product?.old_price ?? ""} inputMode="decimal"/>
              </label>
            </div>
            <label className="dash-field">{t.description}
              <textarea name="description" defaultValue={product?.description ?? ""}/>
            </label>
            <div className="dash-row-2">
              <label className="dash-field">{t.color}
                <input name="color" defaultValue={product?.color ?? ""}/>
              </label>
              <label className="dash-field">{t.material}
                <input name="material" defaultValue={product?.material ?? ""}/>
              </label>
            </div>
            <label className="dash-check"><input type="checkbox" name="is_new" defaultChecked={Boolean(product?.is_new)}/> {t.markNew}</label>
          </section>
        </div>
        <aside className="dash-grid">
          <ProductImages images={images} onChange={setImages}/>
        </aside>
        <section className="dash-card dash-form-seo">
          <h2 style={{fontSize:18,marginBottom:18}}>{t.searchDetails}</h2>
          <label className="dash-field">{t.pageTitle}
            <input name="page_title" defaultValue={product?.page_title ?? ""}/>
          </label>
          <label className="dash-field">{t.metaDescription}
            <textarea name="meta_description" defaultValue={product?.meta_description ?? ""}/>
          </label>
        </section>
        <div className="dash-actions dash-form-save">
          <button className="dash-btn primary" type="submit" disabled={pending}>{pending ? t.saving : t.saveProduct}</button>
        </div>
      </form>
    </div>
  );
}
