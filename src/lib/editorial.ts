import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
export const cms = process.env.CMS_URL || "http://127.0.0.1:1337";
export const sessionCookie = "court_editorial";
export async function editorialToken() {
  return (await cookies()).get(sessionCookie)?.value;
}
export async function editorialRequest(path: string) {
  const token = await editorialToken();
  if (!token) redirect("/editorial/login");
  const response = await fetch(cms + path, {
    headers: { Authorization: "Bearer " + token },
    cache: "no-store",
    signal: AbortSignal.timeout(15000),
  });
  if (response.status === 401) redirect("/editorial/login?expired=1");
  if (!response.ok)
    throw new Error("The editorial service could not complete this request.");
  return (await response.json()).data;
}
export function sameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  return (
    !!origin && origin === new URL(process.env.SITE_URL || request.url).origin
  );
}
