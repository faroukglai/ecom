import Link from "next/link";
import { Icon } from "@/components/dashboard/icons";
import { DashPage } from "@/components/dashboard/runtime";
import { SetupNotice } from "@/components/dashboard/setup-notice";
import { AreaChart, Delta, EmptyState, KpiCard, PageHeader, StatusPill } from "@/components/dashboard/ui";
import { requireAdmin } from "@/lib/auth";
import { initials, ORDER_STATUSES, percentChange } from "@/lib/dashboard-data";
import { dashDate, dashDayKey, dashMoney, fill, orderStatusLabel } from "@/lib/dashboard-i18n";
import { getDashCopy } from "@/lib/dashboard-lang";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;
type OrderRow = { id: string; order_number: string; customer_name: string; total: number | string; status: string; created_at: string };
type ItemRow = { product_id: string | null; product_name: string; product_image: string; quantity: number; unit_price: number | string; orders: { status: string; created_at: string } | { status: string; created_at: string }[] | null };

export default function DashboardHome({ searchParams }: { searchParams: SearchParams }) {
  return (
    <DashPage>
      <Analytics searchParams={searchParams}/>
    </DashPage>
  );
}

const sum = (rows: OrderRow[]) => rows.filter((row) => row.status !== "cancelled").reduce((total, row) => total + Number(row.total), 0);

