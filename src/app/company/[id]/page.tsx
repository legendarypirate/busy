import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { mediaUrl } from "@/lib/media-url";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

export default async function CompanyPublicPage({ params }: Props) {
  const { id } = await params;
  let accountId: bigint;
  try {
    accountId = BigInt(id);
  } catch {
    notFound();
  }

  const profile = await prisma.platformProfile.findUnique({
    where: { accountId },
  });

  if (!profile) {
    notFound();
  }

  return (
    <main className="container py-4">
      <nav aria-label="breadcrumb" className="mb-3">
        <ol className="breadcrumb mb-0">
          <li className="breadcrumb-item">
            <Link href="/members">Гишүүд</Link>
          </li>
          <li className="breadcrumb-item active" aria-current="page">
            {profile.companyName ?? profile.displayName}
          </li>
        </ol>
      </nav>

      <div className="row g-4 align-items-start">
        <div className="col-auto">
          {profile.photoUrl ? (
            <Image
              src={mediaUrl(profile.photoUrl)}
              alt=""
              width={120}
              height={120}
              className="rounded-3 border object-cover"
              unoptimized
            />
          ) : (
            <div className="rounded-3 bg-light border d-flex align-items-center justify-content-center text-muted fw-bold fs-3" style={{ width: 120, height: 120 }}>
              {(profile.companyName ?? profile.displayName).slice(0, 1)}
            </div>
          )}
        </div>
        <div className="col">
          <h1 className="h3 fw-bold" style={{ color: "var(--brand-primary)" }}>
            {profile.companyName ?? profile.displayName}
          </h1>
          <p className="text-muted mb-1">{profile.displayName}</p>
          {profile.businessEmail ? <p className="mb-1">{profile.businessEmail}</p> : null}
          {profile.businessPhone ? <p className="mb-1">{profile.businessPhone}</p> : null}
          {profile.website ? (
            <p className="mb-1">
              <a href={profile.website} target="_blank" rel="noopener noreferrer">
                {profile.website}
              </a>
            </p>
          ) : null}
          {profile.addressLine ? <p className="small">{profile.addressLine}</p> : null}
          {profile.bio ? <div className="mt-3 small whitespace-pre-wrap">{profile.bio}</div> : null}
        </div>
      </div>
    </main>
  );
}
