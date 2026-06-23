import type { BusinessVertical } from "@/types/demo";

export interface AdminAppointmentServiceOption {
  id: string;
  name: string;
  durationMinutes: number;
  priceFrom: number;
  currency: string;
  isActive: boolean;
}

export interface AdminAppointmentCustomerOption {
  id: string;
  fullName: string;
  phone: string;
  email: string | null;
}

export interface AdminAppointmentProfessionalOption {
  id: string;
  displayName: string;
  roleTitle: string | null;
  isActive: boolean;
  services: Array<{
    id: string;
    name: string;
  }>;
}

export interface AdminAppointmentLocationOption {
  id: string;
  slug: string;
  name: string;
  timezone: string;
  status: string;
}

export interface AdminAppointmentBusinessHour {
  id: string;
  locationId: string | null;
  weekday: Weekday;
  opensAtLocal: string;
  closesAtLocal: string;
  status: string;
}

export interface AdminAppointmentWeeklyRule {
  id: string;
  locationId: string;
  weekday: Weekday;
  startsAtLocal: string;
  endsAtLocal: string;
  status: string;
}

export interface AdminAppointmentTimeOff {
  id: string;
  locationId: string | null;
  startsAt: string;
  endsAt: string;
  status: string;
}

export interface AdminAppointmentAvailability {
  businessHours: AdminAppointmentBusinessHour[];
  weeklyRules: AdminAppointmentWeeklyRule[];
  timeOff: AdminAppointmentTimeOff[];
}

export interface AdminAppointmentFormData {
  businessSlug: string;
  vertical: BusinessVertical;
  services: AdminAppointmentServiceOption[];
  customers: AdminAppointmentCustomerOption[];
  professionals: AdminAppointmentProfessionalOption[];
  locations: AdminAppointmentLocationOption[];
  locationsByProfessionalId: Record<string, string[]>;
  availabilityByProfessionalId: Record<string, AdminAppointmentAvailability>;
}

export type AdminAppointmentFormLoadState =
  | {
      status: "ready";
      data: AdminAppointmentFormData;
    }
  | {
      status: "missing-config";
      message: string;
    }
  | {
      status: "error";
      message: string;
      debugBlock?: AdminAppointmentFormLoadBlock;
    };

export type AdminAppointmentFormLoadBlock =
  | "services"
  | "customers"
  | "professionals"
  | "availability";

export interface AdminCreateAppointmentInput {
  businessSlug: string;
  customerId: string;
  serviceId: string;
  professionalId: string;
  locationId: string;
  date: string;
  time: string;
}

type Weekday =
  | "MONDAY"
  | "TUESDAY"
  | "WEDNESDAY"
  | "THURSDAY"
  | "FRIDAY"
  | "SATURDAY"
  | "SUNDAY";

export type AdminCreateAppointmentResult =
  | {
      ok: true;
      appointmentId: string;
    }
  | {
      ok: false;
      code: string;
      message: string;
    };
