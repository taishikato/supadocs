import { createClient } from "@supabase/supabase-js";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getServerEnv } from "./env";

let cachedServiceClient: SupabaseClient | null = null;

export function getServiceSupabaseClient(): SupabaseClient {
  if (cachedServiceClient) return cachedServiceClient;

  const env = getServerEnv();
  cachedServiceClient = createClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.SERVICE_ROLE_KEY!,
    {
      auth: { persistSession: false },
    },
  );

  return cachedServiceClient;
}
