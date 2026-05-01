import { type NextRequest, NextResponse } from "next/server";
import { getPublishedFormBundleBySlug } from "@/lib/trip-registration-form/service";

type Ctx = { params: Promise<{ publicSlug: string }> };

export async function GET(_req: NextRequest, ctx: Ctx) {
  const { publicSlug } = await ctx.params;
  const form = await getPublishedFormBundleBySlug(publicSlug);
  if (!form) return NextResponse.json({ error: "not_found" }, { status: 404 });

  return NextResponse.json({
    form: {
      title: form.title,
      description: form.description,
      publicSlug: form.publicSlug,
      settings: form.settings,
      trip: form.trip,
      questions: form.questions.map((q) => ({
        id: q.id,
        label: q.label,
        description: q.description,
        type: q.type,
        placeholder: q.placeholder,
        isRequired: q.isRequired,
        sortOrder: q.sortOrder,
        options: q.options.map((o) => ({ id: o.id, label: o.label, value: o.value })),
      })),
    },
  });
}
