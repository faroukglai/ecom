"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { ADMIN_EMAIL } from "@/lib/types";
import { useDashLocale } from "@/components/dashboard/locale";

export function LoginForm() {
  const router = useRouter();
  const { t } = useDashLocale();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  return (
    <form
      onSubmit={async (event) => {
        event.preventDefault();
        setPending(true);
        setError("");
        const supabase = createClient();
        const { error: loginError } = await supabase.auth.signInWithPassword({
          email: ADMIN_EMAIL,
          password,
        });
        if (loginError) {
          setError(loginError.message === "Email not confirmed" ? t.emailNotConfirmed : t.badPassword);
          setPending(false);
          return;
        }
        router.replace("/dashboard");
        router.refresh();
      }}
    >
      {error ? <p className="dash-login-error" role="alert">{error}</p> : null}
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
