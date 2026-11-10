import type { Lang } from "@/lib/store-i18n";

/** "49 DT" in French, "49 د.ت" in Arabic. Western digits in both languages. */
export function money(amount: number, lang: Lang = "fr") {
  const text = new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 2, useGrouping: false }).format(amount);
  return `${text} ${lang === "ar" ? "د.ت" : "DT"}`;
}

export function discountPercent(price: number, oldPrice?: number) {
  return oldPrice && oldPrice > price ? Math.round((1 - price / oldPrice) * 100) : 0;
}
