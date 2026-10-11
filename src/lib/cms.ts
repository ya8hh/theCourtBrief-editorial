export function publicPdfUrl(slug: string) {
  return `/judgments/${encodeURIComponent(slug)}/pdf`;
}
export function siteUrl(path = "") {
  return `${(process.env.PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/$/, "")}${path}`;
}
