import { NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";

function isAdmin(request: Request) {
  const password = request.headers.get("x-admin-password");
  return Boolean(process.env.ADMIN_PASSWORD && password === process.env.ADMIN_PASSWORD);
}

export async function GET(request: Request) {
  if (!isAdmin(request)) return NextResponse.json({ message: "Senha inválida." }, { status: 401 });

  try {
    const supabase = getSupabase();
    const [{ data: orders, error: ordersError }, { data: slots, error: slotsError }] = await Promise.all([
      supabase.from("orders").select("*").order("created_at", { ascending: false }),
      supabase.from("time_slots").select("*").order("event_date").order("pickup_time")
    ]);

    if (ordersError) throw ordersError;
    if (slotsError) throw slotsError;

    return NextResponse.json({ orders: orders ?? [], slots: slots ?? [] });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Erro ao carregar painel." },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  if (!isAdmin(request)) return NextResponse.json({ message: "Senha inválida." }, { status: 401 });

  try {
    const body = await request.json();
    const supabase = getSupabase();

    if (body.type === "slot") {
      const nextMaxPizzas = Number(body.max_pizzas);
      if (!body.id || !Number.isInteger(nextMaxPizzas) || nextMaxPizzas < 0) {
        throw new Error("Limite de horário inválido.");
      }

      const { data: slot, error: slotReadError } = await supabase
        .from("time_slots")
        .select("*")
        .eq("id", body.id)
        .single();

      if (slotReadError || !slot) throw new Error("Horário não encontrado.");
      if (nextMaxPizzas < Number(slot.current_pizzas)) {
        throw new Error("O limite não pode ser menor que a quantidade de pizzas já vendida neste horário.");
      }

      const { error: slotUpdateError } = await supabase
        .from("time_slots")
        .update({ max_pizzas: nextMaxPizzas })
        .eq("id", body.id);

      if (slotUpdateError) throw new Error("Não foi possível atualizar o limite do horário.");

      const { data: slots, error: slotsError } = await supabase
        .from("time_slots")
        .select("*")
        .order("event_date")
        .order("pickup_time");

      if (slotsError) throw slotsError;

      return NextResponse.json({ slots: slots ?? [] });
    }

    const { data: currentOrder, error: orderReadError } = await supabase
      .from("orders")
      .select("*")
      .eq("id", body.id)
      .single();

    if (orderReadError || !currentOrder) throw new Error("Pedido não encontrado.");

    const previousStatus = currentOrder.order_status;
    const nextStatus = body.order_status ?? currentOrder.order_status;
    const shouldCancel = previousStatus !== "cancelado" && nextStatus === "cancelado";
    const shouldReactivate = previousStatus === "cancelado" && nextStatus !== "cancelado";
    let slotRollback: { id: string; current_pizzas: number } | null = null;

    if (shouldCancel || shouldReactivate) {
      const { data: slot, error: slotError } = await supabase
        .from("time_slots")
        .select("*")
        .eq("event_date", currentOrder.event_date)
        .eq("round", currentOrder.round)
        .eq("pickup_time", currentOrder.pickup_time)
        .single();

      if (slotError || !slot) {
        console.warn("[Admin] Horário não encontrado ao atualizar status do pedido.", {
          order: currentOrder.order_number,
          eventDate: currentOrder.event_date,
          round: currentOrder.round,
          pickupTime: currentOrder.pickup_time,
          error: slotError?.message
        });
        if (shouldReactivate) {
          throw new Error("Horário do pedido não encontrado. Não foi possível reativar o pedido.");
        }
      }

      if (slot) {
        const totalPizzas = Number(currentOrder.total_pizzas);
        const nextCurrentPizzas = shouldCancel
          ? Math.max(0, Number(slot.current_pizzas) - totalPizzas)
          : Number(slot.current_pizzas) + totalPizzas;

        if (shouldReactivate && nextCurrentPizzas > Number(slot.max_pizzas)) {
          console.warn("[Admin] Reativação bloqueada por falta de vagas.", {
            order: currentOrder.order_number,
            totalPizzas,
            currentPizzas: slot.current_pizzas,
            maxPizzas: slot.max_pizzas
          });
          throw new Error("Não há vagas suficientes neste horário para reativar o pedido.");
        }

        slotRollback = { id: slot.id, current_pizzas: Number(slot.current_pizzas) };
        const { error: slotUpdateError } = await supabase
          .from("time_slots")
          .update({ current_pizzas: nextCurrentPizzas })
          .eq("id", slot.id);

        if (slotUpdateError) {
          console.warn("[Admin] Falha ao atualizar vagas do horário.", slotUpdateError.message);
          throw new Error("Não foi possível atualizar as vagas do horário.");
        }
      }
    }

    const { data, error } = await supabase
      .from("orders")
      .update({
        payment_status: body.payment_status,
        order_status: nextStatus,
        notes: body.notes ?? null
      })
      .eq("id", body.id)
      .select()
      .single();

    if (error) {
      if (slotRollback) {
        await supabase
          .from("time_slots")
          .update({ current_pizzas: slotRollback.current_pizzas })
          .eq("id", slotRollback.id);
      }
      console.warn("[Admin] Falha ao atualizar pedido; rollback de vagas tentado.", error.message);
      throw error;
    }

    const { data: slots, error: slotsError } = await supabase
      .from("time_slots")
      .select("*")
      .order("event_date")
      .order("pickup_time");

    if (slotsError) throw slotsError;

    return NextResponse.json({ order: data, slots: slots ?? [] });
  } catch (error) {
    console.warn("[Admin] Erro ao atualizar pedido:", error instanceof Error ? error.message : error);
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Erro ao atualizar pedido." },
      { status: 400 }
    );
  }
}
