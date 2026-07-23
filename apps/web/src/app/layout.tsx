import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, Outfit } from "next/font/google";
import "./globals.css";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
  display: "swap",
});

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  variable: "--font-cormorant",
  display: "swap",
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
});

export const metadata: Metadata = {
  title: { default: "Velora Reservas", template: "%s · Velora Reservas" },
  description: "Reservas online premium para barberías y estudios de belleza en Chile.",
};

export const viewport: Viewport = { themeColor: "#f6f2eb", width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="es-CL" data-scroll-behavior="smooth" className={`${outfit.variable} ${cormorant.variable}`}><body>{children}</body></html>;
}
