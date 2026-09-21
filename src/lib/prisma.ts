import { PrismaClient } from "@prisma/client";
import dotenv from "dotenv";

dotenv.config({ override: true });

const rawDbUrl = process.env.DATABASE_URL || "";
export const isValidPostgresUrl = rawDbUrl.startsWith("postgresql://") || rawDbUrl.startsWith("postgres://");

// Fallback PostgreSQL URL to satisfy Prisma schema datasource validation when a PostgreSQL DATABASE_URL is not provided
const effectiveDbUrl = isValidPostgresUrl
  ? rawDbUrl
  : "postgresql://postgres:placeholder@127.0.0.1:5432/projetofarda?sslmode=disable";

// Global connection state flag
let isDbConnected = false;

export function isDatabaseConnected(): boolean {
  return isDbConnected;
}

export function setDatabaseConnected(connected: boolean): void {
  isDbConnected = connected;
}

// Global Prisma Client instance with connection caching (Singleton)
declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

export const prisma =
  globalThis.prisma ??
  new PrismaClient({
    datasources: {
      db: {
        url: effectiveDbUrl,
      },
    },
    // Prevent Prisma from logging raw error banners to stdout/stderr
    log: [],
  });

if (process.env.NODE_ENV !== "production") {
  globalThis.prisma = prisma;
}

export async function testDatabaseConnection(): Promise<boolean> {
  if (!isValidPostgresUrl) {
    isDbConnected = false;
    return false;
  }
  try {
    await prisma.$queryRaw`SELECT 1`;
    isDbConnected = true;
    console.log("[POSTGRES DB] Conexão estabelecida com sucesso");
    return true;
  } catch (error: any) {
    isDbConnected = false;
    console.warn("[POSTGRES DB] Banco PostgreSQL não acessível no momento. Utilizando camada de persistência resiliente.");
    return false;
  }
}

export default prisma;


