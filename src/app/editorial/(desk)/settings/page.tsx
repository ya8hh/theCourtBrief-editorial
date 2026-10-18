import { editorialRequest } from "@/lib/editorial";
import { AiSettings } from "@/components/editorial/ai-settings";
import { notFound } from "next/navigation";
export default async function Page() {
  const user = await editorialRequest("/admin/users/me");
  if (
    !user.roles?.some((r: { code: string }) => r.code === "strapi-super-admin")
  )
    notFound();
  const settings = await editorialRequest("/editorial/ai/settings");
  return <AiSettings initial={settings} />;
}
