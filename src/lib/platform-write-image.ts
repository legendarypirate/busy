import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";
import {
  isCloudinaryConfigured,
  uploadBufferToCloudinary,
} from "@/lib/cloudinary-platform";

const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

function extForMime(mime: string): string {
  if (mime === "image/jpeg") {
    return ".jpg";
  }
  if (mime === "image/png") {
    return ".png";
  }
  if (mime === "image/webp") {
    return ".webp";
  }
  return ".gif";
}

/** Re-export for callers that remove assets (hero slides, profile photos, trip media). */
export { destroyCloudinaryBySecureUrl } from "@/lib/cloudinary-platform";

/**
 * Uploads platform user images. Uses Cloudinary when `CLOUDINARY_*` env vars are set;
 * otherwise falls back to `public/uploads/platform/{accountId}/…` (local dev).
 */
export async function writePlatformUploadImage(
  accountId: bigint,
  file: File,
  maxBytes: number,
): Promise<{ ok: true; url: string } | { ok: false; error: string }> {
  if (!file || file.size === 0) {
    return { ok: false, error: "empty" };
  }
  if (file.size > maxBytes) {
    return { ok: false, error: "Файл хэт том байна." };
  }
  const mime = file.type;
  if (!ALLOWED.has(mime)) {
    return { ok: false, error: "Зөвхөн JPG, PNG, WebP, GIF зөвшөөрнө." };
  }

  const buf = Buffer.from(await file.arrayBuffer());

  if (isCloudinaryConfigured()) {
    try {
      const folder = `busy/platform/${accountId.toString()}`;
      const { secure_url } = await uploadBufferToCloudinary({ folder, mime, buffer: buf });
      return { ok: true, url: secure_url };
    } catch (e) {
      console.error("[writePlatformUploadImage] Cloudinary", e);
      return { ok: false, error: "Зургийг Cloudinary руу илгээхэд алдаа гарлаа." };
    }
  }

  const dir = path.join(process.cwd(), "public", "uploads", "platform", accountId.toString());
  await mkdir(dir, { recursive: true });
  const name = `${Date.now()}-${randomUUID().slice(0, 10)}${extForMime(mime)}`;
  await writeFile(path.join(dir, name), buf);
  const url = `/uploads/platform/${accountId.toString()}/${name}`;
  return { ok: true, url };
}
