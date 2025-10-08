import { createClient } from "@supabase/supabase-js";
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

type ReindexRequest = {
  repoRawBaseUrl?: string;
  changedPaths?: string[];
  deletedPaths?: string[];
};

type ReindexSummary = {
  processed: Array<{ path: string; chunks: number }>;
  deleted: string[];
  skipped: Array<{ path: string; reason: string }>;
  errors: Array<{ path: string; error: string }>;
};

const EDGE_SECRET = Deno.env.get("EDGE_FUNCTION_REINDEX_SECRET");
const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
const EMBEDDING_MODEL = Deno.env.get("EMBEDDING_MODEL") ??
  "text-embedding-3-small";
const NEXT_PUBLIC_SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SERVICE_ROLE_KEY = Deno.env.get("SERVICE_ROLE_KEY") ??
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

if (!NEXT_PUBLIC_SUPABASE_URL) {
  throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL environment variable");
}
if (!SERVICE_ROLE_KEY) {
  throw new Error(
    "Missing SERVICE_ROLE_KEY environment variable (set via `supabase secrets set SERVICE_ROLE_KEY=...`)",
  );
}

const supabase = createClient(NEXT_PUBLIC_SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: corsHeaders(req),
    });
  }

  if (req.method !== "POST") {
    return jsonResponse(
      { error: "Method not allowed" },
      { status: 405, headers: corsHeaders(req) },
    );
  }

  if (!EDGE_SECRET) {
    return jsonResponse(
      { error: "Edge function secret is not configured" },
      { status: 500, headers: corsHeaders(req) },
    );
  }

  const providedSecret = req.headers.get("x-edge-secret");
  if (providedSecret !== EDGE_SECRET) {
    return jsonResponse(
      { error: "Unauthorized" },
      { status: 401, headers: corsHeaders(req) },
    );
  }

  let payload: ReindexRequest;
  try {
    payload = await req.json();
  } catch {
    return jsonResponse(
      { error: "Invalid JSON body" },
      { status: 400, headers: corsHeaders(req) },
    );
  }

  const repoRawBaseUrl = payload.repoRawBaseUrl?.trim();
  if (!repoRawBaseUrl) {
    return jsonResponse(
      { error: "`repoRawBaseUrl` is required" },
      { status: 400, headers: corsHeaders(req) },
    );
  }

  const changedPaths = Array.isArray(payload.changedPaths)
    ? payload.changedPaths
    : [];
  const deletedPaths = Array.isArray(payload.deletedPaths)
    ? payload.deletedPaths
    : [];

  const summary: ReindexSummary = {
    processed: [],
    deleted: [],
    skipped: [],
    errors: [],
  };

  for (const rawPath of deletedPaths) {
    const docPath = normalisePath(rawPath);
    if (!docPath) continue;
    const { error } = await supabase
      .from("document_chunks")
      .delete()
      .eq("doc_path", docPath);
    if (error) {
      summary.errors.push({ path: docPath, error: error.message });
    } else {
      summary.deleted.push(docPath);
    }
  }

  for (const rawPath of changedPaths) {
    const docPath = normalisePath(rawPath);
    if (!docPath) continue;
    if (!shouldIndex(docPath)) {
      summary.skipped.push({
        path: docPath,
        reason: "Unsupported file extension",
      });
      continue;
    }

    try {
      const rawUrl = buildRawUrl(repoRawBaseUrl, docPath);
      const res = await fetch(rawUrl);

      if (res.status === 404) {
        const { error } = await supabase
          .from("document_chunks")
          .delete()
          .eq("doc_path", docPath);
        if (error) {
          summary.errors.push({ path: docPath, error: error.message });
        } else {
          summary.deleted.push(docPath);
        }
        continue;
      }

      if (!res.ok) {
        summary.errors.push({
          path: docPath,
          error: `Failed to fetch (${res.status})`,
        });
        continue;
      }

      const content = await res.text();
      if (!content.trim()) {
        summary.skipped.push({ path: docPath, reason: "File is empty" });
        continue;
      }

      const chunks = chunkContent(content);
      if (chunks.length === 0) {
        summary.skipped.push({
          path: docPath,
          reason: "No chunks generated",
        });
        continue;
      }

      await supabase.from("document_chunks").delete().eq("doc_path", docPath);

      const records = [];
      for (let index = 0; index < chunks.length; index += 1) {
        const chunk = chunks[index];
        const contentHash = await sha256(chunk);
        const embedding = await embedText(chunk);

        records.push({
          doc_path: docPath,
          chunk_index: index,
          content: chunk,
          embedding,
          content_hash: contentHash,
          metadata: { source_url: rawUrl },
        });
      }

      const { error } = await supabase
        .from("document_chunks")
        .upsert(records, { onConflict: "doc_path, content_hash" });

      if (error) {
        summary.errors.push({ path: docPath, error: error.message });
        continue;
      }

      summary.processed.push({ path: docPath, chunks: records.length });
    } catch (error) {
      summary.errors.push({
        path: docPath,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  return jsonResponse(
    { ok: summary.errors.length === 0, summary },
    { status: 200, headers: corsHeaders(req) },
  );
});

function corsHeaders(req: Request): Headers {
  const origin = req.headers.get("origin") ?? "*";
  return new Headers({
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Headers": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Content-Type": "application/json",
  });
}

function jsonResponse(
  body: unknown,
  init: ResponseInit & { headers?: Headers },
): Response {
  return new Response(JSON.stringify(body), {
    ...init,
    headers: init.headers ??
      new Headers({ "Content-Type": "application/json" }),
  });
}

function normalisePath(rawPath: string | null | undefined): string | null {
  if (!rawPath) return null;
  const trimmed = rawPath.trim().replace(/^\.?\//, "");
  return trimmed.length > 0 ? trimmed : null;
}

function shouldIndex(path: string): boolean {
  return path.endsWith(".md") || path.endsWith(".mdx");
}

function buildRawUrl(base: string, path: string): string {
  const normalisedBase = base.endsWith("/") ? base : `${base}/`;
  return `${normalisedBase}${path}`;
}

const MAX_CHARS_PER_CHUNK = 1200;

function chunkContent(content: string): string[] {
  const chunks: string[] = [];
  const paragraphs = content.split(/\n{2,}/);
  let current = "";

  for (const para of paragraphs) {
    const trimmed = para.trim();
    if (!trimmed) continue;

    if (!current) {
      current = trimmed;
      continue;
    }

    const candidate = `${current}\n\n${trimmed}`;
    if (candidate.length <= MAX_CHARS_PER_CHUNK) {
      current = candidate;
    } else {
      chunks.push(current);
      if (trimmed.length > MAX_CHARS_PER_CHUNK) {
        const parts = splitLongParagraph(trimmed);
        chunks.push(...parts.slice(0, parts.length - 1));
        current = parts[parts.length - 1];
      } else {
        current = trimmed;
      }
    }
  }

  if (current) {
    if (current.length > MAX_CHARS_PER_CHUNK) {
      chunks.push(...splitLongParagraph(current));
    } else {
      chunks.push(current);
    }
  }

  return chunks;
}

function splitLongParagraph(paragraph: string): string[] {
  const result: string[] = [];
  let start = 0;
  while (start < paragraph.length) {
    const end = Math.min(start + MAX_CHARS_PER_CHUNK, paragraph.length);
    result.push(paragraph.slice(start, end));
    start = end;
  }
  return result;
}

async function sha256(content: string): Promise<string> {
  const data = new TextEncoder().encode(content);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

async function embedText(text: string): Promise<number[]> {
  if (!OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY is not configured");
  }

  const response = await fetch("https://api.openai.com/v1/embeddings", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      input: text,
      model: EMBEDDING_MODEL,
    }),
  });

  if (!response.ok) {
    const detail = await safeParseError(response);
    throw new Error(
      `Embedding request failed (${response.status}): ${detail ?? "unknown"}`,
    );
  }

  const payload = await response.json();
  const embedding = payload?.data?.[0]?.embedding;
  if (!Array.isArray(embedding)) {
    throw new Error("Embedding response is missing data");
  }

  return embedding.map((value: unknown) => Number(value));
}

async function safeParseError(response: Response): Promise<string | null> {
  try {
    const json = await response.json();
    if (json && typeof json === "object") {
      return json.error?.message ?? json.message ?? null;
    }
  } catch {
    // ignore body parse failure
  }
  return null;
}
