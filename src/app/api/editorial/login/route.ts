import { NextResponse } from "next/server";
import { cms, sameOrigin, sessionCookie } from "@/lib/editorial";
export async function POST(request: Request) {
  if (!sameOrigin(request))
    return NextResponse.json(
      { error: "Invalid request origin." },
      { status: 403 },
    );
  const body = await request.json().catch(() => null);
  if (
    !body ||
    typeof body.email !== "string" ||
    typeof body.password !== "string"
  )
    return NextResponse.json(
      { error: "Email and password are required." },
      { status: 400 },
    );
  try {
    const response = await fetch(cms + "/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: body.email.trim(),
        password: body.password,
        rememberMe: false,
      }),
      signal: AbortSignal.timeout(15000),
    });
    const result = await response.json();
    if (response.status === 429)
      return NextResponse.json(
        {
          error:
            "Too many sign-in attempts. Wait 5 minutes before trying again.",
          retryAfter: 300,
        },
        { status: 429, headers: { "Retry-After": "300" } },
      );
    if (!response.ok || !result.data?.token)
      return NextResponse.json(
        {
          error:
            "Sign-in failed. Use the email and password for your Strapi administrator account.",
        },
        { status: response.status >= 500 ? 503 : 401 },
      );
    // Never retain a login cookie beyond the actual CMS access-token expiry.
    const claims = JSON.parse(
      Buffer.from(result.data.token.split(".")[1], "base64url").toString(),
    );
    const lifetime = Math.max(
      0,
      Math.min(28800, Math.floor(claims.exp - Date.now() / 1000)),
    );
    const out = NextResponse.json({ ok: true });
    out.cookies.set(sessionCookie, result.data.token, {
      httpOnly: true,
      sameSite: "strict",
      secure:
        process.env.NODE_ENV === "production" &&
        new URL(process.env.SITE_URL || request.url).protocol === "https:",
      path: "/",
      maxAge: lifetime,
    });
    return out;
  } catch {
    return NextResponse.json(
      { error: "The authentication service is unavailable." },
      { status: 503 },
    );
  }
}
