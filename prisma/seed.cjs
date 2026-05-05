/**
 * Local dev only: upserts one platform admin (email + bcrypt password).
 * Run: `npm run db:seed` (requires DATABASE_URL and `npx prisma generate`).
 * Refuses to run when NODE_ENV=production.
 *
 * Before seeding supreme admin (`super_admin`), apply pending migrations so PostgreSQL
 * has enum values: `npx prisma migrate deploy`
 */
/* eslint-disable @typescript-eslint/no-require-imports */

const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

const EMAIL = (process.env.LOCAL_ADMIN_EMAIL || "admin@localhost.local").trim().toLowerCase();
const PASSWORD = process.env.LOCAL_ADMIN_PASSWORD || "AdminLocalDev!9";
const BCRYPT_ROUNDS = 12;

const SUPREME_EMAIL = (process.env.SUPREME_ADMIN_EMAIL || "idersaikhan.ja@gmail.com").trim().toLowerCase();
const SUPREME_PASSWORD = process.env.SUPREME_ADMIN_PASSWORD || "user12";
const SUPREME_DISPLAY = (process.env.SUPREME_ADMIN_DISPLAY_NAME || "Supreme admin").trim() || "Supreme admin";

async function upsertSupremeAdmin() {
  const passwordHash = await bcrypt.hash(SUPREME_PASSWORD, BCRYPT_ROUNDS);
  await prisma.platformAccount.upsert({
    where: { email: SUPREME_EMAIL },
    create: {
      email: SUPREME_EMAIL,
      passwordHash,
      role: "super_admin",
      status: "active",
      profile: {
        create: { displayName: SUPREME_DISPLAY },
      },
    },
    update: {
      passwordHash,
      role: "super_admin",
      status: "active",
    },
  });

  const row = await prisma.platformAccount.findUnique({
    where: { email: SUPREME_EMAIL },
    include: { profile: true },
  });
  if (row && !row.profile) {
    await prisma.platformProfile.create({
      data: { accountId: row.id, displayName: SUPREME_DISPLAY },
    });
  } else if (row?.profile) {
    await prisma.platformProfile.update({
      where: { accountId: row.id },
      data: { displayName: SUPREME_DISPLAY },
    });
  }

  console.log("");
  console.log("Supreme admin (scoped managers assigned under /admin/bni-platform-users):");
  console.log("  Email:   ", SUPREME_EMAIL);
  console.log("  Password:", SUPREME_PASSWORD);
  console.log("");
}

async function main() {
  if (process.env.NODE_ENV === "production") {
    console.error("seed.cjs: refusing to run in NODE_ENV=production.");
    process.exit(1);
  }

  const passwordHash = await bcrypt.hash(PASSWORD, BCRYPT_ROUNDS);

  await prisma.platformAccount.upsert({
    where: { email: EMAIL },
    create: {
      email: EMAIL,
      passwordHash,
      role: "admin",
      status: "active",
      profile: {
        create: { displayName: "Local admin" },
      },
    },
    update: {
      passwordHash,
      role: "admin",
      status: "active",
    },
  });

  await upsertSupremeAdmin();

  console.log("");
  console.log("Local admin upserted (use at /admin/login):");
  console.log("  Email:   ", EMAIL);
  console.log("  Password:", PASSWORD);
  console.log("");
  console.log("Override with LOCAL_ADMIN_EMAIL / LOCAL_ADMIN_PASSWORD in .env");
  console.log("");
}

main()
  .catch((e) => {
    const msg = e && typeof e.message === "string" ? e.message : String(e);
    if (msg.includes("PlatformRole") && (msg.includes("super_admin") || msg.includes("22P02"))) {
      console.error("");
      console.error("Database enum PlatformRole is missing super_admin / trip_manager / event_manager.");
      console.error("Apply migrations from the project root, then seed again:");
      console.error("  npx prisma migrate deploy");
      console.error("  npm run db:seed");
      console.error("");
    }
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
