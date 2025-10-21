import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { embed, embedMany } from "ai";
import { openai } from "@ai-sdk/openai";

const embeddingModel = openai.embedding("text-embedding-3-small");

export type RelevantContent = {
  id: string;
  docPath: string;
  docUrl: string;
  chunkIndex: number;
  content: string;
  contentHash: string;
  metadata: Record<string, unknown> | null;
  similarity: number;
  updatedAt: string;
};

let cachedSupabaseClient: SupabaseClient | null = null;

const getSupabaseClient = () => {
  if (cachedSupabaseClient) return cachedSupabaseClient;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SERVICE_ROLE_KEY ??
    process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL must be set to query embeddings");
  }

  if (!serviceRoleKey) {
    throw new Error(
      "SERVICE_ROLE_KEY (or NEXT_PUBLIC_SUPABASE_ANON_KEY) must be set to query embeddings",
    );
  }

  // @ts-ignore
  cachedSupabaseClient = createClient(url, serviceRoleKey, {
    db: { schema: "docs" },
  });

  return cachedSupabaseClient;
};

const generateChunks = (input: string): string[] => {
  return input
    .trim()
    .split(".")
    .filter((i) => i !== "");
};

export const generateEmbeddings = async (
  value: string,
): Promise<Array<{ embedding: number[]; content: string }>> => {
  const chunks = generateChunks(value);
  const { embeddings } = await embedMany({
    model: embeddingModel,
    values: chunks,
  });

  // @ts-ignore
  return embeddings.map((e, i) => ({ content: chunks[i], embedding: e }));
};

export const generateEmbedding = async (value: string): Promise<number[]> => {
  const input = value.replaceAll("\\n", " ");
  const { embedding } = await embed({
    model: embeddingModel,
    value: input,
  });

  return embedding;
};

export const findRelevantContent = async (
  userQuery: string,
): Promise<RelevantContent[]> => {
  const supabase = getSupabaseClient();
  const queryEmbedding = await generateEmbedding(userQuery);

  const { data: pageSections, error } = await supabase.rpc<
    MatchDocumentChunk[]
  >(
    "match_page_sections",
    {
      embedding: queryEmbedding,
      match_threshold: 0.7,
      match_count: 10,
      min_content_length: 50,
    },
  );

  if (error) {
    throw new Error(`Failed to retrieve relevant content: ${error.message}`);
  }

  return pageSections;
};
