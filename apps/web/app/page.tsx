import Link from "next/link";

import { Button } from "@workspace/ui/components/button";
import { ChatModal } from "@/components/chat-modal";

const featureHighlights = [
  {
    title: "Collector Pipeline",
    description:
      "Ingest markdown sources, normalize metadata, and stay in sync with your content repository.",
  },
  {
    title: "Context-Aware Composer",
    description:
      "Draft changelogs, FAQs, and release summaries with guardrails tailored for your team.",
  },
  {
    title: "Auditable by Design",
    description:
      "Trace every run with correlation IDs, structured events, and Supabase-backed storage.",
  },
];

const workflowSteps = [
  {
    title: "1. Capture",
    description:
      "Scan the `content/` directory, generate embeddings, and register artifacts for downstream agents.",
  },
  {
    title: "2. Compose",
    description:
      "Bundle relevant context and propose new docs or updates while observing token budgets.",
  },
  {
    title: "3. Review & Ship",
    description:
      "Validate accuracy, apply editorial rules, and publish to the live knowledge base with confidence.",
  },
];

export default function Page() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-gradient-to-b from-background via-background to-muted/30 px-6 py-32">
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 mx-auto h-64 w-full max-w-4xl rounded-full bg-gradient-to-br from-primary/10 via-primary/5 to-transparent blur-3xl" />
      <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-24">
        <section className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_420px]">
          <div className="space-y-8 text-center lg:text-left">
            <span className="inline-flex items-center justify-center rounded-full border border-border px-4 py-1 text-xs font-medium uppercase tracking-[0.3em] text-muted-foreground">
              AI-ready Documentation Template
            </span>
            <div className="space-y-4">
              <h1 className="text-balance text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
                Supadocs
              </h1>
              <p className="text-lg text-muted-foreground sm:text-xl">
                Author in Markdown and ship a RAG-ready documentation site with
                agent automation and chat on day one.
              </p>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-4 lg:justify-start">
              <Button asChild size="lg">
                <Link href="/docs">View Documentation</Link>
              </Button>
              <ChatModal initialChatModel="gpt-4o-mini-2024-07-18" />
            </div>
          </div>
          <div className="rounded-3xl border border-border/70 bg-card/80 p-8 shadow-lg backdrop-blur">
            <div className="space-y-4">
              <h2 className="text-lg font-semibold">Bring your docs to life</h2>
              <p className="text-sm text-muted-foreground">
                Trigger agents from your dashboard, watch their progress in
                real-time timelines, and capture every artifact inside Supabase.
              </p>
              <div className="grid gap-3 text-sm">
                <div className="rounded-xl border border-border/70 bg-background/80 p-4">
                  <p className="font-medium text-primary">Always-on auditing</p>
                  <p className="text-muted-foreground">
                    Every run emits structured events with correlation IDs for
                    confident review.
                  </p>
                </div>
                <div className="rounded-xl border border-border/70 bg-background/80 p-4">
                  <p className="font-medium text-primary">Composable tooling</p>
                  <p className="text-muted-foreground">
                    Swap providers, add validators, and extend collectors
                    without touching the UI.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="space-y-8">
          <div className="space-y-3 text-center lg:text-left">
            <h2 className="text-2xl font-semibold sm:text-3xl">
              Built for high-trust documentation workflows
            </h2>
            <p className="text-muted-foreground sm:text-lg">
              Automate your release notes, knowledge base updates, and internal
              comms while keeping humans in the loop.
            </p>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {featureHighlights.map((feature) => (
              <div
                key={feature.title}
                className="rounded-2xl border border-border/60 bg-background/70 p-6 shadow-sm transition hover:-translate-y-1 hover:border-primary/60 hover:shadow-lg"
              >
                <h3 className="text-lg font-semibold">{feature.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="grid gap-6 rounded-3xl border border-border/60 bg-muted/40 px-8 py-10 sm:px-10 lg:grid-cols-[320px_minmax(0,1fr)] lg:items-center">
          <div className="space-y-2 text-center lg:text-left">
            <h2 className="text-2xl font-semibold">Agent-driven lifecycle</h2>
            <p className="text-sm text-muted-foreground">
              Keep the Collector, Composer, and Reviewer agents aligned on the
              same source of truth.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            {workflowSteps.map((step) => (
              <div
                key={step.title}
                className="space-y-2 rounded-2xl border border-border/60 bg-background/80 p-5 text-left shadow-sm"
              >
                <p className="text-sm font-semibold text-primary">
                  {step.title}
                </p>
                <p className="text-xs text-muted-foreground">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-3xl border border-primary/40 bg-primary/10 p-10 text-center shadow-lg sm:p-12">
          <h2 className="text-2xl font-semibold sm:text-3xl">
            Ready to automate your docs pipeline?
          </h2>
          <p className="mt-3 text-base text-muted-foreground sm:text-lg">
            Launch Supadocs, invite your team, and start tracking every agent
            run in a single timeline.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-4">
            <Button asChild size="lg" variant="secondary">
              <Link href="/docs/getting-started">Get Started</Link>
            </Button>
            <Button asChild size="lg" variant="ghost">
              <Link href="/docs/agents">Explore Agents</Link>
            </Button>
          </div>
        </section>
      </div>
    </main>
  );
}
