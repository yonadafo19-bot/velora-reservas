import type { Metadata } from "next";
import { VerticalPage } from "@/components/verticales/vertical-page";
export const metadata: Metadata = { title: "Demo Barbería" };
export default function BarberiaPage() { return <VerticalPage vertical="barberia"/>; }
