import { Suspense } from "react";

export function DashPageFallback() {
  return <p className="dash-empty">Loading…</p>;
}

export function DashPage({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={<DashPageFallback />}>{children}</Suspense>;
}
