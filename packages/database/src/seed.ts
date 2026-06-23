import "dotenv/config";

import { PrismaPg } from "@prisma/adapter-pg";

import { PrismaClient } from "./generated/prisma/client.js";
import { barbershopDemo } from "./seeds/barbershop.demo.js";
import { beautyStudioDemo } from "./seeds/beauty-studio.demo.js";
import { seedDemoBusiness } from "./seeds/seed-demo.js";

const REQUIRED_CONFIRMATION = "SEED_VELORA_DEMOS";
const SEED_TRANSACTION_OPTIONS = { maxWait: 10_000, timeout: 30_000 } as const;

async function main(): Promise<void> {
  const databaseUrl = process.env.DATABASE_URL?.trim();
  if (!databaseUrl) {
    throw new Error("DATABASE_URL es obligatoria para ejecutar el seed.");
  }

  if (process.env.VELORA_SEED_CONFIRM !== REQUIRED_CONFIRMATION) {
    throw new Error(
      `Define VELORA_SEED_CONFIRM=${REQUIRED_CONFIRMATION} para confirmar el seed demo.`,
    );
  }

  const prisma = new PrismaClient({
    adapter: new PrismaPg({ connectionString: databaseUrl }),
  });

  try {
    await prisma.$transaction(
      (transaction) => seedDemoBusiness(transaction, barbershopDemo),
      SEED_TRANSACTION_OPTIONS,
    );
    await prisma.$transaction(
      (transaction) => seedDemoBusiness(transaction, beautyStudioDemo),
      SEED_TRANSACTION_OPTIONS,
    );
    console.info("Seeds demo de Barberías y Beauty Studios completados.");
  } finally {
    await prisma.$disconnect();
  }
}

main().catch(() => {
  console.error(
    "No fue posible ejecutar el seed. Revisa la configuración y la base aprobada sin compartir credenciales.",
  );
  process.exitCode = 1;
});
