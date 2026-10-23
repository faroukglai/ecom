import { Suspense } from "react";
import { DashboardShell } from "@/components/dashboard/shell";
import { requireAdmin } from "@/lib/auth";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<div className="dash-body"><div className="dash-main"><p className="dash-empty">Loading…</p></div></div>}>
      <AdminShell>{children}</AdminShell>
    </Suspense>
  );
}

async function AdminShell({ children }: { children: React.ReactNode }) {
  const { email } = await requireAdmin();
  return <DashboardShell email={email}>{children}</DashboardShell>;
}
