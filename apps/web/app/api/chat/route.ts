import { openai } from "@ai-sdk/openai";
import {
  convertToModelMessages,
  stepCountIs,
  streamText,
  tool,
  UIMessage,
} from "ai";
import { z } from "zod";
import {
  findRelevantContent,
  type RelevantContent,
} from "@workspace/core/embeddings";

type Citation = {
  id: string;
  title: string;
  href?: string;
};

type KnowledgeBaseToolResult = {
  context: string;
  citations: Citation[];
};

const stripDocsPrefix = (docPath: string): string =>
  docPath
    .replace(/\\/g, "/")
    .replace(/^(?:apps\/web\/)?content\/docs\//, "");

const deriveTitleFromDocPath = (docPath: string): string => {
  const withoutPrefix = stripDocsPrefix(docPath);
  const withoutExt = withoutPrefix.replace(/\.(md|mdx)$/i, "");
  const segments = withoutExt.split("/");
  const lastSegment = segments.at(-1);

  if (!lastSegment) {
    return withoutExt || docPath;
  }

  return lastSegment.replace(/[-_]/g, " ");
};

const readMetadataString = (
  metadata: Record<string, unknown> | null,
  key: string,
): string | undefined => {
  if (!metadata) return undefined;
  const value = metadata[key];
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
};

const deriveHrefFromMetadata = (
  metadata: Record<string, unknown> | null,
  fallbackHref: string,
): string => {
  const candidateKeys = ["url", "doc_url", "source_url"];
  for (const key of candidateKeys) {
    const value = readMetadataString(metadata, key);
    if (value) {
      return value;
    }
  }

  return fallbackHref;
};

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

export async function POST(req: Request) {
  const { messages }: { messages: UIMessage[] } = await req.json();

  let latestCitations: Citation[] = [];
  const createdAt = new Date().toISOString();

  const result = streamText({
    model: openai("gpt-4o-mini"),
    system:
      `You are a helpful assistant. Check your knowledge base before answering any questions.
    Only respond to questions using information from tool calls.
    Cite every factual statement by inserting a bracketed reference like [n] that matches the tool results provided.
    After the main answer, output a "Sources:" section that lists each citation id with its title and URL.
    If no relevant information is found in the tool calls, respond, "Sorry, I don't know."`,
    messages: convertToModelMessages(messages),
    stopWhen: stepCountIs(5),
    tools: {
      getInformation: tool({
        description:
          `get information from your knowledge base to answer questions.`,
        inputSchema: z.object({
          question: z.string().describe("the users question"),
        }),
        execute: async ({ question }): Promise<KnowledgeBaseToolResult> => {
          const matches: RelevantContent[] = await findRelevantContent(
            question,
          );

          const citations = matches.map((match, idx) => {
            const id = `${idx + 1}`;
            const titleFromMetadata = readMetadataString(
              match.metadata,
              "title",
            );
            const title = titleFromMetadata ??
              deriveTitleFromDocPath(match.docPath);

            const href = deriveHrefFromMetadata(
              match.metadata,
              match.docUrl,
            );

            return { id, title, href } satisfies Citation;
          });

          latestCitations = citations;

          const context = matches
            .map((match, idx) => `[${idx + 1}] ${match.content}`)
            .join("\n\n");

          return { context, citations };
        },
      }),
    },
  });

  return result.toUIMessageStreamResponse({
    messageMetadata: () => {
      if (latestCitations.length === 0) {
        return { createdAt };
      }

      return {
        createdAt,
        citations: latestCitations,
      };
    },
  });
}
