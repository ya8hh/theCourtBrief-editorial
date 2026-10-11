import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = {
  title: "The Court Brief · Editorial",
  robots: { index: false, follow: false },
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <header className="wrap masthead">
          <span className="brand">
            The Court Brief <small>Editorial workspace</small>
          </span>
        </header>
        <main id="main">{children}</main>
      </body>
    </html>
  );
}
