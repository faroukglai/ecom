"use client";

import { useDashLocale } from "@/components/dashboard/locale";

export function SetupNotice({ message }: { message?: string }) {
  const { t } = useDashLocale();
  return (
    <section className="dash-card" style={{borderColor:"#fcd34d",background:"#fffbeb"}}>
      <h2 style={{fontSize:18,marginBottom:8}}>{t.setupTitle}</h2>
      <p style={{color:"#6b7280",fontSize:14,lineHeight:1.6}}>
        {message ?? t.setupBody}
      </p>
      <p style={{marginTop:12}}>
        <a className="dash-btn primary" href="https://supabase.com/dashboard/project/eocdleitnihglspprcsr/sql/new" target="_blank" rel="noreferrer">{t.openSql}</a>
      </p>
    </section>
  );
}
