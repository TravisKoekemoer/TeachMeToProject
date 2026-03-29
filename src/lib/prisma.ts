import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

import { PrismaClient } from "../generated/prisma/client";

const connectionString = process.env.DIRECT_URL?.trim() || process.env.DATABASE_URL?.trim();

if (!connectionString) {
  throw new Error("DIRECT_URL or DATABASE_URL is not set. Add one of them to .env before starting TeachMeGTM.");
}

declare global {
  // eslint-disable-next-line no-var
  var __intentEnginePrisma: PrismaClient | undefined;
  // eslint-disable-next-line no-var
  var __intentEnginePool: Pool | undefined;
}

function createPool() {
  return new Pool({
    connectionString,
    max: process.env.NODE_ENV === "production" ? 10 : 5,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 15_000
  });
}

function createPrismaClient() {
  const pool = global.__intentEnginePool ?? createPool();
  const adapter = new PrismaPg(pool);
  const client = new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"]
  });

  if (process.env.NODE_ENV !== "production") {
    global.__intentEnginePool = pool;
  }

  return client;
}

export const prisma = global.__intentEnginePrisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  global.__intentEnginePrisma = prisma;
}