import { z } from "zod"
import { ensureArray } from "./utils"

export type EmbeddingProvider = "openai" | "supabase"

export interface EmbeddingConfig {
  provider: EmbeddingProvider
  model: string
  openai?: {
    apiKey: string
    baseUrl: string
  }
  supabase?: {
    apiKey: string
    apiUrl: string
    provider?: string
  }
}

export interface GenerateEmbeddingOptions {
  input: string | string[]
  config?: EmbeddingConfig
  signal?: AbortSignal
}

export interface EmbeddingResult {
  embeddings: number[][]
  model: string
  provider: EmbeddingProvider
  dimensions: number
}

const envSchema = z.object({
  EMBEDDING_PROVIDER: z
    .string()
    .optional()
    .transform((value) => value?.toLowerCase().trim())
    .refine(
      (value) =>
        value === undefined || value === "openai" || value === "supabase",
      {
        message: "EMBEDDING_PROVIDER must be either 'openai' or 'supabase'",
      },
    )
    .transform((value) => value as EmbeddingProvider | undefined),
  EMBEDDING_MODEL: z.string().optional(),
  OPENAI_API_KEY: z.string().optional(),
  OPENAI_BASE_URL: z.string().optional(),
  SUPABASE_AI_KEY: z.string().optional(),
  SUPABASE_AI_URL: z.string().optional(),
  SUPABASE_AI_PROVIDER: z.string().optional(),
  SERVICE_ROLE_KEY: z.string().optional(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().optional(),
})

const DEFAULT_OPENAI_MODEL = "text-embedding-3-small"
const DEFAULT_OPENAI_BASE_URL = "https://api.openai.com/v1"
const DEFAULT_SUPABASE_MODEL = "text-embedding-3-small"
const DEFAULT_SUPABASE_AI_URL = "https://api.supabase.com/v1/ai/embeddings"

export function resolveEmbeddingConfig(
  env: Record<string, string | undefined> = process.env,
): EmbeddingConfig {
  const parsed = envSchema.parse(env)
  const provider = parsed.EMBEDDING_PROVIDER ?? "openai"

  if (provider === "openai") {
    const apiKey = parsed.OPENAI_API_KEY?.trim()
    if (!apiKey) {
      throw new Error(
        "OPENAI_API_KEY is required when EMBEDDING_PROVIDER=openai",
      )
    }
    return {
      provider,
      model: parsed.EMBEDDING_MODEL ?? DEFAULT_OPENAI_MODEL,
      openai: {
        apiKey,
        baseUrl: (parsed.OPENAI_BASE_URL ?? DEFAULT_OPENAI_BASE_URL).replace(
          /\/$/,
          "",
        ),
      },
    }
  }

  const apiKey =
    parsed.SUPABASE_AI_KEY?.trim() ??
    parsed.SERVICE_ROLE_KEY?.trim() ??
    parsed.SUPABASE_SERVICE_ROLE_KEY?.trim()
  if (!apiKey) {
    throw new Error(
      "SUPABASE_AI_KEY (or SERVICE_ROLE_KEY) is required when EMBEDDING_PROVIDER=supabase",
    )
  }

  return {
    provider,
    model: parsed.EMBEDDING_MODEL ?? DEFAULT_SUPABASE_MODEL,
    supabase: {
      apiKey,
      apiUrl: (parsed.SUPABASE_AI_URL?.trim() ?? DEFAULT_SUPABASE_AI_URL).replace(
        /\/$/,
        "",
      ),
      provider: parsed.SUPABASE_AI_PROVIDER?.trim(),
    },
  }
}

export async function generateEmbeddings(
  options: GenerateEmbeddingOptions,
): Promise<EmbeddingResult> {
  const config = options.config ?? resolveEmbeddingConfig()
  const inputs = ensureArray(options.input)
  if (inputs.length === 0) {
    throw new Error("`input` must contain at least one string")
  }

  if (config.provider === "openai") {
    const { apiKey, baseUrl } = config.openai!
    return callOpenAI({
      apiKey,
      baseUrl,
      model: config.model,
      inputs,
      signal: options.signal,
    })
  }

  const { apiKey, apiUrl, provider } = config.supabase!
  return callSupabaseAI({
    apiKey,
    apiUrl,
    model: config.model,
    inputs,
    provider,
    signal: options.signal,
  })
}

async function callOpenAI(params: {
  apiKey: string
  baseUrl: string
  model: string
  inputs: string[]
  signal?: AbortSignal
}): Promise<EmbeddingResult> {
  const response = await fetch(`${params.baseUrl}/embeddings`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${params.apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      input: params.inputs,
      model: params.model,
    }),
    signal: params.signal,
  })

  if (!response.ok) {
    throw await buildRequestError("OpenAI", response)
  }

  const payload = await response.json()
  const embeddings: number[][] = payload?.data?.map(
    (item: { embedding: number[] }) => item.embedding,
  )

  if (!Array.isArray(embeddings) || embeddings.length === 0) {
    throw new Error("OpenAI embeddings response did not include data")
  }

  return {
    embeddings,
    model: payload.model ?? params.model,
    provider: "openai",
    dimensions: embeddings[0]?.length ?? 0,
  }
}

async function callSupabaseAI(params: {
  apiKey: string
  apiUrl: string
  model: string
  inputs: string[]
  provider?: string
  signal?: AbortSignal
}): Promise<EmbeddingResult> {
  const headers: Record<string, string> = {
    Authorization: `Bearer ${params.apiKey}`,
    "Content-Type": "application/json",
    apikey: params.apiKey,
  }
  if (params.provider) {
    headers["llm-provider"] = params.provider
  }

  const response = await fetch(params.apiUrl, {
    method: "POST",
    headers,
    body: JSON.stringify({
      input: params.inputs,
      model: params.model,
    }),
    signal: params.signal,
  })

  if (!response.ok) {
    throw await buildRequestError("Supabase AI", response)
  }

  const payload = await response.json()
  const embeddings: number[][] = payload?.data?.map(
    (item: { embedding: number[] }) => item.embedding,
  )

  if (!Array.isArray(embeddings) || embeddings.length === 0) {
    throw new Error("Supabase AI embeddings response did not include data")
  }

  return {
    embeddings,
    model: payload.model ?? params.model,
    provider: "supabase",
    dimensions: embeddings[0]?.length ?? 0,
  }
}

async function buildRequestError(
  provider: string,
  response: Response,
): Promise<Error> {
  let detail = `${response.status} ${response.statusText}`
  try {
    const payload = await response.json()
    const message =
      payload?.error?.message ??
      payload?.error ??
      payload?.message ??
      payload?.detail
    if (message) {
      detail += ` – ${message}`
    }
  } catch {
    // ignore JSON parse errors
  }
  return new Error(`${provider} embedding request failed: ${detail}`)
}
