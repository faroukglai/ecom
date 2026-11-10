"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { localePath, type Lang } from "@/lib/store-i18n";

/** Switches between French and Arabic on the same page and remembers the choice. */
export function LangSwitch({ lang, label }: { lang: Lang; label: string }) {
  const pathname = usePathname();
  const other: Lang = lang === "fr" ? "ar" : "fr";
  const base = pathname.replace(/^\/(fr|ar)(?=\/|$)/, "") || "/";

  return (
    <Link
      className="st-lang"
      href={localePath(other, base)}
      lang={other}
      prefetch={false}
      onClick={() => {
        document.cookie = `store_lang=${other}; Path=/; Max-Age=31536000; SameSite=Lax`;
      }}
    >
      {label}
    </Link>
  );
}
