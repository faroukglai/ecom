import type { SupabaseClient } from "@supabase/supabase-js";
import { fill, type DashCopy } from "@/lib/dashboard-i18n";

export type PhoneHistory = Map<string, { total: number; bad: number }>;

const isBad = (status: string) => status === "refused" || status === "returned";

/** How many orders each phone number has placed, and how many were refused or returned. Used to warn before shipping. */
export async function phoneHistory(supabase: SupabaseClient, phones: string[]): Promise<PhoneHistory> {
  const history: PhoneHistory = new Map();
  const unique = [...new Set(phones.filter(Boolean))];
  if (!unique.length) return history;
  const { data } = await supabase.from("orders").select("phone, status").in("phone", unique).limit(3000);
  for (const row of (data ?? []) as { phone: string; status: string }[]) {
    const entry = history.get(row.phone) ?? { total: 0, bad: 0 };
    entry.total += 1;
    if (isBad(row.status)) entry.bad += 1;
    history.set(row.phone, entry);
  }
  return history;
}

/** Warning text for one order, ignoring the order itself. Null when this is a first-time, clean customer. */
export function riskFor(history: PhoneHistory, phone: string, ownStatus: string, t: DashCopy) {
  const entry = history.get(phone);
  if (!entry) return null;
  const others = entry.total - 1;
  const bad = entry.bad - (isBad(ownStatus) ? 1 : 0);
  if (bad > 0) return { level: "high" as const, text: fill(t.riskRefused, { n: bad }) };
  if (others > 0) return { level: "info" as const, text: fill(t.ordersBefore, { n: others }) };
  return null;
}
