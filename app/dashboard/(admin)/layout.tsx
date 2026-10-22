import { Suspense } from "react";
import { DashboardShell } from "@/components/dashboard/shell";
import { requireAdmin } from "@/lib/auth";
import { getDashCopy } from "@/lib/dashboard-lang";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const { t } = await getDashCopy();
  return (
    <Suspense fallback={<div className="dash-body"><div className="dash-main">{t.loadingDashboard}</div></div>}>
      <AdminShell>{children}</AdminShell>
    </Suspense>
  );
}

async function AdminShell({ children }: { children: React.ReactNode }) {
  const { email } = await requireAdmin();
  return <DashboardShell email={email}>{children}</DashboardShell>;
}
