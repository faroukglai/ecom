import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { money } from "@/lib/pricing";

export default async function OrdersPage() {
  const { supabase } = await requireAdmin();
  const { data } = await supabase.from("orders").select("*").order("created_at", { ascending: false });
  const orders = data ?? [];
  return (
    <>
      <div className="dash-topbar">
        <div>
          <div className="dash-crumb">Orders</div>
          <h1>Orders</h1>
        </div>
      </div>
      <section className="dash-card">
        {orders.length ? (
          <table className="dash-table">
            <thead><tr><th>Order</th><th>Customer</th><th>Phone</th><th>Location</th><th>Total</th><th>Status</th></tr></thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id}>
                  <td><Link href={`/dashboard/orders/${order.id}`}>{order.order_number}</Link></td>
                  <td>{order.customer_name}</td>
                  <td>{order.phone}</td>
                  <td>{order.location}</td>
                  <td>{money(Number(order.total))}</td>
                  <td><span className={`dash-status ${order.status}`}>{order.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : <div className="dash-empty">When a customer places a cash-on-delivery order, it will land here.</div>}
      </section>
    </>
  );
}
