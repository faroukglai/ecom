"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { dashboardErrorMessage } from "@/lib/dashboard-i18n";
import { useDashLocale } from "@/components/dashboard/locale";
import { clearDashboardFieldError, validateDashboardForm } from "@/components/dashboard/validation";

type ActionResult = { error?: string; redirectTo?: string };

export function DashActionForm({
  action,
  children,
  submitLabel,
  submitTitle,
  submitClassName = "dash-btn primary",
  className,
  style,
  confirmMessage,
  resetOnSuccess = false,
}: {
  action: (formData: FormData) => Promise<ActionResult>;
  children?: React.ReactNode;
  submitLabel: React.ReactNode;
  submitTitle?: string;
  submitClassName?: string;
  className?: string;
  style?: React.CSSProperties;
  confirmMessage?: string;
  resetOnSuccess?: boolean;
}) {
  const router = useRouter();
  const { t, showError } = useDashLocale();
  const [pending, setPending] = useState(false);

  return <form className={className} style={style} aria-busy={pending} noValidate onInputCapture={(event) => clearDashboardFieldError(event.target)} onSubmit={async (event) => {
    event.preventDefault();
    if (!validateDashboardForm(event.currentTarget, showError, t.requiredFields)) return;
    if (pending || (confirmMessage && !window.confirm(confirmMessage))) return;
    const form = event.currentTarget;
    setPending(true);
    try {
      const result = await action(new FormData(form));
      if (result?.error) {
        showError(dashboardErrorMessage(t, result.error));
        return;
      }
      if (resetOnSuccess) form.reset();
      if (result?.redirectTo) router.push(result.redirectTo);
      else router.refresh();
    } catch {
      showError(t.actionFailed);
    } finally {
      setPending(false);
    }
  }}>
    {children}
    <button className={submitClassName} type="submit" disabled={pending} title={submitTitle} aria-label={submitTitle}>{submitLabel}</button>
  </form>;
}
