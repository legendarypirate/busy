/**
 * Local dev only: upserts one platform admin (email + bcrypt password).
 * Run: `npm run db:seed` (requires DATABASE_URL and `npx prisma generate`).
 * Refuses to run when NODE_ENV=production.
 */
/* eslint-disable @typescript-eslint/no-require-imports */

const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

const EMAIL = (process.env.LOCAL_ADMIN_EMAIL || "admin@localhost.local").trim().toLowerCase();
const PASSWORD = process.env.LOCAL_ADMIN_PASSWORD || "AdminLocalDev!9";
const BCRYPT_ROUNDS = 12;

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
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
