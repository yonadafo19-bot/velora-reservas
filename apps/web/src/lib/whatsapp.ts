import { siteConfig } from "@/config/site";

export function getWhatsappHref() {
  if (!siteConfig.whatsapp.enabled) return "/contacto#formulario";
  return `https://wa.me/${siteConfig.whatsapp.number}?text=${encodeURIComponent(siteConfig.whatsapp.message)}`;
}

