import { prisma } from "@/lib/prisma";

export type GoogleProfilePayload = {
  googleSub: string;
  email: string;
  name: string;
  picture: string;
};

/**
 * Mirrors PHP `bni_platform_upsert_from_google`: find by google_sub OR email,
 * update / create account + profile, return account with profile for display name.
 */
export async function upsertPlatformAccountFromGoogle(payload: GoogleProfilePayload) {
  const email = payload.email.trim().toLowerCase();
  if (!email) {
    throw new Error("Google profile must include an email.");
  }

  const googleId = payload.googleSub;
  const name = payload.name.trim();
  const picture = payload.picture.trim();
  const now = new Date();

  const existing = await prisma.platformAccount.findFirst({
    where: {
      OR: [{ googleSub: googleId }, { email }],
    },
    include: { profile: { select: { displayName: true, photoUrl: true } } },
  });

  if (existing) {
    if (existing.status !== "active") {
      throw new Error("account_inactive");
    }

    const displayName = name !== "" ? name : existing.email;
    const photoKeep = existing.profile?.photoUrl?.trim() ?? "";
    const photoUrl = picture !== "" ? picture : photoKeep || null;

    await prisma.platformAccount.update({
      where: { id: existing.id },
      data: {
        googleSub: googleId,
        email,
        lastLoginAt: now,
      },
    });

    await prisma.platformProfile.upsert({
      where: { accountId: existing.id },
      create: {
        accountId: existing.id,
        displayName,
        photoUrl,
      },
      update: {
        displayName,
        photoUrl,
      },
    });

    return prisma.platformAccount.findUnique({
      where: { id: existing.id },
      include: { profile: { select: { displayName: true } } },
    });
  }

  return prisma.platformAccount.create({
    data: {
      email,
      googleSub: googleId,
      lastLoginAt: now,
      profile: {
        create: {
          displayName: name !== "" ? name : email,
          photoUrl: picture !== "" ? picture : null,
        },
      },
    },
    include: { profile: { select: { displayName: true } } },
  });
}
