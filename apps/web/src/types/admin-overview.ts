import type { AdminCalendarAppointment } from "@/types/admin-calendar";

export interface AdminOverviewMetric {
  label: string;
  value: number;
  detail: string;
  kind: "count" | "currency";
}

export interface AdminOverviewAlert {
  id: string;
  title: string;
  detail: string;
  href: string;
}

export interface AdminOverviewData {
  businessName: string;
  greeting: string;
  localDateLabel: string;
  metrics: AdminOverviewMetric[];
  appointments: AdminCalendarAppointment[];
  alerts: AdminOverviewAlert[];
}

export type AdminOverviewLoadState =
  | {
      status: "ready";
      data: AdminOverviewData;
    }
  | {
      status: "error";
      message: string;
    };
