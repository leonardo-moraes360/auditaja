import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { connection } from "next/server";
import { buscarParlamentares, casaDoFiltro, contarPorCasa, ufsDisponiveis, type Casa } from "@/data/perfil";
import { cargoParlamentar } from "@/lib/rotulos";
import { FotoParlamentar } from "@/components/perfil/foto";
import { Esqueleto } from "@/components/esqueleto";

export const metadata: Metadata = { title: "Parlamentares" };

export default function Parlamentares({ searchParams }: PageProps<"/parlamentares">) {
  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-8">
      <h1 className="font-heading text-3xl font-bold">Parlamentares federais em exercício</h1>
      <Suspense fallback={<Esqueleto linhas={4} />}>
        <Resultados searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function Resultados({ searchParams }: Pick<PageProps<"/parlamentares">, "searchParams">) {
  await connection();
  const sp = await searchParams;
  const q = typeof sp.q === "string" ? sp.q : "";
  const uf = typeof sp.uf === "string" && /^[A-Z]{2}$/.test(sp.uf) ? sp.uf : "";
  const casa = casaDoFiltro(sp.casa);
  const [lista, ufs, contagem] = await Promise.all([
    buscarParlamentares({ q, uf, casa }),
    ufsDisponiveis(),
    contarPorCasa(),
  ]);
  const filtrosCasa: { valor: Casa | null; rotulo: string; n: number }[] = [
    { valor: null, rotulo: "Todos", n: contagem.camara + contagem.senado },
    { valor: "camara", rotulo: "Câmara dos Deputados", n: contagem.camara },
    { valor: "senado", rotulo: "Senado Federal", n: contagem.senado },
  ];
  const linkCasa = (c: Casa | null) => {
    const p = new URLSearchParams();
    if (c) p.set("casa", c);
    if (q) p.set("q", q);
    if (uf) p.set("uf", uf);
    const t = p.toString();
    return t ? `/parlamentares?${t}` : "/parlamentares";
  };
  const fonte =
    casa === "senado"
      ? "Senado Federal, Dados Abertos"
      : casa === "camara"
        ? "Câmara dos Deputados, API v2"
        : "Câmara dos Deputados (API v2) e Senado Federal (Dados Abertos)";

  return (
    <div className="space-y-6">
      <nav aria-label="Casa legislativa" className="flex flex-wrap gap-2">
        {filtrosCasa.map((f) => {
          const atual = f.valor === casa;
          return (
            <Link
              key={f.rotulo}
              href={linkCasa(f.valor)}
              aria-current={atual ? "page" : undefined}
              className={`inline-flex h-10 items-center rounded-full border px-4 text-sm no-underline ${
                atual
                  ? "border-primary bg-secondary font-semibold text-primary"
                  : "border-input bg-white text-texto-2 hover:border-primary"
              }`}
            >
              {f.rotulo} ({f.n})
            </Link>
          );
        })}
      </nav>
      <form className="flex flex-wrap items-end gap-3" role="search" aria-label="Filtrar parlamentares">
        {casa && <input type="hidden" name="casa" value={casa} />}
        <div className="flex min-w-60 flex-1 flex-col gap-1">
          <label htmlFor="q" className="text-sm font-medium">
            Nome ou UF
          </label>
          <input
            id="q"
            name="q"
            defaultValue={q}
            type="search"
            placeholder="Ex.: Maria, Silva ou SP"
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
          ? "Nenhum parlamentar encontrado com esses filtros."
          : `${lista.length}${lista.length === 60 ? "+" : ""} resultado(s). Fonte: ${fonte}.`}
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
                  {[cargoParlamentar(p.casa, p.sexo), p.sigla_partido, p.sigla_uf].filter(Boolean).join(" · ")}
                </span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
