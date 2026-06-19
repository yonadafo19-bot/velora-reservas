import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "Velora Reservas", template: "%s · Velora Reservas" },
  description: "Reservas online premium para barberías y estudios de belleza en Chile.",
};

export const viewport: Viewport = { themeColor: "#f6f2eb", width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="es-CL"><body>{children}</body></html>;
}
