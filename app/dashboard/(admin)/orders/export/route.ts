import { requireAdmin } from "@/lib/auth";
import { applyOrderFilters, parseOrderFilters } from "@/lib/dashboard-data";

/** Spreadsheet apps run cells that start with these characters as formulas, so neutralise them. */
function cell(value: unknown) {
  let text = value == null ? "" : String(value);
  if (/^[=+\-@\t\r]/.test(text)) text = `'${text}`;
  return `"${text.replace(/"/g, '""')}"`;
}

export async function GET(request: Request) {
  const { supabase } = await requireAdmin();
  const filters = parseOrderFilters(Object.fromEntries(new URL(request.url).searchParams));
  const { data, error } = await applyOrderFilters(supabase.from("orders").select("*"), filters)
    .order("created_at", { ascending: false })
    .limit(5000);
  if (error) return new Response("Export failed", { status: 500 });

  const header = ["order_number", "created_at", "customer_name", "phone", "location", "status", "note", "subtotal", "discount", "coupon", "shipping", "total", "payment_method"];
  const rows = (data ?? []).map((order: Record<string, unknown>) => header.map((key) => cell(order[key])).join(","));
  const body = `﻿${[header.join(","), ...rows].join("\r\n")}\r\n`;
  const stamp = new Date().toISOString().slice(0, 10);

  return new Response(body, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="darivo-orders-${stamp}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
