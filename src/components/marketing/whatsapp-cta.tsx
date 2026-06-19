import Link from "next/link";
import { Icon } from "@/components/ui/icon";
import { getWhatsappHref } from "@/lib/whatsapp";
import { siteConfig } from "@/config/site";

export function WhatsappCta({ label = "Conversemos por WhatsApp", floating = false }: { label?: string; floating?: boolean }) {
  return (
    <Link className={floating ? "whatsapp-fab" : "button button--whatsapp"} href={getWhatsappHref()} aria-label={label}>
      <Icon name="whatsapp" />{!floating && <span>{label}{!siteConfig.whatsapp.enabled && " · Demo"}</span>}
    </Link>
  );
}

