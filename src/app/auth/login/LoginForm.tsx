"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import Link from "next/link";
import type { LoginFormState } from "./actions";
import { loginAction } from "./actions";

const initial: LoginFormState = { errorKey: null, email: "" };

const copy = {
  title: "Платформд нэвтрэх",
  subtitle: "Имэйл, нууц үг эсвэл Google ашиглан нэвтэрнэ үү.",
  email: "Имэйл",
  password: "Нууц үг",
  submit: "Нэвтрэх",
  or: "эсвэл",
  forgot: "Нууц үгээ мартсан уу?",
  noAccount: "Бүртгэлгүй юу?",
  register: "Бүртгүүлэх",
  google: "Google-р нэвтрэх",
  errInvalid: "Имэйл эсвэл нууц үг буруу байна.",
  errGoogle: "Энэ бүртгэл Google-р нэвтэрдэг. Доорх товчийг ашиглана уу.",
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
  legacyBase: string | null;
  /** Next.js `/api/auth/google` эсвэл legacy `google-start.php`; null бол Google товч харагдахгүй. */
  googleHref: string | null;
  defaultEmail: string;
};

export default function LoginForm({ nextPath, legacyBase, googleHref, defaultEmail }: Props) {
  const [state, formAction] = useActionState(loginAction, { ...initial, email: defaultEmail });

  const registerHref = `/auth/register${nextPath !== "/" ? `?next=${encodeURIComponent(nextPath)}` : ""}`;
  const forgotHref = legacyBase ? `${legacyBase}/auth/forgot-password.php` : "#";

  const errMsg =
    state.errorKey === "use_google" ? copy.errGoogle : state.errorKey === "invalid" ? copy.errInvalid : null;

  return (
    <form action={formAction} className="mb-0">
      <input type="hidden" name="next" value={nextPath} />
      {errMsg ? (
        <div className="alert alert-danger bni-auth-alert mb-4" role="alert">
          {errMsg}
        </div>
      ) : null}
      <div className="mb-3">
        <label className="form-label" htmlFor="email">
          {copy.email}
        </label>
        <div className="bni-auth-input-icon">
          <span className="bni-auth-input-ico">
            <i className="fa-solid fa-envelope" aria-hidden="true" />
          </span>
          <input
            type="email"
            className="form-control"
            id="email"
            name="email"
            required
            autoComplete="email"
            placeholder="name@company.com"
            defaultValue={state.email || defaultEmail}
          />
        </div>
      </div>
      <div className="mb-2">
        <label className="form-label" htmlFor="password">
          {copy.password}
        </label>
        <div className="bni-auth-input-icon">
          <span className="bni-auth-input-ico">
            <i className="fa-solid fa-lock" aria-hidden="true" />
          </span>
          <input
            type="password"
            className="form-control"
            id="password"
            name="password"
            required
            autoComplete="current-password"
          />
        </div>
      </div>
      <div className="text-end mb-4">
        {legacyBase ? (
          <a href={forgotHref} className="small text-decoration-none">
            {copy.forgot}
          </a>
        ) : (
          <span className="small text-muted">{copy.forgot}</span>
        )}
      </div>
      <SubmitButton />
      {googleHref ? (
        <>
          <div className="bni-auth-divider">
            <span>{copy.or}</span>
          </div>
          <a href={googleHref} className="bni-auth-btn-google">
            <i className="fa-brands fa-google" aria-hidden="true" />
            {copy.google}
          </a>
        </>
      ) : null}
      <div className="bni-auth-footer">
        {copy.noAccount}
        <Link href={registerHref}>{copy.register}</Link>
      </div>
    </form>
  );
}
