import { NextResponse } from "next/server";
import { z } from "zod";
import { generateEmbeddings } from "@workspace/core/embeddings";
import { getServiceSupabaseClient } from "@/lib/supabase";
import { getServerEnv } from "@/lib/env";

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
    const env = getServerEnv();
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
    const answer = await callOpenAI({
      apiKey: env.OPENAI_API_KEY,
      model: env.OPENAI_CHAT_MODEL,
      question,
      matches: sources,
    });

    return NextResponse.json({
      answer,
      sources,
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

async function callOpenAI(params: {
  apiKey: string;
  model: string;
  question: string;
  matches: MatchResult[];
}): Promise<string> {
  const { apiKey, model, question, matches } = params;
  const context = matches.length
    ? matches
      .map(
        (match, index) =>
          `Context ${index + 1} (similarity ${
            (match.similarity * 100).toFixed(1)
          }%):\nSource: ${match.doc_path}\n${match.content.trim()}`,
      )
      .join("\n\n")
    : "No relevant context was retrieved.";

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      temperature: 0.2,
      messages: [
        {
          role: "system",
          content:
            "あなたは Supadocs のドキュメントに基づいて回答する日本語のアシスタントです。提供されたコンテキスト以外の情報は推測せず、わからない場合はその旨を伝えてください。",
        },
        {
          role: "user",
          content:
            `質問: ${question}\n\nコンテキスト:\n${context}\n\n回答は日本語で、必要に応じて箇条書きで整理してください。`,
        },
      ],
    }),
  });

  if (!response.ok) {
    let detail = `${response.status} ${response.statusText}`;
    try {
      const payload = await response.json();
      detail = payload?.error?.message ?? payload?.message ?? detail;
    } catch {
      // ignore
    }
    throw new Error(`OpenAI API error: ${detail}`);
  }

  const payload = await response.json();
  const answer: string | undefined = payload?.choices?.[0]?.message?.content;
  if (!answer) {
    throw new Error("OpenAI API returned an empty response");
  }
  return answer.trim();
}
