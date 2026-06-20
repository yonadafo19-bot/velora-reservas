import {
  Injectable,
  ServiceUnavailableException,
  type OnApplicationShutdown,
} from "@nestjs/common";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@velora/database";

import { AppConfig } from "../config/app-config";

@Injectable()
export class DatabaseService implements OnApplicationShutdown {
  private client?: PrismaClient;

  constructor(private readonly config: AppConfig) {}

  getClient(): PrismaClient {
    if (!this.config.databaseUrl) {
      throw new ServiceUnavailableException({
        code: "DATABASE_NOT_CONFIGURED",
        message: "La base de datos no está configurada.",
      });
    }

    this.client ??= new PrismaClient({
      adapter: new PrismaPg({ connectionString: this.config.databaseUrl }),
    });

    return this.client;
  }

  async onApplicationShutdown(): Promise<void> {
    await this.client?.$disconnect();
  }
}
