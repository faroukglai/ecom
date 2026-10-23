"use client";

import { BrandLogo } from "@/components/brand-logo";
import { LoginForm } from "@/components/dashboard/login-form";
import { LangSwitch, useDashLocale } from "@/components/dashboard/locale";

export default function LoginPage() {
  const { t } = useDashLocale();
  return (
    <div className="dash-login">
      <div className="dash-login-card">
        <div className="dash-login-head">
          <span className="dash-brand-chip"><BrandLogo size={28}/> {t.storeName}</span>
          <LangSwitch/>
        </div>
        <h1>{t.loginTitle}</h1>
        <p>{t.loginHelp}</p>
        <LoginForm/>
      </div>
    </div>
  );
}
