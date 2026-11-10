# Darivo storefront plan: a clean, trusted, cash-on-delivery store for Tunisia

Status: proposal, nothing built yet. Written 10 November 2026.

## 1. The goal in one sentence

A shopper on a mid-range Android phone, arriving from a Facebook or Instagram ad, sees a product, trusts it, and orders in under 45 seconds without making an account, reading a long page, or doing any maths.

Everything that does not serve that sentence gets removed.

## 2. Who we are designing for (and what that means)

We are not designing for "bad users". We are designing for people who have good reasons to be careful online.

| What is true for many Tunisian shoppers | What the store must do |
|---|---|
| They have been burned: photos that don't match, sellers who vanish, no refunds. Trust is the main barrier, not price. | Real photos only. A real phone and WhatsApp number on every page. Clear, specific delivery and return promises. Payment only on delivery. |
| They buy through Facebook/Instagram and often through Messenger or WhatsApp, not websites. | A visible "Commander par WhatsApp" option next to the form for people who fear forms. Pages open fast inside the Facebook/Instagram in-app browser. |
| Phones are mid-range, mobile data is limited, connections drop. | Light pages, small images, forms that survive a bad connection and never lose what was typed. |
| Low patience and low digital confidence. Words like "checkout", "coupon", "account" mean nothing. | No cart, no account, no password, no email field, no coupon box. One action per screen, big buttons, plain words. |
| They fear hidden costs. | Show the delivery fee (7 DT) next to the price from the first screen, and the exact total before the button. |
| Addresses are informal ("near the pharmacy"). Couriers phone anyway. | Ask governorate, city and a free-text address plus an optional landmark. Say clearly that we will call to confirm. |
| Many speak French and Arabic mixed. | French and Arabic, one tap to switch, proper right-to-left Arabic. No English. |
| COD has a real cost for the seller: fake orders and refused parcels. | Confirmation-call workflow, duplicate and spam protection, and a "refused" status in the dashboard. |

Rules that follow from this:

1. One decision per screen. One obvious button per screen.
2. Never make the shopper think about "what happens next". Tell them in one line, before and after ordering.
3. Never invent proof: no fake reviews, no fake stock counts, no invented delivery times. Show only what the owner can honour.
4. Prices are written "49 DT" (the form Tunisians use), with Western digits in both languages.

## 3. What we keep, cut and add

### Cut completely (extra)
- Cart and cart drawer, checkout page, order summary sidebar
- Coupons (WELCOME10, HOME15, FREESHIP) and the fake newsletter form
- Wishlist, account page, track-order page that only reads this device's storage
- Journal / inspiration pages, "Notre histoire" long page, hero carousel, mega menu, promo tiles, benefit band
- Promises we cannot back up (for example "Complimentary delivery on this set" while the order charges 7 DT)
- English text everywhere in the storefront

### Keep
- The direct-order product page idea (it is right) and the 7 DT flat delivery
- Warm, calm Darivo look and the logo
- The secure order function in the database (`place_order`), reused as is

### Add
- Sticky "Commander" bar on mobile product pages
- Order confirmation page with what happens next, plus WhatsApp and call buttons
- "Commander par WhatsApp" secondary button
- Help page with delivery, returns and contact in one place
- Real analytics events and Meta Pixel (ads are how stores here get traffic)
- Order notifications to the owner (WhatsApp, Telegram or email) and basic fraud controls

## 4. Site map (final)

```
/                    Home
/shop                All products, category chips, search
/products/[slug]     Product page with the order form (the money page)
/order/[number]      Confirmation page after ordering
/help                Delivery, returns, payment, FAQ, contact (one page)
/legal               Terms and privacy (one page, short, in plain language)
```

Six routes instead of seventeen. Category pages become `/shop?category=…` so there is one listing page to maintain.

## 5. Page by page

### 5.1 Home (a shop window, not a magazine)
1. Header: logo, search icon, language switch, WhatsApp/call icon. No menu with nine items.
2. Trust strip (four short items with icons): Paiement à la livraison, Livraison dans toute la Tunisie 7 DT, Retour (the real period), Appelez-nous (real number).
3. One hero: a single best product or the best category photo, one headline, one button "Voir les produits".
4. Categories as large photo tiles (at most six; hide the rest under "Voir tout").
5. Best sellers grid (8 products).
6. "Comment commander" in three steps with icons: Choisissez, Remplissez 4 champs, Payez à la réception.
7. Footer: phone, WhatsApp, social links, Help, Legal. Nothing else.

