import { site } from "@/config/site";
import type { Product } from "@/lib/types";

export type CartLine = { id: string; quantity: number };

export function totals(lines: CartLine[], catalog: Product[], coupon = "") {
  const subtotal = Math.round(lines.reduce((sum, line) => sum + (catalog.find((product) => product.id === line.id)?.price ?? 0) * line.quantity, 0) * 100) / 100;
  const discount = Math.round(subtotal * (coupon === "WELCOME10" ? 0.1 : coupon === "HOME15" && subtotal >= 200 ? 0.15 : 0) * 100) / 100;
  const shipping = subtotal > 0 ? site.shipping : 0;
  return { subtotal, discount, shipping, total: Math.round((subtotal - discount + shipping) * 100) / 100 };
}

export const money = (amount: number) => `${new Intl.NumberFormat("en", { maximumFractionDigits: 2 }).format(amount)} ${site.currency}`;
