import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase.from("settings") as any)
      .select("value")
      .eq("key", "webhook_api_key")
      .single();

    if (error || !data) {
      return NextResponse.json({ key: null, error: "Supabase not configured yet" }, { status: 200 });
    }
    return NextResponse.json({ key: (data as { value: string }).value });
  } catch {
    return NextResponse.json({ key: null, error: "Supabase not configured" }, { status: 200 });
  }
}

export async function POST() {
  try {
    const newKey = crypto.randomUUID();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase.from("settings") as any).upsert({ key: "webhook_api_key", value: newKey });
    return NextResponse.json({ key: newKey });
  } catch {
    return NextResponse.json({ error: "Failed to regenerate key" }, { status: 500 });
  }
}
