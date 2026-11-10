import Script from "next/script";
import { Suspense } from "react";
import { PixelRoute } from "@/components/store/pixel-route";

const id = process.env.NEXT_PUBLIC_META_PIXEL_ID ?? "";

/** Loads the Meta (Facebook/Instagram) Pixel only when NEXT_PUBLIC_META_PIXEL_ID is set. */
export function MetaPixel() {
  if (!/^\d{8,20}$/.test(id)) return null;
  return (
    <>
      <Script id="meta-pixel" strategy="afterInteractive">{`
!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');
fbq('init','${id}');fbq('track','PageView');`}</Script>
      <Suspense fallback={null}>
        <PixelRoute/>
      </Suspense>
    </>
  );
}
