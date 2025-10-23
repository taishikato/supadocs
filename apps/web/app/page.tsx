import type { Metadata } from "next";
import Link from "next/link";
import { Header } from "./header";

const pageDescription =
  "Launch a technical documentation site with AI chat, Markdown utilities, and a ready-to-use Next.js stack.";

export const metadata: Metadata = {
  description: pageDescription,
  alternates: {
    canonical: "/",
  },
  openGraph: {
    description: pageDescription,
    url: "/",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    description: pageDescription,
  },
};

export default function Page() {
  return (
    <>
      <Header />
      <main className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
        <h1 className="text-4xl font-semibold">Hey, welcome to Supadocs!</h1>
        <div className="mt-6 text-lg sm:text-xl text-muted-foreground">
          <ul className="list-disc list-inside space-y-1">
            <li>
              To enable AI Chat, check{" "}
              <Link
                className="font-semibold text-secondary-foreground underline"
                href="https://github.com/taishikato/supadocs-starter-template/blob/main/README.md#usage"
                rel="noreferrer"
                target="_blank"
              >
                README.md
              </Link>{" "}
              for the setup guide - it's supa easy!
            </li>
            <li>
              Open{" "}
              <Link
                className="font-semibold text-secondary-foreground underline"
                href="/docs"
              >
                /docs
              </Link>{" "}
              to see the documentation.
            </li>
          </ul>
        </div>
      </main>
    </>
  );
}
