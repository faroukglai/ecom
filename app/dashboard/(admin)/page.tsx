import { Suspense } from "react";
import Link from "next/link";
import { SetupNotice } from "@/components/dashboard/setup-notice";
import { requireAdmin } from "@/lib/auth";
import { money } from "@/lib/pricing";

export default function DashboardHome() {
  return (
    <Suspense fallback={<p>Loading analytics…</p>}>
      <Analytics/>
    </Suspense>
  );
}

async function Analytics() {
  const { supabase } = await requireAdmin();
  const [{ count: productCount, error: productError }, { count: categoryCount }, { data: orders, error: orderError }] = await Promise.all([
    supabase.from("products").select("id", { count: "exact", head: true }),
    supabase.from("categories").select("id", { count: "exact", head: true }),
    supabase.from("orders").select("id, order_number, customer_name, total, status, created_at").order("created_at", { ascending: false }),
  ]);
  if (productError || orderError) {
    return (
      <>
        <div className="dash-topbar"><div><div className="dash-crumb">Overview</div><h1>Dashboard</h1></div></div>
        <SetupNotice message={productError?.message ?? orderError?.message}/>
      </>
    );
  }
  const list = orders ?? [];
  const revenue = list.reduce((sum, order) => sum + Number(order.total), 0);
  const pending = list.filter((order) => order.status === "new").length;
  const days = Array.from({ length: 7 }, (_, index) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - index));
    const key = date.toISOString().slice(0, 10);
    const count = list.filter((order) => String(order.created_at).startsWith(key)).length;
    return { label: date.toLocaleDateString("en", { weekday: "short" }), count };
  });
  const max = Math.max(1, ...days.map((day) => day.count));

  return (
    <>
      <div className="dash-topbar">
        <div>
          <div className="dash-crumb">Overview</div>
          <h1>Dashboard</h1>
        </div>
        <Link className="dash-btn primary" href="/dashboard/products/new">Add product</Link>
      </div>
      <div className="dash-grid dash-kpis">
        <article className="dash-card dash-kpi"><span>Orders</span><strong>{list.length}</strong><b>{pending} waiting</b></article>
        <article className="dash-card dash-kpi"><span>Revenue</span><strong>{money(revenue)}</strong><b>Cash on delivery</b></article>
        <article className="dash-card dash-kpi"><span>Products</span><strong>{productCount ?? 0}</strong><b>Live catalog</b></article>
        <article className="dash-card dash-kpi"><span>Categories</span><strong>{categoryCount ?? 0}</strong><b>Storefront sync</b></article>
      </div>
      <div className="dash-grid dash-split" style={{marginTop:16}}>
        <section className="dash-card">
          <h2 style={{fontSize:18}}>Recent orders</h2>
          {list.length ? (
            <table className="dash-table">
              <thead><tr><th>Order</th><th>Customer</th><th>Total</th><th>Status</th></tr></thead>
              <tbody>
                {list.slice(0, 8).map((order) => (
                  <tr key={order.id}>
                    <td><Link href={`/dashboard/orders/${order.id}`}>{order.order_number}</Link></td>
                    <td>{order.customer_name}</td>
                    <td>{money(Number(order.total))}</td>
                    <td><span className={`dash-status ${order.status}`}>{order.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : <div className="dash-empty">No orders yet. The next checkout will appear here.</div>}
        </section>
        <section className="dash-card">
          <h2 style={{fontSize:18}}>Orders this week</h2>
          <div className="dash-bars">
            {days.map((day) => (
              <span key={day.label} style={{height:`${Math.max(8, (day.count / max) * 100)}%`}}><i>{day.label}</i></span>
            ))}
          </div>
        </section>
      </div>
    </>
  );
}
