import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { loadEnvConfig } from "@next/env";
import { PrismaClient } from "@prisma/client";

/**
 * Next/Turbopack зарим route chunk-д `loadEnvConfig` `process.env.DATABASE_URL` дүүргэхгүй үлдэж,
 * Prisma `env("DATABASE_URL")` алдаа өгнө. Төслийн үндсийг олж `.env`-ийг шууд уншина.
 */
function resolveProjectRoot(): string {
  let dir = process.cwd();
  for (let i = 0; i < 10; i++) {
    if (existsSync(join(dir, "package.json")) && existsSync(join(dir, "prisma", "schema.prisma"))) {
      return dir;
    }
    const parent = join(dir, "..");
    if (parent === dir) break;
    dir = parent;
  }
  return process.cwd();
}

/** Минимал .env парсер (гэдсэн тайлбар, `KEY=value`, хашилттай утга). */
function parseDotenvFile(filePath: string): Record<string, string> {
  const out: Record<string, string> = {};
  if (!existsSync(filePath)) return out;
  try {
    const raw = readFileSync(filePath, "utf8");
    for (let line of raw.split("\n")) {
      const hash = line.indexOf("#");
      if (hash >= 0) line = line.slice(0, hash);
      line = line.trim();
      if (!line) continue;
      const eq = line.indexOf("=");
      if (eq <= 0) continue;
      const key = line.slice(0, eq).trim();
      let val = line.slice(eq + 1).trim();
      if (
        (val.startsWith('"') && val.endsWith('"')) ||
        (val.startsWith("'") && val.endsWith("'"))
      ) {
        val = val.slice(1, -1);
      }
      if (key) out[key] = val;
    }
  } catch {
    /* noop */
  }
  return out;
}

function resolveDatabaseUrl(root: string): string | undefined {
  loadEnvConfig(root);
  const fromEnv = process.env.DATABASE_URL?.trim();
  if (fromEnv) return fromEnv;

  const fromLocal = parseDotenvFile(join(root, ".env.local")).DATABASE_URL?.trim();
  if (fromLocal) {
    process.env.DATABASE_URL = fromLocal;
    return fromLocal;
  }
  const fromDotenv = parseDotenvFile(join(root, ".env")).DATABASE_URL?.trim();
  if (fromDotenv) {
    process.env.DATABASE_URL = fromDotenv;
    return fromDotenv;
  }
  return undefined;
}

const projectRoot = resolveProjectRoot();
const databaseUrl = resolveDatabaseUrl(projectRoot);

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    ...(databaseUrl ? { datasources: { db: { url: databaseUrl } } } : {}),
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
