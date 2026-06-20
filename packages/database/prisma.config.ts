import "dotenv/config";

import { defineConfig } from "prisma/config";

const developmentDatabaseUrl = "postgresql://velora:velora@localhost:5432/velora";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: process.env.DATABASE_URL ?? developmentDatabaseUrl,
  },
});
