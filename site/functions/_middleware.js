/**
 * Cloudflare Pages Middleware — HMAC Cookie Auth
 *
 * Protects all routes except login page, API routes, and static assets.
 * Token validation uses HMAC-SHA256 with TOKEN_SECRET environment variable.
 */

function isProtected(pathname) {
  if (pathname === "/login.html" || pathname === "/login" || pathname.startsWith("/api/")) return false;
  if (pathname.startsWith("/assets/")) return false;
  if (pathname.startsWith("/dashboards/")) return false;
  if (pathname === "/favicon.ico" || pathname === "/dashboard-light-mode-overrides.css") return false;
  if (pathname.endsWith(".json") || pathname.endsWith(".md")) return false;
  return true;
}

async function verifyAuth(cookie, env) {
  if (!cookie) return false;
  const parts = cookie.split("|");
  if (parts.length !== 3) return false;
  const [status, expires, signature] = parts;
  if (status !== "ok") return false;
  if (Date.now() > parseInt(expires, 10)) return false;
  const key = await crypto.subtle.importKey(
    "raw", new TextEncoder().encode(env.TOKEN_SECRET),
    { name: "HMAC", hash: "SHA-256" }, false, ["sign"]
  );
  const data = new TextEncoder().encode(status + "|" + expires);
  const sig = await crypto.subtle.sign("HMAC", key, data);
  const hex = [...new Uint8Array(sig)].map(b => b.toString(16).padStart(2, "0")).join("");
  return hex === signature;
}

function getCookie(request, name) {
  const cookies = request.headers.get("Cookie") || "";
  const match = cookies.match(new RegExp(name + "=([^;]+)"));
  return match ? match[1] : null;
}

export async function onRequest(context) {
  const { request, env, next } = context;
  const url = new URL(request.url);
  if (!isProtected(url.pathname)) return next();
  const cookie = getCookie(request, "mvp_auth");
  const authed = await verifyAuth(cookie, env);
  if (!authed) return Response.redirect(new URL("/login.html", request.url).toString(), 302);
  return next();
}
