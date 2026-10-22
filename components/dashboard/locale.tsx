"use client";

import { createContext, useContext, useMemo, useOptimistic, useTransition } from "react";
import { useRouter } from "next/navigation";
import { dashCopy, parseDashLang, type DashLang } from "@/lib/dashboard-i18n";

function persistLang(lang: DashLang) {
  document.cookie = `dash_lang=${lang}; Path=/; Max-Age=31536000; SameSite=Lax`;
}

type LocaleContextValue = {
  lang: DashLang;
  t: (typeof dashCopy)[DashLang];
  setLang: (lang: DashLang) => void;
};

const LocaleContext = createContext<LocaleContextValue | null>(null);

export function DashLocaleProvider({ initialLang, children }: { initialLang: DashLang; children: React.ReactNode }) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [lang, setOptimisticLang] = useOptimistic(initialLang);

  const value = useMemo<LocaleContextValue>(() => ({
    lang,
    t: dashCopy[lang],
    setLang(next) {
      const resolved = parseDashLang(next);
      persistLang(resolved);
      const root = document.querySelector(".dash-root");
      if (root instanceof HTMLElement) {
        root.dir = resolved === "ar" ? "rtl" : "ltr";
        root.lang = resolved;
        root.classList.toggle("dash-ar", resolved === "ar");
      }
      startTransition(() => {
        setOptimisticLang(resolved);
        router.refresh();
      });
    },
  }), [lang, router, setOptimisticLang]);

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useDashLocale() {
  const context = useContext(LocaleContext);
  if (!context) throw new Error("Dash locale is missing.");
  return context;
}

export function LangSwitch() {
  const { lang, setLang, t } = useDashLocale();
  return (
    <div className="dash-lang" role="group" aria-label={t.language}>
      <button type="button" className={lang === "en" ? "active" : ""} onClick={() => setLang("en")}>EN</button>
      <button type="button" className={lang === "ar" ? "active" : ""} onClick={() => setLang("ar")}>عربي</button>
    </div>
  );
}
