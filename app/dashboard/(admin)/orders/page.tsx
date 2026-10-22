import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { dashMoney, orderStatusLabel } from "@/lib/dashboard-i18n";
import { getDashCopy } from "@/lib/dashboard-lang";

export default async function OrdersPage() {
  const { lang, t } = await getDashCopy();
  const { supabase } = await requireAdmin();
  const { data } = await supabase.from("orders").select("*").order("created_at", { ascending: false });
  const orders = data ?? [];
  return (
    <>
      <div className="dash-topbar">
        <div>
          <div className="dash-crumb">{t.navOrders}</div>
          <h1>{t.ordersTitle}</h1>
        </div>
      </div>
      <section className="dash-card">
        {orders.length ? (
          <div className="dash-table-wrap">
          <table className="dash-table">
            <thead><tr><th>{t.colOrder}</th><th>{t.colCustomer}</th><th>{t.colPhone}</th><th>{t.colLocation}</th><th>{t.colTotal}</th><th>{t.colStatus}</th></tr></thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id}>
                  <td><Link href={`/dashboard/orders/${order.id}`}>{order.order_number}</Link></td>
                  <td>{order.customer_name}</td>
                  <td>{order.phone}</td>
                  <td>{order.location}</td>
                  <td>{dashMoney(Number(order.total), lang)}</td>
                  <td><span className={`dash-status ${order.status}`}>{orderStatusLabel(t, order.status)}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        ) : <div className="dash-empty">{t.ordersEmpty}</div>}
      </section>
    </>
  );
}
