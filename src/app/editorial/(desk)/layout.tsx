import Link from "next/link";
import { editorialRequest } from "@/lib/editorial";
import { Logout } from "@/components/editorial/workspace";
export const metadata = { robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";
export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await editorialRequest("/admin/users/me");
  return (
    <section className="wrap section editorial">
      <nav className="desk-nav">
        <Link href="/editorial">Newsroom</Link>
        <Link href="/editorial/upload">Upload PDF</Link>
        <Link href="/editorial/new">Write article</Link>
        {user.roles?.some(
          (r: { code: string }) => r.code === "strapi-super-admin",
        ) && <Link href="/editorial/settings">AI providers</Link>}
        <a
          href={
            (process.env.CMS_PUBLIC_URL || "http://localhost:1337") + "/admin"
          }
        >
          Users & CMS
        </a>
        <span>
          {user.firstname} {user.lastname}
        </span>
        <Logout />
      </nav>
      {children}
    </section>
  );
}
