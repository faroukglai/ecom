import { Suspense } from "react";
import { DashboardShell } from "@/components/dashboard/shell";
import { requireAdmin } from "@/lib/auth";
import { getDashTheme } from "@/lib/dashboard-lang";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<div className="dash-body"><div className="dash-content"><div className="dash-loading"><div className="dash-skel"/><div className="dash-skel"/></div></div></div>}>
      <AdminShell>{children}</AdminShell>
    </Suspense>
  );
}

async function AdminShell({ children }: { children: React.ReactNode }) {
  const { email, supabase } = await requireAdmin();
  const theme = await getDashTheme();
  const { count } = await supabase.from("orders").select("id", { count: "exact", head: true }).eq("status", "new");
  return <DashboardShell email={email} newOrders={count ?? 0} theme={theme}>{children}</DashboardShell>;
}
