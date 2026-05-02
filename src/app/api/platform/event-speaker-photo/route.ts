import { type NextRequest, NextResponse } from "next/server";
import { getApiPlatformUser } from "@/lib/api-platform-session";
import { writePlatformUploadImage } from "@/lib/platform-write-image";

export const runtime = "nodejs";

const MAX_BYTES = 5 * 1024 * 1024;

/** Multipart upload for event speaker headshots (Cloudinary or local fallback). */
export async function POST(req: NextRequest) {
  const user = await getApiPlatformUser(req);
  if (!user) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ ok: false, error: "bad_form" }, { status: 400 });
  }

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json({ ok: false, error: "empty_file" }, { status: 400 });
  }

  const up = await writePlatformUploadImage(user.id, file, MAX_BYTES);
  if (!up.ok) {
    return NextResponse.json({ ok: false, error: up.error }, { status: 400 });
  }

  return NextResponse.json({ ok: true, url: up.url });
}
