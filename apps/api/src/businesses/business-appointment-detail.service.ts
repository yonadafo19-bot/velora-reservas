import { Injectable, NotFoundException } from "@nestjs/common";

import { DatabaseService } from "../common/database/database.service";
import type { TenantContext } from "../common/types/request-user";

@Injectable()
export class BusinessAppointmentDetailService {
  constructor(private readonly database: DatabaseService) {}

  async getAppointment(tenant: TenantContext, appointmentId: string) {
    const appointment = await this.database.getClient().appointment.findFirst({
      where: {
        id: appointmentId,
        businessId: tenant.businessId,
      },
      select: {
        id: true,
        status: true,
        source: true,
        startAt: true,
        endAt: true,
        totalPriceClp: true,
        totalDurationMinutes: true,
        currencySnapshot: true,
        timezoneSnapshot: true,
        isFirstVisit: true,
        createdAt: true,
        cancelledAt: true,
        cancellationSource: true,
        isLateCancellation: true,
        markedNoShowAt: true,
        depositRequiredSnapshot: true,
        customer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            phone: true,
            email: true,
            loyaltyTier: true,
            isManualVip: true,
          },
        },
        location: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        services: {
          select: {
            id: true,
            serviceId: true,
            packId: true,
            sequence: true,
            serviceNameSnapshot: true,
            servicePriceClpSnapshot: true,
            serviceDurationMinutesSnapshot: true,
          },
          orderBy: [
            { sequence: "asc" },
            { id: "asc" },
          ],
        },
        segments: {
          select: {
            id: true,
            professionalId: true,
            locationId: true,
            sequence: true,
            startsAt: true,
            endsAt: true,
            status: true,
            professional: {
              select: {
                id: true,
                displayName: true,
                roleTitle: true,
              },
            },
          },
          orderBy: [
            { sequence: "asc" },
            { startsAt: "asc" },
            { id: "asc" },
          ],
        },
        statusHistory: {
          select: {
            id: true,
            previousStatus: true,
            nextStatus: true,
            actorType: true,
            createdAt: true,
          },
          orderBy: [
            { createdAt: "asc" },
            { id: "asc" },
          ],
        },
      },
    });

    if (!appointment) {
      throw new NotFoundException({
        code: "APPOINTMENT_NOT_FOUND",
        message: "La cita no existe en este negocio.",
      });
    }

    const professionals = new Map<string, {
      id: string;
      displayName: string;
      roleTitle: string | null;
    }>();

    for (const segment of appointment.segments) {
      if (!professionals.has(segment.professional.id)) {
        professionals.set(segment.professional.id, {
          id: segment.professional.id,
          displayName: segment.professional.displayName,
          roleTitle: segment.professional.roleTitle,
        });
      }
    }

    return {
      id: appointment.id,
      status: appointment.status,
      source: appointment.source,
      startAt: appointment.startAt.toISOString(),
      endAt: appointment.endAt.toISOString(),
      totalPriceClp: appointment.totalPriceClp,
      totalDurationMinutes: appointment.totalDurationMinutes,
      currency: appointment.currencySnapshot,
      timezone: appointment.timezoneSnapshot,
      isFirstVisit: appointment.isFirstVisit,
      createdAt: appointment.createdAt.toISOString(),
      cancelledAt: appointment.cancelledAt?.toISOString() ?? null,
      cancellationSource: appointment.cancellationSource,
      isLateCancellation: appointment.isLateCancellation,
      markedNoShowAt: appointment.markedNoShowAt?.toISOString() ?? null,
      depositRequired: appointment.depositRequiredSnapshot,
      customer: {
        id: appointment.customer.id,
        fullName: [
          appointment.customer.firstName,
          appointment.customer.lastName,
        ].filter(Boolean).join(" "),
        phone: appointment.customer.phone,
        email: appointment.customer.email,
        loyaltyTier: appointment.customer.loyaltyTier,
        isManualVip: appointment.customer.isManualVip,
      },
      location: {
        id: appointment.location.id,
        name: appointment.location.name,
        slug: appointment.location.slug,
      },
      services: appointment.services.map((service) => ({
        id: service.id,
        serviceId: service.serviceId,
        packId: service.packId,
        sequence: service.sequence,
        name: service.serviceNameSnapshot,
        durationMinutes: service.serviceDurationMinutesSnapshot,
        priceClp: service.servicePriceClpSnapshot,
      })),
      professionals: [...professionals.values()],
      segments: appointment.segments.map((segment) => ({
        id: segment.id,
        professionalId: segment.professionalId,
        locationId: segment.locationId,
        sequence: segment.sequence,
        startsAt: segment.startsAt.toISOString(),
        endsAt: segment.endsAt.toISOString(),
        status: segment.status,
      })),
      statusHistory: appointment.statusHistory.map((historyEntry) => ({
        id: historyEntry.id,
        fromStatus: historyEntry.previousStatus,
        toStatus: historyEntry.nextStatus,
        actorType: historyEntry.actorType,
        changedAt: historyEntry.createdAt.toISOString(),
      })),
    };
  }
}
