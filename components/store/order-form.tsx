"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/icons";
import { ProductMedia } from "@/components/product-media";
import { site } from "@/config/site";
import { track } from "@/lib/analytics";
import { hasWhatsapp, whatsappHref } from "@/lib/contact";
import { money } from "@/lib/format";
import { GOVERNORATES, fill, getCopy, localePath, type Lang } from "@/lib/store-i18n";

export type OrderProduct = { id: string; name: string; price: number; image: string };
type Errors = Partial<Record<"name" | "phone" | "region" | "city" | "address", string>>;

const DRAFT_KEY = "darivo-draft";
const FIELDS = ["name", "phone", "region", "city", "address", "landmark"] as const;

/** Accepts "22 123 456", "+216 22123456" or "0021622123456" and returns the 8 local digits. */
export function normalizePhone(raw: string) {
  let digits = raw.replace(/\D/g, "");
  if (digits.startsWith("00216")) digits = digits.slice(5);
  else if (digits.startsWith("216") && digits.length === 11) digits = digits.slice(3);
  return digits.length === 8 ? digits : null;
}

export function OrderForm({ product, addons, lang }: { product: OrderProduct; addons: OrderProduct[]; lang: Lang }) {
  const t = getCopy(lang);
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const started = useRef(false);
  const [quantity, setQuantity] = useState(1);
  const [picked, setPicked] = useState<string[]>([]);
  const [pending, setPending] = useState(false);
  const [errors, setErrors] = useState<Errors>({});
  const [formError, setFormError] = useState("");
  const [offline, setOffline] = useState(false);
  // False on the server and during hydration: tapping "order" before the page is interactive must never fall back to a plain form submit.
  const ready = useSyncExternalStore(() => () => {}, () => true, () => false);

  const chosen = addons.filter((addon) => picked.includes(addon.id));
  const subtotal = product.price * quantity + chosen.reduce((sum, addon) => sum + addon.price, 0);
  const total = subtotal + site.shipping;

  // Bring back what the customer typed last time (a dropped connection or a reload must never cost them their details).
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(DRAFT_KEY) ?? "null") as Record<string, string> | null;
      if (!saved) return;
      for (const key of FIELDS) {
        const el = formRef.current?.elements.namedItem(key) as HTMLInputElement | HTMLSelectElement | null;
        if (el && typeof saved[key] === "string" && !el.value) el.value = saved[key];
      }
    } catch {
      // No storage, no draft. The form still works.
    }
  }, []);

  useEffect(() => () => { if (saveTimer.current) clearTimeout(saveTimer.current); }, []);

  function saveDraft() {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      const form = formRef.current;
      if (!form) return;
      const draft: Record<string, string> = {};
      for (const key of FIELDS) draft[key] = String((form.elements.namedItem(key) as HTMLInputElement | null)?.value ?? "");
      try {
        localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
      } catch {
        // Ignore: a full or blocked storage only means no draft.
      }
    }, 400);
  }

  // First time the customer touches the form: this is the "started ordering" step of the sales funnel.
  function startCheckout() {
    if (started.current) return;
    started.current = true;
    track("InitiateCheckout", { content_ids: [product.id], content_type: "product", value: total, currency: "TND", num_items: quantity + chosen.length });
  }

  function toggle(id: string) {
    setPicked((current) => (current.includes(id) ? current.filter((item) => item !== id) : [...current, id]));
  }

  const whatsappLink = () => {
    const items = [`${product.name} × ${quantity}`, ...chosen.map((addon) => addon.name)].join(", ");
    return whatsappHref(fill(t.waMessage, { items, total: money(total, lang) }));
  };

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    const form = new FormData(event.currentTarget);
    const get = (key: string) => String(form.get(key) ?? "").trim();
    const name = get("name");
    const region = get("region");
    const city = get("city");
    const address = get("address");
    const landmark = get("landmark");
    const phone = normalizePhone(get("phone"));

    const next: Errors = {};
    if (name.length < 2) next.name = t.errName;
    if (!phone) next.phone = t.errPhone;
    if (!region) next.region = t.errRegion;
    if (city.length < 2) next.city = t.errCity;
    if (address.length < 4) next.address = t.errAddress;
    setErrors(next);
    setFormError("");
    setOffline(false);
    const firstError = Object.keys(next)[0];
    if (firstError) {
      (event.currentTarget.elements.namedItem(firstError) as HTMLElement | null)?.focus();
      return;
    }

    setPending(true);
    try {
      const location = [region, city, address, landmark].filter(Boolean).join(" · ");
      const lines = [{ id: product.id, quantity }, ...chosen.map((addon) => ({ id: addon.id, quantity: 1 }))];
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lines, customer: { name, phone: `+216${phone}`, location } }),
      });
      const result: { orderNumber?: string; total?: number; shipping?: number } = await response.json().catch(() => ({}));
      if (!response.ok || !result.orderNumber) {
        setFormError(t.errServer);
        setOffline(true);
        return;
      }
      try {
        localStorage.setItem(
          "darivo-last-order",
          JSON.stringify({
            orderNumber: result.orderNumber,
            total: result.total ?? total,
            shipping: result.shipping ?? site.shipping,
            lines: [
              { name: product.name, quantity, unitPrice: product.price },
              ...chosen.map((addon) => ({ name: addon.name, quantity: 1, unitPrice: addon.price })),
            ],
          }),
        );
      } catch {
        // The confirmation page still works without storage; it just cannot show the summary.
      }
      router.push(localePath(lang, `/order/${result.orderNumber}`));
    } catch {
      setFormError(t.errNetwork);
      setOffline(true);
    } finally {
      setPending(false);
    }
  }

  const field = (key: keyof Errors) => ({ "data-invalid": Boolean(errors[key]) });

  return (
    <form ref={formRef} method="post" className="st-form" id="order-form" onSubmit={submit} onInput={saveDraft} onChange={saveDraft} onFocus={startCheckout} noValidate aria-busy={pending}>
      <h2>{t.formTitle}</h2>
      <p className="sub">{t.formSub}</p>

      <label className="st-field" {...field("name")}>
        {t.name}
        <input name="name" autoComplete="name" placeholder={t.namePh} maxLength={120} aria-invalid={Boolean(errors.name)}/>
        {errors.name ? <span className="err" role="alert">{errors.name}</span> : null}
      </label>

      <label className="st-field" {...field("phone")}>
        {t.phone}
        <input name="phone" type="tel" inputMode="tel" autoComplete="tel" placeholder="22 123 456" dir="ltr" style={lang === "ar" ? { textAlign: "right" } : undefined} aria-invalid={Boolean(errors.phone)}/>
        {errors.phone ? <span className="err" role="alert">{errors.phone}</span> : <span className="hint">{t.phoneHint}</span>}
      </label>

      <div className="st-two">
        <label className="st-field" {...field("region")}>
          {t.region}
          <select name="region" defaultValue="" autoComplete="address-level1" aria-invalid={Boolean(errors.region)}>
            <option value="" disabled>{t.regionPh}</option>
            {GOVERNORATES.map((item) => <option key={item.fr} value={item.fr}>{lang === "ar" ? item.ar : item.fr}</option>)}
          </select>
          {errors.region ? <span className="err" role="alert">{errors.region}</span> : null}
        </label>
        <label className="st-field" {...field("city")}>
          {t.city}
          <input name="city" autoComplete="address-level2" placeholder={t.cityPh} maxLength={80} aria-invalid={Boolean(errors.city)}/>
          {errors.city ? <span className="err" role="alert">{errors.city}</span> : null}
        </label>
      </div>

      <label className="st-field" {...field("address")}>
        {t.address}
        <input name="address" autoComplete="street-address" placeholder={t.addressPh} maxLength={200} aria-invalid={Boolean(errors.address)}/>
        {errors.address ? <span className="err" role="alert">{errors.address}</span> : null}
      </label>

      <label className="st-field">
        {t.landmark}
        <input name="landmark" placeholder={t.landmarkPh} maxLength={120}/>
      </label>

      <div className="st-qty-row">
        <span style={{ fontWeight: 700 }}>{t.qty}</span>
        <div className="st-qty">
          <button type="button" aria-label={t.decrease} disabled={quantity <= 1} onClick={() => setQuantity((value) => Math.max(1, value - 1))}><Icon name="minus" size={20}/></button>
          <output aria-live="polite">{quantity}</output>
          <button type="button" aria-label={t.increase} disabled={quantity >= 20} onClick={() => setQuantity((value) => Math.min(20, value + 1))}><Icon name="plus" size={20}/></button>
        </div>
      </div>

      {addons.length ? (
        <fieldset className="st-addons">
          <legend>{t.addonsTitle}</legend>
          <p className="hint">{t.addonsHint}</p>
          {addons.map((addon) => (
            <label key={addon.id} className="st-addon" data-on={picked.includes(addon.id)}>
              <input type="checkbox" checked={picked.includes(addon.id)} onChange={() => toggle(addon.id)}/>
              <span className="st-addon-img"><ProductMedia src={addon.image} alt="" fill sizes="56px"/></span>
              <span className="st-addon-name">{addon.name}</span>
              <strong>{money(addon.price, lang)}</strong>
            </label>
          ))}
        </fieldset>
      ) : null}

      <div className="st-summary">
        <div><span>{product.name} × {quantity}</span><span>{money(product.price * quantity, lang)}</span></div>
        {chosen.map((addon) => <div key={addon.id}><span>{addon.name}</span><span>{money(addon.price, lang)}</span></div>)}
        <div><span>{t.shipping}</span><span>{money(site.shipping, lang)}</span></div>
        <div className="total"><span>{t.total}</span><strong>{money(total, lang)}</strong></div>
      </div>

      {formError ? (
        <div className="st-form-error" role="alert">
          <p>{formError}</p>
          {offline && hasWhatsapp() ? <a className="st-link" href={whatsappLink()} target="_blank" rel="noreferrer">{t.errNetworkWa}</a> : null}
        </div>
      ) : null}

      <button className="st-btn primary block" type="submit" disabled={pending || !ready}>
        {pending ? t.sending : <>{t.submit} <Icon name="arrowRight" size={20} className="st-flip"/></>}
      </button>
      {hasWhatsapp() ? (
        <a className="st-btn wa block" href={whatsappLink()} target="_blank" rel="noreferrer"><Icon name="whatsapp" size={20}/> {t.orderWhatsapp}</a>
      ) : null}
      <p className="st-note"><Icon name="badge" size={18}/> {t.noCard}</p>
    </form>
  );
}
