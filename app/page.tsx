"use client";

import { AlertTriangle, CalendarDays, Check, Clipboard, Flame, MapPin, Minus, Plus, ShoppingBag } from "lucide-react";
import { useEffect, useState } from "react";
import { EVENT_DATES, MENU, PICKUP_TIMES_BY_ROUND, PIX_KEY, ROUNDS, money } from "@/lib/menu";
import { CartItem, Product, TimeSlot } from "@/lib/types";

const salty = MENU.filter((item) => item.category === "salgada");
const sweet = MENU.filter((item) => item.category === "doce");
const categories = ["salgada", "doce", "combo", "bebida"] as const;

export default function HomePage() {
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [customerName, setCustomerName] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [eventDate, setEventDate] = useState("13/06");
  const [round, setRound] = useState("Almoço");
  const [pickupTime, setPickupTime] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState<{ order_number: string; total_amount: number } | null>(null);

  useEffect(() => {
    fetch("/api/slots")
      .then((response) => response.json())
      .then((data) => setSlots(data.slots ?? []))
      .catch((caught) => {
        console.warn("[Horários] Não foi possível carregar time_slots do Supabase:", caught);
        setError("Não foi possível carregar as vagas do Supabase. Os horários seguem visíveis, mas a finalização depende do banco configurado.");
      });
  }, []);

  const selectedSlots = slots.filter((slot) => slot.event_date === eventDate && slot.round === round);
  const selectedSlot = selectedSlots.find((slot) => slot.pickup_time === pickupTime);
  const pickupTimes = PICKUP_TIMES_BY_ROUND[round as keyof typeof PICKUP_TIMES_BY_ROUND] ?? [];
  const roundTotal = selectedSlots.reduce((sum, slot) => sum + slot.current_pizzas, 0);
  const roundCapacity = selectedSlots.reduce((sum, slot) => sum + slot.max_pizzas, 0) || pickupTimes.length * 5;
  const roundSoldOut = roundTotal >= roundCapacity;
  const totalPizzas = cart.reduce((sum, item) => sum + item.product.pizza_count * item.quantity, 0);
  const totalCartItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  const totalAmount = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const canChooseProducts = customerName.trim().length >= 3 && whatsapp.replace(/\D/g, "").length >= 10 && Boolean(eventDate && round && pickupTime);

  const availableRounds = ROUNDS.filter((item) => item.day === eventDate);

  function addProduct(product: Product) {
    if (!canChooseProducts) {
      setError("Preencha nome, WhatsApp, dia, rodada e horário antes de adicionar itens.");
      document.getElementById("customer-data")?.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }

    setCart((current) => {
      const found = current.find((item) => item.product.id === product.id && product.category !== "combo");
      if (found) {
        return current.map((item) =>
          item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }

      return [
        ...current,
        {
          lineId: crypto.randomUUID(),
          product,
          quantity: 1,
          saltyChoices: product.id === "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb" || product.id === "cccccccc-cccc-4ccc-8ccc-cccccccccccc" ? salty.slice(0, 3).map((item) => item.name) : [],
          sweetChoices: product.id === "cccccccc-cccc-4ccc-8ccc-cccccccccccc" ? [sweet[0].name] : []
        }
      ];
    });
  }

  function updateQuantity(lineId: string | undefined, delta: number) {
    setCart((current) =>
      current
        .map((item) => (item.lineId === lineId ? { ...item, quantity: item.quantity + delta } : item))
        .filter((item) => item.quantity > 0)
    );
  }

  function updateComboChoice(index: number, type: "saltyChoices" | "sweetChoices", choiceIndex: number, value: string) {
    setCart((current) =>
      current.map((item, itemIndex) => {
        if (itemIndex !== index) return item;
        const choices = [...(item[type] ?? [])];
        choices[choiceIndex] = value;
        return { ...item, [type]: choices };
      })
    );
  }

  function scrollToCart() {
    document.getElementById("cart")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  async function finishOrder() {
    setError("");

    const trimmedName = customerName.trim();
    const cleanWhatsapp = whatsapp.replace(/\D/g, "");

    if (trimmedName.length < 3) {
      setError("Informe o nome completo.");
      console.warn("[Pedido] Finalização bloqueada: nome inválido.");
      return;
    }

    if (cleanWhatsapp.length < 10) {
      setError("Informe um WhatsApp válido.");
      console.warn("[Pedido] Finalização bloqueada: WhatsApp inválido.");
      return;
    }

    if (!eventDate) {
      setError("Escolha o dia da retirada.");
      console.warn("[Pedido] Finalização bloqueada: dia não selecionado.");
      return;
    }

    if (!round) {
      setError("Escolha a rodada.");
      console.warn("[Pedido] Finalização bloqueada: rodada não selecionada.");
      return;
    }

    if (!pickupTime) {
      setError("Escolha um horário de retirada.");
      console.warn("[Pedido] Finalização bloqueada: horário de retirada vazio.");
      return;
    }

    if (!cart.length || totalPizzas < 1) {
      setError("Adicione pelo menos uma pizza ao carrinho.");
      console.warn("[Pedido] Finalização bloqueada: carrinho sem pizzas.");
      return;
    }

    if (selectedSlot && selectedSlot.current_pizzas + totalPizzas > selectedSlot.max_pizzas) {
      setError("Este horário não tem vagas suficientes para a quantidade de pizzas do carrinho.");
      console.warn("[Pedido] Finalização bloqueada: vagas insuficientes no horário selecionado.", {
        pickupTime,
        totalPizzas,
        currentPizzas: selectedSlot.current_pizzas,
        maxPizzas: selectedSlot.max_pizzas
      });
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ customerName, whatsapp, eventDate, round, pickupTime, items: cart, notes })
      });
      const data = await response.json();
      if (!response.ok) {
        console.warn("[Pedido] Supabase recusou a finalização:", data.message ?? data);
        throw new Error(data.message);
      }
      setSuccess(data.order);
      setCart([]);
      const slotsResponse = await fetch("/api/slots");
      const slotsData = await slotsResponse.json();
      setSlots(slotsData.slots ?? []);
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : "Erro ao finalizar pedido.";
      console.warn("[Pedido] Falha ao finalizar pedido:", message);
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <main className="mx-auto flex min-h-screen max-w-3xl flex-col justify-center px-5 py-10">
        <section className="wood-panel rounded-lg border border-gold/30 p-6 shadow-glow">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-gold text-coal">
            <Check size={30} />
          </div>
          <p className="text-sm uppercase tracking-[0.22em] text-gold">Pedido recebido</p>
          <h1 className="mt-2 text-3xl font-black text-white">{success.order_number}</h1>
          <p className="mt-4 text-lg text-cream/85">Total: {money(success.total_amount)}</p>
          <div className="mt-6 rounded-lg border border-gold/25 bg-coal/60 p-4">
            <p className="text-sm text-cream/70">Chave Pix aleatória</p>
            <p className="mt-1 break-all font-semibold text-gold">{PIX_KEY}</p>
            <p className="mt-2 text-sm text-cream/70">
              No app do banco, escolha Pix por chave aleatória. Não use o campo Pix Copia e Cola.
            </p>
            <button
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-md bg-gold px-4 py-3 font-bold text-coal"
              onClick={() => navigator.clipboard.writeText(PIX_KEY)}
            >
              <Clipboard size={18} /> Copiar chave Pix
            </button>
          </div>
          <p className="mt-5 text-cream/80">
            Após pagar, envie o comprovante para a equipe ou apresente na retirada. Pedidos pagos antecipadamente têm prioridade.
          </p>
          <button className="mt-6 w-full rounded-md border border-gold/30 bg-wood/40 px-4 py-3 font-bold" onClick={() => setSuccess(null)}>
            Fazer outro pedido
          </button>
        </section>
      </main>
    );
  }

  return (
    <main>
      <section className="px-5 pb-8 pt-8 sm:pt-12">
        <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <div>
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-gold/40 bg-coal/70 px-3 py-2 text-sm text-gold">
              <Flame size={16} /> Individuais 25 cm • Forno a lenha
            </div>
            <h1 className="text-4xl font-black leading-tight text-white sm:text-6xl">
              Pizzas artesanais para formatura da <span className="text-gold">M4</span>
            </h1>
            <p className="mt-4 max-w-2xl text-lg text-cream/80">
              Pizzas individuais de 25 cm, montadas e assadas no forno a lenha, com massa artesanal de longa fermentação natural.
            </p>
            <div className="mt-5 flex flex-wrap gap-2 text-sm font-bold text-gold">
              <span className="rounded-full border border-gold/30 bg-coal/55 px-3 py-2">25 cm</span>
              <span className="rounded-full border border-gold/30 bg-coal/55 px-3 py-2">Assada no forno a lenha</span>
              <span className="rounded-full border border-gold/30 bg-coal/55 px-3 py-2">Massa de longa fermentação</span>
              <span className="rounded-full border border-gold/30 bg-coal/55 px-3 py-2">Pré-venda com horário marcado</span>
            </div>
            <div className="mt-6 flex flex-col gap-3 text-sm text-cream/85 sm:flex-row">
              <span className="flex items-center gap-2"><CalendarDays size={18} /> 13/06 e 14/06</span>
              <span className="flex items-center gap-2"><MapPin size={18} /> R. Via Veneto, 2340</span>
            </div>
          </div>
          <div id="customer-data" className="wood-panel scroll-mt-4 rounded-lg border border-gold/25 p-5 shadow-glow">
            <div className="flex gap-3 rounded-md border border-gold/40 bg-coal/55 p-3 text-sm text-cream">
              <AlertTriangle className="mt-0.5 shrink-0 text-gold" size={18} />
              Produção limitada por horário. Escolha seu horário com antecedência.
            </div>
            <div className="mt-5 grid gap-3">
              <input className="rounded-md border border-gold/20 bg-coal/55 px-4 py-3" placeholder="Nome completo" value={customerName} onChange={(event) => setCustomerName(event.target.value)} />
              <input className="rounded-md border border-gold/20 bg-coal/55 px-4 py-3" placeholder="WhatsApp" value={whatsapp} onChange={(event) => setWhatsapp(event.target.value)} />
              <div className="grid grid-cols-2 gap-3">
                <select
                  className="rounded-md border border-gold/20 bg-coal/55 px-4 py-3"
                  value={eventDate}
                  onChange={(event) => {
                    setEventDate(event.target.value);
                    setRound("Almoço");
                    setPickupTime("");
                  }}
                >
                  {EVENT_DATES.map((date) => <option key={date}>{date}</option>)}
                </select>
                <select
                  className="rounded-md border border-gold/20 bg-coal/55 px-4 py-3"
                  value={round}
                  onChange={(event) => {
                    setRound(event.target.value);
                    setPickupTime("");
                  }}
                >
                  {availableRounds.map((item) => <option key={item.label}>{item.label}</option>)}
                </select>
              </div>
              {roundSoldOut && <p className="rounded-md border border-gold/35 bg-coal/65 px-3 py-2 text-sm font-bold text-gold">Rodada esgotada</p>}
              <div>
                <p className="mb-2 text-sm font-bold text-cream/85">Horário de retirada</p>
                <p className="mb-3 text-xs text-cream/55">Selecione um horário dentro da rodada escolhida.</p>
              </div>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {pickupTimes.map((time) => {
                  const slot = selectedSlots.find((item) => item.pickup_time === time);
                  const currentPizzas = slot?.current_pizzas ?? 0;
                  const maxPizzas = slot?.max_pizzas ?? 5;
                  const remaining = Math.max(maxPizzas - currentPizzas, 0);
                  const soldOut = currentPizzas >= maxPizzas || roundSoldOut;
                  return (
                    <button
                      key={`${eventDate}-${round}-${time}`}
                      disabled={soldOut}
                      onClick={() => setPickupTime(time)}
                      className={`rounded-md border px-3 py-3 text-left ${pickupTime === time ? "border-gold bg-gold text-coal" : "border-gold/20 bg-wood/35"} disabled:cursor-not-allowed disabled:opacity-45`}
                    >
                      <span className="block font-bold">{time}</span>
                      <span className="text-xs">{soldOut ? "Esgotado" : `${remaining} vagas`}</span>
                    </button>
                  );
                })}
              </div>
              <textarea className="min-h-20 rounded-md border border-gold/20 bg-coal/55 px-4 py-3" placeholder="Observações" value={notes} onChange={(event) => setNotes(event.target.value)} />
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-6 px-5 pb-28 lg:grid-cols-[1fr_360px] lg:pb-12">
        <div className="space-y-8">
          {!canChooseProducts && (
            <div className="rounded-lg border border-gold/35 bg-coal/70 p-4 text-sm text-cream">
              <strong className="block text-gold">Antes de escolher as pizzas</strong>
              Preencha nome, WhatsApp, dia, rodada e horário de retirada no início da página. Depois disso os botões de adicionar serão liberados.
            </div>
          )}
          {categories.map((category) => (
            <div key={category}>
              <h2 className="mb-3 text-2xl font-black capitalize text-white">{category === "combo" ? "Combos" : category}</h2>
              <div className="grid gap-3 sm:grid-cols-2">
                {MENU.filter((product) => product.category === category).map((product) => (
                  <article key={product.id} className="rounded-lg border border-gold/20 bg-wood/35 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <h3 className="font-black text-white">{product.name}</h3>
                      <span className="shrink-0 font-black text-gold">{money(product.price)}</span>
                    </div>
                    <p className="mt-2 text-sm leading-relaxed text-cream/70">{product.description}</p>
                    <button
                      disabled={!canChooseProducts}
                      className="mt-4 flex w-full items-center justify-center gap-2 rounded-md bg-gold px-4 py-3 font-bold text-coal disabled:cursor-not-allowed disabled:opacity-45"
                      onClick={() => addProduct(product)}
                    >
                      <Plus size={18} /> {canChooseProducts ? "Adicionar" : "Preencha os dados primeiro"}
                    </button>
                  </article>
                ))}
              </div>
            </div>
          ))}
        </div>

        <aside id="cart" className="scroll-mt-4 border-t border-gold/25 bg-coal/95 p-4 backdrop-blur lg:sticky lg:top-6 lg:h-fit lg:rounded-lg lg:border lg:p-5">
          <div className="flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-xl font-black text-white"><ShoppingBag size={22} /> Carrinho</h2>
            <span className="text-sm text-cream/65">{totalPizzas} pizzas</span>
          </div>
          <div className="mt-4 max-h-72 space-y-3 overflow-auto pr-1">
            {!cart.length && <p className="text-sm text-cream/65">Seu carrinho está vazio.</p>}
            {cart.map((item, index) => (
              <div key={`${item.product.id}-${index}`} className="rounded-md border border-gold/15 bg-wood/35 p-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-bold text-white">{item.product.name}</p>
                    <p className="text-sm text-cream/60">{money(item.product.price)}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button className="rounded bg-wood/70 p-2" onClick={() => updateQuantity(item.lineId, -1)}><Minus size={14} /></button>
                    <span className="w-6 text-center font-bold">{item.quantity}</span>
                    <button className="rounded bg-wood/70 p-2" onClick={() => updateQuantity(item.lineId, 1)}><Plus size={14} /></button>
                  </div>
                </div>
                {item.product.category === "combo" && (
                  <div className="mt-3 space-y-2">
                    {item.saltyChoices?.map((choice, choiceIndex) => (
                      <select key={`s-${choiceIndex}`} className="w-full rounded border border-gold/20 bg-coal/60 px-3 py-2 text-sm" value={choice} onChange={(event) => updateComboChoice(index, "saltyChoices", choiceIndex, event.target.value)}>
                        {salty.map((product) => <option key={product.id}>{product.name}</option>)}
                      </select>
                    ))}
                    {item.sweetChoices?.map((choice, choiceIndex) => (
                      <select key={`d-${choiceIndex}`} className="w-full rounded border border-gold/20 bg-coal/60 px-3 py-2 text-sm" value={choice} onChange={(event) => updateComboChoice(index, "sweetChoices", choiceIndex, event.target.value)}>
                        {sweet.map((product) => <option key={product.id}>{product.name}</option>)}
                      </select>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
          <div className="mt-4 border-t border-gold/20 pt-4">
            <div className="flex justify-between text-sm text-cream/70"><span>Total de pizzas</span><strong>{totalPizzas}</strong></div>
            <div className="mt-1 flex justify-between text-lg font-black text-white"><span>Total</span><span>{money(totalAmount)}</span></div>
            {error && <p className="mt-3 rounded-md border border-gold/30 bg-coal/65 px-3 py-2 text-sm text-gold">{error}</p>}
            <button disabled={loading} className="mt-4 w-full rounded-md bg-gold px-4 py-4 font-black text-coal disabled:cursor-not-allowed disabled:opacity-50" onClick={finishOrder}>
              {loading ? "Finalizando..." : "Finalizar pedido"}
            </button>
          </div>
        </aside>
      </section>
      {cart.length > 0 && (
        <button
          className="fixed bottom-4 right-4 z-50 flex items-center gap-2 rounded-full border border-gold/40 bg-gold px-4 py-3 font-black text-coal shadow-glow lg:hidden"
          onClick={scrollToCart}
        >
          <ShoppingBag size={20} />
          Ver carrinho
          <span className="rounded-full bg-coal px-2 py-0.5 text-xs text-gold">
            {totalPizzas > 0 ? `${totalPizzas} pizza${totalPizzas === 1 ? "" : "s"}` : `${totalCartItems} item${totalCartItems === 1 ? "" : "s"}`}
          </span>
        </button>
      )}
    </main>
  );
}
