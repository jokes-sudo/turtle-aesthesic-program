import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type");
  const days = parseInt(searchParams.get("days") ?? "30");
  const limit = parseInt(searchParams.get("limit") ?? "500");
  const aggregate = searchParams.get("aggregate"); // "day" | null

  if (!type) return NextResponse.json({ error: "type required" }, { status: 400 });

  const since = new Date();
  since.setDate(since.getDate() - days);

  const { data, error } = await supabase
    .from("apple_health_records")
    .select("value, unit, start_date, end_date, source_name")
    .eq("record_type", type)
    .gte("start_date", since.toISOString())
    .order("start_date", { ascending: true })
    .limit(limit);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  if (aggregate === "day" && data) {
    // Sum/avg per calendar day
    type DbRow = { value: number | null; unit: string | null; start_date: string; end_date: string | null; source_name: string | null };
    const byDay: Record<string, { sum: number; count: number; unit: string | null }> = {};
    for (const r of data as DbRow[]) {
      const day = r.start_date.slice(0, 10);
      if (!byDay[day]) byDay[day] = { sum: 0, count: 0, unit: r.unit };
      byDay[day].sum += r.value ?? 0;
      byDay[day].count++;
    }
    const aggregated = Object.entries(byDay).map(([date, { sum, count, unit }]) => ({
      date,
      value: Math.round((sum / count) * 10) / 10,
      sum: Math.round(sum * 10) / 10,
      count,
      unit,
    }));
    return NextResponse.json(aggregated);
  }

  return NextResponse.json(data ?? []);
}

// Fetch summary stats for multiple types in one call (used by Today page)
export async function POST(req: NextRequest) {
  const { types, days = 1 } = await req.json();
  if (!Array.isArray(types)) return NextResponse.json({ error: "types array required" }, { status: 400 });

  const since = new Date();
  since.setDate(since.getDate() - days);

  const { data, error } = await supabase
    .from("apple_health_records")
    .select("record_type, value, unit, start_date")
    .in("record_type", types)
    .gte("start_date", since.toISOString())
    .order("start_date", { ascending: false })
    .limit(2000);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}
