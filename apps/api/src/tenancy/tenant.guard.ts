import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import type { MembershipRole } from "@velora/types";

import type { AuthenticatedRequest } from "../common/types/request-context";
import type { TenantContext } from "../common/types/request-user";
import { TENANT_ROLES_KEY } from "./tenant.constants";
import { TenantContextService } from "./tenant-context.service";

@Injectable()
export class TenantGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly tenantContext: TenantContextService,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const businessSlug = request.params.businessSlug;
    const membership = request.user?.memberships.find(
      (candidate) => candidate.businessSlug === businessSlug,
    );

    if (!businessSlug || !membership || !request.user) {
      throw new ForbiddenException({
        code: "TENANT_ACCESS_DENIED",
        message: "No tienes una membresía activa para este negocio.",
      });
    }

    const allowedRoles = this.reflector.getAllAndOverride<MembershipRole[]>(
      TENANT_ROLES_KEY,
      [context.getHandler(), context.getClass()],
    ) ?? [];

    if (allowedRoles.length > 0 && !allowedRoles.includes(membership.role)) {
      throw new ForbiddenException({
        code: "TENANT_ROLE_FORBIDDEN",
        message: "Tu rol no permite realizar esta acción.",
      });
    }

    const tenant: TenantContext = {
      businessId: membership.businessId,
      businessSlug: membership.businessSlug,
      businessName: membership.businessName,
      businessVertical: membership.businessVertical,
      membershipId: membership.id,
      role: membership.role,
      userId: request.user.id,
    };
    request.tenant = tenant;
    this.tenantContext.set(tenant);
    return true;
  }
}
