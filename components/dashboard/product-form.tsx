"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import { duplicateProduct, saveProduct } from "@/app/actions/catalog";
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

export function ProductForm({ product, categories }: { product?: ProductRow; categories: Category[] }) {
  const { t } = useDashLocale();
  const existingGallery = (product?.gallery ?? []).filter((src) => src && src !== product?.image);
  const [mainPreview, setMainPreview] = useState(product?.image ?? "");
  const [galleryKeep, setGalleryKeep] = useState(existingGallery);
  const [galleryNew, setGalleryNew] = useState<string[]>([]);
  const [state, action, pending] = useActionState(saveProduct, undefined);

  const objectUrls = useMemo(() => [mainPreview, ...galleryNew].filter((src) => src.startsWith("blob:")), [galleryNew, mainPreview]);
  useEffect(() => () => objectUrls.forEach((src) => URL.revokeObjectURL(src)), [objectUrls]);

  return (
    <div>
      {product?.id ? (
        <form action={duplicateProduct.bind(null, product.id)} className="dash-duplicate">
          <button className="dash-btn ghost" type="submit">{t.duplicate}</button>
        </form>
      ) : null}
      <form action={action} className="dash-form-layout">
        {product?.id ? <input type="hidden" name="id" value={product.id}/> : null}
        <input type="hidden" name="image" value={mainPreview.startsWith("blob:") ? (product?.image ?? "") : mainPreview}/>
        <input type="hidden" name="gallery" value={galleryKeep.join("\n")}/>
        <div className="dash-grid">
          <section className="dash-card">
            <h2 style={{fontSize:18,marginBottom:18}}>{t.basicInfo}</h2>
            {state?.error ? <p className="dash-login-error" role="alert">{state.error}</p> : null}
            <div className="dash-row">
              <label className="dash-field">{t.brandName}
                <input name="brand" defaultValue={product?.brand ?? "Hearth & Hue"}/>
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
          <section className="dash-card">
            <h2 style={{fontSize:18,marginBottom:18}}>{t.searchDetails}</h2>
            <label className="dash-field">{t.pageTitle}
              <input name="page_title" defaultValue={product?.page_title ?? ""}/>
            </label>
            <label className="dash-field">{t.metaDescription}
              <textarea name="meta_description" defaultValue={product?.meta_description ?? ""}/>
            </label>
          </section>
        </div>
        <aside className="dash-grid">
          <section className="dash-card">
            <h2 style={{fontSize:18,marginBottom:18}}>{t.productImages}</h2>
            <label className="dash-upload">
              <input
                type="file"
                name="image_file"
                accept="image/*"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  setMainPreview(file ? URL.createObjectURL(file) : (product?.image ?? ""));
                }}
              />
              <strong>{t.uploadMain}</strong>
              <span>{t.uploadMainHelp}</span>
            </label>
            {mainPreview ? <img className="dash-hero-img" src={mainPreview} alt=""/> : <div className="dash-hero-img dash-upload-empty">{t.noPhoto}</div>}
            <label className="dash-upload" style={{marginTop:14}}>
              <input
                type="file"
                name="gallery_files"
                accept="image/*"
                multiple
                onChange={(event) => {
                  const files = Array.from(event.target.files ?? []);
                  setGalleryNew(files.map((file) => URL.createObjectURL(file)));
                }}
              />
              <strong>{t.addMorePhotos}</strong>
              <span>{t.addMoreHelp}</span>
            </label>
            <div className="dash-thumbs">
              {galleryKeep.map((src) => (
                <button key={src} className="dash-thumb" type="button" onClick={() => setGalleryKeep((current) => current.filter((item) => item !== src))}>
                  <img src={src} alt=""/>
                  <span>{t.remove}</span>
                </button>
              ))}
              {galleryNew.map((src) => <img key={src} src={src} alt=""/>)}
            </div>
            <small className="dash-help">{t.imageHelp}</small>
          </section>
        </aside>
        <div className="dash-actions dash-form-save">
          <button className="dash-btn primary" type="submit" disabled={pending}>{pending ? t.saving : t.saveProduct}</button>
        </div>
      </form>
    </div>
  );
}
