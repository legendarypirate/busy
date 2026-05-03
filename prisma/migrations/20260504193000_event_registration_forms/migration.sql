-- Event registration uses same TripRegistrationForm / TripFormResponse tables with optional event_id.

ALTER TABLE "trip_registration_forms" ADD COLUMN IF NOT EXISTS "event_id" BIGINT;
ALTER TABLE "trip_registration_forms" ALTER COLUMN "trip_id" DROP NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'trip_registration_forms_event_id_fkey'
  ) THEN
    ALTER TABLE "trip_registration_forms"
      ADD CONSTRAINT "trip_registration_forms_event_id_fkey"
      FOREIGN KEY ("event_id") REFERENCES "bni_events"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS "trip_registration_forms_event_id_key"
  ON "trip_registration_forms" ("event_id")
  WHERE "event_id" IS NOT NULL;

ALTER TABLE "trip_form_responses" ADD COLUMN IF NOT EXISTS "event_id" BIGINT;
ALTER TABLE "trip_form_responses" ALTER COLUMN "trip_id" DROP NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'trip_form_responses_event_id_fkey'
  ) THEN
    ALTER TABLE "trip_form_responses"
      ADD CONSTRAINT "trip_form_responses_event_id_fkey"
      FOREIGN KEY ("event_id") REFERENCES "bni_events"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS "trip_registration_forms_event_id_idx" ON "trip_registration_forms" ("event_id");
CREATE INDEX IF NOT EXISTS "trip_form_responses_event_id_idx" ON "trip_form_responses" ("event_id");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'trip_registration_forms_trip_or_event_chk'
  ) THEN
    ALTER TABLE "trip_registration_forms"
      ADD CONSTRAINT "trip_registration_forms_trip_or_event_chk"
      CHECK (
        ("trip_id" IS NOT NULL AND "event_id" IS NULL)
        OR ("trip_id" IS NULL AND "event_id" IS NOT NULL)
      );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'trip_form_responses_trip_or_event_chk'
  ) THEN
    ALTER TABLE "trip_form_responses"
      ADD CONSTRAINT "trip_form_responses_trip_or_event_chk"
      CHECK (
        ("trip_id" IS NOT NULL AND "event_id" IS NULL)
        OR ("trip_id" IS NULL AND "event_id" IS NOT NULL)
      );
  END IF;
END $$;
