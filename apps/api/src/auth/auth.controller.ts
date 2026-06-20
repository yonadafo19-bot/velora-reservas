import { Controller, Get } from "@nestjs/common";

import type { RequestUser } from "../common/types/request-user";
import { CurrentUser } from "./current-user.decorator";
import { RequireAuth } from "./require-auth.decorator";

@Controller("auth")
export class AuthController {
  @Get("me")
  @RequireAuth()
  me(@CurrentUser() user: RequestUser) {
    return {
      userId: user.id,
      email: user.email,
      memberships: user.memberships.map((membership) => ({
        businessId: membership.businessId,
        businessSlug: membership.businessSlug,
        businessName: membership.businessName,
        businessVertical: membership.businessVertical,
        role: membership.role,
      })),
    };
  }
}
