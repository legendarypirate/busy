import { NextRequest, NextResponse } from "next/server";
import { getPublicAppOrigin } from "@/lib/auth-public-origin";
import { ensureOrganizerRoleForEligibleAccount } from "@/lib/busy-rbac";
import { upsertPlatformAccountFromGoogle } from "@/lib/platform-google-upsert";
import { defaultPostLoginPath } from "@/lib/platform-session";
import { attachPlatformSessionToResponse, googleOAuthCookieBase } from "@/lib/platform-session-cookies";

const STATE_COOKIE = "bni_google_oauth_state";
const NEXT_COOKIE = "bni_google_oauth_next";

function safeNextPath(raw: string | null | undefined): string {
  if (!raw || typeof raw !== "string") return "/";
  const t = raw.trim();
  if (!t.startsWith("/") || t.startsWith("//")) return "/";
  return t.slice(0, 512);
}

function clearOAuthCookies(res: NextResponse) {
  res.cookies.set(STATE_COOKIE, "", { ...googleOAuthCookieBase, httpOnly: true, maxAge: 0 });
  res.cookies.set(NEXT_COOKIE, "", { ...googleOAuthCookieBase, httpOnly: true, maxAge: 0 });
}

/** Redirect to login with error; keep `next` from OAuth cookie so user can retry Google sign-in. */
function redirectLoginOAuthError(request: NextRequest, error: string, detail?: string) {
  const url = new URL("/auth/login", request.url);
  url.searchParams.set("error", error);
  const preserved = safeNextPath(request.cookies.get(NEXT_COOKIE)?.value);
  if (preserved !== "/") url.searchParams.set("next", preserved);
  if (detail) url.searchParams.set("detail", detail);
  const res = NextResponse.redirect(url);
  clearOAuthCookies(res);
  return res;
}

function isDbConfigError(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err);
  return (
    msg.includes("DATABASE_URL") ||
    msg.includes("Environment variable not found") ||
    msg.includes("Can't reach database server") ||
    msg.includes("P1001") ||
    msg.includes("P1013")
  );
}

async function exchangeCode(code: string, redirectUri: string): Promise<string> {
  const clientId = process.env.GOOGLE_CLIENT_ID?.trim();
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET?.trim();
  if (!clientId || !clientSecret) {
    throw new Error("missing_google_env");
  }
  const body = new URLSearchParams({
    code,
    client_id: clientId,
    client_secret: clientSecret,
    redirect_uri: redirectUri,
    grant_type: "authorization_code",
  });
  const r = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  const data = (await r.json()) as { access_token?: string; error?: string; error_description?: string };
  if (!r.ok || !data.access_token) {
    const msg = data.error_description || data.error || "token_failed";
    throw new Error(msg);
  }
  return data.access_token;
}

async function fetchGoogleUserInfo(accessToken: string): Promise<{
  id: string;
  email?: string;
  name?: string;
  picture?: string;
}> {
  const r = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const p = (await r.json()) as { id?: string; email?: string; name?: string; picture?: string };
  if (!r.ok || !p.id) {
    throw new Error("profile_failed");
  }
  return { id: String(p.id), email: p.email, name: p.name, picture: p.picture };
}

export async function GET(request: NextRequest) {
  const savedState = request.cookies.get(STATE_COOKIE)?.value;
  const state = request.nextUrl.searchParams.get("state");

  if (!savedState || !state || savedState !== state) {
    return redirectLoginOAuthError(request, "google_state");
  }

  const oauthErr = request.nextUrl.searchParams.get("error");
  if (oauthErr) {
    return redirectLoginOAuthError(request, "google_denied", oauthErr);
  }

  const code = request.nextUrl.searchParams.get("code");
  if (!code) {
    return redirectLoginOAuthError(request, "google_code");
  }

  const origin = getPublicAppOrigin(request);
  const redirectUri = `${origin}/api/auth/google/callback`;
  const cookieNext = request.cookies.get(NEXT_COOKIE)?.value;
  const nextPath = safeNextPath(cookieNext);

  let accessToken: string;
  try {
    accessToken = await exchangeCode(code, redirectUri);
  } catch {
    return redirectLoginOAuthError(request, "google_token");
  }

  let profile: { id: string; email?: string; name?: string; picture?: string };
  try {
    profile = await fetchGoogleUserInfo(accessToken);
  } catch {
    return redirectLoginOAuthError(request, "google_profile");
  }

  const email = (profile.email ?? "").trim().toLowerCase();
  if (!email) {
    return redirectLoginOAuthError(request, "google_email");
  }

  if (!process.env.DATABASE_URL?.trim()) {
    return redirectLoginOAuthError(request, "google_env_db");
  }

  let account;
  try {
    account = await upsertPlatformAccountFromGoogle({
      googleSub: profile.id,
      email,
      name: profile.name ?? "",
      picture: profile.picture ?? "",
    });
  } catch (err) {
    return redirectLoginOAuthError(request, isDbConfigError(err) ? "google_env_db" : "google_db");
  }

  if (!account) {
    return redirectLoginOAuthError(request, "google_db");
  }

  const display =
    account.profile?.displayName && account.profile.displayName.trim() !== ""
      ? account.profile.displayName.trim()
      : account.email;

  const dest = new URL(defaultPostLoginPath(nextPath), origin);
  const res = NextResponse.redirect(dest);
  clearOAuthCookies(res);
  attachPlatformSessionToResponse(res, account.id, display);
  await ensureOrganizerRoleForEligibleAccount(account.id);
  return res;
}
