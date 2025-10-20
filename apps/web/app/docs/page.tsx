import { notFound } from "next/navigation";
import { MDXRemote } from "next-mdx-remote/rsc";
import { getDocBySlug } from "@/lib/docs";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@workspace/ui/components/sidebar";
import { AppSidebar } from "@/components/app-sidebar";

export default async function DocsIndexPage() {
  const doc = await getDocBySlug(["index"]);

  if (!doc) {
    notFound();
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <div className="relative flex h-full flex-col px-4 pt-4 sm:px-6 lg:px-8">
          <SidebarTrigger />
          <main className="mt-10">
            <article className="flex h-full flex-col pb-10">
              <header className="mb-8">
                <h1 className="text-4xl font-bold">{doc.title}</h1>
                {doc.description && (
                  <p className="mt-2 text-lg text-muted-foreground">
                    {doc.description}
                  </p>
                )}
              </header>
              <div className="prose prose-neutral dark:prose-invert">
                <MDXRemote source={doc.content} />
              </div>
            </article>
          </main>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
