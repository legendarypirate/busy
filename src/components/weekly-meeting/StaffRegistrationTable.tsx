"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import type { BusyMeetingAttendanceStatus, BusyMeetingPaymentStatus } from "@prisma/client";

type Row = {
  id: string;
  participantType: string;
  displayName: string;
  companyName: string | null;
  position: string | null;
  businessCategory: string | null;
  phone: string | null;
  email: string | null;
  invitedBy: string | null;
  shortIntroduction: string | null;
  paymentStatus: BusyMeetingPaymentStatus;
  attendanceStatus: BusyMeetingAttendanceStatus;
};

const PAY: BusyMeetingPaymentStatus[] = ["unpaid", "paid", "exempted", "refunded"];
const ATT: BusyMeetingAttendanceStatus[] = ["unknown", "present", "absent", "late", "substitute_present"];

export default function StaffRegistrationTable({
  meetingId,
  rows,
  showIntro,
}: {
  meetingId: string;
  rows: Row[];
  showIntro: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200">
      <table className="w-full min-w-[960px] border-collapse text-left text-sm">
        <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-600">
          <tr>
            <th className="border-b border-slate-200 px-3 py-2">Төрөл</th>
            <th className="border-b border-slate-200 px-3 py-2">Нэр</th>
            <th className="border-b border-slate-200 px-3 py-2">Компани</th>
            <th className="border-b border-slate-200 px-3 py-2">Албан тушаал</th>
            <th className="border-b border-slate-200 px-3 py-2">Ангилал</th>
            <th className="border-b border-slate-200 px-3 py-2">Утас</th>
            <th className="border-b border-slate-200 px-3 py-2">Имэйл</th>
            <th className="border-b border-slate-200 px-3 py-2">Төлбөр</th>
            <th className="border-b border-slate-200 px-3 py-2">Ирц</th>
            <th className="border-b border-slate-200 px-3 py-2 text-right"> </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 bg-white">
          {rows.map((r) => (
            <tr key={r.id} className="align-middle text-slate-800">
              <td className="px-3 py-2 capitalize text-slate-600">{r.participantType}</td>
              <td className="px-3 py-2 font-medium">{r.displayName}</td>
              <td className="px-3 py-2 text-slate-600">{r.companyName ?? "—"}</td>
              <td className="px-3 py-2 text-slate-600">{r.position ?? "—"}</td>
              <td className="px-3 py-2 text-slate-600">{r.businessCategory ?? "—"}</td>
              <td className="whitespace-nowrap px-3 py-2 text-slate-600">{r.phone ?? "—"}</td>
              <td className="max-w-[140px] break-all px-3 py-2 text-slate-600">{r.email ?? "—"}</td>
              <td className="px-3 py-2" style={{ minWidth: 140 }}>
                <select
                  id={`pay-${r.id}`}
                  defaultValue={r.paymentStatus}
                  disabled={pending}
                  className="w-full rounded-md border border-slate-300 bg-white px-2 py-1.5 text-xs focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  {PAY.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              </td>
              <td className="px-3 py-2" style={{ minWidth: 140 }}>
                <select
                  id={`att-${r.id}`}
                  defaultValue={r.attendanceStatus}
                  disabled={pending}
                  className="w-full rounded-md border border-slate-300 bg-white px-2 py-1.5 text-xs focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  {ATT.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              </td>
              <td className="px-3 py-2 text-right">
                <button
                  type="button"
                  disabled={pending}
                  className="rounded-full border border-blue-200 bg-white px-3 py-1 text-xs font-medium text-blue-700 hover:bg-blue-50 disabled:opacity-50"
                  onClick={() => {
                    const pay = (document.getElementById(`pay-${r.id}`) as HTMLSelectElement | null)?.value as
                      | BusyMeetingPaymentStatus
                      | undefined;
                    const att = (document.getElementById(`att-${r.id}`) as HTMLSelectElement | null)?.value as
                      | BusyMeetingAttendanceStatus
                      | undefined;
                    if (!pay || !att) return;
                    startTransition(async () => {
                      const res = await fetch(
                        `/api/meetings/weekly/${meetingId}/registrations/${r.id}`,
                        {
                          method: "PATCH",
                          headers: { "Content-Type": "application/json" },
                          credentials: "include",
                          body: JSON.stringify({ paymentStatus: pay, attendanceStatus: att }),
                        },
                      );
                      if (res.ok) router.refresh();
                    });
                  }}
                >
                  Хадгалах
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {showIntro ? (
        <p className="border-t border-slate-100 bg-slate-50/50 px-3 py-2 text-xs text-slate-500">
          Товч танилцуулгыг хүснэгтэнд багтаахгүй — CSV / хэвлэх хуудсанд багтана.
        </p>
      ) : null}
    </div>
  );
}
