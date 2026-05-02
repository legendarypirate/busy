/**
 * One-off: create or update a platform admin (password + role) for /admin/login.
 *
 * Safety:
 * - Requires ALLOW_PRODUCTION_ADMIN=1 (prevents accidental runs).
 * - Requires PRODUCTION_ADMIN_EMAIL and PRODUCTION_ADMIN_PASSWORD (min 12 chars).
 * - Loads DATABASE_URL from the environment (use the same .env as the app).
 *
 * Example (on the VPS, from app directory):
 *   ALLOW_PRODUCTION_ADMIN=1 \
 *   PRODUCTION_ADMIN_EMAIL="you@yourdomain.mn" \
 *   PRODUCTION_ADMIN_PASSWORD='use-a-long-random-password' \
 *   node scripts/promote-production-admin.cjs
 */
/* eslint-disable no-console */

const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();
const BCRYPT_ROUNDS = 12;

async function main() {
  if (process.env.ALLOW_PRODUCTION_ADMIN !== "1") {
    console.error(
      "Refused: set ALLOW_PRODUCTION_ADMIN=1 to confirm you intend to modify the database (any environment).",
    );
    process.exit(1);
  }

  const email = (process.env.PRODUCTION_ADMIN_EMAIL || "").trim().toLowerCase();
  const password = process.env.PRODUCTION_ADMIN_PASSWORD || "";
  const displayName = (process.env.PRODUCTION_ADMIN_DISPLAY_NAME || "Admin").trim() || "Admin";

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    console.error("Set PRODUCTION_ADMIN_EMAIL to a valid email.");
    process.exit(1);
  }
  if (password.length < 12) {
    console.error("PRODUCTION_ADMIN_PASSWORD must be at least 12 characters.");
    process.exit(1);
  }

  if (!process.env.DATABASE_URL?.trim()) {
    console.error("DATABASE_URL is missing.");
    process.exit(1);
  }

  const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);

  await prisma.platformAccount.upsert({
    where: { email },
    create: {
      email,
      passwordHash,
      role: "admin",
      status: "active",
      profile: {
        create: { displayName },
      },
    },
    update: {
      passwordHash,
      role: "admin",
      status: "active",
    },
  });

  const row = await prisma.platformAccount.findUnique({
    where: { email },
    include: { profile: true },
  });

  if (row?.profile) {
    await prisma.platformProfile.update({
      where: { accountId: row.id },
      data: { displayName },
    });
  } else if (row) {
    await prisma.platformProfile.create({
      data: { accountId: row.id, displayName },
    });
  }

  console.log("");
  console.log("Done. Admin upserted for:", email);
  console.log("Log in at: https://YOUR_DOMAIN/admin/login");
  console.log("Unset ALLOW_PRODUCTION_ADMIN and clear shell history if you pasted secrets.");
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
