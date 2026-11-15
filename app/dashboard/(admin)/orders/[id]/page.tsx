import { notFound } from "next/navigation";
import { updateOrderNote, updateOrderStatus } from "@/app/actions/catalog";
import { CopyButton, PrintButton } from "@/components/dashboard/copy-button";
import { DashActionForm } from "@/components/dashboard/action-form";
import { Icon } from "@/components/dashboard/icons";
import { DashPage } from "@/components/dashboard/runtime";
import { PageHeader, StatusPill } from "@/components/dashboard/ui";
import { requireAdmin } from "@/lib/auth";
import { FLOW, nextStatus, nextStatusLabel, telLink, whatsappLink } from "@/lib/dashboard-data";
import { dashDate, dashMoney, fill, orderStatusLabel } from "@/lib/dashboard-i18n";
import { getDashCopy } from "@/lib/dashboard-lang";
import { phoneHistory, riskFor } from "@/lib/dashboard-risk";

type Item = { id: string; product_name: string; product_image: string; quantity: number; unit_price: number | string };
const stepIcons = ["packageProcess", "checkCircle", "packageMoving", "packageDelivered"] as const;

export default function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <DashPage>
      <OrderBody params={params}/>
    </DashPage>
  );
}

async function OrderBody({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { lang, t } = await getDashCopy();
  const { supabase } = await requireAdmin();
  const { data: order } = await supabase.from("orders").select("*, order_items(*)").eq("id", id).maybeSingle();
  if (!order) notFound();

  const items = (order.order_items ?? []) as Item[];
  const status = String(order.status);
  const cancelled = status === "cancelled" || status === "refused" || status === "returned";
  const history = await phoneHistory(supabase, [String(order.phone)]);
  const risk = riskFor(history, String(order.phone), status, t);
  const index = FLOW.indexOf(status as (typeof FLOW)[number]);
  const next = nextStatus(status);
  const discount = Number(order.discount ?? 0);
  const gross = Number(order.subtotal) + discount;
  const units = items.reduce((sum, item) => sum + item.quantity, 0);
  const greeting = `Bonjour ${order.customer_name}, ici Darivo à propos de votre commande ${order.order_number}.`;

  return (
    <>
      <PageHeader
        title={String(order.order_number)}
        subtitle={fill(t.placedOn, { date: dashDate(order.created_at, lang) })}
        crumbs={[{ label: t.navOrders, href: "/dashboard/orders" }, { label: String(order.order_number) }]}
      >
        <StatusPill t={t} status={status}/>
        <span className="dash-no-print"><PrintButton/></span>
      </PageHeader>

      <div className="dash-grid dash-detail">
        <div className="dash-grid">
          <section className="dash-card">
            <div className="dash-card-head"><h2 className="dash-card-title"><Icon name="truck" size={17}/> {t.orderProgress}</h2></div>
            {cancelled ? (
              <div className={`dash-banner ${status}`}><Icon name="cancelCircle" size={20}/> {status === "refused" ? t.orderRefused : status === "returned" ? t.orderReturned : t.orderCancelled}</div>
            ) : (
              <ol className="dash-steps" style={{ listStyle: "none", margin: 0, padding: 0 }}>
                {FLOW.map((step, position) => {
                  const state = status === "delivered" || position < index ? "done" : position === index ? "current" : "";
                  return (
                    <li key={step} className={`dash-step ${state}`} aria-current={state === "current" ? "step" : undefined}>
                      <span className="dot"><Icon name={state === "done" ? "check" : stepIcons[position]!} size={16}/></span>
                      {orderStatusLabel(t, step)}
                    </li>
                  );
                })}
              </ol>
            )}
          </section>

          <section className="dash-card flush">
            <div className="dash-card-head" style={{ padding: "18px 20px 0", marginBottom: 12 }}>
              <h2 className="dash-card-title"><Icon name="package" size={17}/> {t.items} · {units}</h2>
            </div>
            <div className="dash-table-wrap">
              <table className="dash-table stack">
                <thead><tr><th>{t.colProduct}</th><th className="end">{t.colQty}</th><th className="end">{t.colPrice}</th><th className="end">{t.colTotal}</th></tr></thead>
                <tbody>
                  {items.map((item) => (
                    <tr key={item.id}>
                      <td className="primary">
                        <div className="dash-cell">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          {item.product_image ? <img className="dash-thumb" src={item.product_image} alt="" width={44} height={44}/> : <span className="dash-thumb"/>}
                          <span><strong>{item.product_name}</strong></span>
                        </div>
                      </td>
                      <td className="num end" data-label={t.colQty}>×{item.quantity}</td>
                      <td className="num end" data-label={t.colPrice}>{dashMoney(Number(item.unit_price), lang)}</td>
                      <td className="num end" data-label={t.colTotal}><strong>{dashMoney(Number(item.unit_price) * item.quantity, lang)}</strong></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>

        <aside className="dash-grid">
          {(
            <section className="dash-card dash-no-print">
              <div className="dash-card-head"><h2 className="dash-card-title"><Icon name="check" size={17}/> {t.nextStep}</h2></div>
              <div className="dash-next">
                {next ? (
                  <DashActionForm action={updateOrderStatus.bind(null, id, next)} submitLabel={<><Icon name="check" size={17}/> {nextStatusLabel(t, status)}</>} submitClassName="dash-btn primary"/>
                ) : null}
                {status === "shipped" ? (
                  <DashActionForm action={updateOrderStatus.bind(null, id, "refused")} submitLabel={<><Icon name="packageOut" size={17}/> {t.actRefused}</>} submitClassName="dash-btn ghost" confirmMessage={t.refusedConfirm}/>
                ) : null}
                {status === "delivered" ? (
                  <DashActionForm action={updateOrderStatus.bind(null, id, "returned")} submitLabel={<><Icon name="returnBox" size={17}/> {t.actReturned}</>} submitClassName="dash-btn ghost" confirmMessage={t.returnedConfirm}/>
                ) : null}
                {cancelled ? (
                  <DashActionForm action={updateOrderStatus.bind(null, id, "new")} submitLabel={t.actReopen} submitClassName="dash-btn ghost"/>
                ) : status !== "delivered" ? (
                  <DashActionForm action={updateOrderStatus.bind(null, id, "cancelled")} submitLabel={<><Icon name="cancelCircle" size={17}/> {t.actCancel}</>} submitClassName="dash-btn danger" confirmMessage={t.cancelOrderConfirm}/>
                ) : null}
              </div>
            </section>
          )}

          <section className="dash-card">
            <div className="dash-card-head"><h2 className="dash-card-title"><Icon name="user" size={17}/> {t.contactCustomer}</h2></div>
            <div className="dash-contact">
              <div className="dash-contact-line">
                <span className="dash-chip"><Icon name="user" size={16}/></span>
                <span><small>{t.customer}</small><b>{order.customer_name}</b></span>
              </div>
              <div className="dash-contact-line">
                <span className="dash-chip"><Icon name="phone" size={16}/></span>
                <span><small>{t.colPhone}</small><b><bdi className="dash-ltr">{order.phone}</bdi></b>{risk ? <span className={`dash-risk ${risk.level === "high" ? "high" : ""}`}><Icon name="alert" size={13}/> {risk.text}</span> : null}</span>
                <CopyButton value={String(order.phone)}/>
              </div>
              <div className="dash-contact-line">
                <span className="dash-chip"><Icon name="pin" size={16}/></span>
                <span><small>{t.deliveryAddress}</small><b>{order.location}</b></span>
                <CopyButton value={String(order.location)}/>
              </div>
              <div className="dash-btn-row dash-no-print">
                <a className="dash-btn ghost" href={telLink(String(order.phone))}><Icon name="phone" size={16}/> {t.call}</a>
                <a className="dash-btn ghost whatsapp" href={whatsappLink(String(order.phone), greeting)} target="_blank" rel="noreferrer"><Icon name="whatsapp" size={16}/> {t.whatsapp}</a>
              </div>
            </div>
          </section>

          <section className="dash-card dash-note dash-no-print">
            <div className="dash-card-head"><h2 className="dash-card-title"><Icon name="note" size={17}/> {t.noteTitle}</h2></div>
            <DashActionForm action={updateOrderNote.bind(null, id)} submitLabel={t.saveNote} submitClassName="dash-btn ghost">
              <textarea name="note" defaultValue={String(order.note ?? "")} placeholder={t.notePlaceholder} maxLength={1000}/>
            </DashActionForm>
          </section>

          <section className="dash-card">
            <div className="dash-card-head"><h2 className="dash-card-title"><Icon name="wallet" size={17}/> {t.orderSummary}</h2><span className="dash-status published">{t.paymentCod}</span></div>
            <div className="dash-sum">
              <div className="dash-sum-row"><span>{t.subtotal}</span><strong>{dashMoney(gross, lang)}</strong></div>
              {discount > 0 ? <div className="dash-sum-row"><span>{t.discount}{order.coupon ? <> · <bdi className="dash-ltr">{order.coupon}</bdi></> : null}</span><strong>−{dashMoney(discount, lang)}</strong></div> : null}
              <div className="dash-sum-row"><span>{t.shipping}</span><strong>{dashMoney(Number(order.shipping), lang)}</strong></div>
              <div className="dash-sum-row total"><span>{t.totalCod}</span><strong>{dashMoney(Number(order.total), lang)}</strong></div>
            </div>
          </section>
        </aside>
      </div>
    </>
  );
}
