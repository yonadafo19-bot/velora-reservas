import { Controller, Get } from "@nestjs/common";

import { Public } from "../auth/public.decorator";
import { AppConfig } from "../common/config/app-config";

@Public()
@Controller("health")
export class HealthController {
  constructor(private readonly config: AppConfig) {}

  @Get("live")
  live() {
    return {
      status: "ok",
      service: this.config.service,
      timestamp: new Date().toISOString(),
    };
  }

  @Get("ready")
  ready() {
    return {
      status: "ready",
      service: this.config.service,
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: this.config.environment,
      version: this.config.version,
    };
  }
}
