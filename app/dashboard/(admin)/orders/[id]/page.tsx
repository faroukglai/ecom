import { notFound } from "next/navigation";
import { updateOrderStatus } from "@/app/actions/catalog";
import { requireAdmin } from "@/lib/auth";
import { money } from "@/lib/pricing";

const statuses = ["new", "confirmed", "shipped", "delivered", "cancelled"] as const;

export default async function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase } = await requireAdmin();
  const { data: order } = await supabase.from("orders").select("*, order_items(*)").eq("id", id).maybeSingle();
  if (!order) notFound();
  const items = order.order_items ?? [];
  return (
    <>
      <div className="dash-topbar">
        <div>
          <div className="dash-crumb">Orders / {order.order_number}</div>
          <h1>{order.order_number}</h1>
        </div>
        <span className={`dash-status ${order.status}`}>{order.status}</span>
      </div>
      <div className="dash-grid dash-split">
        <section className="dash-card">
          <h2 style={{fontSize:18,marginBottom:12}}>Items</h2>
          <table className="dash-table">
            <thead><tr><th>Product</th><th>Qty</th><th>Price</th></tr></thead>
            <tbody>
              {items.map((item: { id: string; product_name: string; product_image: string; quantity: number; unit_price: number }) => (
                <tr key={item.id}>
                  <td style={{display:"flex",gap:12,alignItems:"center"}}>
                    {item.product_image ? <img src={item.product_image} alt="" width={48} height={48} style={{width:48,height:48,objectFit:"cover",borderRadius:10}}/> : null}
                    {item.product_name}
                  </td>
                  <td>{item.quantity}</td>
                  <td>{money(Number(item.unit_price) * item.quantity)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
        <section className="dash-card">
          <h2 style={{fontSize:18,marginBottom:12}}>Customer</h2>
          <p><strong>{order.customer_name}</strong></p>
          <p>{order.phone}</p>
          <p style={{color:"#6b7280",margin:"12px 0 20px"}}>{order.location}</p>
          <div className="summary-row"><span>Subtotal</span><strong>{money(Number(order.subtotal))}</strong></div>
          <div className="summary-row"><span>Livraison</span><strong>{money(Number(order.shipping))}</strong></div>
          <div className="summary-row total"><span>Total · COD</span><strong>{money(Number(order.total))}</strong></div>
          <form action={async (formData: FormData) => { "use server"; await updateOrderStatus(id, String(formData.get("status"))); }} style={{marginTop:20}}>
            <label className="dash-field">Status
              <select name="status" defaultValue={order.status}>
                {statuses.map((status) => <option key={status} value={status}>{status}</option>)}
              </select>
            </label>
            <button className="dash-btn primary" type="submit">Update order</button>
          </form>
        </section>
      </div>
    </>
  );
}
