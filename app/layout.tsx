import type { Metadata } from "next";
import localFont from "next/font/local";
import { site } from "@/config/site";
import "./globals.css";
const sans = localFont({ src: "../public/fonts/dm-sans.woff2", variable: "--font-dm-sans", display: "swap", weight: "100 1000" });
const display = localFont({ src: "../public/fonts/lora.woff2", variable: "--font-lora", display: "swap", weight: "400 700" });
export const metadata: Metadata = { title: { default: `${site.name} — Make home feel like you`, template: `%s | ${site.name}` }, description: site.promise };
export default function RootLayout({ children }: { children: React.ReactNode }) { return <html lang="en" className={`${sans.variable} ${display.variable}`}><body>{children}</body></html>; }
