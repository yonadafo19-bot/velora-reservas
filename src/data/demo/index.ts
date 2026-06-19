import type {
  DemoAppointment,
  DemoBusiness,
  DemoClient,
  DemoProfessional,
  DemoSchedule,
  DemoService,
  DemoMetric,
  BusinessVertical,
} from "@/types/demo";

export const businesses: DemoBusiness[] = [
  {
    businessId: "biz_barberia_01",
    vertical: "barberia",
    name: "Velora Barbería",
    descriptor: "Concepto ficticio · Demo comercial",
    tagline: "Precisión, oficio y una experiencia a tu altura.",
    address: "Ubicación referencial · Santiago",
    phone: "+56 9 0000 0000",
    rating: 4.9,
    reviewCount: 126,
  },
  {
    businessId: "biz_belleza_01",
    vertical: "belleza",
    name: "Velora Belleza",
    descriptor: "Concepto ficticio · Demo comercial",
    tagline: "Detalles que elevan tu belleza natural.",
    address: "Ubicación referencial · Santiago",
    phone: "+56 9 0000 0000",
    rating: 4.9,
    reviewCount: 98,
  },
];

export const services: DemoService[] = [
  { serviceId: "svc_b_01", businessId: "biz_barberia_01", vertical: "barberia", name: "Corte clásico", description: "Asesoría, corte a tijera o máquina y styling final.", durationMinutes: 45, priceClp: 22000, featured: true },
  { serviceId: "svc_b_02", businessId: "biz_barberia_01", vertical: "barberia", name: "Degradado premium", description: "Fade de precisión con terminaciones a navaja.", durationMinutes: 60, priceClp: 28000 },
  { serviceId: "svc_b_03", businessId: "biz_barberia_01", vertical: "barberia", name: "Corte + barba", description: "Servicio completo con ritual de toalla caliente.", durationMinutes: 75, priceClp: 38000, featured: true },
  { serviceId: "svc_b_04", businessId: "biz_barberia_01", vertical: "barberia", name: "Perfilado de barba", description: "Diseño, rebaje y contornos definidos.", durationMinutes: 30, priceClp: 18000 },
  { serviceId: "svc_b_05", businessId: "biz_barberia_01", vertical: "barberia", name: "Limpieza facial", description: "Limpieza y cuidado facial masculino.", durationMinutes: 40, priceClp: 25000 },
  { serviceId: "svc_b_06", businessId: "biz_barberia_01", vertical: "barberia", name: "Camuflaje de canas", description: "Matización natural de cabello o barba.", durationMinutes: 45, priceClp: 32000 },
  { serviceId: "svc_be_01", businessId: "biz_belleza_01", vertical: "belleza", name: "Esmaltado permanente", description: "Preparación, color y acabado brillante de larga duración.", durationMinutes: 60, priceClp: 24000, featured: true },
  { serviceId: "svc_be_02", businessId: "biz_belleza_01", vertical: "belleza", name: "Uñas acrílicas", description: "Extensión y diseño personalizado de acabado natural.", durationMinutes: 120, priceClp: 42000 },
  { serviceId: "svc_be_03", businessId: "biz_belleza_01", vertical: "belleza", name: "Lifting de pestañas", description: "Curvatura, tinte y nutrición para una mirada luminosa.", durationMinutes: 75, priceClp: 32000, featured: true },
  { serviceId: "svc_be_04", businessId: "biz_belleza_01", vertical: "belleza", name: "Extensión de pestañas", description: "Set clásico aplicado según la forma de tus ojos.", durationMinutes: 120, priceClp: 48000 },
  { serviceId: "svc_be_05", businessId: "biz_belleza_01", vertical: "belleza", name: "Diseño de cejas", description: "Visagismo, perfilado y definición sutil.", durationMinutes: 35, priceClp: 18000 },
  { serviceId: "svc_be_06", businessId: "biz_belleza_01", vertical: "belleza", name: "Laminado de cejas", description: "Dirección, fijación y nutrición del vello natural.", durationMinutes: 60, priceClp: 28000 },
];

export const professionals: DemoProfessional[] = [
  { professionalId: "pro_b_01", businessId: "biz_barberia_01", vertical: "barberia", name: "Matías Soto", role: "Barbero senior", initials: "MS", serviceIds: ["svc_b_01", "svc_b_02", "svc_b_03", "svc_b_04"] },
  { professionalId: "pro_b_02", businessId: "biz_barberia_01", vertical: "barberia", name: "Tomás Vidal", role: "Especialista en fade", initials: "TV", serviceIds: ["svc_b_01", "svc_b_02", "svc_b_03", "svc_b_06"] },
  { professionalId: "pro_b_03", businessId: "biz_barberia_01", vertical: "barberia", name: "Diego Reyes", role: "Barbero & grooming", initials: "DR", serviceIds: ["svc_b_03", "svc_b_04", "svc_b_05"] },
  { professionalId: "pro_be_01", businessId: "biz_belleza_01", vertical: "belleza", name: "Sofía Araya", role: "Nail artist", initials: "SA", serviceIds: ["svc_be_01", "svc_be_02"] },
  { professionalId: "pro_be_02", businessId: "biz_belleza_01", vertical: "belleza", name: "Valentina Ríos", role: "Lashista senior", initials: "VR", serviceIds: ["svc_be_03", "svc_be_04"] },
  { professionalId: "pro_be_03", businessId: "biz_belleza_01", vertical: "belleza", name: "Antonia Silva", role: "Brow artist", initials: "AS", serviceIds: ["svc_be_05", "svc_be_06"] },
];

