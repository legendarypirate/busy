import { PLATFORM_POST_TOKEN_FIELD } from "@/lib/platform-post-token-constants";

/** Hidden signed session handle for Server Action POSTs when cookies are dropped (multipart / prod). */
export default function PlatformPostTokenHidden({ token }: { token: string | null }) {
  if (!token) return null;
  return <input type="hidden" name={PLATFORM_POST_TOKEN_FIELD} value={token} />;
}
