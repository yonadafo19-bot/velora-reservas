import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";

import { AppConfig } from "../common/config/app-config";
import type { AuthenticatedRequest } from "../common/types/request-context";
import type { RequestUser } from "../common/types/request-user";
import { IS_PUBLIC_KEY, REQUIRE_AUTH_KEY } from "./auth.constants";
import { AuthIdentityService } from "./auth-identity.service";
import { SupabaseJwtService } from "./supabase-jwt.service";

type DevelopmentMembership = RequestUser["memberships"][number];

const DEVELOPMENT_USER: RequestUser = {
  id: "seed-user-demo-owner",
  authSubject: "development:velora-demo-owner",
  email: "owner.demo@velora.invalid",
  memberships: [
    {
      id: "seed-barberia-membership-owner",
      businessId: "seed-barberia-business-main",
      businessSlug: "barberia",
      businessName: "Velora Barberia Demo",
      businessVertical: "BARBERSHOP" as DevelopmentMembership["businessVertical"],
      role: "OWNER" as DevelopmentMembership["role"],
    },
    {
      id: "seed-barberia-membership-owner-canonical",
      businessId: "seed-barberia-business-main",
      businessSlug: "velora-barberia-demo",
      businessName: "Velora Barberia Demo",
      businessVertical: "BARBERSHOP" as DevelopmentMembership["businessVertical"],
      role: "OWNER" as DevelopmentMembership["role"],
    },
    {
      id: "seed-beauty-membership-owner",
      businessId: "seed-beauty-business-main",
      businessSlug: "belleza",
      businessName: "Velora Beauty Studio Demo",
      businessVertical: "BEAUTY_STUDIO" as DevelopmentMembership["businessVertical"],
      role: "OWNER" as DevelopmentMembership["role"],
    },
    {
      id: "seed-beauty-membership-owner-canonical",
      businessId: "seed-beauty-business-main",
      businessSlug: "velora-beauty-studio-demo",
      businessName: "Velora Beauty Studio Demo",
      businessVertical: "BEAUTY_STUDIO" as DevelopmentMembership["businessVertical"],
      role: "OWNER" as DevelopmentMembership["role"],
    },
  ],
};

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly config: AppConfig,
    private readonly jwt: SupabaseJwtService,
    private readonly identity: AuthIdentityService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const targets = [context.getHandler(), context.getClass()];
    if (this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, targets)) {
      return true;
    }

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    if (!this.config.authRequired) {
      request.user = DEVELOPMENT_USER;
      return true;
    }

    const explicitlyRequired = this.reflector.getAllAndOverride<boolean>(
      REQUIRE_AUTH_KEY,
      targets,
    );
    if (!explicitlyRequired) {
      return true;
    }

    const authorization = request.headers.authorization;
    const header = Array.isArray(authorization) ? authorization[0] : authorization;
    const [scheme, token, extra] = header?.trim().split(/\s+/) ?? [];

    if (scheme?.toLowerCase() !== "bearer" || !token || extra) {
      throw new UnauthorizedException({
        code: "AUTH_TOKEN_MISSING",
        message: "Se requiere un token Bearer válido.",
      });
    }

    const verified = await this.jwt.verify(token);
    request.user = await this.identity.resolve(verified.subject);
    return true;
  }
}
