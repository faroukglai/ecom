import type { Metadata } from "next";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { OrderConfirmation } from "@/components/store/order-confirmation";
import { getCopy, hasLang } from "@/lib/store-i18n";

type Props = { params: Promise<{ lang: string; number: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang } = await params;
  return { title: hasLang(lang) ? getCopy(lang).thanks : "Darivo", robots: { index: false, follow: false } };
}

export default function OrderPage({ params }: Props) {
  return (
    <Suspense fallback={<div className="st-skel" style={{ height: 320 }}/>}>
      <Confirmation params={params}/>
    </Suspense>
  );
}

async function Confirmation({ params }: Props) {
  const { lang, number } = await params;
  if (!hasLang(lang)) notFound();
  // Order numbers look like DR-20261110-AB12CD34; anything else is not ours.
  if (!/^DR-\d{8}-[A-Z0-9]{8}$/.test(number)) notFound();
  return <OrderConfirmation number={number} lang={lang}/>;
}