### 5.2 Shop (find and compare quickly)
- Two-column grid on phones. Card: large photo, name, price, struck-through old price with "−20%" badge, "Commander" button.
- Category chips in one horizontal scrolling row. Sort: Nouveautés, Prix croissant, Prix décroissant. Search box that filters as you type.
- No price slider, no filter drawer, no pagination (the catalogue is small). Loading skeletons so the page never looks broken on slow data.

### 5.3 Product page (where the money is made)
Top to bottom on a phone:
1. Photo gallery with swipe and dots (first photo large and sharp, others lazy-loaded).
2. Name, price in large type, old price and "−%" badge, "Livraison 7 DT · Paiement à la livraison" directly under the price.
3. Primary button "Commander maintenant" (also pinned as a sticky bar at the bottom of the screen). It scrolls to the form.
4. The order form: Nom complet, Téléphone, Gouvernorat, Ville, Adresse (with optional "point de repère"), quantity stepper. Nothing else.
5. Live total: "Total à payer à la livraison: 56 DT" updating with quantity.
6. Reassurance line (only what the owner can honour), for example "Vous payez à la réception. Nous vous appelons pour confirmer."
7. Secondary button: "Commander par WhatsApp" (opens WhatsApp with the product and price already written).
8. Short description, then expandable details: material, colour, dimensions, care. Dimensions are the most-asked question for decor and are currently missing.
9. "Complétez votre commande": up to three related products as tick boxes added to the same order (this replaces the cart and raises order value).

Form behaviour that matters:
- Phone field accepts "22 123 456", "+216 22123456" or "0022122123456" and normalises to 8 digits, with a clear message if wrong.
- Numeric keyboard for phone, large 48px fields, 16px text so phones never zoom.
- Errors appear next to the field in plain French or Arabic, never as a generic alert.
- Draft is kept on the device; double-tap and slow network are handled; a failed send offers "Réessayer" and the WhatsApp fallback.

### 5.4 Confirmation page `/order/[number]`
- Big check, "Commande reçue", the order number and the summary (items, delivery, total to pay).
- "Que se passe-t-il maintenant ?" in three lines: we call you, we ship, you pay when you receive. Use the real timings from the owner.
- Buttons: WhatsApp us, Call us, Continue shopping.
- Reachable only with the order number from the same session, so personal details are not exposed to guessing.

### 5.5 Help page
One page with anchors: Livraison, Retour et échange, Paiement, Contact. Short answers, real numbers, no marketing copy.

## 6. Language and copy
- French by default and Arabic on one tap, remembered. Right-to-left layout is real, not mirrored by accident. Phone numbers and prices stay left-to-right inside Arabic text.
- Arabic is simple Modern Standard Arabic for the interface, with a short Tunisian reassurance line where it helps. The owner confirms the tone.
- Product names and descriptions are stored in the database in both languages and edited in the dashboard. This removes the hardcoded French dictionary in the code, so every new product is complete in both languages.
- Copy rules: short sentences, verbs first, no English words, no jargon ("Commander", not "Checkout").

## 7. Visual design
- Keep the warm neutral Darivo palette. One strong accent colour used only for the main action buttons so the eye always knows where to tap.
- Minimum tap target 48px, base text 16px, strong contrast, generous spacing, product photos on plain backgrounds, consistent photo ratio.
- Icons: Hugeicons **Rounded / Stroke** (the same set already used in the dashboard) for the storefront too, for one consistent, light look. Category tiles can use the Furnitures set (sofa, bed, lamp, cabinet, and so on) as small accents.
- Motion limited to feedback (button press, form success). No sliders, parallax or auto-playing anything.

## 8. Trust, ads and operations

### Trust
- Real phone and WhatsApp number in the header and footer on every page, and on the confirmation page.
- Photos of the real product. Reviews only if they are real and collected with consent.
- Plain return policy with a number of days and what is covered.

