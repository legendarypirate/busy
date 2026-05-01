/**
 * Shared Tailwind tokens for BUSY.mn trip registration / form builder (SaaS, Google-Forms–inspired).
 * Single source so builder, public form, and responses stay visually aligned.
 */
export const tripFormUi = {
  pageBg: "bg-[#f4f6f9]",
  shell: "rounded-2xl border border-slate-200/90 bg-white shadow-[0_1px_3px_rgba(15,23,42,0.06)]",
  shellHeader: "border-b border-slate-100 bg-white px-4 py-4 sm:px-6",
  label: "text-xs font-semibold uppercase tracking-wide text-slate-500",
  labelField: "text-sm font-medium text-slate-700",
  input:
    "w-full rounded-2xl border border-slate-200 bg-white px-4 py-3.5 text-base text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/15",
  inputSm:
    "w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20",
  select:
    "w-full rounded-2xl border border-slate-200 bg-white px-4 py-3.5 text-base text-slate-900 shadow-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/15",
  selectSm:
    "rounded-xl border border-slate-200 bg-white px-2.5 py-2 text-xs font-medium text-slate-800 shadow-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20",
  textarea:
    "w-full min-h-[100px] rounded-2xl border border-slate-200 bg-white px-4 py-3.5 text-base text-slate-900 shadow-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/15",
  card: "rounded-2xl border border-slate-200/90 bg-white p-5 shadow-sm sm:p-6",
  cardAccent: "rounded-2xl border border-slate-200/90 border-l-[5px] border-l-blue-600 bg-white p-5 shadow-sm sm:p-6",
  btnPrimary:
    "inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:pointer-events-none disabled:opacity-50",
  btnSecondary:
    "inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-800 shadow-sm transition hover:bg-slate-50 disabled:opacity-50",
  btnGhost: "inline-flex items-center justify-center rounded-lg px-3 py-1.5 text-sm font-medium text-blue-700 transition hover:bg-blue-50",
  btnDanger:
    "inline-flex items-center justify-center rounded-lg border border-red-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-red-700 transition hover:bg-red-50",
  badge: "inline-flex items-center rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-blue-800",
  dragHandle:
    "flex h-10 w-8 shrink-0 cursor-grab touch-none items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-slate-400 active:cursor-grabbing hover:bg-slate-100 hover:text-slate-600",

  /** Dashboard form builder: tighter spacing, smaller radii, data-dense B2B feel */
  formBuilder: {
    shell: "rounded-xl border border-slate-200/80 bg-white shadow-sm",
    shellHeader: "border-b border-slate-100 bg-white px-4 py-2.5 sm:px-5",
    labelField: "text-xs font-medium text-slate-600",
    input:
      "w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20",
    select:
      "w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20",
    textarea:
      "w-full min-h-[72px] rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20",
    card: "rounded-xl border border-slate-200/90 bg-white p-3.5 shadow-sm",
    cardAccent:
      "rounded-xl border border-slate-200/90 border-l-[3px] border-l-blue-600 bg-white p-3.5 shadow-sm sm:p-4",
    dragHandle:
      "flex h-8 w-7 shrink-0 cursor-grab touch-none items-center justify-center rounded-md border border-slate-200 bg-slate-50 text-slate-400 active:cursor-grabbing hover:bg-slate-100 hover:text-slate-600",
    btnSecondaryCompact:
      "inline-flex items-center justify-center gap-1 rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-semibold text-slate-800 shadow-sm transition hover:bg-slate-50 disabled:opacity-50",
    btnPrimaryCompact:
      "inline-flex items-center justify-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:pointer-events-none disabled:opacity-50",
    btnToolbar:
      "inline-flex items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-800 shadow-sm transition hover:bg-slate-50 disabled:opacity-50",
    btnToolbarPrimary:
      "inline-flex items-center justify-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:pointer-events-none disabled:opacity-50",
  },
} as const;
