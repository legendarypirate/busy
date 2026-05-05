-- Immutable copy of submitted answers (survives form question sync / Google re-import).
ALTER TABLE "trip_form_responses" ADD COLUMN IF NOT EXISTS "answers_snapshot" JSONB;

-- Questions removed from the live form but still referenced by responses stay in DB with this flag.
ALTER TABLE "trip_form_questions" ADD COLUMN IF NOT EXISTS "retired_from_form" BOOLEAN NOT NULL DEFAULT false;
