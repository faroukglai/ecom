import { site } from "@/config/site";

const digits = (value: string) => value.replace(/\D/g, "");

export const hasPhone = () => digits(site.contact.phone).length >= 8;
export const hasWhatsapp = () => digits(site.contact.whatsapp).length >= 8;

export const telHref = () => `tel:+${digits(site.contact.phone)}`;
export const whatsappHref = (text = "") => {
  const base = `https://wa.me/${digits(site.contact.whatsapp)}`;
  return text ? `${base}?text=${encodeURIComponent(text)}` : base;
};
export const displayPhone = () => site.contact.phone;

/** "21622123456" -> "+216 22 123 456" for display; anything else is shown as typed with a plus sign. */
export const displayWhatsapp = () => {
  const d = digits(site.contact.whatsapp);
  return /^216\d{8}$/.test(d) ? `+216 ${d.slice(3, 5)} ${d.slice(5, 8)} ${d.slice(8)}` : `+${d}`;
};
