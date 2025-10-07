import { z } from "zod";

const serverEnvSchema = z.object({
  SUPABASE_URL: z.string().url(),
  SUPABASE_ANON_KEY: z.string().optional(),
  SERVICE_ROLE_KEY: z.string().optional(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().optional(),
  OPENAI_API_KEY: z.string(),
  OPENAI_CHAT_MODEL: z
    .string()
    .optional()
    .default("gpt-4o-mini"),
  EMBEDDING_MODEL: z.string().optional(),
});

type ServerEnv = z.infer<typeof serverEnvSchema>;

let cachedEnv: ServerEnv | null = null;

export function getServerEnv(): ServerEnv {
  if (cachedEnv) return cachedEnv;

  const parsed = serverEnvSchema.safeParse(process.env);
  if (!parsed.success) {
    throw new Error(
      `Invalid server environment variables: ${parsed.error.message}`,
    );
  }

  const env = {
    ...parsed.data,
    SERVICE_ROLE_KEY: parsed.data.SERVICE_ROLE_KEY ??
      parsed.data.SUPABASE_SERVICE_ROLE_KEY,
  };

  if (!env.SERVICE_ROLE_KEY) {
    throw new Error(
      "SERVICE_ROLE_KEY (or SUPABASE_SERVICE_ROLE_KEY) must be defined on the server",
    );
  }

  cachedEnv = env;
  return env;
}
