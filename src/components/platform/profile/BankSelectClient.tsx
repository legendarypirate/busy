"use client";

import { useEffect, useRef } from "react";
import type { MongoliaBank } from "@/lib/mongolia-banks";
import { mongoliaBankLogoUrl } from "@/lib/mongolia-banks";

type Props = {
  banks: MongoliaBank[];
  savedBankCode: string;
};

export default function BankSelectClient({ banks, savedBankCode }: Props) {
  const selRef = useRef<HTMLSelectElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    function sync() {
      const sel = selRef.current;
      const img = imgRef.current;
      if (!sel || !img) {
        return;
      }
      const opt = sel.options[sel.selectedIndex];
      const url = opt?.getAttribute("data-logo") ?? "";
      if (url) {
        img.src = url;
        img.alt = (opt?.textContent ?? "").trim();
        img.classList.add("is-visible");
      } else {
        img.removeAttribute("src");
        img.alt = "";
        img.classList.remove("is-visible");
      }
    }
    const sel = selRef.current;
    sel?.addEventListener("change", sync);
    sync();
    return () => sel?.removeEventListener("change", sync);
  }, []);

  return (
    <div className="pm-bank-select-wrap">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img ref={imgRef} alt="" className="pm-bank-logo-preview" width={44} height={44} />
      <select
        ref={selRef}
        className="pm-select"
        name="bank_code"
        id="profileBankSelect"
        autoComplete="organization"
        defaultValue={savedBankCode}
      >
        <option value="" data-logo="">
          Сонгох...
        </option>
        {banks.map((b) => (
          <option key={b.code} value={b.code} data-logo={mongoliaBankLogoUrl(b.domain)}>
            {b.nameMn}
          </option>
        ))}
      </select>
    </div>
  );
}
