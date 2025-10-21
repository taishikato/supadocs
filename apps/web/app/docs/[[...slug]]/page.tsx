import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { MDXRemote } from "next-mdx-remote/rsc";
import { ChevronDownIcon } from "lucide-react";
import { listDocSlugs, getDocBySlug } from "@/lib/docs";
import { CopyDocButton } from "./copy-doc-button";
import { Button } from "@workspace/ui/components/button";
import { ButtonGroup } from "@workspace/ui/components/button-group";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu";
import { ClaudeAIIcon, MarkdownIcon, OpenAIIcon } from "@/components/icons";

type PageProps = {
  params: Promise<{ slug: string[] }>;
};

function normalizeSlug(input?: string[]): string[] {
  if (!input) {
    return ["index"];
  }

  const normalized = input.filter(Boolean);

  return normalized;
}

function buildChatGptHref(slug: string[]): string {
  const docUrl = resolveDocUrl(slug);
  const chatGptPrompt = `Read from this URL: ${docUrl} and explain it to me.`;
  return `https://chatgpt.com/?prompt=${encodeURIComponent(chatGptPrompt)}`;
}

function buildClaudeHref(slug: string[]): string {
  const docUrl = resolveDocUrl(slug);
  const claudePrompt = `Read from this URL: ${docUrl} and explain it to me.`;
  return `https://claude.ai/new?q=${encodeURIComponent(claudePrompt)}`;
}

function resolveDocUrl(slug: string[]): string {
  const slugPathname =
    slug.length === 1 && slug[0] === "index" ? "" : slug.join("/");

  const docPath = slugPathname ? `/docs/${slugPathname}` : "/docs";
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const normalizedSiteUrl = siteUrl.replace(/\/$/, "");

  return `${normalizedSiteUrl}${docPath}`;
}

export default async function DocPage(props: PageProps) {
  const params = await props.params;
  const slug = normalizeSlug(params.slug);

  const doc = await getDocBySlug(slug);
  if (!doc) {
    notFound();
  }

  const chatGptHref = buildChatGptHref(doc.slug);
  const claudeHref = buildClaudeHref(doc.slug);

  const downloadHref = `/api/docs/download/${doc.slug
    .map((segment) => encodeURIComponent(segment))
    .join("/")}`;

  return (
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
            <ButtonGroup>
              <CopyDocButton slug={doc.slug} />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="!pl-2">
                    <ChevronDownIcon />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="[--radius:1rem]">
                  <DropdownMenuGroup>
                    <DropdownMenuItem>
                      <MarkdownIcon className="size-4" aria-hidden="true" />
                      <a href={downloadHref} download>
                        <span>Download Markdown</span>
                      </a>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <a
                        href={chatGptHref}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <OpenAIIcon className="size-4" aria-hidden="true" />
                        <span>Open in ChatGPT</span>
                      </a>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <a
                        href={claudeHref}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <ClaudeAIIcon className="size-4" aria-hidden="true" />
                        <span>Open in Claude</span>
                      </a>
                    </DropdownMenuItem>
                  </DropdownMenuGroup>
                </DropdownMenuContent>
              </DropdownMenu>
            </ButtonGroup>
          </div>
        </header>
        <div className="prose prose-neutral dark:prose-invert">
          <MDXRemote source={doc.content} />
        </div>
      </article>
    </main>
  );
}

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
