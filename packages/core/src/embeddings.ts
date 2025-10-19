import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { embed, embedMany } from "ai";
import { openai } from "@ai-sdk/openai";

const embeddingModel = openai.embedding("text-embedding-3-small");

type MatchDocumentChunk = {
  id: string;
  doc_path: string;
  chunk_index: number;
  content: string;
  content_hash: string;
  metadata: Record<string, unknown> | null;
  updated_at: string;
  similarity: number;
};

type MatchDocumentChunksArgs = {
  query_embedding: number[];
  match_count?: number;
  similarity_threshold?: number;
};

let cachedSupabaseClient: SupabaseClient | null = null;

const getSupabaseClient = (): SupabaseClient => {
  if (cachedSupabaseClient) return cachedSupabaseClient;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SERVICE_ROLE_KEY ??
    process.env.SUPABASE_SERVICE_ROLE_KEY;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL must be set to query embeddings");
  }

  const apiKey = serviceRoleKey ?? anonKey;
  if (!apiKey) {
    throw new Error(
      "SERVICE_ROLE_KEY (or NEXT_PUBLIC_SUPABASE_ANON_KEY) must be set to query embeddings",
    );
  }

  cachedSupabaseClient = createClient(url, apiKey, {
    auth: { persistSession: false },
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

export const findRelevantContent = async (userQuery: string) => {
  const supabase = getSupabaseClient();
  const queryEmbedding = await generateEmbedding(userQuery);

  const { data, error } = await supabase.rpc<
    MatchDocumentChunk[],
    MatchDocumentChunksArgs
  >(
    "match_document_chunks",
    {
      query_embedding: queryEmbedding,
      match_count: 4,
      similarity_threshold: 0.5,
    },
  );

  if (error) {
    throw new Error(`Failed to retrieve relevant content: ${error.message}`);
  }

  if (!data) return [];

  return data.map((chunk) => ({
    id: chunk.id,
    docPath: chunk.doc_path,
    chunkIndex: chunk.chunk_index,
    content: chunk.content,
    contentHash: chunk.content_hash,
    metadata: chunk.metadata,
    similarity: chunk.similarity,
    updatedAt: chunk.updated_at,
  }));
};
