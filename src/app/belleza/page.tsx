import type { Metadata } from "next";
import { VerticalPage } from "@/components/verticales/vertical-page";
export const metadata: Metadata = { title: "Demo Belleza" };
export default function BellezaPage() { return <VerticalPage vertical="belleza"/>; }
