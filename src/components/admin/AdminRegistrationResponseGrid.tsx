import Link from "next/link";
import type { ReactNode } from "react";
import type { AdminGridSection } from "@/lib/admin-registration-response-grid";

function fmtLocal(iso: string): string {
  try {
    return new Date(iso).toLocaleString("mn-MN", { dateStyle: "short", timeStyle: "short" });
  } catch {
    return iso.slice(0, 16).replace("T", " ");
  }
}

type Props = {
  title: string;
  subtitle?: string;
  backHref: string;
  backLabel: string;
  sections: AdminGridSection[];
  emptyMessage?: string;
  /** GET URL that returns UTF-8 CSV (Excel). */
  exportDownloadHref?: string;
};

export default function AdminRegistrationResponseGrid({
  title,
  subtitle,
  backHref,
  backLabel,
  sections,
  emptyMessage = "Энэ аялалд / эвентэд илгээсэн хариулт байхгүй байна.",
  exportDownloadHref,
}: Props) {
  const hasAny = sections.some((s) => s.responses.length > 0);

  return (
    <div>
      <div className="d-flex flex-wrap align-items-center gap-2 mb-3">
        <Link href={backHref} className="btn btn-sm btn-outline-secondary">
          ← {backLabel}
        </Link>
        {exportDownloadHref ? (
          <a
            href={exportDownloadHref}
            className="btn btn-sm btn-success"
            title="Бүх хариултыг нэг Excel (CSV) файл болгон татах"
          >
            <i className="fas fa-file-excel me-1" aria-hidden />
            Excel татах
          </a>
        ) : null}
      </div>
      <h1 className="h4 fw-bold mb-1">{title}</h1>
      {subtitle ? <p className="text-muted small mb-3">{subtitle}</p> : null}

      {!hasAny ? <p className="text-muted small">{emptyMessage}</p> : null}

      {sections.map((sec) => (
        <section key={sec.signature || `empty-${sec.sectionNo}`} className="mb-4">
          {sec.sectionNo > 1 ? (
            <p className="fw-bold mb-2 mt-4 pt-2 border-top">Асуулт өөрчлөгдсөний дараа</p>
          ) : null}
          {sec.responses.length > 0 ? (
            <p className="small text-muted mb-2">
              {sec.questionColumns.length} асуулт · {sec.responses.length} оролцогчийн хариулт
            </p>
          ) : null}

          {sec.responses.length === 0 ? (
            <p className="text-muted small mb-0">Энэ багцад мөр байхгүй.</p>
          ) : (
            <div className="table-responsive border rounded-2 bg-white shadow-sm">
              <table
                className="table table-bordered table-sm align-middle mb-0"
                style={{ minWidth: 480, fontSize: "0.8125rem" }}
              >
                <thead className="table-light">
                  <tr>
                    <th className="text-nowrap text-center" style={{ width: "2.5rem" }}>
                      #
                    </th>
                    <th className="text-nowrap" style={{ minWidth: "9rem" }}>
                      Оролцогч
                    </th>
                    {sec.questionColumns.map((c) => (
                      <th
                        key={c.id}
                        className="small fw-semibold text-start align-top"
                        style={{
                          minWidth: "7.5rem",
                          maxWidth: "16rem",
                          whiteSpace: "normal",
                          wordBreak: "break-word",
                          lineHeight: 1.35,
                        }}
                      >
                        {c.label.trim() || c.id}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {sec.responses.map((r, idx) => (
                    <tr key={r.id}>
                      <td className="text-center text-muted">{idx + 1}</td>
                      <td className="small">
                        <div className="fw-medium">{r.who}</div>
                        <div className="text-muted" style={{ fontSize: "0.75rem" }}>
                          {fmtLocal(r.submittedAt)}
                        </div>
                      </td>
                      {sec.questionColumns.map((c) => (
                        <td
                          key={c.id}
                          className="small align-top"
                          style={{ whiteSpace: "pre-wrap", wordBreak: "break-word", maxWidth: 280 }}
                        >
                          {linkifyCell(r.cellByQuestionId[c.id] ?? "—")}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      ))}
    </div>
  );
}

function linkifyCell(text: string): ReactNode {
  if (text === "—" || !text) return text;
  const lines = text.split("\n");
  return lines.map((line, i) => {
    const t = line.trim();
    const isUrl = /^https?:\/\//i.test(t);
    const node = isUrl ? (
      <a href={t} target="_blank" rel="noopener noreferrer" className="text-break">
        {t}
      </a>
    ) : (
      line
    );
    return (
      <span key={i}>
        {i > 0 ? <br /> : null}
        {node}
      </span>
    );
  });
}
