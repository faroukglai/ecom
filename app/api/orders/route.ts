import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { products } from "@/data/catalog";
import { totals, type CartLine } from "@/lib/pricing";

export async function POST(request: Request) {
  try {
    const body: unknown = await request.json();
    if (!body || typeof body !== "object") return Response.json({error:"Invalid order."},{status:400});
    const data = body as Record<string,unknown>;
    if (!Array.isArray(data.lines) || !data.lines.length || data.lines.length>30) return Response.json({error:"Your cart needs at least one item."},{status:400});
    const lines: CartLine[]=[];
    for (const value of data.lines) {
      if (!value || typeof value!=="object") return Response.json({error:"Invalid item."},{status:400});
      const line=value as Record<string,unknown>;
      if(typeof line.id!=="string" || !products.some(p=>p.id===line.id) || typeof line.quantity!=="number" || !Number.isInteger(line.quantity) || line.quantity<1 || line.quantity>20 || lines.some(l=>l.id===line.id)) return Response.json({error:"Please check your cart quantities."},{status:400});
      lines.push({id:line.id,quantity:line.quantity});
    }
    if (!data.customer || typeof data.customer!=="object") return Response.json({error:"Please fill in your contact details."},{status:400});
    const customer=data.customer as Record<string,unknown>;
    if (!["email","phone","firstName","lastName","address","region","postcode"].every(k=>typeof customer[k]==="string" && (customer[k] as string).trim().length>0 && (customer[k] as string).length<=200) || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(customer.email)) || !/^[0-9]{4}$/.test(String(customer.postcode)) || !/^[+0-9 ()-]{8,20}$/.test(String(customer.phone)) || customer.payment!=="cod") return Response.json({error:"Please enter valid contact and delivery details."},{status:400});
    const coupon=typeof data.coupon==="string"?data.coupon.toUpperCase():"";
    if(coupon && !["WELCOME10","HOME15","FREESHIP"].includes(coupon)) return Response.json({error:"That discount code is not valid."},{status:400});
    const pricing=totals(lines,coupon);
    if(coupon==="HOME15"&&pricing.subtotal<200) return Response.json({error:"HOME15 needs a subtotal of 200 TND."},{status:400});
    const orderNumber=`HH-${new Date().toISOString().slice(0,10).replace(/-/g,"")}-${randomUUID().slice(0,8).toUpperCase()}`;
    const order={orderNumber,lines,coupon,...pricing,status:"demo",createdAt:new Date().toISOString()};
    // Preview orders deliberately omit personal information from disk.
    // Persist locally when the filesystem is writable; skip on serverless hosts.
    try {
      const directory=path.join(process.cwd(),".local","orders");
      await mkdir(directory,{recursive:true});
      await writeFile(path.join(directory,`${orderNumber}.json`),JSON.stringify(order,null,2),{flag:"wx"});
    } catch {
      // Read-only deploy environments still return a valid demo confirmation.
    }
    return Response.json(order,{status:201});
  } catch { return Response.json({error:"We couldn’t save this preview order. Please try again."},{status:500}); }
}
