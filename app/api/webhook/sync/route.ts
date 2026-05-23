import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { AH } from "@/lib/apple-health";

export const dynamic = "force-dynamic";

// Simple flat payload the iOS Shortcut sends (one or many readings)
interface SyncPayload {
  key: string;
  timestamp?: string; // ISO — defaults to now
  // Individual readings (all optional)
  heart_rate?: number;          // bpm
  resting_heart_rate?: number;  // bpm
  hrv?: number;                 // ms
  steps?: number;               // count (today)
  active_calories?: number;     // kcal
  weight?: number;              // kg or lb (see weight_unit)
  weight_unit?: "kg" | "lb";
  body_fat?: number;            // %
  distance?: number;            // km
  flights_climbed?: number;
  spo2?: number;                // %
  // Batch — optional array of raw records for more advanced shortcuts
  records?: Array<{
    type: string;
    value: number;
    unit?: string;
    timestamp?: string;
  }>;
}

async function validateKey(provided: string): Promise<boolean> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data } = await (supabase.from("settings") as any)
    .select("value")
    .eq("key", "webhook_api_key")
    .single();
  return !!data && (data as { value: string }).value === provided;
}

export async function POST(req: NextRequest) {
  let body: SyncPayload;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!body.key) return NextResponse.json({ error: "API key required" }, { status: 401 });

  const valid = await validateKey(body.key);
  if (!valid) return NextResponse.json({ error: "Invalid API key" }, { status: 403 });

  const now = body.timestamp ? new Date(body.timestamp).toISOString() : new Date().toISOString();

  type InsertRow = {
    record_type: string;
    value: number | null;
    unit: string | null;
    start_date: string;
    end_date: string | null;
    source_name: string | null;
  };

  const rows: InsertRow[] = [];

  // Map flat fields → typed records
  const flat: Array<[string | undefined, number | undefined, string]> = [
    [AH.HEART_RATE,  body.heart_rate,          "bpm"],
    [AH.RESTING_HR,  body.resting_heart_rate,   "bpm"],
    [AH.HRV,         body.hrv,                  "ms"],
    [AH.STEPS,       body.steps,                "count"],
    [AH.ACTIVE_CAL,  body.active_calories,      "kcal"],
    [AH.BODY_FAT,    body.body_fat,             "%"],
    [AH.DISTANCE,    body.distance,             "km"],
    [AH.FLIGHTS,     body.flights_climbed,      "count"],
    [AH.SPO2,        body.spo2,                 "%"],
  ];

  for (const [type, value, unit] of flat) {
    if (type && value != null) {
      rows.push({ record_type: type, value, unit, start_date: now, end_date: null, source_name: "iOS Shortcut" });
    }
  }

  // Weight with optional unit conversion
  if (body.weight != null) {
    const kg = body.weight_unit === "lb" ? body.weight * 0.453592 : body.weight;
    rows.push({ record_type: AH.WEIGHT, value: Math.round(kg * 100) / 100, unit: "kg", start_date: now, end_date: null, source_name: "iOS Shortcut" });
  }

  // Raw batch records (advanced shortcuts)
  for (const r of body.records ?? []) {
    if (r.type && r.value != null) {
      rows.push({
        record_type: r.type,
        value: r.value,
        unit: r.unit ?? null,
        start_date: r.timestamp ? new Date(r.timestamp).toISOString() : now,
        end_date: null,
        source_name: "iOS Shortcut",
      });
    }
  }

  if (rows.length === 0) return NextResponse.json({ inserted: 0, message: "No readings in payload" });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase.from("apple_health_records") as any).insert(rows);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ inserted: rows.length, timestamp: now });
}
