// La aplicación que consuma este paquete debe crear y cerrar PrismaClient.
// No se exporta un singleton para evitar conexiones globales fuera de control.
export * from "./generated/prisma/client.js";
