-- Trip detail registration checkout (tier qty, departure, totals). Prisma: TripFormResponse.orderSummary → JSON.
ALTER TABLE "trip_form_responses" ADD COLUMN IF NOT EXISTS "order_summary" JSONB;
