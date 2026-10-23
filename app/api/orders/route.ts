import { randomUUID } from "node:crypto";
import { site } from "@/config/site";
import { getStoreCatalog } from "@/lib/catalog";
import { totals, type CartLine } from "@/lib/pricing";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const body: unknown = await request.json();
    if (!body || typeof body !== "object") return Response.json({ error: "Invalid order." }, { status: 400 });
    const data = body as Record<string, unknown>;
    if (!Array.isArray(data.lines) || !data.lines.length || data.lines.length > 30) {
      return Response.json({ error: "Your cart needs at least one item." }, { status: 400 });
    }

    const { products } = await getStoreCatalog();
    const lines: CartLine[] = [];
    for (const value of data.lines) {
      if (!value || typeof value !== "object") return Response.json({ error: "Invalid item." }, { status: 400 });
      const line = value as Record<string, unknown>;
      if (
        typeof line.id !== "string" ||
        !products.some((product) => product.id === line.id) ||
        typeof line.quantity !== "number" ||
        !Number.isInteger(line.quantity) ||
        line.quantity < 1 ||
        line.quantity > 20 ||
        lines.some((existing) => existing.id === line.id)
      ) {
        return Response.json({ error: "Please check your cart quantities." }, { status: 400 });
      }
      lines.push({ id: line.id, quantity: line.quantity });
    }

    if (!data.customer || typeof data.customer !== "object") {
      return Response.json({ error: "Please fill in your contact details." }, { status: 400 });
    }
    const customer = data.customer as Record<string, unknown>;
    const name = typeof customer.name === "string" ? customer.name.trim() : "";
    const phone = typeof customer.phone === "string" ? customer.phone.trim() : "";
    const location = typeof customer.location === "string" ? customer.location.trim() : "";
    if (name.length < 2 || name.length > 120) return Response.json({ error: "Please enter your name." }, { status: 400 });
    if (!/^[+0-9 ()-]{8,20}$/.test(phone)) return Response.json({ error: "Please enter a valid phone number." }, { status: 400 });
    if (location.length < 4 || location.length > 400) return Response.json({ error: "Please enter your location." }, { status: 400 });

    const coupon = typeof data.coupon === "string" ? data.coupon.toUpperCase() : "";
    if (coupon && !["WELCOME10", "HOME15", "FREESHIP"].includes(coupon)) {
      return Response.json({ error: "That discount code is not valid." }, { status: 400 });
    }
    const pricing = totals(lines, products, coupon);
    if (coupon === "HOME15" && pricing.subtotal < 200) {
      return Response.json({ error: "HOME15 needs a subtotal of 200 TND." }, { status: 400 });
    }
    if (pricing.shipping !== site.shipping) {
      return Response.json({ error: "Delivery could not be calculated." }, { status: 400 });
    }

    const orderNumber = `DR-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-${randomUUID().slice(0, 8).toUpperCase()}`;
    const supabase = await createClient();
    const { data: order, error } = await supabase
      .from("orders")
      .insert({
        order_number: orderNumber,
        customer_name: name,
        phone,
        location,
        subtotal: pricing.subtotal - pricing.discount,
        shipping: pricing.shipping,
        total: pricing.total,
        status: "new",
        payment_method: "cod",
      })
      .select("id, order_number")
      .single();
    if (error || !order) return Response.json({ error: "We couldn’t save this order. Please try again." }, { status: 500 });

    const items = lines.map((line) => {
      const product = products.find((entry) => entry.id === line.id)!;
      return {
        order_id: order.id,
        product_id: product.id,
        product_name: product.name,
        product_image: product.image,
        quantity: line.quantity,
        unit_price: product.price,
      };
    });
    const { error: itemError } = await supabase.from("order_items").insert(items);
    if (itemError) return Response.json({ error: "We couldn’t save this order. Please try again." }, { status: 500 });

    return Response.json({ orderNumber: order.order_number, ...pricing, status: "new" }, { status: 201 });
  } catch {
    return Response.json({ error: "We couldn’t save this order. Please try again." }, { status: 500 });
  }
}
