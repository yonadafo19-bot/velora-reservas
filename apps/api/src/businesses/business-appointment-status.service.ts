import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import type {
  AppointmentSegmentStatus as PrismaAppointmentSegmentStatus,
  AppointmentStatus as PrismaAppointmentStatus,
  CancellationSource as PrismaCancellationSource,
} from "@velora/database";

import { TransactionService } from "../common/database/transaction.service";
import type { TenantContext } from "../common/types/request-user";
import { BusinessAppointmentDetailService } from "./business-appointment-detail.service";

const ALLOWED_TARGET_STATUSES = new Set([
  "COMPLETED",
  "CANCELLED",
  "NO_SHOW",
]);

const ALLOWED_CANCELLATION_SOURCES = new Set([
  "ADMIN",
  "CUSTOMER",
  "SYSTEM",
]);

export interface UpdateAppointmentStatusRequest {
  status: string;
  reason?: string;
  cancellationSource?: string;
}

type AppointmentTargetStatus = "COMPLETED" | "CANCELLED" | "NO_SHOW";
type CancellationSource = "ADMIN" | "CUSTOMER" | "SYSTEM";

@Injectable()
export class BusinessAppointmentStatusService {
  constructor(
    private readonly transactions: TransactionService,
    private readonly appointmentDetail: BusinessAppointmentDetailService,
  ) {}

  async updateStatus(
    tenant: TenantContext,
    appointmentId: string,
    body: UpdateAppointmentStatusRequest,
  ) {
    const input = this.validateInput(body);

    await this.transactions.runInTransaction(async (transaction) => {
      const appointment = await transaction.appointment.findFirst({
        where: {
          id: appointmentId,
          businessId: tenant.businessId,
        },
        select: {
          id: true,
          status: true,
        },
      });

      if (!appointment) {
        throw new NotFoundException({
          code: "APPOINTMENT_NOT_FOUND",
          message: "La cita no existe en este negocio.",
        });
      }

      if (!this.canTransition(appointment.status, input.status)) {
        throw this.invalidTransition();
      }

      const updatedAppointment = await transaction.appointment.updateMany({
        where: {
          id: appointmentId,
          businessId: tenant.businessId,
          status: appointment.status,
        },
        data: this.buildAppointmentUpdate(input),
      });

      if (updatedAppointment.count !== 1) {
        throw this.invalidTransition();
      }

      if (input.status === "COMPLETED" || input.status === "CANCELLED") {
        await transaction.appointmentSegment.updateMany({
          where: {
            appointmentId,
            businessId: tenant.businessId,
          },
          data: {
            status: input.status as PrismaAppointmentSegmentStatus,
          },
        });
      }

      await transaction.appointmentStatusHistory.create({
        data: {
          businessId: tenant.businessId,
          appointmentId,
          previousStatus: appointment.status,
          nextStatus: input.status as PrismaAppointmentStatus,
          actorType: "ADMIN",
          actorId: tenant.userId,
          reason: input.reason,
        },
      });
    });

    return this.appointmentDetail.getAppointment(tenant, appointmentId);
  }

  private validateInput(body: UpdateAppointmentStatusRequest): {
    status: AppointmentTargetStatus;
    reason: string | null;
    cancellationSource: CancellationSource | null;
  } {
    if (!body || typeof body !== "object" || !ALLOWED_TARGET_STATUSES.has(body.status)) {
      throw this.invalidInput();
    }

    let reason: string | null = null;
    if (body.reason !== undefined) {
      if (typeof body.reason !== "string") {
        throw this.invalidInput();
      }

      reason = body.reason.trim();
      if (reason.length === 0 || reason.length > 500) {
        throw this.invalidInput();
      }
    }

    let cancellationSource: CancellationSource | null = null;
    if (body.cancellationSource !== undefined) {
      if (!ALLOWED_CANCELLATION_SOURCES.has(body.cancellationSource)) {
        throw this.invalidInput();
      }

      if (body.status !== "CANCELLED") {
        throw this.invalidInput();
      }

      cancellationSource = body.cancellationSource as CancellationSource;
    }

    return {
      status: body.status as AppointmentTargetStatus,
      reason,
      cancellationSource,
    };
  }

  private canTransition(
    previousStatus: string,
    nextStatus: AppointmentTargetStatus,
  ): boolean {
    return previousStatus === "CONFIRMED" && ALLOWED_TARGET_STATUSES.has(nextStatus);
  }

  private buildAppointmentUpdate(input: {
    status: AppointmentTargetStatus;
    cancellationSource: CancellationSource | null;
  }) {
    if (input.status === "CANCELLED") {
      return {
        status: "CANCELLED" as PrismaAppointmentStatus,
        cancelledAt: new Date(),
        cancellationSource: (input.cancellationSource ?? "ADMIN") as PrismaCancellationSource,
        isLateCancellation: false,
      };
    }

    if (input.status === "NO_SHOW") {
      return {
        status: "NO_SHOW" as PrismaAppointmentStatus,
        markedNoShowAt: new Date(),
      };
    }

    return {
      status: "COMPLETED" as PrismaAppointmentStatus,
    };
  }

  private invalidInput(): BadRequestException {
    return new BadRequestException({
      code: "APPOINTMENT_STATUS_INVALID_INPUT",
      message: "Los datos del cambio de estado no son validos.",
    });
  }

  private invalidTransition(): BadRequestException {
    return new BadRequestException({
      code: "APPOINTMENT_STATUS_TRANSITION_INVALID",
      message: "El cambio de estado de la cita no esta permitido.",
    });
  }
}
