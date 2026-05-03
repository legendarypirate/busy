"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireAdminUser } from "@/lib/admin-session";

function slugifyChapter(name: string): string {
  const base = name
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .slice(0, 190);
  return base || `chapter-${Date.now().toString(36)}`;
}

export async function saveChapterAction(formData: FormData): Promise<void> {
  await requireAdminUser("/admin/bni-chapters");
  const regionId = Math.max(0, parseInt(String(formData.get("region_id") ?? "0"), 10) || 0);
  const name = String(formData.get("name") ?? "").trim();
  let slug = String(formData.get("slug") ?? "").trim().toLowerCase();
  const maxMembers = Math.min(500, Math.max(1, parseInt(String(formData.get("max_members") ?? "40"), 10) || 40));
  const timezone = String(formData.get("timezone") ?? "").trim() || "Asia/Ulaanbaatar";

  if (name === "" || regionId < 1) {
    redirect("/admin/bni-chapters?error=missing");
  }
  if (slug === "") slug = slugifyChapter(name);

  let finalSlug = slug.slice(0, 190);
  for (let i = 0; i < 8; i++) {
    const clash = await prisma.chapter.findFirst({
      where: { regionId, slug: finalSlug },
      select: { id: true },
    });
    if (!clash) break;
    finalSlug = `${slug.slice(0, 160)}-${Math.random().toString(36).slice(2, 7)}`;
  }

  await prisma.chapter.create({
    data: {
      regionId,
      name: name.slice(0, 190),
      slug: finalSlug,
      maxMembers,
      timezone: timezone.slice(0, 64),
    },
  });

  revalidatePath("/admin/bni-chapters");
  revalidatePath("/admin/meetings");
  revalidatePath("/platform/events");
  redirect("/admin/bni-chapters");
}
