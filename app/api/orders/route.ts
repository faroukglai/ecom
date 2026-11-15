import { createHash } from "node:crypto";
import { after } from "next/server";
import { getStoreCatalog } from "@/lib/catalog";
import { notifyNewOrder } from "@/lib/notify";
import { createClient } from "@/lib/supabase/server";

const bad = (error: string) => Response.json({ error }, { status: 400 });
const failed = () => Response.json({ error: "We couldn’t save this order. Please try again." }, { status: 500 });

/** One-way hash of the visitor's network address, used only to spot floods of orders. The address itself is never stored. */
function networkHash(request: Request) {
  const ip = (request.headers.get("x-forwarded-for") ?? "").split(",")[0]?.trim() || request.headers.get("x-real-ip") || "";
  if (!ip) return null;
  return createHash("sha256").update(`${process.env.ORDER_HASH_SALT ?? "darivo"}:${ip}`).digest("hex").slice(0, 32);
}

// Pricing, coupon rules, duplicate/spam checks and the order insert all happen inside the database function
// public.place_order (see supabase/migrations), in one transaction.
// This route checks the request shape, forwards it, and alerts the owner.
export async function POST(request: Request) {
  try {
    const body: unknown = await request.json();
    if (!body || typeof body !== "object") return bad("Invalid order.");
    const data = body as Record<string, unknown>;

    // Hidden field that real customers never see. Bots fill it; pretend it worked and drop the order.
    if (typeof data.website === "string" && data.website.trim()) {
      return Response.json({ orderNumber: `DR-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-00000000`, total: 0, shipping: 0, status: "new" }, { status: 201 });
    }

    if (!Array.isArray(data.lines) || !data.lines.length || data.lines.length > 30) return bad("Your cart needs at least one item.");
    const lines: { id: string; quantity: number }[] = [];
    for (const value of data.lines) {
      const line = value && typeof value === "object" ? (value as Record<string, unknown>) : null;
      if (!line || typeof line.id !== "string" || typeof line.quantity !== "number" || !Number.isInteger(line.quantity)) {
        return bad("Please check your cart quantities.");
      }
      lines.push({ id: line.id, quantity: line.quantity });
    }

    const customer = data.customer && typeof data.customer === "object" ? (data.customer as Record<string, unknown>) : null;
    if (!customer) return bad("Please fill in your contact details.");
    const str = (value: unknown) => (typeof value === "string" ? value : "");

    const supabase = await createClient();
    const { data: rows, error } = await supabase.rpc("place_order", {
      p_name: str(customer.name),
      p_phone: str(customer.phone),
      p_location: str(customer.location),
      p_lines: lines,
      // Coupons were removed from the storefront; the database function still accepts the argument.
      p_coupon: "",
      p_ip_hash: networkHash(request),
    });

    if (error) {
      // 22023 = validation failure raised by place_order; the message is safe to show.
      if (error.code === "22023") return bad(error.message);
      // 54000 = too many orders from this phone or network.
      if (error.code === "54000") return Response.json({ error: "rate_limited" }, { status: 429 });
      return failed();
    }
    const order = Array.isArray(rows) ? rows[0] : rows;
    if (!order) return failed();

    // A repeated tap returns the order that already exists; the owner was alerted the first time.
    if (!order.already_exists) {
      after(async () => {
        let names = new Map<string, string>();
        try {
          const { products } = await getStoreCatalog();
          names = new Map(products.map((product) => [product.id, product.name]));
        } catch {
          // Names are a nicety; ids are enough for the alert.
        }
        await notifyNewOrder({
          orderNumber: order.order_number,
          name: str(customer.name),
          phone: str(customer.phone),
          location: str(customer.location),
          total: Number(order.total),
          items: lines.map((line) => `${names.get(line.id) ?? line.id} × ${line.quantity}`),
        });
      });
    }

    return Response.json(
      {
        orderNumber: order.order_number,
        subtotal: Number(order.subtotal),
        discount: Number(order.discount),
        shipping: Number(order.shipping),
        total: Number(order.total),
        status: "new",
      },
      { status: 201 },
    );
  } catch {
    return failed();
  }
}
