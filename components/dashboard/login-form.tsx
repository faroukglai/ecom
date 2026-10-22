"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { ADMIN_EMAIL } from "@/lib/types";

export function LoginForm() {
  const router = useRouter();
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
          setError(loginError.message === "Email not confirmed" ? "Confirm the admin email in Supabase Auth, then try again." : "That password does not match this store.");
          setPending(false);
          return;
        }
        router.replace("/dashboard");
        router.refresh();
      }}
    >
      {error ? <p className="dash-login-error" role="alert">{error}</p> : null}
      <label>Email
        <input type="email" value={ADMIN_EMAIL} readOnly autoComplete="username"/>
      </label>
      <label>Password
        <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} required autoComplete="current-password" placeholder="Your store password"/>
      </label>
      <button type="submit" disabled={pending}>{pending ? "Signing in…" : "Log in"}</button>
    </form>
  );
}
