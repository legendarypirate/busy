"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import Link from "next/link";
import type { AdminLoginFormState } from "./actions";
import { adminLoginAction } from "./actions";

const initial: AdminLoginFormState = { errorKey: null, email: "" };

const copy = {
  email: "Имэйл",
  password: "Нууц үг",
  submit: "Админ нэвтрэх",
  errInvalid: "Имэйл эсвэл нууц үг буруу байна.",
  errGoogle: "Энэ бүртгэл Google-р нэвтэрдэг. Энэ хуудас зөвхөн нууц үгтэй админд зориулагдсан.",
  errForbidden: "Энэ дансад админ эрх байхгүй байна.",
} as const;

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="bni-auth-btn-primary" disabled={pending}>
      {pending ? "…" : copy.submit}
    </button>
  );
}

type Props = {
  nextPath: string;
  defaultEmail: string;
};

export default function AdminLoginForm({ nextPath, defaultEmail }: Props) {
  const [state, formAction] = useActionState(adminLoginAction, { ...initial, email: defaultEmail });

  const errMsg =
    state.errorKey === "use_google"
      ? copy.errGoogle
      : state.errorKey === "forbidden"
        ? copy.errForbidden
        : state.errorKey === "invalid"
          ? copy.errInvalid
          : null;

  return (
    <form action={formAction} className="mb-0">
      <input type="hidden" name="next" value={nextPath} />
      {errMsg ? (
        <div className="alert alert-danger bni-auth-alert mb-4" role="alert">
          {errMsg}
        </div>
      ) : null}
      <div className="mb-3">
        <label className="form-label" htmlFor="admin-email">
          {copy.email}
        </label>
        <div className="bni-auth-input-icon">
          <span className="bni-auth-input-ico">
            <i className="fa-solid fa-envelope" aria-hidden="true" />
          </span>
          <input
            type="email"
            className="form-control"
            id="admin-email"
            name="email"
            required
            autoComplete="email"
            placeholder="admin@busy.mn"
            defaultValue={state.email || defaultEmail}
          />
        </div>
      </div>
      <div className="mb-4">
        <label className="form-label" htmlFor="admin-password">
          {copy.password}
        </label>
        <div className="bni-auth-input-icon">
          <span className="bni-auth-input-ico">
            <i className="fa-solid fa-lock" aria-hidden="true" />
          </span>
          <input
            type="password"
            className="form-control"
            id="admin-password"
            name="password"
            required
            autoComplete="current-password"
          />
        </div>
      </div>
      <SubmitButton />
      <div className="bni-auth-footer">
        <Link href="/">Нүүр руу</Link>
      </div>
    </form>
  );
}
