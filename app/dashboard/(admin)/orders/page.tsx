import Link from "next/link";
import { Icon } from "@/components/dashboard/icons";
import { DashPage } from "@/components/dashboard/runtime";
import { EmptyState, PageHeader, StatusPill } from "@/components/dashboard/ui";
import { requireAdmin } from "@/lib/auth";
import { applyOrderFilters, filtersToQuery, ORDER_STATUSES, PAGE_SIZE, parseOrderFilters, telLink, whatsappLink } from "@/lib/dashboard-data";
import { dashDate, dashMoney, fill, orderStatusLabel } from "@/lib/dashboard-i18n";
import { getDashCopy } from "@/lib/dashboard-lang";
import { phoneHistory, riskFor } from "@/lib/dashboard-risk";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;
type OrderRow = { id: string; order_number: string; customer_name: string; phone: string; location: string; total: number | string; status: string; created_at: string };

export default function OrdersPage({ searchParams }: { searchParams: SearchParams }) {
  return (
    <DashPage>
      <OrdersBody searchParams={searchParams}/>
    </DashPage>
  );
}

async function OrdersBody({ searchParams }: { searchParams: SearchParams }) {
  const [{ lang, t }, raw] = await Promise.all([getDashCopy(), searchParams]);
  const { supabase } = await requireAdmin();
  const filters = parseOrderFilters(raw);
  const from = (filters.page - 1) * PAGE_SIZE;

  const [pageRes, statusRes] = await Promise.all([
    applyOrderFilters(supabase.from("orders").select("id, order_number, customer_name, phone, location, total, status, created_at", { count: "exact" }), filters)
      .order("created_at", { ascending: false })
      .range(from, from + PAGE_SIZE - 1),
    supabase.from("orders").select("status").limit(5000),
  ]);

  const orders = (pageRes.data ?? []) as OrderRow[];
  const total = pageRes.count ?? orders.length;
  const history = await phoneHistory(supabase, orders.map((order) => order.phone));
  const statusRows = (statusRes.data ?? []) as { status: string }[];
  const counts: Record<string, number> = { all: statusRows.length };
  for (const row of statusRows) counts[row.status] = (counts[row.status] ?? 0) + 1;
  const hasFilters = Boolean(filters.status || filters.q || filters.range);
  const lastPage = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const rangeOptions: [string, string][] = [["", t.rangeAll], ["today", t.rangeToday], ["7", t.range7], ["30", t.range30]];
  const exportHref = `/dashboard/orders/export${filtersToQuery(filters, { page: 1 })}`;

  return (
    <>
      <PageHeader title={t.ordersTitle}>
        <a className="dash-btn ghost" href={exportHref}><Icon name="download" size={17}/> {t.exportCsv}</a>
      </PageHeader>

      <section className="dash-card flush">
        <nav className="dash-tabs" aria-label={t.colStatus}>
          <Link href={`/dashboard/orders${filtersToQuery(filters, { status: "", page: 1 })}`} className={!filters.status ? "active" : ""}>{t.filterAll} <span className="n">{counts.all ?? 0}</span></Link>
          {ORDER_STATUSES.map((status) => (
            <Link key={status} href={`/dashboard/orders${filtersToQuery(filters, { status, page: 1 })}`} className={filters.status === status ? "active" : ""}>
              {orderStatusLabel(t, status)} <span className="n">{counts[status] ?? 0}</span>
            </Link>
          ))}
        </nav>

        <div className="dash-toolbar">
          <form className="dash-search" method="get" role="search" style={{ display: "flex" }}>
            {filters.status ? <input type="hidden" name="status" value={filters.status}/> : null}
            {filters.range ? <input type="hidden" name="range" value={filters.range}/> : null}
            <Icon name="search" size={17}/>
            <input name="q" type="search" defaultValue={filters.q} placeholder={t.searchOrders} aria-label={t.searchOrders} autoComplete="off"/>
            <button type="submit" className="dash-sr">{t.searchProducts}</button>
          </form>
          <div className="dash-seg" role="group" aria-label={t.colDate}>
            {rangeOptions.map(([value, label]) => (
              <Link key={value || "all"} href={`/dashboard/orders${filtersToQuery(filters, { range: value, page: 1 })}`} className={filters.range === value ? "active" : ""}>{label}</Link>
            ))}
          </div>
          {hasFilters ? <Link className="dash-link" href="/dashboard/orders"><Icon name="close" size={14}/> {t.clearFilters}</Link> : null}
        </div>

        {orders.length ? (
          <>
            <div className="dash-table-wrap">
              <table className="dash-table stack">
                <thead>
                  <tr><th>{t.colOrder}</th><th>{t.colCustomer}</th><th>{t.colLocation}</th><th className="end">{t.colTotal}</th><th>{t.colStatus}</th><th className="end">{t.actions}</th></tr>
                </thead>
                <tbody>
                  {orders.map((order) => (
                    <tr key={order.id}>
                      <td className="primary">
                        <div className="dash-cell"><span>
                          <Link className="dash-order-link" href={`/dashboard/orders/${order.id}`}><bdi className="dash-ltr">{order.order_number}</bdi></Link>
                          <small>{dashDate(order.created_at, lang)}</small>
                        </span></div>
                      </td>
                      <td data-label={t.colCustomer}>
                        <div className="dash-cell"><span><strong>{order.customer_name}</strong><small><bdi className="dash-ltr">{order.phone}</bdi></small>{(() => { const risk = riskFor(history, order.phone, order.status, t); return risk ? <span className={`dash-risk ${risk.level === "high" ? "high" : ""}`}><Icon name="alert" size={13}/> {risk.text}</span> : null; })()}</span></div>
                      </td>
                      <td className="hide-sm" data-label={t.colLocation} style={{ maxWidth: 240 }}><span className="dash-muted">{order.location}</span></td>
                      <td className="num end" data-label={t.colTotal}><strong>{dashMoney(Number(order.total), lang)}</strong></td>
                      <td data-label={t.colStatus}><StatusPill t={t} status={order.status}/></td>
                      <td className="end actions">
                        <div className="dash-row-actions">
                          <a className="dash-btn ghost dash-btn-compact dash-btn-icon" href={telLink(order.phone)} aria-label={t.call} title={t.call}><Icon name="phone" size={15}/></a>
                          <a className="dash-btn ghost dash-btn-compact dash-btn-icon whatsapp" href={whatsappLink(order.phone)} target="_blank" rel="noreferrer" aria-label={t.whatsapp} title={t.whatsapp}><Icon name="whatsapp" size={15}/></a>
                          <Link className="dash-btn ghost dash-btn-compact" href={`/dashboard/orders/${order.id}`}>{t.open} <Icon name="arrowRight" size={14} className="dash-flip"/></Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="dash-table-foot">
              <span>{fill(t.showingRange, { from: from + 1, to: from + orders.length, total })}</span>
              {lastPage > 1 ? (
                <div className="dash-pager">
                  {filters.page > 1 ? <Link className="dash-btn ghost dash-btn-compact" href={`/dashboard/orders${filtersToQuery(filters, { page: filters.page - 1 })}`}><Icon name="arrowLeft" size={14} className="dash-flip"/> {t.prevPage}</Link> : null}
                  {filters.page < lastPage ? <Link className="dash-btn ghost dash-btn-compact" href={`/dashboard/orders${filtersToQuery(filters, { page: filters.page + 1 })}`}>{t.nextPage} <Icon name="arrowRight" size={14} className="dash-flip"/></Link> : null}
                </div>
              ) : null}
            </div>
          </>
        ) : (
          <EmptyState icon="orders" title={hasFilters ? t.noResults : t.ordersEmpty}>
            {hasFilters ? <Link className="dash-btn ghost" href="/dashboard/orders">{t.clearFilters}</Link> : null}
          </EmptyState>
        )}
      </section>
    </>
  );
}
