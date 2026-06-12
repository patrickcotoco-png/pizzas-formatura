import { Product } from "@/lib/types";

export const PIX_KEY = "ab760ff6-b3e3-4de4-b86c-4ae181df237f";

export const EVENT_DATES = ["13/06", "14/06"];

export const ROUNDS = [
  { day: "13/06", label: "Almoço", range: "12:00 às 13:30" },
  { day: "13/06", label: "Saída", range: "17:30 às 18:30" },
  { day: "14/06", label: "Almoço", range: "12:00 às 13:30" },
  { day: "14/06", label: "Saída", range: "17:30 às 18:30" }
];

export const PICKUP_TIMES_BY_ROUND = {
  Almoço: ["12:00", "12:15", "12:30", "12:45", "13:00", "13:15"],
  Saída: ["17:30", "17:45", "18:00", "18:15", "18:30"]
} as const;

export const BEVERAGE_NAMES = [
  "Coca-Cola lata",
  "Coca-Cola Zero lata",
  "Pepsi lata",
  "Guaraná Antarctica lata",
  "Fanta lata",
  "Coca-Cola 2L",
  "Coca-Cola Zero 2L",
  "Guaraná Antarctica 2L"
];

export const MENU: Product[] = [
  {
    id: "11111111-1111-4111-8111-111111111111",
    name: "Calabresa",
    category: "salgada",
    price: 35,
    description:
      "Massa artesanal de longa fermentação natural, molho de tomate, muçarela, calabresa selecionada, cebola e orégano.",
    pizza_count: 1,
    active: true
  },
  {
    id: "22222222-2222-4222-8222-222222222222",
    name: "Marguerita",
    category: "salgada",
    price: 35,
    description:
      "Massa artesanal de longa fermentação natural, molho de tomate, muçarela, tomate cereja, manjericão ou orégano e fio de azeite.",
    pizza_count: 1,
    active: true
  },
  {
    id: "33333333-3333-4333-8333-333333333333",
    name: "Frango com Catupiry original",
    category: "salgada",
    price: 40,
    description:
      "Massa artesanal de longa fermentação natural, molho de tomate, muçarela, frango temperado e Catupiry original.",
    pizza_count: 1,
    active: true
  },
  {
    id: "44444444-4444-4444-8444-444444444444",
    name: "Lombo canadense com Catupiry original",
    category: "salgada",
    price: 40,
    description:
      "Massa artesanal de longa fermentação natural, molho de tomate, muçarela, lombo canadense e Catupiry original.",
    pizza_count: 1,
    active: true
  },
  {
    id: "55555555-5555-4555-8555-555555555555",
    name: "Bacon, brócolis e Catupiry original",
    category: "salgada",
    price: 40,
    description:
      "Massa artesanal de longa fermentação natural, molho de tomate, muçarela, bacon dourado, brócolis e Catupiry original.",
    pizza_count: 1,
    active: true
  },
  {
    id: "66666666-6666-4666-8666-666666666666",
    name: "Vegetariana da Casa",
    category: "salgada",
    price: 40,
    description:
      "Massa artesanal de longa fermentação natural, molho de tomate, muçarela, tomate cereja, brócolis, milho, azeitona, orégano e fio de azeite.",
    pizza_count: 1,
    active: true
  },
  {
    id: "77777777-7777-4777-8777-777777777777",
    name: "Brigadeiro artesanal",
    category: "doce",
    price: 35,
    description:
      "Massa artesanal de longa fermentação natural com brigadeiro artesanal da casa e raspas de chocolate.",
    pizza_count: 1,
    active: true
  },
  {
    id: "88888888-8888-4888-8888-888888888888",
    name: "Doce de leite com banana e canela",
    category: "doce",
    price: 35,
    description:
      "Massa artesanal de longa fermentação natural, doce de leite cremoso, banana e toque de canela.",
    pizza_count: 1,
    active: true
  },
  {
    id: "d1111111-1111-4111-8111-111111111111",
    name: "Coca-Cola lata",
    category: "bebida",
    price: 6,
    description: "Coca-Cola gelada em lata.",
    pizza_count: 0,
    active: true
  },
  {
    id: "d2222222-2222-4222-8222-222222222222",
    name: "Coca-Cola Zero lata",
    category: "bebida",
    price: 6,
    description: "Coca-Cola Zero gelada em lata.",
    pizza_count: 0,
    active: true
  },
  {
    id: "d3333333-3333-4333-8333-333333333333",
    name: "Pepsi lata",
    category: "bebida",
    price: 6,
    description: "Pepsi gelada em lata.",
    pizza_count: 0,
    active: true
  },
  {
    id: "d4444444-4444-4444-8444-444444444444",
    name: "Guaraná Antarctica lata",
    category: "bebida",
    price: 6,
    description: "Guaraná Antarctica gelado em lata.",
    pizza_count: 0,
    active: true
  },
  {
    id: "d5555555-5555-4555-8555-555555555555",
    name: "Fanta lata",
    category: "bebida",
    price: 6,
    description: "Fanta gelada em lata.",
    pizza_count: 0,
    active: true
  },
  {
    id: "d6666666-6666-4666-8666-666666666666",
    name: "Coca-Cola 2L",
    category: "bebida",
    price: 15,
    description: "Coca-Cola 2 litros para compartilhar.",
    pizza_count: 0,
    active: true
  },
  {
    id: "d7777777-7777-4777-8777-777777777777",
    name: "Coca-Cola Zero 2L",
    category: "bebida",
    price: 15,
    description: "Coca-Cola Zero 2 litros para compartilhar.",
    pizza_count: 0,
    active: true
  },
  {
    id: "d8888888-8888-4888-8888-888888888888",
    name: "Guaraná Antarctica 2L",
    category: "bebida",
    price: 15,
    description: "Guaraná Antarctica 2 litros para compartilhar.",
    pizza_count: 0,
    active: true
  },
  {
    id: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
    name: "Combo Família",
    category: "combo",
    price: 109.9,
    description: "Inclui 3 pizzas salgadas. Escolha 3 sabores salgados.",
    pizza_count: 3,
    active: true
  },
  {
    id: "cccccccc-cccc-4ccc-8ccc-cccccccccccc",
    name: "Combo Família Doce",
    category: "combo",
    price: 139.9,
    description: "Inclui 3 pizzas salgadas + 1 pizza doce. Escolha 3 sabores salgados e 1 sabor doce.",
    pizza_count: 4,
    active: true
  }
];

export const money = (value: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
