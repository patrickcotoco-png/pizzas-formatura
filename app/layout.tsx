import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Pizzas Artesanais de Formatura",
  description: "Pre-venda de pizzas artesanais no forno a lenha para arrecadacao de formatura."
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
