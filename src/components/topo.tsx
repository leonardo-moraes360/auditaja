import Link from "next/link";

export function Topo() {
  return (
    <header className="border-b bg-superficie">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-8 gap-y-3 px-4 py-3">
        <Link href="/" className="font-heading text-xl font-bold tracking-tight text-foreground no-underline">
          Auditaja
        </Link>
        <nav aria-label="Principal" className="flex flex-wrap gap-x-5 gap-y-1 text-sm">
          <Link className="text-muted-foreground hover:text-foreground" href="/parlamentares">
            Parlamentares
          </Link>
          <Link className="text-muted-foreground hover:text-foreground" href="/metodologia">
            Metodologia
          </Link>
          <Link className="text-muted-foreground hover:text-foreground" href="/fontes">
            Fontes
          </Link>
        </nav>
        <form action="/parlamentares" role="search" className="ml-auto flex w-full gap-2 sm:w-auto">
          <label htmlFor="busca-topo" className="sr-only">
            Buscar parlamentar
          </label>
          <input
            id="busca-topo"
            name="q"
            type="search"
            placeholder="Buscar parlamentar"
            className="h-9 w-full rounded-md border border-input bg-white px-3 text-sm sm:w-64"
          />
        </form>
      </div>
    </header>
  );
}
