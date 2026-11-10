"use client";

import { useEffect } from "react";
import { useDashLocale } from "@/components/dashboard/locale";

export default function DashboardError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const { t, showError } = useDashLocale();

  useEffect(() => {
    showError(t.actionFailed);
  }, [error, showError, t.actionFailed]);

  return <div className="dash-card dash-error-fallback" role="alert">
    <h2>{t.errorTitle}</h2>
    <p>{t.actionFailed}</p>
    <button type="button" className="dash-btn primary" onClick={reset}>{t.tryAgain}</button>
  </div>;
}
