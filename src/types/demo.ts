export type BusinessVertical = "barberia" | "belleza";

export type AppointmentStatus =
  | "pending"
  | "confirmed"
  | "completed"
  | "cancelled"
  | "no_show";

export interface DemoBusiness {
  businessId: string;
  vertical: BusinessVertical;
  name: string;
  descriptor: string;
  tagline: string;
  address: string;
  phone: string;
  rating: number;
  reviewCount: number;
}

export interface DemoService {
  serviceId: string;
  businessId: string;
  vertical: BusinessVertical;
  name: string;
  description: string;
  durationMinutes: number;
  priceClp: number;
  featured?: boolean;
}

export interface DemoProfessional {
  professionalId: string;
  businessId: string;
  vertical: BusinessVertical;
  name: string;
  role: string;
  initials: string;
  serviceIds: string[];
}

export interface DemoClient {
  clientId: string;
  businessId: string;
  vertical: BusinessVertical;
  name: string;
  phone: string;
  lastVisit: string;
  totalVisits: number;
}

export interface DemoAppointment {
  appointmentId: string;
  businessId: string;
  serviceId: string;
  professionalId: string;
  clientId: string;
  vertical: BusinessVertical;
  status: AppointmentStatus;
  dayOffset: number;
  time: string;
}

export interface DemoSchedule {
  businessId: string;
  professionalId: string;
  vertical: BusinessVertical;
  weekdays: string[];
  startTime: string;
  endTime: string;
}

export interface DemoMetric {
  businessId: string;
  vertical: BusinessVertical;
  todayAppointments: number;
  weekAppointments: number;
  estimatedMonthlyRevenueClp: number;
  occupancyPercent: number;
}

export interface BookingDraft {
  appointmentId: string;
  businessId: string;
  serviceId: string;
  professionalId: string;
  clientId: string;
  vertical: BusinessVertical;
  date: string;
  time: string;
  clientName: string;
  clientPhone: string;
  clientEmail: string;
  status: "pending";
}
