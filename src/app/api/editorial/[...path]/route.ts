import { NextResponse } from "next/server";
import {
  cms,
  editorialToken,
  sameOrigin,
  sessionCookie,
} from "@/lib/editorial";
type Context = { params: Promise<{ path: string[] }> };
async function proxy(request: Request, context: Context) {
  const token = await editorialToken();
  if (!token)
    return NextResponse.json(
      { error: "Sign in to continue." },
      { status: 401 },
    );
  if (request.method !== "GET" && !sameOrigin(request))
    return NextResponse.json(
      { error: "Invalid request origin." },
      { status: 403 },
    );
  const { path } = await context.params;
  const route = path.join("/");
  if (
    !/^(?:config|overview|documents(?:\/[a-z0-9]+(?:\/(?:review|jobs))?)?|articles(?:\/[a-z0-9]+(?:\/action)?)?|jobs\/[a-f0-9-]+\/(?:retry|apply)|upload|logout)$/.test(
      route,
    )
  )
    return NextResponse.json({ error: "Unknown route." }, { status: 404 });
  const endpoint =
    route === "upload"
      ? "/upload"
      : route === "logout"
        ? "/admin/logout"
        : "/editorial/" + route;
  const headers: Record<string, string> = { Authorization: "Bearer " + token };
  try {
    let body: BodyInit | undefined;
    if (request.method !== "GET") {
      if (route === "upload") {
        const configResponse = await fetch(cms + "/editorial/config", {
          headers: { Authorization: "Bearer " + token },
          cache: "no-store",
          signal: AbortSignal.timeout(15000),
        });
        if (!configResponse.ok) {
          const expired = configResponse.status === 401;
          const out = NextResponse.json(
            {
              error: expired
                ? "Your session has expired. Sign in again to upload your PDF."
                : configResponse.status === 403
                  ? "Your account does not have editorial upload access. Ask an administrator to assign an editorial role."
                  : "The upload service could not check permissions. Please try again.",
            },
            {
              status: configResponse.status,
              headers: { "Cache-Control": "no-store" },
            },
          );
          if (expired)
            out.cookies.set(sessionCookie, "", {
              httpOnly: true,
              path: "/",
              maxAge: 0,
            });
          return out;
        }
        const maxBytes = Number(
          (await configResponse.json()).data.maxUploadBytes,
        );
        if (
          Number(request.headers.get("content-length")) >
          maxBytes + 1024 * 1024
        )
          return NextResponse.json(
            { error: "The upload exceeds the configured size limit." },
            { status: 413 },
          );
        const form = await request.formData(),
          file = form.get("files");
        if (
          !(file instanceof File) ||
          file.size > maxBytes ||
          file.type !== "application/pdf"
        )
          return NextResponse.json(
            { error: "Select one PDF within the configured size limit." },
            { status: 400 },
          );
        const safe = new FormData();
        safe.set("files", file);
        body = safe;
      } else {
        headers["Content-Type"] = "application/json";
        body = await request.text();
        if (body.length > 1000000)
          return NextResponse.json(
            { error: "Request too large." },
            { status: 413 },
          );
      }
    }
    const response = await fetch(cms + endpoint, {
      method: request.method,
      headers,
      body,
      cache: "no-store",
      signal: AbortSignal.timeout(60000),
    });
    const result = await response.json();
    const out = NextResponse.json(result, {
      status: response.status,
      headers: {
        "Cache-Control": "no-store",
        "X-Request-Id":
          response.headers.get("X-Request-Id") || crypto.randomUUID(),
      },
    });
    if (route === "logout" || response.status === 401)
      out.cookies.set(sessionCookie, "", {
        httpOnly: true,
        path: "/",
        maxAge: 0,
      });
    return out;
  } catch {
    return NextResponse.json(
      { error: "The editorial service is unavailable." },
      { status: 503 },
    );
  }
}
export { proxy as GET, proxy as POST, proxy as PUT };
