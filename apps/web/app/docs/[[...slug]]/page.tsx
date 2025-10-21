import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { MDXRemote } from "next-mdx-remote/rsc";
import {
  ChevronDownIcon,
  AlertTriangleIcon,
  CheckIcon,
  Download,
  UserRoundXIcon,
  ShareIcon,
  CopyIcon,
  TrashIcon,
} from "lucide-react";
import { listDocSlugs, getDocBySlug } from "@/lib/docs";
import { CopyDocButton } from "./copy-doc-button";
import { Button } from "@workspace/ui/components/button";
import { ButtonGroup } from "@workspace/ui/components/button-group";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu";

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
                      <Download className="size-4" aria-hidden="true" />
                      <a href={downloadHref} download>
                        <span>Download Markdown</span>
                      </a>
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <CheckIcon />
                      Mark as Read
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <AlertTriangleIcon />
                      Report Conversation
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <UserRoundXIcon />
                      Block User
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <ShareIcon />
                      Share Conversation
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <CopyIcon />
                      Copy Conversation
                    </DropdownMenuItem>
                  </DropdownMenuGroup>
                  <DropdownMenuSeparator />
                  <DropdownMenuGroup>
                    <DropdownMenuItem variant="destructive">
                      <TrashIcon />
                      Delete Conversation
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
