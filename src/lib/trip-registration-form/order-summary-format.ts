/** Client-safe display helpers for `TripFormResponse.orderSummary` (no Prisma / Node). */

function isRecord(x: unknown): x is Record<string, unknown> {
  return typeof x === "object" && x !== null && !Array.isArray(x);
}

export function formatOrderSummaryMn(raw: unknown): string {
  if (!isRecord(raw)) return "";
  const lines = raw.lines;
  if (!Array.isArray(lines)) return "";
  const totalPax = Number(raw.totalPax ?? 0);
  const totalMnt = Number(raw.totalMnt ?? 0);
  const dep = String(raw.departureIso ?? "").trim();
  const parts: string[] = [];
  if (dep) parts.push(`Эхлэх: ${dep}`);
  parts.push(`Нийт: ${totalPax} хүн · ${Math.round(totalMnt).toLocaleString("mn-MN")} ₮`);
  for (const row of lines) {
    if (!isRecord(row)) continue;
    const label = String(row.label ?? "").trim() || String(row.tierId ?? "");
    const qty = Math.round(Number(row.qty ?? 0)) || 0;
    const unit = Math.round(Number(row.unitPriceMnt ?? 0)) || 0;
    if (qty > 0) parts.push(`  · ${label} × ${qty} — ${unit.toLocaleString("mn-MN")} ₮`);
  }
  return parts.join("\n");
}
