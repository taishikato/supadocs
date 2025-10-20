import Link from "next/link";
import { listDocSlugs, getDocBySlug } from "@/lib/docs";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@workspace/ui/components/sidebar";
import { AppSidebar } from "@/components/app-sidebar";

export default async function DocsIndexPage() {
  const slugs = await listDocSlugs();
  const docs = await Promise.all(
    slugs.map(async (slug) => {
      const doc = await getDocBySlug(slug);
      return doc;
    })
  );

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <SidebarTrigger className="m-2" />
        <div className="mx-auto max-w-3xl px-6 py-12">
          <h1 className="text-3xl font-bold">Documentation</h1>
          <p className="mt-4 text-muted-foreground">
            Browse the latest Supadocs documentation.
          </p>

          <ul className="mt-8 space-y-6">
            {docs
              .filter((doc) => doc !== null)
              .map((doc) => (
                <li key={doc!.slug.join("/")}>
                  <Link
                    href={`/docs/${doc!.slug.join("/")}`}
                    className="group block rounded-lg border border-border p-4 transition hover:border-primary"
                  >
                    <h2 className="text-xl font-semibold group-hover:text-primary">
                      {doc!.title}
                    </h2>
                    {doc!.description ? (
                      <p className="mt-2 text-muted-foreground">
                        {doc!.description}
                      </p>
                    ) : null}
                  </Link>
                </li>
              ))}
          </ul>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
