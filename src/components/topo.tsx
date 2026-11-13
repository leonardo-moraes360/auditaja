import Link from "next/link";
import { Suspense } from "react";
import { BotaoTema } from "./botao-tema";
import { NavPrincipal, NavPrincipalEstatica } from "./nav-principal";
import { TopoMovel } from "./topo-movel";

function Logo() {
  return (
    <Link href="/" className="flex items-center gap-2 text-foreground no-underline hover:text-foreground sm:gap-2.5">
      {/* Logo: "A" de Auditaja com visto no lugar do traço (proposta B). Mesmo desenho do favicon, em tokens. */}
      <svg viewBox="0 0 64 64" aria-hidden="true" className="size-6 sm:size-7">
        <rect width="64" height="64" rx="14" className="fill-primary" />
        <g className="stroke-primary-foreground" fill="none" strokeLinecap="round" strokeLinejoin="round">
          <path d="M15 49 32 13 49 49" strokeWidth="7.5" />
          <path d="M23 38l6 5.5L41.5 30" strokeWidth="5.5" />
        </g>
      </svg>
      <span className="font-heading text-[1.1875rem] font-bold tracking-normal sm:text-[1.375rem] sm:tracking-[-0.02em]">
        Auditaja
      </span>
    </Link>
  );
}

function Busca({ id }: { id: string }) {
  return (
    <form action="/parlamentares" role="search" aria-label="Busca rápida" className="w-full">
      <label htmlFor={id} className="sr-only">
        Buscar parlamentar
      </label>
      <input
        id={id}
        name="q"
        type="search"
        placeholder="Buscar parlamentar ou estado"
        className="h-11 w-full rounded-[10px] border border-input bg-superficie px-3.5 text-base"
      />
    </form>
  );
}

function Menu() {
  // usePathname é dado de request: com Cache Components precisa de Suspense.
  return (
    <Suspense fallback={<NavPrincipalEstatica />}>
      <NavPrincipal />
    </Suspense>
  );
}

export function Topo() {
  return (
    <header className="border-b bg-superficie">
      {/* Faixa da bandeira: única área com verde e amarelo (azul 50%, verde 25%, amarelo 25%). */}
      <div aria-hidden="true" className="flex h-1">
        <div className="flex-[2] bg-azul-bandeira" />
        <div className="flex-1 bg-verde-bandeira" />
        <div className="flex-1 bg-amarelo-bandeira" />
      </div>
      {/* Desktop: logo, menu e busca numa linha (protótipo, Main.dc.html). */}
      <div className="mx-auto hidden max-w-[1248px] flex-wrap items-center gap-x-8 gap-y-4 px-6 py-3.5 sm:flex">
        <Logo />
        <Menu />
        <div className="ml-auto max-w-[360px] flex-[1_1_260px]">
          <Busca id="busca-topo" />
        </div>
        <BotaoTema />
      </div>
      {/* Celular: logo e botões de ícone; menu e busca abrem sob demanda (Mobile.dc.html). */}
      <TopoMovel
        logo={<Logo />}
        menu={
          <>
            <Menu />
            <BotaoTema className="my-2" />
          </>
        }
        busca={<Busca id="busca-topo-movel" />}
      />
    </header>
  );
}
