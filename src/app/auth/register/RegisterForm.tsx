"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import Link from "next/link";
import type { RegisterFormState } from "./actions";
import { registerAction } from "./actions";

const initial: RegisterFormState = { errorKey: null, displayName: "", email: "" };

const copy = {
  displayName: "Овог нэр",
  email: "Имэйл",
  password: "Нууц үг",
  passwordConfirm: "Нууц үг давтах",
  passwordHint: "Хамгийн багадаа 8 тэмдэгт.",
  submit: "Бүртгүүлэх",
  or: "эсвэл",
  hasAccount: "Данстай юу?",
  login: "Нэвтрэх",
  google: "Google-р нэвтрэх",
  googlePlatform: "Google-р нэвтрэх (BUSY платформ)",
  errPasswordMismatch: "Нууц үг таарахгүй байна.",
  errPasswordWeak: "Нууц үг хамгийн багадаа 8 тэмдэгт байна.",
  errTerms: "Үргэлжлүүлэхийн тулд нөхцөлийг зөвшөөрнө үү.",
  errEmailTaken: "Энэ имэйлээр бүртгэл аль хэдийн байна. Нэвтрэх хуудас ашиглана уу.",
  errUseGoogle: "Энэ имэйл Google-р бүртгэгдсэн. Google-р нэвтрэх товчийг ашиглана уу.",
  errInactive: "Энэ имэйлтэй холбоотой данс идэвхгүй байна. Дэмжлэгт холбогдоно уу.",
  errServer: "Бүртгэл үүсгэхэд алдаа гарлаа. Дахин оролдоно уу.",
  errInvalid: "Бүх шаардлагатай талбарыг бөглөнө үү.",
};

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
  googleHref: string | null;
  googleUsesNextPlatformOAuth?: boolean;
  defaultEmail?: string;
  defaultDisplayName?: string;
};

export default function RegisterForm({
  nextPath,
  googleHref,
  googleUsesNextPlatformOAuth = false,
  defaultEmail = "",
  defaultDisplayName = "",
}: Props) {
  const [state, formAction] = useActionState(registerAction, {
    ...initial,
    email: defaultEmail,
    displayName: defaultDisplayName,
  });

  const loginHref = `/auth/login${nextPath !== "/" ? `?next=${encodeURIComponent(nextPath)}` : ""}`;

  const errMsg =
    state.errorKey === "invalid"
      ? copy.errInvalid
      : state.errorKey === "password_mismatch"
        ? copy.errPasswordMismatch
        : state.errorKey === "password_weak"
          ? copy.errPasswordWeak
          : state.errorKey === "terms_required"
            ? copy.errTerms
            : state.errorKey === "email_taken"
              ? copy.errEmailTaken
              : state.errorKey === "use_google"
                ? copy.errUseGoogle
                : state.errorKey === "account_inactive"
                  ? copy.errInactive
                  : state.errorKey === "server_error"
                    ? copy.errServer
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
        <label className="form-label" htmlFor="displayName">
          {copy.displayName}
        </label>
        <div className="bni-auth-input-icon">
          <span className="bni-auth-input-ico">
            <i className="fa-solid fa-user" aria-hidden="true" />
          </span>
          <input
            type="text"
            className="form-control"
            id="displayName"
            name="displayName"
            required
            autoComplete="name"
            maxLength={255}
            placeholder="Бат Болд"
            defaultValue={state.displayName || defaultDisplayName}
          />
        </div>
      </div>
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
      <div className="mb-3">
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
            autoComplete="new-password"
            minLength={8}
            aria-describedby="passwordHelp"
          />
        </div>
        <div id="passwordHelp" className="form-text">
          {copy.passwordHint}
        </div>
      </div>
      <div className="mb-3">
        <label className="form-label" htmlFor="passwordConfirm">
          {copy.passwordConfirm}
        </label>
        <div className="bni-auth-input-icon">
          <span className="bni-auth-input-ico">
            <i className="fa-solid fa-lock" aria-hidden="true" />
          </span>
          <input
            type="password"
            className="form-control"
            id="passwordConfirm"
            name="passwordConfirm"
            required
            autoComplete="new-password"
            minLength={8}
          />
        </div>
      </div>
      <div className="mb-4">
        <div className="form-check">
          <input className="form-check-input" type="checkbox" name="terms" id="terms" value="on" required />
          <label className="form-check-label small" htmlFor="terms">
            <Link href="#" className="text-primary text-decoration-none">
              Нөхцөл, болзол
            </Link>
            {" болон "}
            <Link href="#" className="text-primary text-decoration-none">
              нууцлалын бодлого
            </Link>
            -ыг зөвшөөрнө
          </label>
        </div>
      </div>
      <SubmitButton />
      {googleHref ? (
        <>
          <div className="bni-auth-divider">
            <span>{copy.or}</span>
          </div>
          <a href={googleHref} className="bni-auth-btn-google">
            <i className="fa-brands fa-google" aria-hidden="true" />
            {googleUsesNextPlatformOAuth ? copy.googlePlatform : copy.google}
          </a>
        </>
      ) : null}
      <div className="bni-auth-footer">
        <span>{copy.hasAccount}</span> <Link href={loginHref}>{copy.login}</Link>
      </div>
    </form>
  );
}
