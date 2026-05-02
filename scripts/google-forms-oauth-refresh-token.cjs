#!/usr/bin/env node
/**
 * One-time: obtain GOOGLE_FORMS_OAUTH_REFRESH_TOKEN for Google Forms API import.
 *
 * Google Cloud Console (same project as OAuth client):
 *  - Enable "Google Forms API"
 *  - OAuth consent screen: add scope https://www.googleapis.com/auth/forms.body.readonly
 *  - OAuth client (Desktop or Web): Authorized redirect URIs MUST include the SAME URI this script uses
 *    (default below). Google treats localhost vs 127.0.0.1 as different — register the exact string.
 *
 * Usage:
 *   node scripts/google-forms-oauth-refresh-token.cjs /path/to/client_secret_....json
 *   node scripts/google-forms-oauth-refresh-token.cjs /path/to/client_secret_....json "http://127.0.0.1:3333/oauth2callback"
 *
 * Then set printed env vars on your server (.env not committed). GOOGLE_FORMS_OAUTH_REDIRECT_URI must match
 * the value printed here (same as used when exchanging the code).
 */

const fs = require("fs");
const http = require("http");
const path = require("path");
const { OAuth2Client } = require("google-auth-library");

const PORT = 3333;
const REDIRECT_PATH = "/oauth2callback";
/** Default: many GCP "Web" clients already allow http://localhost — add this exact URI if missing. */
const DEFAULT_REDIRECT_URI = `http://localhost:${PORT}${REDIRECT_PATH}`;

function loadClient(jsonPath) {
  const raw = fs.readFileSync(path.resolve(jsonPath), "utf8");
  const j = JSON.parse(raw);
  const b = j.installed || j.web;
  if (!b?.client_id || !b?.client_secret) {
    throw new Error('File must be Google OAuth client JSON with "installed" or "web" and client_id / client_secret');
  }
  return { clientId: b.client_id, clientSecret: b.client_secret };
}

const jsonPath = process.argv[2];
const redirectOverride = (process.argv[3] || "").trim();
if (!jsonPath) {
  console.error("Usage: node scripts/google-forms-oauth-refresh-token.cjs path/to/client_secret....json [redirect_uri]\n");
  console.error("Default redirect_uri:", DEFAULT_REDIRECT_URI);
  console.error("GCP → Credentials → OAuth 2.0 Client → Authorized redirect URIs → add that exact line.\n");
  process.exit(1);
}

const REDIRECT_URI = redirectOverride || DEFAULT_REDIRECT_URI;

const { clientId, clientSecret } = loadClient(jsonPath);
const oauth2 = new OAuth2Client(clientId, clientSecret, REDIRECT_URI);

const authUrl = oauth2.generateAuthUrl({
  access_type: "offline",
  scope: ["https://www.googleapis.com/auth/forms.body.readonly"],
  prompt: "consent",
});

const server = http.createServer(async (req, res) => {
  try {
    const u = new URL(req.url || "/", `http://localhost:${PORT}`);
    if (u.pathname !== REDIRECT_PATH) {
      res.writeHead(404);
      res.end("Not found");
      return;
    }
    const oerr = u.searchParams.get("error");
    const code = u.searchParams.get("code");
    if (oerr) {
      res.writeHead(400, { "Content-Type": "text/html; charset=utf-8" });
      res.end(`<!DOCTYPE html><html><body><pre>OAuth error: ${oerr}</pre></body></html>`);
      server.close();
      process.exit(1);
      return;
    }
    if (!code) {
      res.writeHead(400);
      res.end("missing code");
      server.close();
      process.exit(1);
      return;
    }
    const { tokens } = await oauth2.getToken(code);
    res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
    res.end(
      "<!DOCTYPE html><html><body><p>OK — check the terminal for env lines to copy.</p></body></html>",
    );
    server.close();

    console.log("\n--- Add to server environment (do not commit to git) ---\n");
    console.log(`GOOGLE_FORMS_OAUTH_CLIENT_ID=${clientId}`);
    console.log(`GOOGLE_FORMS_OAUTH_CLIENT_SECRET=${clientSecret}`);
    console.log(`GOOGLE_FORMS_OAUTH_REDIRECT_URI=${REDIRECT_URI}`);
    if (tokens.refresh_token) {
      console.log(`GOOGLE_FORMS_OAUTH_REFRESH_TOKEN=${tokens.refresh_token}`);
    } else {
      console.log("# GOOGLE_FORMS_OAUTH_REFRESH_TOKEN was not returned.");
      console.log("# Remove BUSY / Google access at https://myaccount.google.com/permissions and run this script again.");
    }
    console.log("\n# Optional: paste entire client JSON (one line) instead of ID+SECRET:");
    console.log("# GOOGLE_FORMS_OAUTH_CLIENT_JSON=<contents of the same .json file>\n");
    process.exit(0);
  } catch (e) {
    console.error(e);
    res.writeHead(500);
    res.end("error");
    server.close();
    process.exit(1);
  }
});

server.listen(PORT, () => {
  console.log("\n1) Google Cloud Console → APIs & Services → Credentials → your OAuth 2.0 Client ID");
  console.log("   Application type should be \"Web application\" (or add URI to Desktop client list).");
  console.log("   Authorized redirect URIs → Add URI → paste exactly this line (character-for-character):");
  console.log("\n     ", REDIRECT_URI, "\n");
  console.log("   If you still see redirect_uri_mismatch, also add the other loopback variant:");
  console.log("     http://127.0.0.1:3333/oauth2callback");
  console.log("   then run: node scripts/google-forms-oauth-refresh-token.cjs <json> \"http://127.0.0.1:3333/oauth2callback\"\n");
  console.log("2) Open this URL, sign in as the Google user that should access forms to import:\n\n", authUrl);
  console.log("\nWaiting for redirect on", REDIRECT_URI, "…\n");
});
