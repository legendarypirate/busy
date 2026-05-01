# busybni — BUSY.mn / BNI on Next.js + TypeScript + PostgreSQL

This folder is a **new** [Next.js](https://nextjs.org/) App Router application that **replaces** the legacy PHP/MySQL stack in the parent directory (`../`). Backend logic lives in **Route Handlers** (`src/app/api/**`) and **Server Components**; the database is **PostgreSQL** via [Prisma](https://www.prisma.io/).

## Product vision (architecture rule)

- **Mission:** Бизнес боломжоо үүсгэ. Зөв хүмүүстэй холбогд. Үр дүнгээ удирд.
- **Rule:** Энэ байршуулалт платформын бүх архитектурыг удирдана.
- **Goal:** Хэрэглэгч бүр өөрийн зорилгоор орж ирээд, өөрт хэрэгтэй үйлдлээ хурдан хийдэг байх.

**Five audiences:** Оролцогч · Зохион байгуулагч · Бизнес гишүүн · Нийлүүлэгч/үйлдвэр · Хөрөнгө оруулагч/түнш.

Canonical strings live in **`src/lib/busy-platform-vision.ts`**. Cursor applies **`.cursor/rules/busy-platform-vision.mdc`** so agents align new work with this framing.

## Prerequisites

- Node.js 20+
- PostgreSQL 16+ (or Docker)

## Quick start

```bash
cd busybni
cp .env.example .env
cp prisma/.env.example prisma/.env
# edit DATABASE_URL in both if needed

# optional: start Postgres
docker compose up -d

npm install
npm run db:migrate   # creates tables from prisma/schema.prisma
npm run dev          # http://localhost:3000
```

- **Health:** [GET /api/health](http://localhost:3000/api/health)
- **Events JSON:** [GET /api/events](http://localhost:3000/api/events)
- **UI:** `/`, `/events`, `/events/[id]`, `/trips`, `/platform` (stubs)

## Migrating from PHP / MySQL

1. **Schema:** `prisma/schema.prisma` maps to `bni_*` table names (aligned with `sql/bni_platform_schema.sql` in the parent repo). Extend models as you port features (`company_store_items`, `business_trips`, `bni_company_follows`, etc.).
2. **Data:** Use `pgloader`, custom ETL, or export CSV → import. Watch **MySQL ENUM → Prisma enum**, **AUTO_INCREMENT → BigInt/serial**, **JSON** columns, and **DATETIME → timestamptz**.
3. **Auth:** Replace `includes/config.php` session with **NextAuth.js** / **Auth.js** or similar; store sessions in DB or JWT.
4. **Media:** Keep Cloudinary URLs; move upload to Route Handler + signed uploads.
5. **Incremental port:** Port routes module-by-module (events, trips, `company.php`, `platform-home` panels) instead of a big-bang rewrite.

## Scripts

| Script            | Description                |
| ----------------- | -------------------------- |
| `npm run dev`     | Next dev server            |
| `npm run build`   | Production build           |
| `npm run db:push` | Push schema (prototyping)  |
| `npm run db:migrate` | Migrations (recommended) |
| `npm run db:studio`  | Prisma Studio GUI        |

## Project layout

```
src/app/           # App Router pages + api routes
src/lib/prisma.ts  # Prisma singleton
prisma/schema.prisma
```

Legacy PHP remains in `../` until feature parity is reached.
