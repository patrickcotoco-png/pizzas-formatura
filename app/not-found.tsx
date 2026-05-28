import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center px-5">
      <section className="wood-panel max-w-lg rounded-lg border border-gold/25 p-6 text-center">
        <p className="text-sm uppercase tracking-[0.22em] text-gold">Página não encontrada</p>
        <h1 className="mt-3 text-3xl font-black text-white">Essa fornada não existe.</h1>
        <p className="mt-3 text-cream/75">Volte para o cardápio e escolha seu horário de retirada.</p>
        <Link className="mt-6 inline-flex rounded-md bg-gold px-5 py-3 font-bold text-coal" href="/">
          Voltar ao cardápio
        </Link>
      </section>
    </main>
  );
}
