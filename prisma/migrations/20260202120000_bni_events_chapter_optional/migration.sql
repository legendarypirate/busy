-- BniEvent.chapter_id optional (admin can create events without a chapter row).
ALTER TABLE "bni_events" DROP CONSTRAINT IF EXISTS "bni_events_chapter_id_fkey";
ALTER TABLE "bni_events" ALTER COLUMN "chapter_id" DROP NOT NULL;
ALTER TABLE "bni_events" ADD CONSTRAINT "bni_events_chapter_id_fkey" FOREIGN KEY ("chapter_id") REFERENCES "bni_chapters"("id") ON DELETE SET NULL ON UPDATE CASCADE;
