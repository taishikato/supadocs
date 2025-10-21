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

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

export async function POST(req: Request) {
  const { messages }: { messages: UIMessage[] } = await req.json();

  const result = streamText({
    model: openai("gpt-4o-mini"),
    system:
      `You are a helpful assistant. Check your knowledge base before answering any questions.
    Only respond to questions using information from tool calls.
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

          return matches;
        },
      }),
    },
  });

  return result.toUIMessageStreamResponse();
}
