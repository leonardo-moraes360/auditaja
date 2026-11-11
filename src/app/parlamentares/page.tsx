import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { buscarParlamentares, ufsDisponiveis } from "@/data/perfil";
import { FotoParlamentar } from "@/components/perfil/foto";

export const metadata: Metadata = { title: "Parlamentares" };

export default async function Parlamentares({ searchParams }: PageProps<"/parlamentares">) {
  await connection();
  const sp = await searchParams;
  const q = typeof sp.q === "string" ? sp.q : "";
  const uf = typeof sp.uf === "string" && /^[A-Z]{2}$/.test(sp.uf) ? sp.uf : "";
  const [lista, ufs] = await Promise.all([buscarParlamentares({ q, uf }), ufsDisponiveis()]);

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-8">
      <h1 className="font-heading text-3xl font-bold">Deputados federais em exercício</h1>
      <form className="flex flex-wrap items-end gap-3" role="search">
        <div className="flex min-w-60 flex-1 flex-col gap-1">
          <label htmlFor="q" className="text-sm font-medium">
            Nome
          </label>
          <input
            id="q"
            name="q"
            defaultValue={q}
            type="search"
            className="h-10 rounded-md border border-input bg-white px-3"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="uf" className="text-sm font-medium">
            UF
          </label>
          <select id="uf" name="uf" defaultValue={uf} className="h-10 rounded-md border border-input bg-white px-3">
            <option value="">Todas</option>
            {ufs.map((u) => (
              <option key={u} value={u}>
                {u}
              </option>
            ))}
          </select>
        </div>
        <button type="submit" className="h-10 rounded-md bg-primary px-4 font-medium text-primary-foreground">
          Filtrar
        </button>
      </form>

      <p className="text-sm text-muted-foreground" aria-live="polite">
        {lista.length === 0
          ? "Nenhum deputado encontrado com esses filtros."
          : `${lista.length}${lista.length === 60 ? "+" : ""} resultado(s). Fonte: Câmara dos Deputados, API v2.`}
      </p>

      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {lista.map((p) => (
          <li key={p.id}>
            <Link
              href={`/parlamentares/${p.id}`}
              className="flex items-center gap-3 rounded-lg border bg-superficie p-3 text-foreground no-underline hover:border-primary"
            >
              <FotoParlamentar nome={p.nome} url={p.url_foto} tamanho={48} />
              <span>
                <span className="block font-medium">{p.nome}</span>
                <span className="block text-sm text-muted-foreground">
                  {[p.sigla_partido, p.sigla_uf].filter(Boolean).join(" · ")}
                </span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
