import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { MDXRemote } from "next-mdx-remote/rsc"
import { listDocSlugs, getDocBySlug } from "@/lib/docs"

type PageParams = { slug?: string[] }

interface PageProps {
  params: Promise<PageParams>
}

export async function generateStaticParams() {
  const slugs = await listDocSlugs()
  return slugs.map((slug) => ({ slug }))
}

export async function generateMetadata(
  props: PageProps,
): Promise<Metadata | undefined> {
  const params = await props.params
  const slug = normalizeSlug(params.slug)
  const doc = slug ? await getDocBySlug(slug) : null
  if (!doc) return undefined

  return {
    title: doc.title,
    description: doc.description,
  }
}

export default async function DocPage(props: PageProps) {
  const params = await props.params
  const slug = normalizeSlug(params.slug)
  if (!slug) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-12">
        <h1 className="text-3xl font-bold">Docs</h1>
        <p className="mt-4 text-muted-foreground">
          ドキュメントを選択してください。
        </p>
      </div>
    )
  }

  const doc = await getDocBySlug(slug)
  if (!doc) {
    notFound()
  }

  return (
    <article className="mx-auto max-w-3xl px-6 py-12 prose prose-neutral dark:prose-invert">
      <header className="mb-8">
        <Link href="/" className="text-sm text-muted-foreground hover:text-foreground">
          ← トップに戻る
        </Link>
        <h1 className="mt-4 text-4xl font-bold">{doc.title}</h1>
        {doc.description ? (
          <p className="mt-2 text-lg text-muted-foreground">{doc.description}</p>
        ) : null}
      </header>
      <MDXRemote source={doc.content} />
    </article>
  )
}

function normalizeSlug(input?: string[]): string[] | null {
  if (!input || input.length === 0) {
    return null
  }
  return input.filter(Boolean)
}
