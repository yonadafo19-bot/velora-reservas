import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";

import { AppConfig } from "../common/config/app-config";
import type { AuthenticatedRequest } from "../common/types/request-context";
import { IS_PUBLIC_KEY, REQUIRE_AUTH_KEY } from "./auth.constants";
import { AuthIdentityService } from "./auth-identity.service";
import { SupabaseJwtService } from "./supabase-jwt.service";

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

    const explicitlyRequired = this.reflector.getAllAndOverride<boolean>(
      REQUIRE_AUTH_KEY,
      targets,
    );
    if (!explicitlyRequired && !this.config.authRequired) {
      return true;
    }

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
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
