import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { embed, embedMany } from "ai";
import { openai } from "@ai-sdk/openai";

const embeddingModel = openai.embedding("text-embedding-3-small");

export type RelevantContent = {
  id: number;
  page_id: number;
  slug: string;
  heading: string;
  content: string;
  similarity: number;
};

let cachedSupabaseClient: SupabaseClient<any, any, "docs", any, any> | null =
  null;

const getSupabaseClient = () => {
  if (cachedSupabaseClient) return cachedSupabaseClient;

  const url = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url) {
    throw new Error("SUPABASE_URL must be set to query embeddings");
  }

  if (!serviceRoleKey) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY must be set to query embeddings"
    );
  }

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
  value: string
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
  userQuery: string
): Promise<RelevantContent[]> => {
  const supabase = getSupabaseClient();
  const queryEmbedding = await generateEmbedding(userQuery);

  const { data: pageSections, error } = await supabase.rpc(
    "match_page_sections",
    {
      embedding: queryEmbedding,
      match_threshold: 0.5,
      match_count: 10,
      min_content_length: 50,
    }
  );

  if (error) {
    throw new Error(`Failed to retrieve relevant content: ${error.message}`);
  }

  return pageSections;
};
