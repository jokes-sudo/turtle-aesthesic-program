export type Json = string | number | boolean | null | { [key: string]: Json } | Json[];

export interface Database {
  public: {
    Tables: {
      body_metrics: {
        Row: {
          id: string;
          created_at: string;
          date: string;
          weight_kg: number | null;
          body_fat_pct: number | null;
          bmi: number | null;
          waist_cm: number | null;
          chest_cm: number | null;
          notes: string | null;
        };
        Insert: Omit<Database["public"]["Tables"]["body_metrics"]["Row"], "id" | "created_at">;
        Update: Partial<Database["public"]["Tables"]["body_metrics"]["Insert"]>;
      };
      workout_logs: {
        Row: {
          id: string;
          created_at: string;
          date: string;
          exercise_name: string;
          sets: number | null;
          reps: number | null;
          weight_kg: number | null;
          duration_min: number | null;
          notes: string | null;
        };
        Insert: Omit<Database["public"]["Tables"]["workout_logs"]["Row"], "id" | "created_at">;
        Update: Partial<Database["public"]["Tables"]["workout_logs"]["Insert"]>;
      };
      nutrition_logs: {
        Row: {
          id: string;
          created_at: string;
          date: string;
          meal_name: string | null;
          calories: number | null;
          protein_g: number | null;
          carbs_g: number | null;
          fats_g: number | null;
          notes: string | null;
        };
        Insert: Omit<Database["public"]["Tables"]["nutrition_logs"]["Row"], "id" | "created_at">;
        Update: Partial<Database["public"]["Tables"]["nutrition_logs"]["Insert"]>;
      };
      sleep_logs: {
        Row: {
          id: string;
          created_at: string;
          date: string;
          duration_hours: number | null;
          quality: number | null;
          bed_time: string | null;
          wake_time: string | null;
          notes: string | null;
        };
        Insert: Omit<Database["public"]["Tables"]["sleep_logs"]["Row"], "id" | "created_at">;
        Update: Partial<Database["public"]["Tables"]["sleep_logs"]["Insert"]>;
      };
      todos: {
        Row: {
          id: string;
          created_at: string;
          title: string;
          description: string | null;
          completed: boolean;
          priority: "low" | "medium" | "high";
          due_date: string | null;
          category: string | null;
        };
        Insert: Omit<Database["public"]["Tables"]["todos"]["Row"], "id" | "created_at">;
        Update: Partial<Database["public"]["Tables"]["todos"]["Insert"]>;
      };
      apple_health_records: {
        Row: {
          id: string;
          created_at: string;
          record_type: string;
          value: number | null;
          unit: string | null;
          start_date: string;
          end_date: string | null;
          source_name: string | null;
        };
        Insert: Omit<Database["public"]["Tables"]["apple_health_records"]["Row"], "id" | "created_at">;
        Update: Partial<Database["public"]["Tables"]["apple_health_records"]["Insert"]>;
      };
    };
  };
}
