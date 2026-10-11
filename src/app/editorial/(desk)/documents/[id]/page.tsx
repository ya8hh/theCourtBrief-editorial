import { editorialRequest } from "@/lib/editorial";
import { SourceWorkspace } from "@/components/editorial/workspace";
export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const s = await editorialRequest("/editorial/documents/" + id);
  if (s.originalPdf?.url?.startsWith("/"))
    s.originalPdf.url =
      (process.env.CMS_PUBLIC_URL || "http://localhost:1337") +
      s.originalPdf.url;
  return <SourceWorkspace initial={s} />;
}
