import { editorialRequest } from "@/lib/editorial";
import { ArticleEditor } from "@/components/editorial/workspace";
export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <ArticleEditor
      initial={await editorialRequest("/editorial/articles/" + id)}
    />
  );
}
