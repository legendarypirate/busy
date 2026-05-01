"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { createWeeklyMeetingAction } from "@/app/dashboard/weekly-meetings/weekly-meeting-actions";

export default function CreateWeeklyMeetingForm() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <form
      className="mx-auto max-w-2xl space-y-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:p-8"
      onSubmit={(e) => {
        e.preventDefault();
        setError(null);
        const fd = new FormData(e.currentTarget);
        const groupName = String(fd.get("groupName") ?? "");
        const meetingDateYmd = String(fd.get("meetingDateYmd") ?? "");
        const startTimeHhMm = String(fd.get("startTimeHhMm") ?? "");
        const endTimeHhMm = String(fd.get("endTimeHhMm") ?? "");
        const location = String(fd.get("location") ?? "");
        const feeRaw = String(fd.get("feeMnt") ?? "").trim();
        const feeMnt = feeRaw === "" ? null : Number(feeRaw);

        startTransition(async () => {
          const res = await createWeeklyMeetingAction({
            groupName,
            meetingDateYmd,
            startTimeHhMm,
            endTimeHhMm: endTimeHhMm.trim() === "" ? undefined : endTimeHhMm,
            location: location.trim() === "" ? undefined : location,
            feeMnt: feeMnt !== null && Number.isFinite(feeMnt) ? feeMnt : null,
            enableMemberRegistration: fd.get("enableMemberRegistration") === "on",
            enableGuestRegistration: fd.get("enableGuestRegistration") === "on",
            enableSubstituteRegistration: fd.get("enableSubstituteRegistration") === "on",
            enableShortIntroduction: fd.get("enableShortIntroduction") === "on",
            enablePaymentTracking: fd.get("enablePaymentTracking") === "on",
          });
          if (!res.ok) {
            const copy: Record<string, string> = {
              UNAUTHORIZED: "Нэвтэрсэн байх шаардлагатай.",
              FORBIDDEN: "Энэ үйлдлийг хийх эрхгүй байна.",
              NO_REG_CHANNEL: "Дор хаяж нэг бүртгэлийн суваа (гишүүн / зочин / орлогч) идэвхтэй байх ёстой.",
            };
            setError(copy[res.error] ?? res.error);
            return;
          }
          router.push(`/dashboard/weekly-meetings/${res.meetingId}`);
        });
      }}
    >
      <h2 className="text-lg font-semibold text-slate-900">Шинэ хурал</h2>
      {error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800" role="alert">
          {error}
        </div>
      ) : null}

      <div className="space-y-2">
        <label className="block text-sm font-medium text-slate-700" htmlFor="groupName">
          Бүлэг / салбарын нэр
        </label>
        <input
          id="groupName"
          name="groupName"
          required
          minLength={2}
          placeholder="BNI Chapter Ulaanbaatar"
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2 sm:col-span-1">
          <label className="block text-sm font-medium text-slate-700" htmlFor="meetingDateYmd">
            Огноо
          </label>
          <input
            id="meetingDateYmd"
            name="meetingDateYmd"
            type="date"
            required
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
          />
        </div>
        <div className="grid grid-cols-2 gap-3 sm:col-span-1">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-700" htmlFor="startTimeHhMm">
              Эхлэх
            </label>
            <input
              id="startTimeHhMm"
              name="startTimeHhMm"
              type="time"
              required
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
            />
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-700" htmlFor="endTimeHhMm">
              Дуусах
            </label>
            <input
              id="endTimeHhMm"
              name="endTimeHhMm"
              type="time"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
            />
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium text-slate-700" htmlFor="location">
          Байршил
        </label>
        <input
          id="location"
          name="location"
          placeholder="Хаяг эсвэл линк"
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
        />
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium text-slate-700" htmlFor="feeMnt">
          Уулзалтын төлбөр (₮)
        </label>
        <input
          id="feeMnt"
          name="feeMnt"
          type="number"
          min={0}
          step={1000}
          placeholder="Хоосон бол төлбөргүй"
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
        />
      </div>

      <fieldset className="space-y-3 rounded-xl border border-slate-200 bg-slate-50/80 p-4">
        <legend className="px-1 text-sm font-medium text-slate-800">Тохиргоо</legend>
        {[
          ["enableMemberRegistration", "Гишүүний бүртгэл"],
          ["enableGuestRegistration", "Зочны бүртгэл"],
          ["enableSubstituteRegistration", "Түр орлогчийн бүртгэл"],
          ["enableShortIntroduction", "Товч танилцуулга"],
          ["enablePaymentTracking", "Төлбөрийн мэдээлэл хадгалах"],
        ].map(([name, label]) => (
          <label key={name} className="flex cursor-pointer items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              name={name}
              defaultChecked
              className="size-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
            />
            {label}
          </label>
        ))}
      </fieldset>

      <button
        type="submit"
        disabled={pending}
        className="inline-flex items-center justify-center rounded-full bg-blue-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-blue-700 disabled:opacity-60"
      >
        {pending ? "Үүсгэж байна…" : "Үүсгэх"}
      </button>
    </form>
  );
}
