import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Pizzas Artesanais para Formatura da M4",
  description: "Pre-venda de pizzas artesanais no forno a lenha para arrecadacao da formatura da M4."
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
