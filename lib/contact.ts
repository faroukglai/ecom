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
