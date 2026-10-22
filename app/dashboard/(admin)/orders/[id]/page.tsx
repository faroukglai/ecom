import { notFound } from "next/navigation";
import { updateOrderStatus } from "@/app/actions/catalog";
import { requireAdmin } from "@/lib/auth";
import { dashMoney, orderStatusLabel } from "@/lib/dashboard-i18n";
import { getDashCopy } from "@/lib/dashboard-lang";

const statuses = ["new", "confirmed", "shipped", "delivered", "cancelled"] as const;

export default async function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { lang, t } = await getDashCopy();
  const { supabase } = await requireAdmin();
  const { data: order } = await supabase.from("orders").select("*, order_items(*)").eq("id", id).maybeSingle();
  if (!order) notFound();
  const items = order.order_items ?? [];
  return (
    <>
      <div className="dash-topbar">
        <div>
          <div className="dash-crumb">{t.navOrders} / {order.order_number}</div>
          <h1>{order.order_number}</h1>
        </div>
        <span className={`dash-status ${order.status}`}>{orderStatusLabel(t, order.status)}</span>
      </div>
      <div className="dash-grid dash-split">
        <section className="dash-card">
          <h2 style={{fontSize:18,marginBottom:12}}>{t.items}</h2>
          <div className="dash-table-wrap">
          <table className="dash-table">
            <thead><tr><th>{t.colProduct}</th><th>{t.colQty}</th><th>{t.colPrice}</th></tr></thead>
            <tbody>
              {items.map((item: { id: string; product_name: string; product_image: string; quantity: number; unit_price: number }) => (
                <tr key={item.id}>
                  <td style={{display:"flex",gap:12,alignItems:"center"}}>
                    {item.product_image ? <img src={item.product_image} alt="" width={48} height={48} style={{width:48,height:48,objectFit:"cover",borderRadius:2}}/> : null}
                    {item.product_name}
                  </td>
                  <td>{item.quantity}</td>
                  <td>{dashMoney(Number(item.unit_price) * item.quantity, lang)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </section>
        <section className="dash-card">
          <h2 style={{fontSize:18,marginBottom:12}}>{t.customer}</h2>
          <p><strong>{order.customer_name}</strong></p>
          <p>{order.phone}</p>
          <p style={{color:"#6b7280",margin:"12px 0 20px"}}>{order.location}</p>
          <div className="summary-row"><span>{t.subtotal}</span><strong>{dashMoney(Number(order.subtotal), lang)}</strong></div>
          <div className="summary-row"><span>{t.shipping}</span><strong>{dashMoney(Number(order.shipping), lang)}</strong></div>
          <div className="summary-row total"><span>{t.totalCod}</span><strong>{dashMoney(Number(order.total), lang)}</strong></div>
          <form action={async (formData: FormData) => { "use server"; await updateOrderStatus(id, String(formData.get("status"))); }} style={{marginTop:20}}>
            <label className="dash-field">{t.status}
              <select name="status" defaultValue={order.status}>
                {statuses.map((status) => <option key={status} value={status}>{orderStatusLabel(t, status)}</option>)}
              </select>
            </label>
            <button className="dash-btn primary" type="submit">{t.updateOrder}</button>
          </form>
        </section>
      </div>
    </>
  );
}
