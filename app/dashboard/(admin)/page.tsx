import { Suspense } from "react";
import Link from "next/link";
import { SetupNotice } from "@/components/dashboard/setup-notice";
import { requireAdmin } from "@/lib/auth";
import { dashMoney, fill, orderStatusLabel } from "@/lib/dashboard-i18n";
import { getDashCopy } from "@/lib/dashboard-lang";

export default async function DashboardHome() {
  const { t } = await getDashCopy();
  return (
    <Suspense fallback={<p>{t.loadingAnalytics}</p>}>
      <Analytics/>
    </Suspense>
  );
}

async function Analytics() {
  const { lang, t } = await getDashCopy();
  const { supabase } = await requireAdmin();
  const [{ count: productCount, error: productError }, { count: categoryCount }, { data: orders, error: orderError }] = await Promise.all([
    supabase.from("products").select("id", { count: "exact", head: true }),
    supabase.from("categories").select("id", { count: "exact", head: true }),
    supabase.from("orders").select("id, order_number, customer_name, total, status, created_at").order("created_at", { ascending: false }),
  ]);
  if (productError || orderError) {
    return (
      <>
        <div className="dash-topbar"><div><div className="dash-crumb">{t.overview}</div><h1>{t.dashboard}</h1></div></div>
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
    return { label: date.toLocaleDateString(lang === "ar" ? "ar-TN" : "en", { weekday: "short" }), count };
  });
  const max = Math.max(1, ...days.map((day) => day.count));

  return (
    <>
      <div className="dash-topbar">
        <div>
          <div className="dash-crumb">{t.overview}</div>
          <h1>{t.dashboard}</h1>
        </div>
        <Link className="dash-btn primary" href="/dashboard/products/new">{t.addProduct}</Link>
      </div>
      <div className="dash-grid dash-kpis">
        <article className="dash-card dash-kpi"><span>{t.kpiOrders}</span><strong>{list.length}</strong><b>{fill(t.kpiWaiting, { n: pending })}</b></article>
        <article className="dash-card dash-kpi"><span>{t.kpiRevenue}</span><strong>{dashMoney(revenue, lang)}</strong><b>{t.kpiCod}</b></article>
        <article className="dash-card dash-kpi"><span>{t.kpiProducts}</span><strong>{productCount ?? 0}</strong><b>{t.kpiLiveCatalog}</b></article>
        <article className="dash-card dash-kpi"><span>{t.kpiCategories}</span><strong>{categoryCount ?? 0}</strong><b>{t.kpiStorefrontSync}</b></article>
      </div>
      <div className="dash-grid dash-split" style={{marginTop:16}}>
        <section className="dash-card">
          <h2 style={{fontSize:18}}>{t.recentOrders}</h2>
          {list.length ? (
            <div className="dash-table-wrap">
            <table className="dash-table">
              <thead><tr><th>{t.colOrder}</th><th>{t.colCustomer}</th><th>{t.colTotal}</th><th>{t.colStatus}</th></tr></thead>
              <tbody>
                {list.slice(0, 8).map((order) => (
                  <tr key={order.id}>
                    <td><Link href={`/dashboard/orders/${order.id}`}>{order.order_number}</Link></td>
                    <td>{order.customer_name}</td>
                    <td>{dashMoney(Number(order.total), lang)}</td>
                    <td><span className={`dash-status ${order.status}`}>{orderStatusLabel(t, order.status)}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          ) : <div className="dash-empty">{t.noOrdersYet}</div>}
        </section>
        <section className="dash-card">
          <h2 style={{fontSize:18}}>{t.ordersThisWeek}</h2>
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