### Fake-order and refusal protection (cash on delivery)
- Honeypot field and per-phone, per-IP rate limit on order creation.
- Flag orders from a phone that ordered in the last 24 hours, and phones with past refusals.
- Dashboard: "Refusé" and "Retourné" statuses, a "to confirm by phone" queue, and a note field on each order.
- Instant notification to the owner when an order arrives.

### Ads and measurement
- Meta Pixel (and TikTok if used) with events: ViewContent, form started, Purchase. Server-side events later.
- One funnel to watch: product view, form started, order placed, confirmed by call, delivered, refused.

## 9. Performance (matters more than anything visual)
- Render pages on the server instead of one giant client component, so the first paint is real content on slow phones.
- Images as WebP, correctly sized, lazy-loaded below the first screen. First product photo under about 100 KB.
- Remove libraries the new design no longer needs (cart store, dialog library) and keep the JavaScript small.
- Cache product pages and refresh them when the owner edits a product in the dashboard.
- Test in a throttled "slow 4G" profile and inside the Facebook/Instagram in-app browser. Target: largest content visible under 2.5 seconds.

## 10. SEO basics (cheap and worth it)
Per-product title and description from the database, Open Graph image so shared links look good, Product structured data (price, availability), sitemap and robots, and clean French/Arabic URLs.

## 11. Technical changes required

| Area | Change |
|---|---|
| Structure | Replace `components/storefront.tsx` and the catch-all route with real routes: `/`, `/shop`, `/products/[slug]`, `/order/[number]`, `/help`, `/legal`. |
| Data | Add bilingual name and description columns, a dimensions field and an optional "bestseller" flag. Stop using the hardcoded French dictionary and the seed fallback catalogue. |
| Ordering | Reuse `place_order`. Add landmark/notes, source (campaign) and a hashed IP for abuse checks. Remove coupon support and shipping rules the owner doesn't want. |
| Client code | Small client pieces only: gallery, order form, sticky bar, language switch. Everything else server-rendered. |
| Dashboard | Refused and returned statuses, order notes, confirmation queue, bilingual product fields, new-order notification setting. |
| Cleanup | Delete cart, wishlist, account, journal, coupon and newsletter code and the styles that go with them. |

## 12. Delivery plan

### Phase 0: decisions from the owner (blocks copy and trust content)
See section 14. Nothing is built on guesses.

### Phase 1: strip and restructure
Remove the extras, create the six routes, server-render the catalogue, French/Arabic switch, design tokens and icons. Acceptance: the old routes are gone, the site builds, and every page works in both languages and on a 360px phone.

### Phase 2: the money path
Product page with sticky bar, the order form with phone normalisation, live total, WhatsApp order, confirmation page. Acceptance: a first-time user places an order in under 45 seconds on a throttled phone, and a failed network never loses their input.

### Phase 3: home and shop
Home sections, category tiles, shop grid, search, skeletons. Acceptance: any product reachable in two taps from the home page.

### Phase 4: trust, SEO and speed
Help and Legal pages with real content, metadata and structured data, image pipeline, Pixel events. Acceptance: Lighthouse mobile performance above 90 on the product page, and shared links preview correctly.

### Phase 5: operations
Notifications, spam and duplicate protection, new statuses, order notes and the confirmation queue in the dashboard.

### Phase 6: learn and improve
Weekly look at the funnel. First experiments: free delivery above a threshold, "complete the set" add-ons, a shorter description versus a longer one.

## 13. How we will know it works
- Product view to form start, form start to order, order to confirmed by phone, confirmed to delivered, delivered to refused.
- Median time from form start to submit under 45 seconds.
- Zero orders lost to errors in the logs.
- Largest content visible under 2.5 seconds on slow 4G.

## 14. Decisions we need from the owner
1. The real phone and WhatsApp number, and who answers them and when.
2. How soon do you call to confirm, and how long does delivery really take?
3. Can the customer open and inspect the parcel before paying? (It is a very strong trust line, but only if true.)
4. The return and exchange policy in plain words: how many days, who pays, what is covered.
5. Delivery fee: always 7 DT, or free above a certain order value?
6. Languages: French plus Arabic (recommended), or French only at first?
7. Social accounts to link, and whether you run Facebook/Instagram/TikTok ads (decides the pixels).
8. Which courier you use, and whether it gives tracking numbers.
9. Real product photos and the dimensions of each product.
10. Legal business name and address for the Terms and Privacy page.
