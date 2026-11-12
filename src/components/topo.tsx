import Link from "next/link";
import { Suspense } from "react";
import { NavPrincipal, NavPrincipalEstatica } from "./nav-principal";
import { TopoMovel } from "./topo-movel";

function Logo() {
  return (
    <Link href="/" className="flex items-center gap-2 text-foreground no-underline hover:text-foreground sm:gap-2.5">
      <svg viewBox="0 0 28 28" aria-hidden="true" className="size-6 sm:size-7">
        <rect x="1" y="1" width="26" height="26" rx="7" className="fill-primary" />
        <path
          d="M8 15l4 4 8-9"
          stroke="#fff"
          strokeWidth="2.5"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <span className="font-heading text-[19px] font-bold tracking-normal sm:text-[22px] sm:tracking-[-0.02em]">
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
        placeholder="Buscar deputado ou senador por nome ou UF"
        className="h-11 w-full rounded-[10px] border border-input bg-campo px-3.5 text-sm"
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
      {/* Desktop: logo, menu e busca numa linha (protótipo, Main.dc.html). */}
      <div className="mx-auto hidden max-w-[1248px] flex-wrap items-center gap-x-8 gap-y-4 px-6 py-3.5 sm:flex">
        <Logo />
        <Menu />
        <div className="ml-auto max-w-[360px] flex-[1_1_260px]">
          <Busca id="busca-topo" />
        </div>
      </div>
      {/* Celular: logo e botões de ícone; menu e busca abrem sob demanda (Mobile.dc.html). */}
      <TopoMovel logo={<Logo />} menu={<Menu />} busca={<Busca id="busca-topo-movel" />} />
    </header>
  );
}
