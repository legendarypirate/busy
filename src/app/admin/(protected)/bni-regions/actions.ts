"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireAdminUser } from "@/lib/admin-session";

function slugify(name: string): string {
  const base = name
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .slice(0, 190);
  return base || `region-${Date.now().toString(36)}`;
}

export async function saveRegionAction(formData: FormData): Promise<void> {
  await requireAdminUser("/admin/bni-regions");
  const idRaw = String(formData.get("id") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim();
  let slug = String(formData.get("slug") ?? "").trim().toLowerCase();
  const sortOrder = Math.max(0, parseInt(String(formData.get("sort_order") ?? "0"), 10) || 0);

  if (name === "") {
    redirect("/admin/bni-regions");
  }
  if (slug === "") slug = slugify(name);

  if (idRaw !== "") {
    const id = parseInt(idRaw, 10);
    if (Number.isFinite(id) && id > 0) {
      await prisma.region.update({
        where: { id },
        data: { name, slug, sortOrder },
      });
    }
  } else {
    let finalSlug = slug;
    const exists = await prisma.region.findUnique({ where: { slug: finalSlug }, select: { id: true } });
    if (exists) {
      finalSlug = `${slug}-${Math.random().toString(36).slice(2, 8)}`;
    }
    await prisma.region.create({
      data: { name, slug: finalSlug, sortOrder },
    });
  }
  revalidatePath("/admin/bni-regions");
  redirect("/admin/bni-regions");
}

export async function deleteRegionAction(formData: FormData): Promise<void> {
  await requireAdminUser("/admin/bni-regions");
  const id = parseInt(String(formData.get("id") ?? ""), 10);
  if (!Number.isFinite(id) || id <= 0) redirect("/admin/bni-regions");
  const ch = await prisma.chapter.count({ where: { regionId: id } });
  if (ch > 0) redirect("/admin/bni-regions");
  await prisma.region.delete({ where: { id } }).catch(() => undefined);
  revalidatePath("/admin/bni-regions");
  redirect("/admin/bni-regions");
}
