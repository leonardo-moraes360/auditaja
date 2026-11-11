import Link from "next/link";
import { Suspense } from "react";
import { NavPrincipal, NavPrincipalEstatica } from "./nav-principal";

export function Topo() {
  return (
    <header className="border-b bg-superficie">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-8 gap-y-3 px-4 py-3">
        <Link href="/" className="flex items-center gap-2.5 text-foreground no-underline">
          <svg width="28" height="28" viewBox="0 0 28 28" aria-hidden="true">
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
          <span className="font-heading text-[22px] font-bold tracking-tight">Auditaja</span>
        </Link>
        {/* usePathname é dado de request: com Cache Components precisa de Suspense. */}
        <Suspense fallback={<NavPrincipalEstatica />}>
          <NavPrincipal />
        </Suspense>
        <form
          action="/parlamentares"
          role="search"
          aria-label="Busca rápida"
          className="ml-auto flex w-full gap-2 sm:w-auto"
        >
          <label htmlFor="busca-topo" className="sr-only">
            Buscar parlamentar
          </label>
          <input
            id="busca-topo"
            name="q"
            type="search"
            placeholder="Buscar deputado por nome ou UF"
            className="h-9 w-full rounded-md border border-input bg-white px-3 text-sm sm:w-72"
          />
        </form>
      </div>
    </header>
  );
}
