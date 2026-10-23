"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Package, ShoppingBag, Layers3, Plus, LogOut, List, Menu, X } from "lucide-react";
import { logout } from "@/app/actions/auth";
import { BrandLogo } from "@/components/brand-logo";
import { LangSwitch, useDashLocale } from "@/components/dashboard/locale";

export function DashboardShell({ email, children }: { email: string; children: React.ReactNode }) {
  const path = usePathname();
  const { t } = useDashLocale();
  const [menuOpen, setMenuOpen] = useState(false);
  const productsOpen = path.startsWith("/dashboard/products") || path.startsWith("/dashboard/categories");

  useEffect(() => {
    setMenuOpen(false);
  }, [path]);

  useEffect(() => {
    document.body.classList.toggle("dash-nav-locked", menuOpen);
    return () => document.body.classList.remove("dash-nav-locked");
  }, [menuOpen]);

  return (
    <div className="dash-body">
      <header className="dash-mobile-bar">
        <button type="button" className="dash-icon-btn" aria-label={t.openMenu} onClick={() => setMenuOpen(true)}><Menu size={20}/></button>
        <strong className="dash-mobile-brand"><BrandLogo size={28}/> {t.storeName}</strong>
        <Link className="dash-icon-btn" href="/dashboard/products/new" aria-label={t.addProduct}><Plus size={20}/></Link>
      </header>
      {menuOpen ? <button type="button" className="dash-nav-overlay" aria-label={t.closeMenu} onClick={() => setMenuOpen(false)}/> : null}
      <div className="dash-shell">
        <aside className={`dash-sidebar${menuOpen ? " open" : ""}`}>
          <div className="dash-user">
            <BrandLogo size={42}/>
            <span>
              <strong>Farouk Glai</strong>
              <small>{t.storeOwner}</small>
            </span>
            <button type="button" className="dash-icon-btn dash-nav-close" aria-label={t.closeMenu} onClick={() => setMenuOpen(false)}><X size={18}/></button>
          </div>
          <nav className="dash-nav">
            <Link className={path === "/dashboard" ? "active" : ""} href="/dashboard"><LayoutDashboard size={18}/> {t.navDashboard}</Link>
            <Link className={path.startsWith("/dashboard/orders") ? "active" : ""} href="/dashboard/orders"><ShoppingBag size={18}/> {t.navOrders}</Link>
            <Link className={productsOpen ? "active" : ""} href="/dashboard/products"><Package size={18}/> {t.navProducts}</Link>
            <div className="sub">
              <Link className={path === "/dashboard/products" ? "active" : ""} href="/dashboard/products"><List size={15}/> {t.navProductList}</Link>
              <Link className={path === "/dashboard/products/new" ? "active" : ""} href="/dashboard/products/new"><Plus size={15}/> {t.navProduct}</Link>
              <Link className={path.startsWith("/dashboard/categories") ? "active" : ""} href="/dashboard/categories"><Layers3 size={15}/> {t.navCategory}</Link>
            </div>
          </nav>
          <div className="dash-side-foot">
            <LangSwitch/>
            <form action={logout}><button className="linkish" type="submit"><LogOut size={18}/> {t.logOut}</button></form>
            <small style={{color:"#9ca3af",padding:"8px 12px"}}>{email}</small>
          </div>
        </aside>
        <div className="dash-main">{children}</div>
      </div>
      <nav className="dash-bottom-nav" aria-label={t.navDashboard}>
        <Link className={path === "/dashboard" ? "active" : ""} href="/dashboard"><LayoutDashboard size={18}/> {t.navHome}</Link>
        <Link className={path.startsWith("/dashboard/orders") ? "active" : ""} href="/dashboard/orders"><ShoppingBag size={18}/> {t.navOrders}</Link>
        <Link className={path.startsWith("/dashboard/products") ? "active" : ""} href="/dashboard/products"><Package size={18}/> {t.navProducts}</Link>
        <Link className={path.startsWith("/dashboard/categories") ? "active" : ""} href="/dashboard/categories"><Layers3 size={18}/> {t.navCategories}</Link>
      </nav>
    </div>
  );
}
