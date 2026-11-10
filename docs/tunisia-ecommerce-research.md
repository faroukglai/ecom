# Tunisia ecommerce: evidence and product page decisions

Date: 30 October 2026. This note records why the Darivo product page prioritizes a direct cash-on-delivery order.

## What the evidence says

- The [US International Trade Administration's Tunisia guide](https://www.trade.gov/country-commercial-guides/tunisia-ecommerce) says cash on delivery is the most common local option. It attributes buyer hesitation to uncertainty about product quality, delivery reliability, and refunds. Its >80% figure cites a Tunisian ministry; it should be treated as a directional figure, not a current conversion benchmark.
- [UN Trade and Development's 2025 review](https://unctad.org/system/files/official-document/dtlecde2025d4_en.pdf) describes the Tunisian ecommerce barometer. It reports a shift towards mobile and social shopping and cash on delivery. Buyers gave importance to website clarity, attractive prices, returns, and short delivery times. This is stronger evidence for page design than copying a competitor's claims.
- A [peer-reviewed cross-sectional survey of 137 Tunisian online shoppers](https://pmc.ncbi.nlm.nih.gov/articles/PMC11859849/) found frequent concern about card information and defective goods. Deals, reduced prices, and free delivery were commonly given reasons to buy. The sample is small and is not representative of all Tunisian shoppers, so we use it to identify objections rather than predict exact sales uplift.
- The [Tunisian telecom regulator's 2023 digital usage survey](https://www.intt.tn/upload/files/Rapport%20Enqu%C3%AAte%20Usage%20Num%C3%A9rique%202023.pdf) also identifies payment on delivery as prevalent. Payment habits vary by survey and year, so the page does not display a market percentage as a sales claim.

## Design and copy choices

1. Place the real product photos and French product name immediately beside the form. Show a short description first, with long details expandable. This addresses quality uncertainty while keeping ordering visible.
2. Ask only for name, phone, governorate, and delivery address. This follows the data needed for the existing cash-on-delivery order endpoint.
3. Show the 7 TND delivery charge and the exact total before the button. The primary button says **Commander maintenant** and submits the order directly; there is no cart or checkout step on the product page.
4. Repeat **Paiement à la livraison** next to the price/form and clarify that no bank card is needed. Use short Tunisian Arabic reassurance beside the main French copy, without changing the reading direction of the form.
5. Use actual product images and discount math from catalog data. Never invent reviews, delivery deadlines, low-stock counts, or guarantees. The page shows only promises the current store configuration supports.

## Next experiments when real traffic exists

Track product-page visit → form start → valid submission → confirmed delivery, and refusals at delivery. A/B test a shorter description against an expanded one, and test whether a visible return policy or a real customer-service number reduces abandonment. Add WhatsApp contact only when a monitored business number exists. Use genuine customer photos and reviews only after collection and consent.
