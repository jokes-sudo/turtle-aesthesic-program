"use client";

import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";

// Singleton browser client — safe to call from client components
let _browser: ReturnType<typeof createClient<Database>> | null = null;

export function getBrowserSupabase() {
  if (_browser) return _browser;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key || url.includes("placeholder")) return null;
  _browser = createClient<Database>(url, key);
  return _browser;
}
