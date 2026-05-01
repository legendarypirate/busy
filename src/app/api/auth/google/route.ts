import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { getPublicAppOrigin } from "@/lib/auth-public-origin";

const STATE_COOKIE = "bni_google_oauth_state";
const NEXT_COOKIE = "bni_google_oauth_next";

function safeNextPath(raw: string | null): string {
  if (!raw || typeof raw !== "string") return "/";
  const t = raw.trim();
  if (!t.startsWith("/") || t.startsWith("//")) return "/";
  return t.slice(0, 512);
}

export async function GET(request: NextRequest) {
  const clientId = process.env.GOOGLE_CLIENT_ID?.trim();
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET?.trim();
  if (!clientId || !clientSecret) {
    return NextResponse.redirect(new URL("/auth/login?error=google_config", request.url));
  }

  const origin = getPublicAppOrigin(request);
  const redirectUri = `${origin}/api/auth/google/callback`;

  const state = crypto.randomBytes(16).toString("hex");
  const next = safeNextPath(request.nextUrl.searchParams.get("next"));

  const res = NextResponse.redirect(
    `https://accounts.google.com/o/oauth2/v2/auth?${new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: "code",
      scope: "openid email profile",
      state,
      access_type: "online",
      prompt: "select_account",
    }).toString()}`
  );

  const secure = process.env.NODE_ENV === "production";
  res.cookies.set(STATE_COOKIE, state, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 600,
    secure,
  });
  if (next !== "/") {
    res.cookies.set(NEXT_COOKIE, next, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 600,
      secure,
    });
  } else {
    res.cookies.set(NEXT_COOKIE, "", { path: "/", maxAge: 0 });
  }

  return res;
}
