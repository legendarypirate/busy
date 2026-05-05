import { type NextRequest, NextResponse } from "next/server";
import { getApiPlatformUser } from "@/lib/api-platform-session";
import { legacyRoleAllowsFullAdminApi } from "@/lib/admin-access";
import { writeAdminMarketingListingHeroUpload } from "@/lib/platform-write-image";

export const runtime = "nodejs";

const MAX_BYTES = 8 * 1024 * 1024;

/** Multipart: one or more `files` (repeat key or array). Admin-only; Cloudinary when configured. */
export async function POST(req: NextRequest) {
  const user = await getApiPlatformUser(req);
  if (!user || !legacyRoleAllowsFullAdminApi(user.legacyRole)) {
    return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 });
  }

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ ok: false, error: "bad_form" }, { status: 400 });
  }

  const raw = formData.getAll("files");
  const files = raw.filter((x): x is File => x instanceof File && x.size > 0);
  if (files.length === 0) {
    return NextResponse.json({ ok: false, error: "no_files" }, { status: 400 });
  }

  const urls: string[] = [];
  const errors: string[] = [];

  for (const file of files) {
    const up = await writeAdminMarketingListingHeroUpload(user.id, file, MAX_BYTES);
    if (up.ok) {
      urls.push(up.url);
    } else {
      errors.push(`${file.name}: ${up.error}`);
    }
  }

  if (urls.length === 0) {
    return NextResponse.json(
      { ok: false, error: errors.join(" · ") || "upload_failed" },
      { status: 400 },
    );
  }

  return NextResponse.json({
    ok: true,
    urls,
    ...(errors.length ? { partialErrors: errors } : {}),
  });
}
