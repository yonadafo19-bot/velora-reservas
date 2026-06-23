import { Injectable } from "@nestjs/common";

import { DatabaseService } from "../common/database/database.service";
import type { TenantContext } from "../common/types/request-user";

@Injectable()
export class BusinessCustomersService {
  constructor(private readonly database: DatabaseService) {}

  async listCustomers(tenant: TenantContext) {
    const client = this.database.getClient();
    const customers = await client.customer.findMany({
      where: {
        businessId: tenant.businessId,
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        phone: true,
        email: true,
        loyaltyTier: true,
        priorityScore: true,
        isManualVip: true,
        firstVisitAt: true,
        lastVisitAt: true,
        createdAt: true,
      },
      orderBy: [
        { createdAt: "desc" },
        { lastName: "asc" },
        { firstName: "asc" },
        { id: "asc" },
      ],
    });
    const customerIds = customers.map((customer) => customer.id);
    const appointmentSummaries = customerIds.length > 0
      ? await client.appointment.groupBy({
        by: ["customerId"],
        where: {
          businessId: tenant.businessId,
          customerId: {
            in: customerIds,
          },
        },
        _count: {
          _all: true,
        },
        _max: {
          startAt: true,
        },
      })
      : [];
    const appointmentsByCustomerId = new Map(
      appointmentSummaries.map((summary) => [summary.customerId, summary]),
    );

    return customers.map((customer) => {
      const appointmentSummary = appointmentsByCustomerId.get(customer.id);

      return {
        id: customer.id,
        fullName: [customer.firstName, customer.lastName].filter(Boolean).join(" "),
        firstName: customer.firstName,
        lastName: customer.lastName,
        phone: customer.phone,
        email: customer.email,
        loyaltyTier: customer.loyaltyTier,
        priorityScore: customer.priorityScore,
        isManualVip: customer.isManualVip,
        firstVisitAt: customer.firstVisitAt?.toISOString() ?? null,
        lastVisitAt: customer.lastVisitAt?.toISOString() ?? null,
        createdAt: customer.createdAt.toISOString(),
        lastAppointmentAt: appointmentSummary?._max.startAt?.toISOString() ?? null,
        appointmentCount: appointmentSummary?._count._all ?? 0,
      };
    });
  }
}
