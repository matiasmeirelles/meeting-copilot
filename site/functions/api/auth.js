/**
 * Cloudflare Pages Function — Token Auth API (Canonical)
 *
 * POST /api/auth — validates token against TOKEN_SECRET,
 * sets HMAC-signed cookie on success.
 *
 * CANONICAL: This file is the single source of truth for WPP auth API.
 * Deployed to all sites via the platform shell (ADR-253).
 * Do NOT modify per-site copies — update this file and redeploy.
 */

export async function onRequestPost(context) {
  const { request, env } = context;
  try {
    const { token } = await request.json();
    if (!token || token !== env.TOKEN_SECRET) {
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401, headers: { "Content-Type": "application/json" }
      });
    }
    const expires = Date.now() + 24 * 60 * 60 * 1000;
    const key = await crypto.subtle.importKey(
      "raw", new TextEncoder().encode(env.TOKEN_SECRET),
      { name: "HMAC", hash: "SHA-256" }, false, ["sign"]
    );
    const data = new TextEncoder().encode("ok|" + expires);
    const sig = await crypto.subtle.sign("HMAC", key, data);
    const hex = [...new Uint8Array(sig)].map(b => b.toString(16).padStart(2, "0")).join("");
    const cookie = "mvp_auth=ok|" + expires + "|" + hex + "; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=86400";
    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { "Content-Type": "application/json", "Set-Cookie": cookie }
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: "Bad request" }), {
      status: 400, headers: { "Content-Type": "application/json" }
    });
  }
}
