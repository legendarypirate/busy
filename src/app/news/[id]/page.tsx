import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { formatMnDate } from "@/lib/format-date";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

export default async function NewsArticlePage({ params }: Props) {
  const { id } = await params;
  const num = Number(id);
  if (!Number.isFinite(num)) {
    notFound();
  }
  const article = await prisma.newsArticle.findUnique({ where: { id: num } }).catch(() => null);
  if (!article || article.status !== "published") {
    notFound();
  }

  const html = article.content ?? article.body ?? "";

  return (
    <main className="container py-4">
      <nav aria-label="breadcrumb" className="mb-3">
        <ol className="breadcrumb mb-0">
          <li className="breadcrumb-item">
            <Link href="/news">Мэдээ</Link>
          </li>
          <li className="breadcrumb-item active" aria-current="page">
            {article.title}
          </li>
        </ol>
      </nav>
      <article>
        <h1 className="h2 fw-bold" style={{ color: "var(--brand-primary)" }}>
          {article.title}
        </h1>
        <p className="text-muted small">{formatMnDate(article.createdAt)}</p>
        {article.excerpt ? <p className="lead mt-3">{article.excerpt}</p> : null}
        {html ? (
          <div className="mt-4 prose-busy" dangerouslySetInnerHTML={{ __html: html }} />
        ) : null}
      </article>
    </main>
  );
}
