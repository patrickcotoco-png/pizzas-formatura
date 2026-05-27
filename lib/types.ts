export type Category = "salgada" | "doce" | "bebida" | "combo";

export type Product = {
  id: string;
  name: string;
  category: Category;
  price: number;
  description: string;
  pizza_count: number;
  active: boolean;
};

export type TimeSlot = {
  id: string;
  event_date: string;
  round: string;
  pickup_time: string;
  max_pizzas: number;
  current_pizzas: number;
};

export type CartItem = {
  lineId?: string;
  product: Product;
  quantity: number;
  saltyChoices?: string[];
  sweetChoices?: string[];
};

export type Order = {
  id: string;
  order_number: string;
  customer_name: string;
  whatsapp: string;
  event_date: string;
  round: string;
  pickup_time: string;
  items: CartItem[];
  total_pizzas: number;
  total_amount: number;
  payment_status: "pendente" | "pago" | "confirmado";
  order_status: "recebido" | "em preparo" | "pronto" | "entregue" | "cancelado";
  notes: string | null;
  created_at: string;
};
