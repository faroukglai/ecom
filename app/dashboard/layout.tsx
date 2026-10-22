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

export default async function DashboardRootLayout({ children }: { children: React.ReactNode }) {
  const lang = await getDashLang();
  return (
    <DashLocaleProvider initialLang={lang}>
      <div
        className={`dash-root ${geist.variable} ${cairo.variable} ${lang === "ar" ? "dash-ar" : ""}`}
        dir={lang === "ar" ? "rtl" : "ltr"}
        lang={lang}
      >
        {children}
      </div>
    </DashLocaleProvider>
  );
}
