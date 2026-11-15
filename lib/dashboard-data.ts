import type { DashCopy } from "@/lib/dashboard-i18n";

export const ORDER_STATUSES = ["new", "confirmed", "shipped", "delivered", "cancelled", "refused", "returned"] as const;
export type OrderStatusKey = (typeof ORDER_STATUSES)[number];
/** Orders that did not (or no longer) bring in money. */
export const DEAD_STATUSES = ["cancelled", "refused", "returned"];
export const isDeadStatus = (status: string) => DEAD_STATUSES.includes(status);

export const FLOW = ["new", "confirmed", "shipped", "delivered"] as const;

export const PAGE_SIZE = 20;

export type OrderFilters = { status: string; q: string; range: string; page: number };

type Params = Record<string, string | string[] | undefined>;

function one(value: string | string[] | undefined) {
  return (Array.isArray(value) ? value[0] : value) ?? "";
}

export function parseOrderFilters(params: Params): OrderFilters {
  const status = one(params.status);
  const range = one(params.range);
  return {
    status: (ORDER_STATUSES as readonly string[]).includes(status) ? status : "",
    q: one(params.q).trim().slice(0, 80),
    range: ["today", "7", "30", "90"].includes(range) ? range : "",
    page: Math.max(1, Number.parseInt(one(params.page), 10) || 1),
  };
}

/** Keeps characters PostgREST's `or()` grammar would choke on out of the search term. */
function safeTerm(value: string) {
  return value.replace(/[,()%*\\:"']/g, " ").replace(/\s+/g, " ").trim();
}

export function rangeStart(range: string): Date | null {
  const days = range === "today" ? 0 : range === "7" ? 6 : range === "30" ? 29 : range === "90" ? 89 : null;
  if (days === null) return null;
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - days);
  return start;
}

// The Supabase builder type is intentionally loose here: we only chain filters on it.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function applyOrderFilters<T extends { eq: any; or: any; gte: any }>(query: T, filters: Pick<OrderFilters, "status" | "q" | "range">): T {
  let next = query;
  if (filters.status) next = next.eq("status", filters.status);
  const start = rangeStart(filters.range);
  if (start) next = next.gte("created_at", start.toISOString());
  const term = safeTerm(filters.q);
  if (term) next = next.or(`order_number.ilike.%${term}%,customer_name.ilike.%${term}%,phone.ilike.%${term}%`);
  return next;
}

export function filtersToQuery(filters: Partial<OrderFilters>, overrides: Partial<OrderFilters> = {}) {
  const merged = { ...filters, ...overrides };
  const params = new URLSearchParams();
  if (merged.status) params.set("status", merged.status);
  if (merged.q) params.set("q", merged.q);
  if (merged.range) params.set("range", merged.range);
  if (merged.page && merged.page > 1) params.set("page", String(merged.page));
  const text = params.toString();
  return text ? `?${text}` : "";
}

export function nextStatus(status: string): OrderStatusKey | null {
  const index = FLOW.indexOf(status as (typeof FLOW)[number]);
  if (index === -1 || index === FLOW.length - 1) return null;
  return FLOW[index + 1] ?? null;
}

export function nextStatusLabel(t: DashCopy, status: string) {
  if (status === "new") return t.actConfirm;
  if (status === "confirmed") return t.actShip;
  if (status === "shipped") return t.actDeliver;
  return "";
}

/** Digits only, with Tunisia's +216 added for local 8-digit numbers. */
export function whatsappNumber(phone: string) {
  let digits = phone.replace(/\D/g, "");
  if (digits.startsWith("00")) digits = digits.slice(2);
  if (digits.length === 8) digits = `216${digits}`;
  return digits;
}

export function whatsappLink(phone: string, text = "") {
  const base = `https://wa.me/${whatsappNumber(phone)}`;
  return text ? `${base}?text=${encodeURIComponent(text)}` : base;
}

export function telLink(phone: string) {
  return `tel:${phone.replace(/[^\d+]/g, "")}`;
}

export function initials(value: string) {
  const parts = value.trim().split(/\s+/).filter(Boolean);
  return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase() || "•";
}

export function percentChange(current: number, previous: number) {
  if (!previous) return current ? 100 : 0;
  return ((current - previous) / previous) * 100;
}
