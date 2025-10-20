import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { MDXRemote } from "next-mdx-remote/rsc";
import { Download } from "lucide-react";
import { Button } from "@workspace/ui/components/button";
import { listDocSlugs, getDocBySlug } from "@/lib/docs";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@workspace/ui/components/sidebar";
import { AppSidebar } from "@/components/app-sidebar";

type PageProps = {
  params: Promise<{ slug: string[] }>;
};

export async function generateStaticParams() {
  const slugs = await listDocSlugs();

  const params = slugs.map((slug) => ({ slug }));
  params.push({ slug: [] });

  return params;
}

export async function generateMetadata(
  props: PageProps
): Promise<Metadata | undefined> {
  const params = await props.params;
  const slug = normalizeSlug(params.slug);
  const doc = await getDocBySlug(slug);
  if (!doc) return undefined;

  return {
    title: doc.title,
    description: doc.description,
  };
}

export default async function DocPage(props: PageProps) {
  const params = await props.params;

  const slug = normalizeSlug(params.slug);

  const doc = await getDocBySlug(slug);
  if (!doc) {
    notFound();
  }

  const downloadHref = `/api/docs/download/${doc.slug
    .map((segment) => encodeURIComponent(segment))
    .join("/")}`;

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
                <div className="mt-6 flex flex-wrap items-center gap-3">
                  <Button variant="outline" size="sm" asChild>
                    <a href={downloadHref} download>
                      <Download className="size-4" aria-hidden="true" />
                      <span>Download Markdown</span>
                    </a>
                  </Button>
                </div>
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

function normalizeSlug(input?: string[]): string[] {
  if (!input) {
    return ["index"];
  }

  const normalized = input.filter(Boolean);

  return normalized;
}
