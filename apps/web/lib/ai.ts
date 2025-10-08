import { createOpenAI } from "@ai-sdk/openai"
import type { LanguageModel } from "ai"
import { getServerEnv } from "./env"

let cachedModel: LanguageModel | null = null

export function getChatModel(): LanguageModel {
  if (cachedModel) return cachedModel

  const env = getServerEnv()
  const openai = createOpenAI({
    apiKey: env.OPENAI_API_KEY,
    baseURL: env.OPENAI_BASE_URL,
  })
  cachedModel = openai(env.OPENAI_CHAT_MODEL)
  return cachedModel
}