export const clients: DemoClient[] = [
  { clientId: "cli_b_01", businessId: "biz_barberia_01", vertical: "barberia", name: "Nicolás Pérez", phone: "+56 9 1234 5678", lastVisit: "Hace 2 días", totalVisits: 8 },
  { clientId: "cli_b_02", businessId: "biz_barberia_01", vertical: "barberia", name: "Felipe Lagos", phone: "+56 9 2345 6789", lastVisit: "Hace 1 semana", totalVisits: 5 },
  { clientId: "cli_b_03", businessId: "biz_barberia_01", vertical: "barberia", name: "Martín Fuentes", phone: "+56 9 3456 7890", lastVisit: "Hace 2 semanas", totalVisits: 3 },
  { clientId: "cli_be_01", businessId: "biz_belleza_01", vertical: "belleza", name: "Josefina Mella", phone: "+56 9 4567 8901", lastVisit: "Ayer", totalVisits: 11 },
  { clientId: "cli_be_02", businessId: "biz_belleza_01", vertical: "belleza", name: "Camila Torres", phone: "+56 9 5678 9012", lastVisit: "Hace 4 días", totalVisits: 6 },
  { clientId: "cli_be_03", businessId: "biz_belleza_01", vertical: "belleza", name: "Fernanda Díaz", phone: "+56 9 6789 0123", lastVisit: "Hace 1 semana", totalVisits: 4 },
];

export const appointments: DemoAppointment[] = [
  { appointmentId: "apt_b_01", businessId: "biz_barberia_01", serviceId: "svc_b_03", professionalId: "pro_b_01", clientId: "cli_b_01", vertical: "barberia", status: "confirmed", dayOffset: 0, time: "10:00" },
  { appointmentId: "apt_b_02", businessId: "biz_barberia_01", serviceId: "svc_b_02", professionalId: "pro_b_02", clientId: "cli_b_02", vertical: "barberia", status: "pending", dayOffset: 0, time: "12:30" },
  { appointmentId: "apt_b_03", businessId: "biz_barberia_01", serviceId: "svc_b_01", professionalId: "pro_b_03", clientId: "cli_b_03", vertical: "barberia", status: "completed", dayOffset: 1, time: "16:00" },
  { appointmentId: "apt_b_04", businessId: "biz_barberia_01", serviceId: "svc_b_04", professionalId: "pro_b_01", clientId: "cli_b_02", vertical: "barberia", status: "cancelled", dayOffset: 3, time: "18:30" },
  { appointmentId: "apt_b_05", businessId: "biz_barberia_01", serviceId: "svc_b_03", professionalId: "pro_b_02", clientId: "cli_b_01", vertical: "barberia", status: "no_show", dayOffset: -2, time: "11:30" },
  { appointmentId: "apt_be_01", businessId: "biz_belleza_01", serviceId: "svc_be_01", professionalId: "pro_be_01", clientId: "cli_be_01", vertical: "belleza", status: "confirmed", dayOffset: 0, time: "09:30" },
  { appointmentId: "apt_be_02", businessId: "biz_belleza_01", serviceId: "svc_be_03", professionalId: "pro_be_02", clientId: "cli_be_02", vertical: "belleza", status: "pending", dayOffset: 0, time: "12:00" },
  { appointmentId: "apt_be_03", businessId: "biz_belleza_01", serviceId: "svc_be_06", professionalId: "pro_be_03", clientId: "cli_be_03", vertical: "belleza", status: "completed", dayOffset: 1, time: "15:30" },
  { appointmentId: "apt_be_04", businessId: "biz_belleza_01", serviceId: "svc_be_04", professionalId: "pro_be_02", clientId: "cli_be_01", vertical: "belleza", status: "cancelled", dayOffset: 4, time: "17:00" },
  { appointmentId: "apt_be_05", businessId: "biz_belleza_01", serviceId: "svc_be_05", professionalId: "pro_be_03", clientId: "cli_be_02", vertical: "belleza", status: "no_show", dayOffset: -1, time: "10:30" },
];

export const schedules: DemoSchedule[] = professionals.map((professional) => ({
  businessId: professional.businessId,
  professionalId: professional.professionalId,
  vertical: professional.vertical,
  weekdays: ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"],
  startTime: professional.vertical === "barberia" ? "10:00" : "09:30",
  endTime: professional.vertical === "barberia" ? "20:00" : "19:30",
}));

export const metrics: DemoMetric[] = [
  { businessId: "biz_barberia_01", vertical: "barberia", todayAppointments: 8, weekAppointments: 42, estimatedMonthlyRevenueClp: 3280000, occupancyPercent: 78 },
  { businessId: "biz_belleza_01", vertical: "belleza", todayAppointments: 7, weekAppointments: 36, estimatedMonthlyRevenueClp: 4120000, occupancyPercent: 82 },
];

export function isVertical(value: string | undefined): value is BusinessVertical {
  return value === "barberia" || value === "belleza";
}

export function getBusiness(vertical: BusinessVertical) {
  return businesses.find((item) => item.vertical === vertical)!;
}

export function getServices(vertical: BusinessVertical) {
  return services.filter((item) => item.vertical === vertical);
}

export function getProfessionals(vertical: BusinessVertical) {
  return professionals.filter((item) => item.vertical === vertical);
}

export function getClients(vertical: BusinessVertical) {
  return clients.filter((item) => item.vertical === vertical);
}

export function getAppointments(vertical: BusinessVertical) {
  return appointments.filter((item) => item.vertical === vertical);
}
