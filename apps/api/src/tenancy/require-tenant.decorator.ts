import { applyDecorators, SetMetadata, UseGuards } from "@nestjs/common";
import type { MembershipRole } from "@velora/types";

import { RequireAuth } from "../auth/require-auth.decorator";
import { TENANT_ROLES_KEY } from "./tenant.constants";
import { TenantGuard } from "./tenant.guard";

export const RequireTenant = (...roles: MembershipRole[]) => applyDecorators(
  RequireAuth(),
  SetMetadata(TENANT_ROLES_KEY, roles),
  UseGuards(TenantGuard),
);
