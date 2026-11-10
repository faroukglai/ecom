import { Suspense } from "react";

export function DashPageFallback() {
  return (
    <div className="dash-loading" aria-busy="true">
      <div className="dash-skel" style={{ height: 56, maxWidth: 320 }}/>
      <div className="dash-skel"/>
      <div className="dash-skel" style={{ height: 240 }}/>
    </div>
  );
}

export function DashPage({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={<DashPageFallback />}>{children}</Suspense>;
}
