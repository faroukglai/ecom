"use client";

import { useActionState, useCallback, useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { duplicateProduct, saveProduct } from "@/app/actions/catalog";
import { ProductImages, type ProductMediaItem } from "@/components/dashboard/product-images";
import { useDashLocale } from "@/components/dashboard/locale";
import { DashActionForm } from "@/components/dashboard/action-form";
import { Icon } from "@/components/dashboard/icons";
import { dashboardErrorMessage } from "@/lib/dashboard-i18n";
import { draftImages, readProductDraft, removeProductDraft, restoreDraftImages, writeProductDraft, type ProductDraft } from "@/components/dashboard/product-draft";

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
  const { t, showError } = useDashLocale();
  const router = useRouter();
  const draftKey = product?.id ?? "new";
  const [images, setImages] = useState<ProductMediaItem[]>(() => initialImages(product));
  const [state, action, pending] = useActionState(saveProduct, undefined);
  const [, startTransition] = useTransition();
  const [draftStatus, setDraftStatus] = useState<"idle" | "saving" | "saved" | "restored" | "failed">("idle");
  const [fieldError, setFieldError] = useState<{ field: string; message: string } | null>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const fieldTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const errorAnchorRef = useRef<HTMLElement | null>(null);
  const imagesRef = useRef(images);
  const readyRef = useRef(false);
  const publishedRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latestDraftRef = useRef<ProductDraft | null>(null);
  const writeQueueRef = useRef<Promise<void>>(Promise.resolve());
  const draftErrorRef = useRef({ showError, message: t.draftFailed });
  useEffect(() => { draftErrorRef.current = { showError, message: t.draftFailed }; }, [showError, t.draftFailed]);

  const showFieldError = useCallback((field: string, message: string) => {
    if (fieldTimerRef.current) clearTimeout(fieldTimerRef.current);
    errorAnchorRef.current?.removeAttribute("aria-invalid");
    const anchor = field === "image"
      ? formRef.current?.querySelector("[data-product-images]")
      : formRef.current?.elements.namedItem(field);
    if (anchor instanceof HTMLElement) {
      if (field !== "image") anchor.setAttribute("aria-invalid", "true");
      anchor.scrollIntoView({ behavior: "smooth", block: "center" });
      anchor.focus({ preventScroll: true });
      errorAnchorRef.current = anchor;
    }
    setFieldError({ field, message });
    fieldTimerRef.current = setTimeout(() => {
      errorAnchorRef.current?.removeAttribute("aria-invalid");
      errorAnchorRef.current = null;
      setFieldError(null);
      fieldTimerRef.current = null;
    }, 3000);
  }, []);

  const clearFieldError = useCallback((field: string) => {
    if (!field || fieldError?.field !== field) return;
    if (fieldTimerRef.current) clearTimeout(fieldTimerRef.current);
    errorAnchorRef.current?.removeAttribute("aria-invalid");
    errorAnchorRef.current = null;
    fieldTimerRef.current = null;
    setFieldError(null);
  }, [fieldError]);

  const captureDraft = useCallback((): ProductDraft | null => {
    const form = formRef.current;
    if (!form) return null;
    const fields: Record<string, string> = {};
    for (const [key, value] of new FormData(form)) if (typeof value === "string") fields[key] = value;
    const isNew = form.elements.namedItem("is_new");
    fields.is_new = isNew instanceof HTMLInputElement && isNew.checked ? "on" : "";
    return { key: draftKey, updatedAt: Date.now(), fields, images: draftImages(imagesRef.current) };
  }, [draftKey]);

  const persistDraft = useCallback((draft: ProductDraft) => {
    writeQueueRef.current = writeQueueRef.current.catch(() => {}).then(() => writeProductDraft(draft));
    void writeQueueRef.current.then(() => {
      if (readyRef.current && latestDraftRef.current === draft) setDraftStatus("saved");
    }).catch(() => {
      if (readyRef.current) {
        setDraftStatus("failed");
        draftErrorRef.current.showError(draftErrorRef.current.message);
      }
    });
  }, []);

  const scheduleDraft = useCallback(() => {
    if (!readyRef.current || publishedRef.current) return;
    const draft = captureDraft();
    if (!draft) return;
    latestDraftRef.current = draft;
    setDraftStatus("saving");
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => { timerRef.current = null; persistDraft(draft); }, 600);
  }, [captureDraft, persistDraft]);

  useEffect(() => {
    let active = true;
    void readProductDraft(draftKey).then((draft) => {
      if (!active) return;
      if (draft) {
        const form = formRef.current;
        for (const [name, value] of Object.entries(draft.fields)) {
          const field = form?.elements.namedItem(name);
          if (field instanceof HTMLInputElement) {
            if (field.type === "checkbox") field.checked = value === "on";
            else if (field.type !== "hidden") field.value = value;
          } else if (field instanceof HTMLSelectElement || field instanceof HTMLTextAreaElement) field.value = value;
        }
        setImages(restoreDraftImages(draft.images));
        setDraftStatus("restored");
      }
      readyRef.current = true;
    }).catch(() => {
      if (!active) return;
      readyRef.current = true;
      setDraftStatus("failed");
      draftErrorRef.current.showError(draftErrorRef.current.message);
    });
    return () => { active = false; };
  }, [draftKey]);

  useEffect(() => { imagesRef.current = images; if (readyRef.current) scheduleDraft(); }, [images, scheduleDraft]);
  useEffect(() => () => {
    readyRef.current = false;
    if (timerRef.current) clearTimeout(timerRef.current);
    if (fieldTimerRef.current) clearTimeout(fieldTimerRef.current);
    if (!publishedRef.current && latestDraftRef.current) persistDraft(latestDraftRef.current);
    imagesRef.current.forEach((image) => {
      if (image.src.startsWith("blob:")) URL.revokeObjectURL(image.src);
    });
  }, [persistDraft]);
  useEffect(() => {
    if (!state?.error) return;
    if (state.error === "name_price") {
      const name = formRef.current?.elements.namedItem("name");
      showFieldError(name instanceof HTMLInputElement && !name.value.trim() ? "name" : "price", name instanceof HTMLInputElement && !name.value.trim() ? t.productNameRequired : t.productPriceRequired);
    } else if (state.error === "photo_required") showFieldError("image", t.productPhotoRequired);
    else if (state.error === "slug_taken") showFieldError("slug", t.productSlugTaken);
    else showError(dashboardErrorMessage(t, state.error));
  }, [state, t, showError, showFieldError]);
  useEffect(() => {
    if (!state?.redirectTo) return;
    publishedRef.current = true;
    if (timerRef.current) clearTimeout(timerRef.current);
    const destination = state.redirectTo;
    void writeQueueRef.current.catch(() => {}).then(() => removeProductDraft(draftKey)).finally(() => router.push(destination));
  }, [state, draftKey, router]);

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

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    const form = event.currentTarget;
    const name = form.elements.namedItem("name");
    const price = form.elements.namedItem("price");
    const oldPrice = form.elements.namedItem("old_price");
    if (oldPrice instanceof HTMLInputElement && !oldPrice.checkValidity()) {
      oldPrice.value = "";
      scheduleDraft();
    }
    if (!(name instanceof HTMLInputElement) || !name.value.trim()) return showFieldError("name", t.productNameRequired);
    if (!(price instanceof HTMLInputElement) || !price.value.trim() || !price.checkValidity()) return showFieldError("price", t.productPriceRequired);
    if (!images.length) return showFieldError("image", t.productPhotoRequired);
    startTransition(() => submit(new FormData(form)));
  }

  return (
    <div>
      {product?.id ? (
        <DashActionForm action={duplicateProduct.bind(null, product.id)} className="dash-duplicate" submitLabel={<><Icon name="copy" size={16}/> {t.duplicate}</>} submitClassName="dash-btn ghost"/>
      ) : null}
      <div className="dash-draft-note" role="status" aria-live="polite"><strong>{draftStatus === "saving" ? t.draftSaving : draftStatus === "saved" ? t.draftSaved : draftStatus === "restored" ? t.draftRestored : draftStatus === "failed" ? t.draftFailed : t.draftHelp}</strong>{draftStatus !== "idle" && <small>{t.draftHelp}</small>}</div>
      <form ref={formRef} className="dash-form-layout" noValidate onInputCapture={(event) => { if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement || event.target instanceof HTMLSelectElement) clearFieldError(event.target.name); scheduleDraft(); }} onChangeCapture={scheduleDraft} onSubmit={handleSubmit}>
        {product?.id ? <input type="hidden" name="id" value={product.id}/> : null}
        <input type="hidden" name="color" value={product?.color ?? ""}/>
        <input type="hidden" name="material" value={product?.material ?? ""}/>
        <input type="hidden" name="page_title" value={product?.page_title ?? ""}/>
        <input type="hidden" name="meta_description" value={product?.meta_description ?? ""}/>
        <div className="dash-grid">
          <section className="dash-card">
            <div className="dash-card-head"><h2 className="dash-card-title"><Icon name="note" size={17}/> {t.basicInfo}</h2></div>
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
              <label className="dash-field" data-error-field="price">{t.priceTnd}
                <input name="price" type="number" min="0" step="0.01" required defaultValue={product?.price ?? ""} inputMode="decimal"/>
                {fieldError?.field === "price" && <span className="dash-input-popover" role="alert">{fieldError.message}</span>}
              </label>
            </div>
            <label className="dash-field" data-error-field="name">{t.productName}
              <input name="name" required defaultValue={product?.name ?? ""} placeholder="Washed linen cushion"/>
              {fieldError?.field === "name" && <span className="dash-input-popover" role="alert">{fieldError.message}</span>}
            </label>
            <div className="dash-row-2">
              <label className="dash-field" data-error-field="slug">{t.slug}
                <input name="slug" defaultValue={product?.slug ?? ""} placeholder="washed-linen-cushion"/>
                {fieldError?.field === "slug" && <span className="dash-input-popover" role="alert">{fieldError.message}</span>}
              </label>
              <label className="dash-field">{t.compareAt}
                <input name="old_price" type="number" min="0" step="0.01" defaultValue={product?.old_price ?? ""} inputMode="decimal"/>
              </label>
            </div>
            <label className="dash-field">{t.description}
              <textarea name="description" defaultValue={product?.description ?? ""}/>
            </label>
            <label className="dash-check"><input type="checkbox" name="is_new" defaultChecked={Boolean(product?.is_new)}/> {t.markNew}</label>
          </section>
        </div>
        <aside className="dash-grid">
          <ProductImages images={images} onChange={(next) => { setImages(next); if (next.length) clearFieldError("image"); }} errorMessage={fieldError?.field === "image" ? fieldError.message : undefined}/>
        </aside>
        <div className="dash-actions dash-form-save">
          <button className="dash-btn primary" type="submit" disabled={pending}><Icon name="check" size={17}/> {pending ? t.saving : t.saveProduct}</button>
        </div>
      </form>
    </div>
  );
}
