import { products } from "@/data/catalog";
import { site } from "@/config/site";
export type CartLine = { id: string; quantity: number };
export function totals(lines: CartLine[], coupon = "") {
  const subtotal = Math.round(lines.reduce((sum, line) => sum + (products.find(p => p.id === line.id)?.price ?? 0) * line.quantity, 0) * 100) / 100;
  const discount = Math.round(subtotal * (coupon === "WELCOME10" ? .1 : coupon === "HOME15" && subtotal >= 200 ? .15 : 0) * 100) / 100;
  const shipping = !subtotal || subtotal >= site.freeShipping || coupon === "FREESHIP" ? 0 : site.shipping;
  return { subtotal, discount, shipping, total: Math.round((subtotal - discount + shipping) * 100) / 100 };
}
export const money = (amount: number) => `${new Intl.NumberFormat("en", { maximumFractionDigits: 2 }).format(amount)} ${site.currency}`;
