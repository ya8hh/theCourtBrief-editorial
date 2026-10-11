import { editorialRequest } from "@/lib/editorial";
import { ArticleView } from "@/components/article-view";
export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const a = await editorialRequest("/editorial/articles/" + id);
  a.publishedAt = a.publicationDate || a.updatedAt;
  a.pdfUrl = a.originalPdf?.url
    ? (a.originalPdf.url.startsWith("/")
        ? process.env.CMS_PUBLIC_URL || "http://localhost:1337"
        : "") + a.originalPdf.url
    : a.officialSourceUrl;
  return (
    <>
      <div className="preview-banner">
        PRIVATE DRAFT PREVIEW · This saved draft has not been published by
        opening this preview.
      </div>
      <ArticleView a={a} preview />
    </>
  );
}
