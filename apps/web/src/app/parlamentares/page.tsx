import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { connection } from "next/server";
import {
  buscarParecidos,
  buscarParlamentares,
  casaDoFiltro,
  contarPorCasa,
  ufsDisponiveis,
  type Casa,
} from "@/data/perfil";
import { cargoParlamentar, NOME_UF } from "@auditaja/core/rotulos";
import { metadataDaPagina } from "@/lib/site";
import { FotoParlamentar } from "@/components/perfil/foto";
import { Esqueleto } from "@/components/esqueleto";

/**
 * Lista por Casa e por UF é indexável, com canonical só com esses dois filtros. Resultado de busca
 * (?q=) fica fora do índice, mas os links para os perfis continuam sendo seguidos.
 */
export async function generateMetadata({ searchParams }: PageProps<"/parlamentares">): Promise<Metadata> {
  const sp = await searchParams;
  const uf = typeof sp.uf === "string" && NOME_UF[sp.uf] ? sp.uf : "";
  const casa = casaDoFiltro(sp.casa);
  const busca = typeof sp.q === "string" && sp.q.trim() !== "";
  const quem =
    casa === "senado" ? "Senadores" : casa === "camara" ? "Deputados federais" : "Deputados federais e senadores";
  // Nome do estado na frente ("Bahia: senadores"): evita a preposição (de, da, do) e cabe nos ~60
  // caracteres que o buscador mostra.
  const titulo = uf ? `${NOME_UF[uf]}: ${quem.toLowerCase()}` : `${quem} em exercício`;
  const descricao = `${uf ? `${NOME_UF[uf]} (${uf}): ${quem.toLowerCase()}` : quem} em exercício. Gastos da cota, votações, presença, emendas e bens, com fonte oficial.`;
  const canon = new URLSearchParams();
  if (casa) canon.set("casa", casa);
  if (uf) canon.set("uf", uf);
  const t = canon.toString();
  return metadataDaPagina({
    titulo,
    descricao,
    caminho: t ? `/parlamentares?${t}` : "/parlamentares",
    indexar: !busca,
  });
}

export default function Parlamentares({ searchParams }: PageProps<"/parlamentares">) {
  return (
    <div className="mx-auto max-w-[1200px] space-y-6 px-4 py-8 sm:px-6">
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
  const [encontrados, ufs, contagem] = await Promise.all([
    buscarParlamentares({ q, uf, casa, limite: 1000 }),
    ufsDisponiveis(),
    contarPorCasa(),
  ]);
  // O Senado cabe inteiro; nas outras listas mostramos 60 e dizemos quantos há.
  const porPagina = casa === "senado" ? 100 : 60;
  const lista = encontrados.slice(0, porPagina);
  // Busca sem resultado: nomes parecidos (erro de digitação, "nicolas" → Nikolas).
  const parecidos = q && encontrados.length === 0 ? await buscarParecidos({ q, uf, casa }) : [];
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
              className={`inline-flex h-11 items-center rounded-full border px-4 text-sm no-underline ${
                atual
                  ? "border-primary bg-secondary font-semibold text-primary"
                  : "border-input bg-superficie text-texto-2 hover:border-primary"
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
            Nome ou estado
          </label>
          <input
            id="q"
            name="q"
            defaultValue={q}
            type="search"
            placeholder="Ex.: Maria, Silva ou Bahia"
            className="h-11 rounded-[8px] border border-input bg-superficie px-3 text-sm"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="uf" className="text-sm font-medium">
            UF
          </label>
          <select
            id="uf"
            name="uf"
            defaultValue={uf}
            className="h-11 rounded-[8px] border border-input bg-superficie px-3 text-sm"
          >
            <option value="">Todas</option>
            {ufs.map((u) => (
              <option key={u} value={u}>
                {u}
              </option>
            ))}
          </select>
        </div>
        <button
          type="submit"
          className="h-11 rounded-[8px] bg-primary px-4 text-sm font-semibold text-primary-foreground"
        >
          Filtrar
        </button>
      </form>

      <p className="text-sm text-muted-foreground" aria-live="polite">
        {encontrados.length === 0
          ? parecidos.length
            ? `Nenhum nome igual a “${q}”. Você quis dizer:`
            : "Nenhum parlamentar encontrado com esses filtros."
          : encontrados.length > lista.length
            ? `Mostrando ${lista.length} de ${encontrados.length}. Use a busca ou o estado para achar os outros. Fonte: ${fonte}.`
            : `${encontrados.length} ${encontrados.length === 1 ? "parlamentar" : "parlamentares"}. Fonte: ${fonte}.`}
      </p>

      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {(lista.length ? lista : parecidos).map((p) => (
          <li key={p.id}>
            <Link
              href={`/parlamentares/${p.id}`}
              className="flex items-center gap-3 rounded-lg border bg-superficie p-3 text-foreground no-underline hover:border-primary"
            >
              <FotoParlamentar nome={p.nome} url={p.url_foto} tamanho={48} raio="rounded-[8px]" />
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
