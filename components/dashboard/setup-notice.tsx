"use client";

import { useDashLocale } from "@/components/dashboard/locale";

export function SetupNotice({ message }: { message?: string }) {
  const { t } = useDashLocale();
  return (
    <section className="dash-card dash-setup">
      <h2>{t.setupTitle}</h2>
      <p>{message ?? t.setupBody}</p>
      <a className="dash-btn primary" href="https://supabase.com/dashboard/project/eocdleitnihglspprcsr/sql/new" target="_blank" rel="noreferrer">{t.openSql}</a>
    </section>
  );
}
