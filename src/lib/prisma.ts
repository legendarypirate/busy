import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { loadEnvConfig } from "@next/env";
import { PrismaClient, type BusinessTrip, type Prisma } from "@prisma/client";

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

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  __busyWeeklyMeetingMissingPrismaLog?: boolean;
  __businessTripExtrasMissingPrismaLog?: boolean;
};

function createPrismaClient(): PrismaClient {
  const options: ConstructorParameters<typeof PrismaClient>[0] = {
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  };
  if (databaseUrl) {
    options.datasources = { db: { url: databaseUrl } };
  }
  return new PrismaClient(options);
}

/** After `prisma generate`, dev HMR / first boot can keep a PrismaClient without `busyWeeklyMeeting`. */
function hasBusyWeeklyMeetingDelegate(client: unknown): boolean {
  if (typeof client !== "object" || client === null) return false;
  const d = (client as { busyWeeklyMeeting?: { findMany?: unknown } }).busyWeeklyMeeting;
  return typeof d?.findMany === "function";
}

/**
 * Stale dev singletons can pass `busyWeeklyMeeting` checks but still be from an older `prisma generate`
 * before `BusinessTrip.extrasJson` existed — then `create` throws "Unknown argument `extrasJson`".
 */
function hasBusinessTripExtrasJsonDelegate(client: unknown): boolean {
  try {
    const inst = client as {
      _runtimeDataModel?: { models?: Record<string, { fields?: { name: string }[] }> };
    };
    const fields = inst._runtimeDataModel?.models?.BusinessTrip?.fields;
    if (!fields?.length) return false;
    return fields.some((f) => f.name === "extrasJson");
  } catch {
    return false;
  }
}

/** Avoid disconnect/create loop if codegen truly has no `busyWeeklyMeeting` model. */
let irrecoverableMissingBusyWeeklyMeeting = false;

/** After refresh, generated client still has no `extrasJson` on BusinessTrip (very old schema). */
let irrecoverableMissingBusinessTripExtras = false;

function replaceGlobalPrismaClient(): PrismaClient {
  const prev = globalForPrisma.prisma;
  if (prev) {
    void prev.$disconnect().catch(() => {});
  }
  const next = createPrismaClient();
  globalForPrisma.prisma = next;
  if (hasBusyWeeklyMeetingDelegate(next)) {
    irrecoverableMissingBusyWeeklyMeeting = false;
    globalForPrisma.__busyWeeklyMeetingMissingPrismaLog = false;
  } else {
    irrecoverableMissingBusyWeeklyMeeting = true;
    if (!globalForPrisma.__busyWeeklyMeetingMissingPrismaLog) {
      globalForPrisma.__busyWeeklyMeetingMissingPrismaLog = true;
      const msg =
        "[prisma] Generated client is missing `busyWeeklyMeeting`. Run `npx prisma generate` from the project root and restart `next dev`.";
      if (process.env.NODE_ENV === "development") {
        console.warn(msg);
      } else {
        console.error(msg);
      }
    }
  }

  if (hasBusinessTripExtrasJsonDelegate(next)) {
    irrecoverableMissingBusinessTripExtras = false;
    globalForPrisma.__businessTripExtrasMissingPrismaLog = false;
  } else {
    irrecoverableMissingBusinessTripExtras = true;
    if (!globalForPrisma.__businessTripExtrasMissingPrismaLog) {
      globalForPrisma.__businessTripExtrasMissingPrismaLog = true;
      const msg =
        "[prisma] Generated client has no `BusinessTrip.extrasJson`. Run `npx prisma generate` and ensure `schema.prisma` matches your DB.";
      if (process.env.NODE_ENV === "development") {
        console.warn(msg);
      } else {
        console.error(msg);
      }
    }
  }
  return next;
}

/**
 * Resolves the singleton on each access (via `prisma` Proxy) so a stale global client
 * is replaced after `prisma generate` without requiring a manual process restart.
 */
function resolvePrismaClient(): PrismaClient {
  const g = globalForPrisma.prisma;
  if (g && (hasBusyWeeklyMeetingDelegate(g) || irrecoverableMissingBusyWeeklyMeeting)) {
    if (hasBusinessTripExtrasJsonDelegate(g) || irrecoverableMissingBusinessTripExtras) {
      return g;
    }
    return replaceGlobalPrismaClient();
  }
  return replaceGlobalPrismaClient();
}

/** Proxy: every property read runs `resolvePrismaClient()` so delegates stay in sync with codegen. */
export const prisma: PrismaClient = new Proxy({} as PrismaClient, {
  get(_target, prop: string | symbol, _receiver) {
    const inst = resolvePrismaClient();
    const value = Reflect.get(inst, prop, inst) as unknown;
    if (typeof value === "function") {
      return (value as (...args: unknown[]) => unknown).bind(inst);
    }
    return value;
  },
});

/** Typed delegate: use this instead of `prisma.businessTrip` so tooling always sees the model API after `prisma generate`. */
export type BusinessTripDb = {
  findMany(args?: Prisma.BusinessTripFindManyArgs): Promise<BusinessTrip[]>;
  findUnique(args: Prisma.BusinessTripFindUniqueArgs): Promise<BusinessTrip | null>;
  update(args: Prisma.BusinessTripUpdateArgs): Promise<BusinessTrip>;
  create(args: Prisma.BusinessTripCreateArgs): Promise<BusinessTrip>;
  delete(args: Prisma.BusinessTripDeleteArgs): Promise<BusinessTrip>;
  count(args?: unknown): Promise<number>;
};

export function dbBusinessTrip(): BusinessTripDb {
  return (prisma as unknown as { businessTrip: BusinessTripDb }).businessTrip;
}

/** Weekly meeting delegate — keeps Prisma `include` / `select` inference (vs hand-rolled delegate types). */
export function dbBusyWeeklyMeeting(): PrismaClient["busyWeeklyMeeting"] | null {
  const inst = resolvePrismaClient();
  const d = (inst as unknown as { busyWeeklyMeeting?: PrismaClient["busyWeeklyMeeting"] }).busyWeeklyMeeting;
  return d ?? null;
}
