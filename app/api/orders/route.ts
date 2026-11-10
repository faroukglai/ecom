import { createClient } from "@/lib/supabase/server";

const bad = (error: string) => Response.json({ error }, { status: 400 });

// Pricing, coupon rules and the order insert all happen inside the database function
// public.place_order (see supabase/migrations/20261110120000_*), in one transaction.
// This route only checks the request shape and forwards it.
export async function POST(request: Request) {
  try {
    const body: unknown = await request.json();
    if (!body || typeof body !== "object") return bad("Invalid order.");
    const data = body as Record<string, unknown>;

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
    // Coupons were removed from the storefront; the database function still accepts the argument.
    const coupon = "";

    const supabase = await createClient();
    const { data: rows, error } = await supabase.rpc("place_order", {
      p_name: str(customer.name),
      p_phone: str(customer.phone),
      p_location: str(customer.location),
      p_lines: lines,
      p_coupon: coupon,
    });

    if (error) {
      // 22023 = validation failure raised by place_order; the message is safe to show.
      if (error.code === "22023") return bad(error.message);
      return Response.json({ error: "We couldn’t save this order. Please try again." }, { status: 500 });
    }
    const order = Array.isArray(rows) ? rows[0] : rows;
    if (!order) return Response.json({ error: "We couldn’t save this order. Please try again." }, { status: 500 });

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
    return Response.json({ error: "We couldn’t save this order. Please try again." }, { status: 500 });
  }
}
