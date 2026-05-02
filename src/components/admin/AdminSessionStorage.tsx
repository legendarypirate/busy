"use client";

import { useEffect } from "react";

const STORAGE_ACCOUNT_ID = "busy_admin_platform_account_id";

/**
 * Mirrors the signed-in platform account id into `localStorage` so client-only flows
 * can read it; **server auth still uses httpOnly cookies only** — this does not replace them.
 */
export default function AdminSessionStorage({ accountIdStr }: { accountIdStr: string }) {
  useEffect(() => {
    try {
      if (accountIdStr) localStorage.setItem(STORAGE_ACCOUNT_ID, accountIdStr);
    } catch {
      /* private mode / quota */
    }
  }, [accountIdStr]);
  return null;
}
