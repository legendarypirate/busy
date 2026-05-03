import { type NextRequest, NextResponse } from "next/server";
import { getApiPlatformUser } from "@/lib/api-platform-session";
import { writeAdminEventDetailHeroUpload } from "@/lib/platform-write-image";

export const runtime = "nodejs";

const MAX_BYTES = 8 * 1024 * 1024;

/** Single image for event public detail hero (envelope `hero_image_url`). Admin-only. */
export async function POST(req: NextRequest) {
  const user = await getApiPlatformUser(req);
  if (!user || user.legacyRole !== "admin") {
    return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 });
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

  const up = await writeAdminEventDetailHeroUpload(user.id, file, MAX_BYTES);
  if (!up.ok) {
    return NextResponse.json({ ok: false, error: up.error }, { status: 400 });
  }

  return NextResponse.json({ ok: true, url: up.url });
}
