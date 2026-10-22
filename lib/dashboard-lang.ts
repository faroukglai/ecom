import { cookies } from "next/headers";
import { dashCopy, parseDashLang, type DashLang } from "@/lib/dashboard-i18n";

export async function getDashLang(): Promise<DashLang> {
  const jar = await cookies();
  return parseDashLang(jar.get("dash_lang")?.value);
}

export async function getDashCopy() {
  const lang = await getDashLang();
  return { lang, t: dashCopy[lang] };
}
