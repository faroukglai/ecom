"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { ADMIN_EMAIL } from "@/lib/types";
import { useDashLocale } from "@/components/dashboard/locale";
import { clearDashboardFieldError, validateDashboardForm } from "@/components/dashboard/validation";

export function LoginForm() {
  const router = useRouter();
  const { t, showError } = useDashLocale();
  const [password, setPassword] = useState("");
  const [pending, setPending] = useState(false);

  return (
    <form
      noValidate
      onInputCapture={(event) => clearDashboardFieldError(event.target)}
      onSubmit={async (event) => {
        event.preventDefault();
        if (!validateDashboardForm(event.currentTarget, showError, t.requiredFields)) return;
        setPending(true);
        try {
          const supabase = createClient();
          const { error: loginError } = await supabase.auth.signInWithPassword({
            email: ADMIN_EMAIL,
            password,
          });
          if (loginError) {
            showError(loginError.message === "Email not confirmed" ? t.emailNotConfirmed : t.badPassword);
            return;
          }
          router.replace("/dashboard");
          router.refresh();
        } catch {
          showError(t.loginFailed);
        } finally {
          setPending(false);
        }
      }}
    >
      <label>{t.email}
        <input type="email" value={ADMIN_EMAIL} readOnly autoComplete="username"/>
      </label>
      <label>{t.password}
        <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} required autoComplete="current-password" placeholder={t.passwordPlaceholder}/>
      </label>
      <button type="submit" disabled={pending}>{pending ? t.signingIn : t.logIn}</button>
    </form>
  );
}
