"use client";

import { useEffect, useState } from "react";

type FormState = "idle" | "submitting" | "success" | "error";

export function ContactPageForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [honeypot, setHoneypot] = useState("");
  const [status, setStatus] = useState<FormState>("idle");
  const [errorText, setErrorText] = useState("");

  useEffect(() => {
    if (status !== "success") return;
    const t = window.setTimeout(() => setStatus("idle"), 5000);
    return () => window.clearTimeout(t);
  }, [status]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("submitting");
    setErrorText("");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, phone, message, website: honeypot }),
      });
      const data: unknown = await res.json().catch(() => ({}));
      if (!res.ok) {
        const msg =
          typeof data === "object" && data && "error" in data && typeof (data as { error: unknown }).error === "string"
            ? (data as { error: string }).error
            : "Илгээхэд алдаа гарлаа.";
        setErrorText(msg);
        setStatus("error");
        return;
      }
      setStatus("success");
      setName("");
      setEmail("");
      setPhone("");
      setMessage("");
    } catch {
      setErrorText("Сүлжээний алдаа. Дахин оролдоно уу.");
      setStatus("error");
    }
  }

  return (
    <div className="rounded-3 border bg-white p-4 p-md-5 shadow-sm">
      <h2 className="h5 fw-bold mb-1">Зурвас илгээх</h2>
      <p className="text-muted small mb-4">
        Санал, хамтын ажиллагаа, техникийн асуулт — бид тань руу имэйлээр хариу өгнө.
      </p>

      {status === "success" ? (
        <div>
          <div
            className="alert alert-success d-flex align-items-start gap-2 mb-3 border-0 shadow-sm py-3"
            role="status"
            aria-live="polite"
          >
            <i className="fa-solid fa-circle-check mt-1 flex-shrink-0" aria-hidden />
            <div>
              <strong className="d-block">Амжилттай илгээгдлээ</strong>
              <span className="small">Удахгүй холбогдох болно. 5 секундын дараа маягт дахин нээгдэнэ.</span>
            </div>
          </div>
          <button type="button" className="btn-brand-outline w-100 py-2" onClick={() => setStatus("idle")}>
            Одоо шинэ зурвас бичих
          </button>
        </div>
      ) : (
        <form onSubmit={onSubmit} noValidate>
          <div className="visually-hidden" aria-hidden="true">
            <label htmlFor="contact-website">Вэбсайт</label>
            <input
              id="contact-website"
              type="text"
              tabIndex={-1}
              autoComplete="off"
              value={honeypot}
              onChange={(ev) => setHoneypot(ev.target.value)}
            />
          </div>

          {status === "error" && errorText ? (
            <div className="alert alert-danger py-2 small" role="alert">
              {errorText}
            </div>
          ) : null}

          <div className="mb-3">
            <label htmlFor="contact-name" className="form-label small fw-semibold">
              Нэр <span className="text-danger">*</span>
            </label>
            <input
              id="contact-name"
              name="name"
              type="text"
              className="form-control"
              autoComplete="name"
              required
              maxLength={200}
              value={name}
              onChange={(ev) => setName(ev.target.value)}
              disabled={status === "submitting"}
            />
          </div>

          <div className="mb-3">
            <label htmlFor="contact-email" className="form-label small fw-semibold">
              Имэйл <span className="text-danger">*</span>
            </label>
            <input
              id="contact-email"
              name="email"
              type="email"
              className="form-control"
              autoComplete="email"
              required
              value={email}
              onChange={(ev) => setEmail(ev.target.value)}
              disabled={status === "submitting"}
            />
          </div>

          <div className="mb-3">
            <label htmlFor="contact-phone" className="form-label small fw-semibold">
              Утас <span className="text-muted fw-normal">(сонголттой)</span>
            </label>
            <input
              id="contact-phone"
              name="phone"
              type="tel"
              className="form-control"
              autoComplete="tel"
              maxLength={40}
              value={phone}
              onChange={(ev) => setPhone(ev.target.value)}
              disabled={status === "submitting"}
            />
          </div>

          <div className="mb-4">
            <label htmlFor="contact-message" className="form-label small fw-semibold">
              Зурвас <span className="text-danger">*</span>
            </label>
            <textarea
              id="contact-message"
              name="message"
              className="form-control"
              rows={5}
              required
              minLength={10}
              maxLength={4000}
              value={message}
              onChange={(ev) => setMessage(ev.target.value)}
              disabled={status === "submitting"}
              placeholder="Товчхон бичнэ үү…"
            />
            <div className="form-text">Хамгийн багадаа 10 тэмдэгт.</div>
          </div>

          <button type="submit" className="btn-brand w-100 py-2" disabled={status === "submitting"}>
            {status === "submitting" ? "Илгээж байна…" : "Илгээх"}
          </button>
        </form>
      )}
    </div>
  );
}
