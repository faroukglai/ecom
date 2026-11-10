import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { site } from "@/config/site";
import "./globals.css";

const sans = localFont({ src: "../public/fonts/dm-sans.woff2", variable: "--font-dm-sans", display: "swap", weight: "100 1000" });

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: { default: site.name, template: `%s | ${site.name}` },
  description: "Déco et maison livrées partout en Tunisie. Paiement à la livraison.",
  openGraph: { siteName: site.name, type: "website", images: [{ url: "/images/hero.webp", width: 1536, height: 1024 }] },
  twitter: { card: "summary_large_image" },
};
export const viewport: Viewport = { width: "device-width", initialScale: 1, viewportFit: "cover" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className={sans.variable}>
      <body>{children}</body>
    </html>
  );
}
