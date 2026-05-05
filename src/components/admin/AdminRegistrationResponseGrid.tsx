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
};

export default function AdminRegistrationResponseGrid({
  title,
  subtitle,
  backHref,
  backLabel,
  sections,
  emptyMessage = "Энэ аялалд / эвентэд илгээсэн хариулт байхгүй байна.",
}: Props) {
  const hasAny = sections.some((s) => s.responses.length > 0);

  return (
    <div>
      <div className="mb-3">
        <Link href={backHref} className="btn btn-sm btn-outline-secondary">
          ← {backLabel}
        </Link>
      </div>
      <h1 className="h4 fw-bold mb-1">{title}</h1>
      {subtitle ? <p className="text-muted small mb-3">{subtitle}</p> : null}

      {!hasAny ? <p className="text-muted small">{emptyMessage}</p> : null}

      {sections.map((sec) => (
        <section key={sec.signature || `empty-${sec.sectionNo}`} className="mb-5">
          <h2 className="h6 fw-semibold border-bottom pb-2 mb-3">
            Хэсэг {sec.sectionNo}
            <span className="text-muted fw-normal ms-2">
              — {sec.questionColumns.length} асуулт, {sec.responses.length} хариулт
            </span>
          </h2>

          {sec.responses.length === 0 ? (
            <p className="text-muted small mb-0">Энэ багцад мөр байхгүй.</p>
          ) : (
            <div className="table-responsive border rounded-3 bg-white">
              <table className="table table-bordered table-sm align-middle mb-0" style={{ minWidth: 640 }}>
                <thead className="table-light">
                  <tr className="small text-secondary">
                    <th className="text-nowrap">#</th>
                    <th className="text-nowrap">Огноо</th>
                    <th className="text-nowrap">Илгээсэн</th>
                    {sec.questionColumns.map((c) => (
                      <th key={c.id} className="text-wrap" style={{ minWidth: 140 }}>
                        {c.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {sec.responses.map((r, idx) => (
                    <tr key={r.id}>
                      <td className="text-muted small">{idx + 1}</td>
                      <td className="text-nowrap small text-muted">{fmtLocal(r.submittedAt)}</td>
                      <td className="small fw-medium">{r.who}</td>
                      {sec.questionColumns.map((c) => (
                        <td
                          key={c.id}
                          className="small"
                          style={{ whiteSpace: "pre-wrap", wordBreak: "break-word", maxWidth: 360 }}
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
