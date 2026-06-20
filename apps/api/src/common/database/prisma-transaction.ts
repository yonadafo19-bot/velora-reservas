import type { Prisma } from "@velora/database";

export type PrismaTransaction = Prisma.TransactionClient;
export type TransactionCallback<T> = (transaction: PrismaTransaction) => Promise<T>;
