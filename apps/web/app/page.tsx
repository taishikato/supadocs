import Link from "next/link"
import { Button } from "@workspace/ui/components/button"

export default function Page() {
  return (
    <main className="flex min-h-svh flex-col items-center justify-center px-6 py-24 text-center">
      <div className="mx-auto max-w-2xl space-y-6">
        <span className="rounded-full border border-border px-3 py-1 text-xs uppercase tracking-widest text-muted-foreground">
          AI-ready Documentation Template
        </span>
        <h1 className="text-4xl font-bold sm:text-5xl">Supadocs</h1>
        <p className="text-lg text-muted-foreground">
          Author in Markdown and ship a RAG-ready documentation site with chat on day one.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Button asChild>
            <Link href="/docs">View Documentation</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/chat">Try the Chat</Link>
          </Button>
        </div>
      </div>
    </main>
  )
}
