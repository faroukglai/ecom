"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Package, ShoppingBag, Layers3, Plus, LogOut, List } from "lucide-react";
import { logout } from "@/app/actions/auth";

export function DashboardShell({ email, children }: { email: string; children: React.ReactNode }) {
  const path = usePathname();
  const productsOpen = path.startsWith("/dashboard/products") || path.startsWith("/dashboard/categories");
  return (
    <div className="dash-body">
      <div className="dash-shell">
        <aside className="dash-sidebar">
          <div className="dash-user">
            <span className="dash-avatar">FG</span>
            <span>
              <strong>Farouk Glai</strong>
              <small>Store owner</small>
            </span>
          </div>
          <nav className="dash-nav">
            <Link className={path === "/dashboard" ? "active" : ""} href="/dashboard"><LayoutDashboard size={18}/> Dashboard</Link>
            <Link className={path.startsWith("/dashboard/orders") ? "active" : ""} href="/dashboard/orders"><ShoppingBag size={18}/> Orders</Link>
            <Link className={productsOpen ? "active" : ""} href="/dashboard/products"><Package size={18}/> Products</Link>
            <div className="sub">
              <Link className={path === "/dashboard/products" ? "active" : ""} href="/dashboard/products"><List size={15}/> Product list</Link>
              <Link className={path === "/dashboard/products/new" ? "active" : ""} href="/dashboard/products/new"><Plus size={15}/> Product</Link>
              <Link className={path.startsWith("/dashboard/categories") ? "active" : ""} href="/dashboard/categories"><Layers3 size={15}/> Category</Link>
            </div>
          </nav>
          <div className="dash-side-foot">
            <form action={logout}><button className="linkish" type="submit"><LogOut size={18}/> Log out</button></form>
            <small style={{color:"#9ca3af",padding:"8px 12px"}}>{email}</small>
          </div>
        </aside>
        <div className="dash-main">{children}</div>
      </div>
    </div>
  );
}
