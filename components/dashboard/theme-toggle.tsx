"use client";

import { useState } from "react";
import { Icon } from "@/components/dashboard/icons";
import { useDashLocale } from "@/components/dashboard/locale";

export function ThemeToggle({ initial }: { initial: "light" | "dark" }) {
  const { t } = useDashLocale();
  const [theme, setTheme] = useState(initial);

  function choose(next: "light" | "dark") {
    setTheme(next);
    document.cookie = `dash_theme=${next}; Path=/; Max-Age=31536000; SameSite=Lax`;
    document.querySelector(".dash-root")?.setAttribute("data-theme", next);
  }

  return (
    <div className="dash-lang" role="group" aria-label={t.appearance}>
      <button type="button" className={theme === "light" ? "active" : ""} onClick={() => choose("light")} aria-label={t.lightMode} title={t.lightMode}>
        <Icon name="sun" size={15}/>
      </button>
      <button type="button" className={theme === "dark" ? "active" : ""} onClick={() => choose("dark")} aria-label={t.darkMode} title={t.darkMode}>
        <Icon name="moon" size={15}/>
      </button>
    </div>
  );
}
