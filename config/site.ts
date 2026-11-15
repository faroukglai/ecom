const fromEnv = process.env.NEXT_PUBLIC_SITE_URL || (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : "");

export const site = {
  year: 2026,
  name: "Darivo",
  currency: "TND",
  shipping: 7,
  /** Public address of the store, used for sitemap, canonical links and share previews. Set NEXT_PUBLIC_SITE_URL to your real domain. */
  url: (fromEnv || "http://localhost:3000").replace(/\/$/, ""),
  /**
   * Contact details shown to customers. Leave a field empty to hide it everywhere.
   * Phone/WhatsApp: digits with country code, for example "21622123456".
   */
  contact: {
    phone: "",
    whatsapp: "21621056480",
    facebook: "",
    instagram: "",
  },
  /**
   * Promises the store can honour. Anything left empty is simply not shown, so the site never claims something that is not true.
   * Write each sentence in both languages, for example deliveryTime.fr = "2 à 4 jours ouvrables".
   */
  policy: {
    deliveryTime: { fr: "", ar: "" },
    confirmationCall: { fr: "", ar: "" },
    returns: { fr: "", ar: "" },
    /** true only if customers really may open and check the parcel before paying. */
    inspectBeforePay: false,
  },
  /** Shown on the Terms and Privacy page when filled in. */
  business: { name: "", address: "", taxId: "" },
};
