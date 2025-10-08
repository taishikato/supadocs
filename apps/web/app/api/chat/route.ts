import { NextResponse } from "next/server";
import { z } from "zod";
import { streamText } from "ai";
import { generateEmbeddings } from "@workspace/core/embeddings";
import { getServiceSupabaseClient } from "@/lib/supabase";
import { getChatModel } from "@/lib/ai";

const requestSchema = z.object({
  question: z.string().min(1, "質問を入力してください"),
  topK: z.number().int().positive().max(10).optional(),
});

type MatchResult = {
  doc_path: string;
  content: string;
  similarity: number;
};

const DEFAULT_TOP_K = 5;
const SIMILARITY_THRESHOLD = 0.7;

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = requestSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { question, topK } = parsed.data;

  try {
    const embeddingResult = await generateEmbeddings({ input: question });
    const embedding = embeddingResult.embeddings[0];
    const supabase = getServiceSupabaseClient();

    const { data, error } = await supabase.rpc(
      "match_document_chunks",
      {
        query_embedding: embedding,
        match_count: topK ?? DEFAULT_TOP_K,
        similarity_threshold: SIMILARITY_THRESHOLD,
      } satisfies Record<string, unknown>,
    );

    if (error) {
      console.error("match_document_chunks error", error);
      throw new Error(error.message);
    }

    const sources = ((data ?? []) as MatchResult[]).filter(Boolean);
    const context = sources.length
      ? sources
        .map(
          (match, index) =>
            `Context ${index + 1} (similarity ${
              (match.similarity * 100).toFixed(1)
            }%):\nSource: ${match.doc_path}\n${match.content.trim()}`,
        )
        .join("\n\n")
      : "No relevant context was retrieved.";

    const prompt =
      `質問: ${question}\n\nコンテキスト:\n${context}\n\n回答は日本語で、必要に応じて箇条書きで整理してください。`;

    const chatModel = getChatModel();
    const result = await streamText({
      model: chatModel,
      system:
        "あなたは Supadocs のドキュメントに基づいて回答する日本語のアシスタントです。提供されたコンテキスト以外の情報は推測せず、わからない場合はその旨を伝えてください。",
      prompt,
      temperature: 0.2,
    });

    const encoder = new TextEncoder();

    const stream = new ReadableStream<Uint8Array>({
      async start(controller) {
        controller.enqueue(
          encoder.encode(
            `event: sources\ndata: ${JSON.stringify(sources)}\n\n`,
          ),
        );

        try {
          for await (const chunk of result.textStream) {
            controller.enqueue(
              encoder.encode(
                `event: text\ndata: ${JSON.stringify({ delta: chunk })}\n\n`,
              ),
            );
          }
          controller.enqueue(encoder.encode(`event: end\ndata: {}\n\n`));
        } catch (streamError) {
          console.error("/api/chat stream error", streamError);
          controller.enqueue(
            encoder.encode(
              `event: error\ndata: ${
                JSON.stringify({ message: "Stream error" })
              }\n\n`,
            ),
          );
        } finally {
          controller.close();
          await result.consumeStream().catch(() => undefined);
        }
      },
      async cancel() {
        await result.consumeStream().catch(() => undefined);
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    console.error("/api/chat failure", error);
    return NextResponse.json(
      {
        error: "Failed to generate answer",
        message: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}
