import {
  Injectable,
  ServiceUnavailableException,
  UnauthorizedException,
} from "@nestjs/common";
import {
  BusinessVertical,
  MembershipRole,
} from "@velora/types";

import { DatabaseService } from "../common/database/database.service";
import type { RequestMembership, RequestUser } from "../common/types/request-user";

@Injectable()
export class AuthIdentityService {
  constructor(private readonly database: DatabaseService) {}

  async resolve(authSubject: string): Promise<RequestUser> {
    let user;

    try {
      user = await this.database.getClient().user.findFirst({
        where: {
          authSubject,
          status: "ACTIVE",
        },
        select: {
          id: true,
          authSubject: true,
          email: true,
          memberships: {
            where: {
              status: "ACTIVE",
              business: { status: "ACTIVE" },
            },
            select: {
              id: true,
              businessId: true,
              role: true,
              business: {
                select: {
                  slug: true,
                  name: true,
                  vertical: true,
                },
              },
            },
          },
        },
      });
    } catch {
      throw new ServiceUnavailableException({
        code: "AUTH_IDENTITY_UNAVAILABLE",
        message: "No fue posible validar la identidad interna.",
      });
    }

    if (!user) {
      throw new UnauthorizedException({
        code: "AUTH_USER_NOT_FOUND",
        message: "La cuenta autenticada no tiene un usuario activo en Velora.",
      });
    }

    const memberships: RequestMembership[] = user.memberships.map((membership) => ({
      id: membership.id,
      businessId: membership.businessId,
      businessSlug: membership.business.slug,
      businessName: membership.business.name,
      businessVertical: membership.business.vertical as BusinessVertical,
      role: membership.role as MembershipRole,
    }));

    return {
      id: user.id,
      authSubject: user.authSubject,
      email: user.email,
      memberships,
    };
  }
}
