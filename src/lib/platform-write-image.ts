import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";

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

/** Saves under `public/uploads/platform/{accountId}/…` and returns public URL path. */
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

  const dir = path.join(process.cwd(), "public", "uploads", "platform", accountId.toString());
  await mkdir(dir, { recursive: true });
  const name = `${Date.now()}-${randomUUID().slice(0, 10)}${extForMime(mime)}`;
  const buf = Buffer.from(await file.arrayBuffer());
  await writeFile(path.join(dir, name), buf);
  const url = `/uploads/platform/${accountId.toString()}/${name}`;
  return { ok: true, url };
}
