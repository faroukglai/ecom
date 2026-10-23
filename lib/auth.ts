import { connection } from "next/server";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ADMIN_EMAIL } from "@/lib/types";

export async function requireAdmin() {
  await connection();
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const email = typeof data?.claims?.email === "string" ? data.claims.email : "";
  if (!email || email !== ADMIN_EMAIL) redirect("/dashboard/login");
  return { supabase, email };
}
