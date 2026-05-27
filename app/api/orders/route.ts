import { NextResponse } from "next/server";
import { EVENT_DATES, MENU, PICKUP_TIMES_BY_ROUND } from "@/lib/menu";
import { getSupabase } from "@/lib/supabase";
import { CartItem } from "@/lib/types";

function normalizeWhatsapp(value: string) {
  return value.replace(/\D/g, "");
}

function validateItems(items: CartItem[]) {
  const products = new Map(MENU.map((product) => [product.id, product]));

  return items.map((item) => {
    const product = products.get(item.product.id);
    if (!product || !product.active) throw new Error("Um item do carrinho não está disponível.");
    if (!Number.isInteger(item.quantity) || item.quantity < 1) throw new Error("Quantidade inválida.");

    if (product.id === "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb" && item.saltyChoices?.length !== 3) {
      throw new Error("Escolha 3 sabores salgados para o Combo Família.");
    }

    if (
      product.id === "cccccccc-cccc-4ccc-8ccc-cccccccccccc" &&
      (item.saltyChoices?.length !== 3 || item.sweetChoices?.length !== 1)
    ) {
      throw new Error("Escolha 3 sabores salgados e 1 doce para o Combo Família Doce.");
    }

    return {
      product,
      quantity: item.quantity,
      saltyChoices: item.saltyChoices ?? [],
      sweetChoices: item.sweetChoices ?? []
    };
  });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const items = validateItems(body.items ?? []);
    const totalPizzas = items.reduce((sum, item) => sum + item.product.pizza_count * item.quantity, 0);
    const totalAmount = items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
    const round = body.round as keyof typeof PICKUP_TIMES_BY_ROUND;
    const validPickupTimes = PICKUP_TIMES_BY_ROUND[round] as readonly string[] | undefined;

    if (!body.customerName || body.customerName.trim().length < 3) throw new Error("Informe o nome completo.");
    if (normalizeWhatsapp(body.whatsapp ?? "").length < 10) throw new Error("Informe um WhatsApp válido.");
    if (!body.eventDate || !EVENT_DATES.includes(body.eventDate)) throw new Error("Escolha um dia válido.");
    if (!body.round || !validPickupTimes) throw new Error("Escolha uma rodada válida.");
    if (!body.pickupTime) throw new Error("Escolha um horário de retirada.");
    if (!validPickupTimes.includes(body.pickupTime)) {
      throw new Error("Escolha um horário válido para a rodada selecionada.");
    }
    if (!items.length) throw new Error("Adicione pelo menos um item ao carrinho.");
    if (totalPizzas < 1) throw new Error("O pedido precisa ter pelo menos uma pizza.");

    const supabase = getSupabase();
    const { data: slot, error: slotError } = await supabase
      .from("time_slots")
      .select("max_pizzas,current_pizzas")
      .eq("event_date", body.eventDate)
      .eq("round", body.round)
      .eq("pickup_time", body.pickupTime)
      .single();

    if (slotError || !slot) {
      console.warn("[Pedido API] Horário não encontrado no Supabase.", {
        eventDate: body.eventDate,
        round: body.round,
        pickupTime: body.pickupTime,
        error: slotError?.message
      });
      throw new Error("Horário de retirada não encontrado. Confira a configuração do Supabase.");
    }

    if (slot.current_pizzas + totalPizzas > slot.max_pizzas) {
      console.warn("[Pedido API] Vagas insuficientes antes da RPC.", {
        eventDate: body.eventDate,
        round: body.round,
        pickupTime: body.pickupTime,
        totalPizzas,
        currentPizzas: slot.current_pizzas,
        maxPizzas: slot.max_pizzas
      });
      throw new Error("Este horário não tem vagas suficientes. Escolha outro horário.");
    }

    const { data, error } = await supabase.rpc("create_order_safely", {
      p_customer_name: body.customerName.trim(),
      p_whatsapp: normalizeWhatsapp(body.whatsapp),
      p_event_date: body.eventDate,
      p_round: body.round,
      p_pickup_time: body.pickupTime,
      p_items: items,
      p_total_pizzas: totalPizzas,
      p_total_amount: totalAmount,
      p_notes: body.notes?.trim() || null
    });

    if (error) {
      console.warn("[Pedido API] RPC create_order_safely falhou.", {
        message: error.message,
        details: error.details,
        hint: error.hint
      });
      throw new Error(error.message);
    }

    return NextResponse.json({ order: data });
  } catch (error) {
    console.warn("[Pedido API] Finalização recusada:", error instanceof Error ? error.message : error);
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Não foi possível finalizar o pedido." },
      { status: 400 }
    );
  }
}
