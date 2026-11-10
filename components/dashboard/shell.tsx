"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { logout } from "@/app/actions/auth";
import { BrandLogo } from "@/components/brand-logo";
import { Icon, type IconName } from "@/components/dashboard/icons";
import { LangSwitch, useDashLocale } from "@/components/dashboard/locale";
import { ThemeToggle } from "@/components/dashboard/theme-toggle";
import { fill } from "@/lib/dashboard-i18n";

type NavItem = { href: string; label: string; icon: IconName; match: (path: string) => boolean; count?: number };

export function DashboardShell({ email, newOrders, theme, children }: { email: string; newOrders: number; theme: "light" | "dark"; children: React.ReactNode }) {
  const path = usePathname();
  const { t } = useDashLocale();
  // The drawer is "open for this path", so navigating anywhere closes it without an effect.
  const [openAt, setOpenAt] = useState<string | null>(null);
  const menuOpen = openAt === path;
  const setMenuOpen = (open: boolean) => setOpenAt(open ? path : null);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    document.body.classList.toggle("dash-nav-locked", menuOpen);
    return () => document.body.classList.remove("dash-nav-locked");
  }, [menuOpen]);
  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null;
      const typing = target && (["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName) || target.isContentEditable);
      if (event.key === "/" && !typing && !event.metaKey && !event.ctrlKey) {
        event.preventDefault();
        searchRef.current?.focus();
      }
      if (event.key === "Escape") setOpenAt(null);
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  const main: NavItem[] = [
    { href: "/dashboard", label: t.navDashboard, icon: "dashboard", match: (p) => p === "/dashboard" },
    { href: "/dashboard/orders", label: t.navOrders, icon: "orders", match: (p) => p.startsWith("/dashboard/orders"), count: newOrders },
  ];
  const catalog: NavItem[] = [
    { href: "/dashboard/products", label: t.navProducts, icon: "package", match: (p) => p.startsWith("/dashboard/products") },
    { href: "/dashboard/categories", label: t.navCategories, icon: "layers", match: (p) => p.startsWith("/dashboard/categories") },
  ];
  const bottom = [main[0]!, main[1]!, catalog[0]!, catalog[1]!];
  const initial = (email[0] ?? "D").toUpperCase();

  const renderLink = (item: NavItem) => (
    <Link key={item.href} href={item.href} className={item.match(path) ? "active" : ""} aria-current={item.match(path) ? "page" : undefined}>
      <Icon name={item.icon} size={19}/>
      <span>{item.label}</span>
      {item.count ? <span className="dash-count">{item.count > 99 ? "99+" : item.count}</span> : null}
    </Link>
  );

  return (
    <div className="dash-body">
      {menuOpen ? <button type="button" className="dash-nav-overlay" aria-label={t.closeMenu} onClick={() => setMenuOpen(false)}/> : null}
      <div className="dash-shell">
        <aside className={`dash-sidebar${menuOpen ? " open" : ""}`}>
          <div className="dash-store">
            <BrandLogo size={36}/>
            <span>
              <strong>{t.storeName}</strong>
              <small>{t.storeOwner}</small>
            </span>
            <span className="dash-pill">Admin</span>
            <button type="button" className="dash-icon-btn dash-nav-close" aria-label={t.closeMenu} onClick={() => setMenuOpen(false)}><Icon name="close" size={18}/></button>
          </div>

          <div className="dash-nav-label">{t.groupMain}</div>
          <nav className="dash-nav" aria-label={t.groupMain}>{main.map(renderLink)}</nav>
          <div className="dash-nav-label">{t.groupCatalog}</div>
          <nav className="dash-nav" aria-label={t.groupCatalog}>{catalog.map(renderLink)}</nav>

          <div className="dash-side-foot">
            <a className="dash-btn ghost" href="/" target="_blank" rel="noreferrer"><Icon name="store" size={17}/> {t.viewStore} <Icon name="arrowUpRight" size={14} className="dash-flip"/></a>
            <div className="dash-foot-row">
              <ThemeToggle initial={theme}/>
              <LangSwitch/>
            </div>
            <div className="dash-user-row">
              <span className="dash-avatar" aria-hidden="true">{initial}</span>
              <span>
                <strong>{t.storeOwnerName}</strong>
                <small dir="ltr">{email}</small>
              </span>
              <form action={logout}>
                <button className="dash-icon-btn" type="submit" aria-label={t.logOut} title={t.logOut}><Icon name="logout" size={17} className="dash-flip"/></button>
              </form>
            </div>
          </div>
        </aside>

        <div className="dash-main">
          <header className="dash-top">
            <button type="button" className="dash-icon-btn dash-menu-btn" aria-label={t.openMenu} onClick={() => setMenuOpen(true)}><Icon name="menu" size={19}/></button>
            <form className="dash-top-search" action="/dashboard/orders" method="get" role="search">
              <Icon name="search" size={17}/>
              <input ref={searchRef} name="q" type="search" placeholder={t.searchPlaceholder} aria-label={t.searchOrders} autoComplete="off"/>
              <span className="dash-kbd" aria-hidden="true">/</span>
            </form>
            <div className="dash-top-actions">
              <Link className="dash-icon-btn" href="/dashboard/orders?status=new" aria-label={newOrders ? fill(t.newOrdersBadge, { n: newOrders }) : t.noNewOrders} title={newOrders ? fill(t.newOrdersBadge, { n: newOrders }) : t.noNewOrders}>
                <Icon name="bell" size={18}/>
                {newOrders ? <span className="dash-dot"/> : null}
              </Link>
              <Link className="dash-btn primary dash-hide-sm" href="/dashboard/products/new"><Icon name="plus" size={17}/> {t.addProduct}</Link>
            </div>
          </header>
          <div className="dash-content">{children}</div>
        </div>
      </div>

      <nav className="dash-bottom-nav" aria-label={t.navDashboard}>
        {bottom.map((item) => (
          <Link key={item.href} href={item.href} className={item.match(path) ? "active" : ""}>
            <Icon name={item.icon} size={21}/>
            {item.label}
            {item.count ? <span className="dash-count">{item.count > 99 ? "99+" : item.count}</span> : null}
          </Link>
        ))}
      </nav>
    </div>
  );
}
