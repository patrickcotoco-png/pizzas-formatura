"use client";

import { Download, FileSpreadsheet, FileText, Minus, Plus, RefreshCw, Search, ShieldCheck } from "lucide-react";
import { useMemo, useState } from "react";
import { BEVERAGE_NAMES, money } from "@/lib/menu";
import { Order, TimeSlot } from "@/lib/types";

const paymentStatuses = ["pendente", "pago", "confirmado"];
const orderStatuses = ["recebido", "em preparo", "pronto", "entregue", "cancelado"];

export default function AdminPage() {
  const [password, setPassword] = useState("");
  const [orders, setOrders] = useState<Order[]>([]);
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [error, setError] = useState("");
  const [filters, setFilters] = useState({
    event_date: "",
    round: "",
    pickup_time: "",
    payment_status: "",
    order_status: ""
  });

  async function loadPanel() {
    setError("");
    const response = await fetch("/api/admin/orders", { headers: { "x-admin-password": password } });
    const data = await response.json();
    if (!response.ok) {
      setError(data.message ?? "Erro ao acessar painel.");
      return;
    }
    setOrders(data.orders ?? []);
    setSlots(data.slots ?? []);
  }

  async function updateOrder(order: Order, patch: Partial<Order>) {
    const response = await fetch("/api/admin/orders", {
      method: "PATCH",
      headers: { "Content-Type": "application/json", "x-admin-password": password },
      body: JSON.stringify({ ...order, ...patch })
    });
    const data = await response.json();
    if (!response.ok) {
      setError(data.message ?? "Erro ao atualizar pedido.");
      return;
    }
    setOrders((current) => current.map((item) => (item.id === order.id ? data.order : item)));
    setSlots(data.slots ?? slots);
  }

  async function updateSlotLimit(slot: TimeSlot, delta: number) {
    setError("");
    const nextMaxPizzas = slot.max_pizzas + delta;
    if (nextMaxPizzas < slot.current_pizzas) {
      setError("O limite não pode ficar menor que a quantidade já vendida neste horário.");
      return;
    }

    const response = await fetch("/api/admin/orders", {
      method: "PATCH",
      headers: { "Content-Type": "application/json", "x-admin-password": password },
      body: JSON.stringify({ type: "slot", id: slot.id, max_pizzas: nextMaxPizzas })
    });
    const data = await response.json();
    if (!response.ok) {
      setError(data.message ?? "Erro ao atualizar limite do horário.");
      return;
    }
    setSlots(data.slots ?? slots);
  }

  const filteredOrders = orders.filter((order) =>
    Object.entries(filters).every(([key, value]) => !value || order[key as keyof Order] === value)
  );

  const summary = useMemo(() => {
    const active = orders.filter((order) => order.order_status !== "cancelado");
    const paid = active.filter((order) => order.payment_status === "pago" || order.payment_status === "confirmado");
    const flavorMap = new Map<string, number>();
    const drinkMap = new Map<string, number>();
    const roundMap = new Map<string, number>();

    active.forEach((order) => {
      roundMap.set(`${order.event_date} • ${order.round}`, (roundMap.get(`${order.event_date} • ${order.round}`) ?? 0) + order.total_pizzas);
      order.items.forEach((item) => {
        if (item.product.category === "bebida") {
          drinkMap.set(item.product.name, (drinkMap.get(item.product.name) ?? 0) + item.quantity);
        } else if (item.product.category === "combo") {
          item.saltyChoices?.forEach((choice) => flavorMap.set(choice, (flavorMap.get(choice) ?? 0) + item.quantity));
          item.sweetChoices?.forEach((choice) => flavorMap.set(choice, (flavorMap.get(choice) ?? 0) + item.quantity));
        } else {
          flavorMap.set(item.product.name, (flavorMap.get(item.product.name) ?? 0) + item.quantity);
        }
      });
    });

    return {
      totalSold: active.reduce((sum, order) => sum + Number(order.total_amount), 0),
      totalPaid: paid.reduce((sum, order) => sum + Number(order.total_amount), 0),
      totalPending: active
        .filter((order) => order.payment_status === "pendente")
        .reduce((sum, order) => sum + Number(order.total_amount), 0),
      flavors: Array.from(flavorMap.entries()),
      drinks: Array.from(drinkMap.entries()),
      rounds: Array.from(roundMap.entries())
    };
  }, [orders]);

  function describeItems(order: Order) {
    return order.items
      .map((item) => {
        const choices = [
          item.saltyChoices?.length ? `Salgadas: ${item.saltyChoices.join(", ")}` : "",
          item.sweetChoices?.length ? `Doce: ${item.sweetChoices.join(", ")}` : ""
        ].filter(Boolean);
        return `${item.quantity}x ${item.product.name}${choices.length ? ` (${choices.join(" | ")})` : ""}`;
      })
      .join("; ");
  }

  function addToSummary(map: Map<string, { quantity: number; revenue: number }>, name: string, quantity: number, revenue: number) {
    const current = map.get(name) ?? { quantity: 0, revenue: 0 };
    map.set(name, { quantity: current.quantity + quantity, revenue: current.revenue + revenue });
  }

  function buildExportData(sourceOrders: Order[]) {
    const activeOrders = sourceOrders.filter((order) => order.order_status !== "cancelado");
    const canceledOrders = sourceOrders.filter((order) => order.order_status === "cancelado");
    const paidOrders = activeOrders.filter((order) => order.payment_status === "pago" || order.payment_status === "confirmado");
    const pendingOrders = activeOrders.filter((order) => order.payment_status === "pendente");
    const productSummary = new Map<string, { quantity: number; revenue: number }>();
    const beverageTotals = new Map<string, number>(BEVERAGE_NAMES.map((name) => [name, 0]));
    const byDay = new Map<string, number>();
    const byRound = new Map<string, number>();
    const byTime = new Map<string, number>();

    activeOrders.forEach((order) => {
      byDay.set(order.event_date, (byDay.get(order.event_date) ?? 0) + order.total_pizzas);
      byRound.set(`${order.event_date} • ${order.round}`, (byRound.get(`${order.event_date} • ${order.round}`) ?? 0) + order.total_pizzas);
      byTime.set(
        `${order.event_date} • ${order.round} • ${order.pickup_time}`,
        (byTime.get(`${order.event_date} • ${order.round} • ${order.pickup_time}`) ?? 0) + order.total_pizzas
      );

      order.items.forEach((item) => {
        const itemRevenue = Number(item.product.price) * item.quantity;
        if (item.product.category === "combo") {
          const choices = [...(item.saltyChoices ?? []), ...(item.sweetChoices ?? [])];
          const revenuePerPizza = item.product.pizza_count > 0 ? itemRevenue / item.product.pizza_count : 0;
          choices.forEach((choice) => addToSummary(productSummary, choice, item.quantity, revenuePerPizza * item.quantity));
        } else {
          addToSummary(productSummary, item.product.name, item.quantity, itemRevenue);
          if (item.product.category === "bebida" && beverageTotals.has(item.product.name)) {
            beverageTotals.set(item.product.name, (beverageTotals.get(item.product.name) ?? 0) + item.quantity);
          }
        }
      });
    });

    return {
      ordersSheet: sourceOrders.map((order) => ({
        "Número do pedido": order.order_number,
        "Data/hora do pedido": new Date(order.created_at).toLocaleString("pt-BR"),
        Nome: order.customer_name,
        WhatsApp: order.whatsapp,
        Dia: order.event_date,
        Rodada: order.round,
        "Horário de retirada": order.pickup_time,
        "Itens do pedido": describeItems(order),
        "Total de pizzas": order.total_pizzas,
        "Valor total": Number(order.total_amount),
        "Status do pagamento": order.payment_status,
        "Status do pedido": order.order_status,
        Observações: order.notes ?? ""
      })),
      productSummary: Array.from(productSummary.entries()).map(([name, values]) => ({
        "Produto/sabor": name,
        "Quantidade vendida": values.quantity,
        "Faturamento total": Number(values.revenue.toFixed(2))
      })),
      generalSummary: [
        ["Total de pedidos", sourceOrders.length],
        ["Total de pizzas vendidas", activeOrders.reduce((sum, order) => sum + order.total_pizzas, 0)],
        ...BEVERAGE_NAMES.map((name) => [`Total de ${name}`, beverageTotals.get(name) ?? 0]),
        ["Faturamento total", activeOrders.reduce((sum, order) => sum + Number(order.total_amount), 0)],
        ["Total pago", paidOrders.reduce((sum, order) => sum + Number(order.total_amount), 0)],
        ["Total pendente", pendingOrders.reduce((sum, order) => sum + Number(order.total_amount), 0)],
        ["Total cancelado", canceledOrders.reduce((sum, order) => sum + Number(order.total_amount), 0)],
        [""],
        ["Quantidade por dia"],
        ...Array.from(byDay.entries()).map(([label, value]) => [label, value]),
        [""],
        ["Quantidade por rodada"],
        ...Array.from(byRound.entries()).map(([label, value]) => [label, value]),
        [""],
        ["Quantidade por horário"],
        ...Array.from(byTime.entries()).map(([label, value]) => [label, value])
      ]
    };
  }

  async function exportExcel() {
    setError("");
    try {
      const XLSX = await import("xlsx");
      const exportData = buildExportData(filteredOrders);
      const workbook = XLSX.utils.book_new();
      const ordersSheet = XLSX.utils.json_to_sheet(exportData.ordersSheet);
      const productSheet = XLSX.utils.json_to_sheet(exportData.productSummary);
      const generalSheet = XLSX.utils.aoa_to_sheet(exportData.generalSummary);

      ordersSheet["!cols"] = [
        { wch: 16 }, { wch: 22 }, { wch: 28 }, { wch: 16 }, { wch: 10 }, { wch: 12 }, { wch: 18 },
        { wch: 60 }, { wch: 15 }, { wch: 14 }, { wch: 20 }, { wch: 18 }, { wch: 30 }
      ];
      productSheet["!cols"] = [{ wch: 34 }, { wch: 20 }, { wch: 18 }];
      generalSheet["!cols"] = [{ wch: 34 }, { wch: 18 }];

      XLSX.utils.book_append_sheet(workbook, ordersSheet, "Pedidos");
      XLSX.utils.book_append_sheet(workbook, productSheet, "Resumo por sabor");
      XLSX.utils.book_append_sheet(workbook, generalSheet, "Resumo geral");
      XLSX.writeFile(workbook, `pedidos-pizzas-${new Date().toISOString().slice(0, 10)}.xlsx`);
    } catch (caught) {
      console.warn("[Admin] Falha ao exportar Excel:", caught);
      setError("Não foi possível exportar o Excel. Tente exportar CSV ou recarregar o painel.");
    }
  }

  function exportCsv() {
    const { ordersSheet } = buildExportData(filteredOrders);
    const headers = Object.keys(ordersSheet[0] ?? {
      "Número do pedido": "",
      "Data/hora do pedido": "",
      Nome: "",
      WhatsApp: "",
      Dia: "",
      Rodada: "",
      "Horário de retirada": "",
      "Itens do pedido": "",
      "Total de pizzas": "",
      "Valor total": "",
      "Status do pagamento": "",
      "Status do pedido": "",
      Observações: ""
    });
    const escape = (value: unknown) => `"${String(value ?? "").replace(/"/g, '""')}"`;
    const csv = [
      headers.join(","),
      ...ordersSheet.map((row) => headers.map((header) => escape(row[header as keyof typeof row])).join(","))
    ].join("\r\n");
    const blob = new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `pedidos-pizzas-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <main className="mx-auto min-h-screen max-w-7xl px-5 py-8">
      <header className="flex flex-col gap-4 border-b border-gold/20 pb-6 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="flex items-center gap-2 text-sm uppercase tracking-[0.2em] text-gold"><ShieldCheck size={16} /> Painel admin</p>
          <h1 className="mt-2 text-3xl font-black text-white">Pedidos da pré-venda</h1>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <input className="rounded-md border border-gold/20 bg-coal/55 px-4 py-3" type="password" placeholder="Senha admin" value={password} onChange={(event) => setPassword(event.target.value)} />
          <button className="flex items-center justify-center gap-2 rounded-md bg-gold px-4 py-3 font-bold text-coal" onClick={loadPanel}>
            <RefreshCw size={18} /> Carregar
          </button>
        </div>
      </header>

      {error && <p className="mt-4 rounded-md border border-gold/30 bg-coal/65 px-4 py-3 text-gold">{error}</p>}

      <section className="mt-6 grid gap-3 sm:grid-cols-3">
        <Metric label="Total vendido" value={money(summary.totalSold)} />
        <Metric label="Total pago" value={money(summary.totalPaid)} />
        <Metric label="Total pendente" value={money(summary.totalPending)} />
      </section>

      <section className="mt-6 grid gap-4 lg:grid-cols-4">
        <Panel title="Pizzas por sabor" rows={summary.flavors} />
        <Panel title="Bebidas" rows={summary.drinks} />
        <Panel title="Total por rodada" rows={summary.rounds} />
        <div className="rounded-lg border border-gold/20 bg-wood/30 p-4">
          <h2 className="mb-3 font-black text-white">Vagas por horário</h2>
          <div className="space-y-2 text-sm">
            {slots.map((slot) => (
              <div key={slot.id} className="rounded-md border border-gold/15 bg-coal/35 p-2">
                <div className="flex justify-between gap-3">
                  <span>{slot.event_date} • {slot.round} • {slot.pickup_time}</span>
                  <strong className="text-gold">{slot.max_pizzas - slot.current_pizzas} vagas</strong>
                </div>
                <div className="mt-2 flex items-center justify-between gap-2 text-xs text-cream/70">
                  <span>{slot.current_pizzas}/{slot.max_pizzas} pizzas</span>
                  <div className="flex gap-2">
                    <button
                      className="rounded border border-gold/25 bg-coal/60 p-2 text-white disabled:cursor-not-allowed disabled:opacity-40"
                      disabled={slot.max_pizzas <= slot.current_pizzas}
                      onClick={() => updateSlotLimit(slot, -1)}
                      title="Diminuir limite do horário"
                    >
                      <Minus size={14} />
                    </button>
                    <button
                      className="rounded bg-gold p-2 text-coal"
                      onClick={() => updateSlotLimit(slot, 1)}
                      title="Aumentar limite do horário"
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mt-6 rounded-lg border border-gold/20 bg-wood/30 p-4">
        <div className="mb-4 flex items-center gap-2 text-white">
          <Search size={18} />
          <h2 className="font-black">Filtros</h2>
        </div>
        <div className="grid gap-3 sm:grid-cols-5">
          {Object.keys(filters).map((key) => (
            <select
              key={key}
              className="rounded-md border border-gold/20 bg-coal/55 px-3 py-3"
              value={filters[key as keyof typeof filters]}
              onChange={(event) => setFilters((current) => ({ ...current, [key]: event.target.value }))}
            >
              <option value="">{key.replace("_", " ")}</option>
              {Array.from(new Set(orders.map((order) => String(order[key as keyof Order])))).filter(Boolean).map((value) => (
                <option key={value}>{value}</option>
              ))}
            </select>
          ))}
        </div>
        <div className="mt-4 flex flex-col gap-2 sm:flex-row">
          <button className="flex items-center justify-center gap-2 rounded-md bg-gold px-4 py-3 font-bold text-coal" onClick={exportExcel}>
            <FileSpreadsheet size={18} /> Exportar Excel
          </button>
          <button className="flex items-center justify-center gap-2 rounded-md border border-gold/30 bg-wood/40 px-4 py-3 font-bold text-white" onClick={exportCsv}>
            <FileText size={18} /> Exportar CSV
          </button>
          <span className="flex items-center gap-2 text-sm text-cream/60">
            <Download size={16} /> Exporta {filteredOrders.length} pedidos filtrados
          </span>
        </div>
      </section>

      <section className="mt-6 space-y-4">
        {filteredOrders.map((order) => (
          <article key={order.id} className="rounded-lg border border-gold/20 bg-wood/30 p-4">
            <div className="grid gap-4 lg:grid-cols-[1fr_260px]">
              <div>
                <div className="flex flex-wrap items-center gap-3">
                  <h3 className="text-xl font-black text-white">{order.order_number}</h3>
                  <span className="rounded border border-gold/20 bg-coal/55 px-2 py-1 text-sm">{order.event_date} • {order.round} • {order.pickup_time}</span>
                </div>
                <p className="mt-2 text-cream/80">{order.customer_name} • WhatsApp: {order.whatsapp}</p>
                <div className="mt-3 space-y-2 text-sm text-cream/75">
                  {order.items.map((item, index) => (
                    <div key={`${order.id}-${index}`}>
                      <strong>{item.quantity}x {item.product.name}</strong>
                      {item.saltyChoices?.length ? <span> • Salgadas: {item.saltyChoices.join(", ")}</span> : null}
                      {item.sweetChoices?.length ? <span> • Doce: {item.sweetChoices.join(", ")}</span> : null}
                    </div>
                  ))}
                </div>
                <p className="mt-3 text-sm text-cream/60">Observações: {order.notes || "Nenhuma"}</p>
                <p className="mt-1 text-sm text-cream/60">Criado em: {new Date(order.created_at).toLocaleString("pt-BR")}</p>
              </div>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <Metric label="Pizzas" value={String(order.total_pizzas)} compact />
                  <Metric label="Total" value={money(Number(order.total_amount))} compact />
                </div>
                <select className="w-full rounded-md border border-gold/20 bg-coal/55 px-3 py-3" value={order.payment_status} onChange={(event) => updateOrder(order, { payment_status: event.target.value as Order["payment_status"] })}>
                  {paymentStatuses.map((status) => <option key={status}>{status}</option>)}
                </select>
                <select className="w-full rounded-md border border-gold/20 bg-coal/55 px-3 py-3" value={order.order_status} onChange={(event) => updateOrder(order, { order_status: event.target.value as Order["order_status"] })}>
                  {orderStatuses.map((status) => <option key={status}>{status}</option>)}
                </select>
              </div>
            </div>
          </article>
        ))}
      </section>
    </main>
  );
}

function Metric({ label, value, compact = false }: { label: string; value: string; compact?: boolean }) {
  return (
    <div className={`rounded-lg border border-gold/20 bg-wood/30 ${compact ? "p-3" : "p-4"}`}>
      <p className="text-xs uppercase tracking-[0.16em] text-cream/55">{label}</p>
      <p className="mt-1 text-xl font-black text-gold">{value}</p>
    </div>
  );
}

function Panel({ title, rows }: { title: string; rows: [string, number][] }) {
  return (
    <div className="rounded-lg border border-gold/20 bg-wood/30 p-4">
      <h2 className="mb-3 font-black text-white">{title}</h2>
      <div className="space-y-2 text-sm">
        {rows.length === 0 && <p className="text-cream/55">Sem dados.</p>}
        {rows.map(([label, value]) => (
          <div key={label} className="flex justify-between gap-3">
            <span>{label}</span>
            <strong className="text-gold">{value}</strong>
          </div>
        ))}
      </div>
    </div>
  );
}
