export type AdminCalendarStatus = "CONFIRMED" | "COMPLETED" | "CANCELLED" | "NO_SHOW";

export interface AdminCalendarResponse {
  range: {
    from: string;
    to: string;
    timezone: string;
  };
  summary: {
    total: number;
    byStatus: Record<AdminCalendarStatus, number>;
  };
  appointments: AdminCalendarAppointment[];
}

export interface AdminCalendarAppointment {
  id: string;
  status: AdminCalendarStatus;
  source: string;
  startAt: string;
  endAt: string;
  localDate: string;
  totalPriceClp: number;
  totalDurationMinutes: number;
  currency: string;
  timezone: string;
  isFirstVisit: boolean;
  customer: {
    id: string;
    fullName: string;
    phone: string;
    email: string | null;
  };
  location: {
    id: string;
    name: string;
    slug: string;
  };
  services: Array<{
    id: string;
    serviceId: string | null;
    packId: string | null;
    sequence: number;
    name: string;
    durationMinutes: number;
    priceClp: number;
  }>;
  professionals: Array<{
    id: string;
    displayName: string;
    roleTitle: string | null;
  }>;
  segments: Array<{
    id: string;
    professionalId: string;
    locationId: string;
    sequence: number;
    startsAt: string;
    endsAt: string;
    status: string;
  }>;
}

export type AdminCalendarLoadState =
  | {
      status: "ready";
      data: AdminCalendarResponse;
    }
  | {
      status: "missing-config";
      message: string;
    }
  | {
      status: "error";
      message: string;
      httpStatus?: number;
    };
