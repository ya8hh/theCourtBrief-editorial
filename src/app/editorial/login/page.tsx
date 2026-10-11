import { Login } from "@/components/editorial/login";
export const metadata = {
  title: "Editorial sign-in",
  robots: { index: false, follow: false },
};
export default function Page() {
  return (
    <section className="wrap section editor-narrow">
      <p className="kicker">THE EDITORIAL DESK</p>
      <h1>Welcome back</h1>
      <p>
        Use your Strapi editorial account. An administrator assigns reporter and
        publisher access.
      </p>
      <Login />
      <p>
        First administrator setup and account recovery are available in the{" "}
        <a
          href={
            (process.env.CMS_PUBLIC_URL || "http://localhost:1337") + "/admin"
          }
        >
          CMS administration
        </a>
        .
      </p>
    </section>
  );
}