async function Analytics({ searchParams }: { searchParams: SearchParams }) {
  const [{ lang, t }, raw] = await Promise.all([getDashCopy(), searchParams]);
  const { supabase } = await requireAdmin();
  const rangeParam = Array.isArray(raw.range) ? raw.range[0] : raw.range;
  const days = rangeParam === "7" ? 7 : rangeParam === "90" ? 90 : 30;

  const start = new Date();
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - (days - 1));
  const previousStart = new Date(start);
  previousStart.setDate(previousStart.getDate() - days);

  const [ordersRes, waitingRes, itemsRes] = await Promise.all([
    supabase.from("orders").select("id, order_number, customer_name, total, status, created_at").gte("created_at", previousStart.toISOString()).order("created_at", { ascending: false }).limit(3000),
    supabase.from("orders").select("id", { count: "exact", head: true }).eq("status", "new"),
    supabase.from("order_items").select("product_id, product_name, product_image, quantity, unit_price, orders!inner(status, created_at)").gte("orders.created_at", start.toISOString()).limit(3000),
  ]);

  if (ordersRes.error) {
    return (
      <>
        <PageHeader title={t.overviewTitle}/>
        <SetupNotice message={ordersRes.error.message}/>
      </>
    );
  }

  const all = (ordersRes.data ?? []) as OrderRow[];
  const current = all.filter((order) => new Date(order.created_at) >= start);
  const previous = all.filter((order) => new Date(order.created_at) < start);
  const revenue = sum(current);
  const previousRevenue = sum(previous);
  const live = current.filter((order) => order.status !== "cancelled");
  const previousLive = previous.filter((order) => order.status !== "cancelled");
  const aov = live.length ? revenue / live.length : 0;
  const previousAov = previousLive.length ? previousRevenue / previousLive.length : 0;
  const waiting = waitingRes.count ?? 0;

  // Revenue per day for the chart.
  const perDay = new Map<string, number>();
  for (const order of live) perDay.set(dashDayKey(order.created_at), (perDay.get(dashDayKey(order.created_at)) ?? 0) + Number(order.total));
  const points = Array.from({ length: days }, (_, index) => {
    const date = new Date(start);
    date.setDate(start.getDate() + index);
    return {
      label: new Intl.DateTimeFormat(lang === "ar" ? "ar-TN" : "en-GB", { day: "numeric", month: "short", timeZone: "Africa/Tunis" }).format(date),
      value: Math.round((perDay.get(dashDayKey(date)) ?? 0) * 100) / 100,
    };
  });

  const statusCounts = Object.fromEntries(ORDER_STATUSES.map((status) => [status, current.filter((order) => order.status === status).length])) as Record<string, number>;
  const statusMax = Math.max(1, ...Object.values(statusCounts));

  const products = new Map<string, { name: string; image: string; sold: number; revenue: number }>();
  for (const item of ((itemsRes.data ?? []) as unknown as ItemRow[])) {
    const order = Array.isArray(item.orders) ? item.orders[0] : item.orders;
    if (!order || order.status === "cancelled") continue;
    const key = item.product_id ?? item.product_name;
    const entry = products.get(key) ?? { name: item.product_name, image: item.product_image, sold: 0, revenue: 0 };
    entry.sold += item.quantity;
    entry.revenue += Number(item.unit_price) * item.quantity;
    products.set(key, entry);
  }
  const top = [...products.values()].sort((a, b) => b.revenue - a.revenue).slice(0, 5);
  const recent = all.slice(0, 6);
  const rangeLinks: [string, string][] = [["7", t.range7], ["30", t.range30], ["90", t.range90]];

  return (
    <>
      <PageHeader title={t.overviewTitle} subtitle={t.overviewSubtitle}>
        <div className="dash-seg" role="group" aria-label={t.colDate}>
          {rangeLinks.map(([value, label]) => <Link key={value} href={`/dashboard?range=${value}`} className={String(days) === value ? "active" : ""}>{label}</Link>)}
        </div>
        <Link className="dash-btn primary" href="/dashboard/products/new"><Icon name="plus" size={17}/> {t.addProduct}</Link>
      </PageHeader>

      <div className="dash-grid dash-kpis">
        <KpiCard icon="wallet" label={t.kpiRevenue} value={dashMoney(revenue, lang)}>
          <Delta value={percentChange(revenue, previousRevenue)} t={t}/> {t.vsPrevious}
        </KpiCard>
        <KpiCard icon="orders" label={t.kpiOrders} value={String(current.length)}>
          <Delta value={percentChange(current.length, previous.length)} t={t}/> {t.vsPrevious}
        </KpiCard>
        <KpiCard icon="coins" label={t.kpiAov} value={dashMoney(aov, lang)}>
          <Delta value={percentChange(aov, previousAov)} t={t}/> {t.vsPrevious}
        </KpiCard>
        <Link href="/dashboard/orders?status=new" style={{ display: "contents" }}>
          <KpiCard icon="clock" label={t.kpiWaitingTitle} value={String(waiting)} alert={waiting > 0}>
            {t.kpiWaitingHelp}
          </KpiCard>
        </Link>
      </div>

      <div className="dash-grid dash-split dash-section-gap">
        <section className="dash-card">
          <div className="dash-card-head">
            <h2 className="dash-card-title"><Icon name="chartLine" size={17}/> {t.salesRevenue}</h2>
            <span className="dash-chart-total">{t.totalForPeriod}: <strong>{dashMoney(revenue, lang)}</strong></span>
          </div>
          <AreaChart points={points} format={(value) => dashMoney(value, lang)}/>
        </section>
        <section className="dash-card">
          <div className="dash-card-head">
            <h2 className="dash-card-title"><Icon name="packageProcess" size={17}/> {t.ordersByStatus}</h2>
          </div>
          <div className="dash-meter">
            {ORDER_STATUSES.map((status) => (
              <div className="dash-meter-row" key={status}>
                <div className="top"><span>{orderStatusLabel(t, status)}</span><b>{statusCounts[status]}</b></div>
                <div className="dash-meter-track"><div className={`dash-meter-fill ${status}`} style={{ width: `${statusCounts[status] ? Math.max(4, (statusCounts[status]! / statusMax) * 100) : 0}%` }}/></div>
              </div>
            ))}
          </div>
        </section>
      </div>

      <div className="dash-grid dash-split-even dash-section-gap">
        <section className="dash-card">
          <div className="dash-card-head">
            <h2 className="dash-card-title"><Icon name="tag" size={17}/> {t.topProducts}</h2>
            <Link className="dash-link" href="/dashboard/products">{t.viewAll} <Icon name="arrowRight" size={14} className="dash-flip"/></Link>
          </div>
          {top.length ? (
            <div className="dash-list">
              {top.map((product, index) => (
                <div className="dash-list-item" key={product.name}>
                  <span className="dash-rank">{index + 1}</span>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  {product.image ? <img className="dash-thumb" src={product.image} alt="" width={44} height={44}/> : null}
                  <span className="grow"><strong>{product.name}</strong><small>{t.colSold}: {product.sold}</small></span>
                  <span className="val">{dashMoney(product.revenue, lang)}</span>
                </div>
              ))}
            </div>
          ) : <EmptyState icon="chartUp" title={t.noSalesYet}/>}
        </section>
        <section className="dash-card">
          <div className="dash-card-head">
            <h2 className="dash-card-title"><Icon name="orders" size={17}/> {t.recentOrders}</h2>
            <Link className="dash-link" href="/dashboard/orders">{t.viewAll} <Icon name="arrowRight" size={14} className="dash-flip"/></Link>
          </div>
          {recent.length ? (
            <div className="dash-list">
              {recent.map((order) => (
                <Link className="dash-list-item" key={order.id} href={`/dashboard/orders/${order.id}`}>
                  <span className="dash-avatar" aria-hidden="true">{initials(order.customer_name)}</span>
                  <span className="grow"><strong>{order.customer_name}</strong><small><bdi className="dash-ltr">{order.order_number}</bdi> · {dashDate(order.created_at, lang)}</small></span>
                  <span style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }}>
                    <span className="val">{dashMoney(Number(order.total), lang)}</span>
                    <StatusPill t={t} status={order.status}/>
                  </span>
                </Link>
              ))}
            </div>
          ) : <EmptyState icon="orders" title={t.noOrdersYet}/>}
        </section>
      </div>
      <p className="dash-sr">{fill(t.newOrdersBadge, { n: waiting })}</p>
    </>
  );
}
