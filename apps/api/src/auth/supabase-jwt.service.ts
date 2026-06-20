import {
  Injectable,
  ServiceUnavailableException,
  UnauthorizedException,
} from "@nestjs/common";
import { createRemoteJWKSet, jwtVerify, type JWTVerifyGetKey } from "jose";

import { AppConfig } from "../common/config/app-config";

export interface VerifiedSupabaseIdentity {
  subject: string;
  email?: string;
}

const JWT_SHAPE = /^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/;

@Injectable()
export class SupabaseJwtService {
  private jwks?: JWTVerifyGetKey;

  constructor(private readonly config: AppConfig) {}

  async verify(token: string): Promise<VerifiedSupabaseIdentity> {
    if (!JWT_SHAPE.test(token)) {
      throw this.invalidToken();
    }

    if (!this.config.supabaseIssuerUrl || !this.config.supabaseJwksUrl) {
      throw new ServiceUnavailableException({
        code: "AUTH_CONFIGURATION_UNAVAILABLE",
        message: "La autenticación no está configurada.",
      });
    }

    this.jwks ??= createRemoteJWKSet(new URL(this.config.supabaseJwksUrl));

    try {
      const result = await jwtVerify(token, this.jwks, {
        issuer: this.config.supabaseIssuerUrl,
        audience: this.config.supabaseJwtAudience,
        algorithms: ["RS256", "ES256"],
      });

      if (!result.payload.sub) {
        throw this.invalidToken();
      }

      return {
        subject: result.payload.sub,
        email: typeof result.payload.email === "string"
          ? result.payload.email
          : undefined,
      };
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }

      throw this.invalidToken();
    }
  }

  private invalidToken(): UnauthorizedException {
    return new UnauthorizedException({
      code: "AUTH_TOKEN_INVALID",
      message: "El token de autenticación no es válido.",
    });
  }
}
