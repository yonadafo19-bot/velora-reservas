import Link from "next/link";
import { BookingFlow } from "@/components/booking/booking-flow";
import { isVertical } from "@/data/demo";

export default async function ReservarPage({ searchParams }: { searchParams: Promise<{ negocio?: string; servicio?: string }> }) {
  const params = await searchParams;
  if (!isVertical(params.negocio)) return <main className="booking-picker"><div><span className="eyebrow">RESERVA DEMO</span><h1>Elige una experiencia</h1><p>Selecciona el tipo de negocio para explorar el flujo de reserva.</p><div className="picker-grid"><Link href="/reservar?negocio=barberia"><span>V/B</span><strong>Velora Barbería</strong><small>Precisión y carácter</small></Link><Link href="/reservar?negocio=belleza"><span>V·B</span><strong>Velora Belleza</strong><small>Editorial y luminosa</small></Link></div><Link className="text-link" href="/">← Volver a Velora Reservas</Link></div></main>;
  return <BookingFlow vertical={params.negocio} initialServiceId={params.servicio}/>;
}

