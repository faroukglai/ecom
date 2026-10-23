import { Suspense } from "react";
import { Cairo, Geist } from "next/font/google";
import { DashLocaleProvider } from "@/components/dashboard/locale";
import { getDashLang } from "@/lib/dashboard-lang";
import "./dashboard.css";

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist",
});

const cairo = Cairo({
  subsets: ["arabic", "latin"],
  variable: "--font-cairo",
});

const fontClass = `${geist.variable} ${cairo.variable}`;

export const instant = false;

export default function DashboardRootLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<div className={`dash-root ${fontClass}`}><div className="dash-login">Loading…</div></div>}>
      <DashboardFrame>{children}</DashboardFrame>
    </Suspense>
  );
}

async function DashboardFrame({ children }: { children: React.ReactNode }) {
  const lang = await getDashLang();
  return (
    <DashLocaleProvider initialLang={lang}>
      <div
        className={`dash-root ${fontClass} ${lang === "ar" ? "dash-ar" : ""}`}
        dir={lang === "ar" ? "rtl" : "ltr"}
        lang={lang}
      >
        {children}
      </div>
    </DashLocaleProvider>
  );
}
