import { NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";

export async function GET() {
  try {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from("time_slots")
      .select("*")
      .order("event_date", { ascending: true })
      .order("pickup_time", { ascending: true });

    if (error) throw error;

    return NextResponse.json({ slots: data ?? [] });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Erro ao carregar horários." },
      { status: 500 }
    );
  }
}
