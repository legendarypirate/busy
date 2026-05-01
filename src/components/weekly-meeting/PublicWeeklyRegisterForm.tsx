"use client";

import type { BusyMeetingParticipantType } from "@prisma/client";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { publicRegisterForWeeklyMeetingAction } from "@/app/dashboard/weekly-meetings/weekly-meeting-actions";

type Flags = {
  enableMemberRegistration: boolean;
  enableGuestRegistration: boolean;
  enableSubstituteRegistration: boolean;
  enableShortIntroduction: boolean;
};

export default function PublicWeeklyRegisterForm({ token, flags }: { token: string; flags: Flags }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const typeOptions = [
    { value: "member" as const, label: "Гишүүн", enabled: flags.enableMemberRegistration },
    { value: "guest" as const, label: "Зочин", enabled: flags.enableGuestRegistration },
    { value: "substitute" as const, label: "Орлогч", enabled: flags.enableSubstituteRegistration },
  ].filter((o) => o.enabled);

  const defaultType = typeOptions[0]?.value ?? "member";

  return (
    <form
      className="mx-auto max-w-lg space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:p-8"
      onSubmit={(e) => {
        e.preventDefault();
        setError(null);
        const fd = new FormData(e.currentTarget);
        const participantType = String(fd.get("participantType") ?? defaultType) as BusyMeetingParticipantType;
        startTransition(async () => {
          const res = await publicRegisterForWeeklyMeetingAction({
            token,
            participantType,
            displayName: String(fd.get("displayName") ?? ""),
            companyName: String(fd.get("companyName") ?? ""),
            position: String(fd.get("position") ?? ""),
            phone: String(fd.get("phone") ?? ""),
            email: String(fd.get("email") ?? ""),
            invitedBy: String(fd.get("invitedBy") ?? ""),
            businessCategory: String(fd.get("businessCategory") ?? ""),
            shortIntroduction: String(fd.get("shortIntroduction") ?? ""),
          });
          if (!res.ok) {
            const map: Record<string, string> = {
              NOT_FOUND: "Холбоос хүчингүй байна.",
              TYPE_DISABLED: "Энэ төрлийн бүртгэл идэвгүй байна.",
              NAME: "Нэрээ бүрэн оруулна уу.",
              INTRO_TOO_LONG: "Танилцуулга хэт урт байна.",
            };
            setError(map[res.error] ?? res.error);
            return;
          }
          setDone(true);
          router.refresh();
        });
      }}
    >
      <h2 className="text-lg font-semibold text-slate-900">Бүртгэл</h2>
      {done ? (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-900" role="status">
          Амжилттай бүртгэгдлээ. Танд баярлалаа.
        </div>
      ) : null}
      {error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800" role="alert">
          {error}
        </div>
      ) : null}

      <div className="space-y-2">
        <label className="block text-sm font-medium text-slate-700">Төрөл</label>
        <select
          name="participantType"
          defaultValue={defaultType}
          disabled={pending || done}
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
        >
          {typeOptions.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium text-slate-700" htmlFor="displayName">
          Нэр
        </label>
        <input
          id="displayName"
          name="displayName"
          required
          minLength={2}
          disabled={pending || done}
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <label className="block text-sm font-medium text-slate-700" htmlFor="companyName">
            Компани
          </label>
          <input
            id="companyName"
            name="companyName"
            disabled={pending || done}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
          />
        </div>
        <div className="space-y-2">
          <label className="block text-sm font-medium text-slate-700" htmlFor="position">
            Албан тушаал
          </label>
          <input
            id="position"
            name="position"
            disabled={pending || done}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <label className="block text-sm font-medium text-slate-700" htmlFor="phone">
            Утас
          </label>
          <input
            id="phone"
            name="phone"
            disabled={pending || done}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
          />
        </div>
        <div className="space-y-2">
          <label className="block text-sm font-medium text-slate-700" htmlFor="email">
            Имэйл
          </label>
          <input
            id="email"
            name="email"
            type="email"
            disabled={pending || done}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
          />
        </div>
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium text-slate-700" htmlFor="invitedBy">
          Уригч
        </label>
        <input
          id="invitedBy"
          name="invitedBy"
          disabled={pending || done}
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
        />
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium text-slate-700" htmlFor="businessCategory">
          Бизнес ангилал
        </label>
        <input
          id="businessCategory"
          name="businessCategory"
          disabled={pending || done}
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
        />
      </div>

      {flags.enableShortIntroduction ? (
        <div className="space-y-2">
          <label className="block text-sm font-medium text-slate-700" htmlFor="shortIntroduction">
            Товч танилцуулга
          </label>
          <textarea
            id="shortIntroduction"
            name="shortIntroduction"
            rows={4}
            disabled={pending || done}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
          />
        </div>
      ) : null}

      <button
        type="submit"
        disabled={pending || done}
        className="w-full rounded-full bg-blue-600 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-blue-700 disabled:opacity-60"
      >
        {pending ? "Илгээж байна…" : "Бүртгүүлэх"}
      </button>
    </form>
  );
}
