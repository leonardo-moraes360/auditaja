import Link from "next/link";
import type { PadraoAtipico } from "@/data/atipico";
import type { ResumoSancoesAno } from "@/data/emendas";

export type PontoParaVerificar = {
  tipo: "sancao" | "atipico";
  ano: number;
  n: number;
  texto: string;
  href: string;
};

/**
 * Pontos para verificar no mandato inteiro, independentemente do ano exibido: empresas pagas com a cota
 * que estavam numa lista de empresas punidas na data da nota, e gastos fora do padrão (padrão atípico).
 * Sanção primeiro, depois do ano mais recente para o mais antigo.
 */
export function pontosParaVerificar(
  id: number,
  sancoes: ResumoSancoesAno[],
  atipicos: PadraoAtipico[],
): PontoParaVerificar[] {
  const href = (ano: number) => `/parlamentares/${id}?ano=${ano}#gastos`;
  const s = sancoes
    .filter((r) => r.sancionadas > 0)
    .map((r) => ({
      tipo: "sancao" as const,
      ano: r.ano,
      n: r.sancionadas,
      texto:
        r.sancionadas === 1
          ? `1 empresa paga com a cota está numa lista de empresas punidas · ${r.ano}`
          : `${r.sancionadas} empresas pagas com a cota estão numa lista de empresas punidas · ${r.ano}`,
      href: href(r.ano),
    }));
  const a = atipicos
    .map((r) => ({ ano: r.ano, n: r.acima.length + r.salto.length }))
    .filter((r) => r.n > 0)
    .map((r) => ({
      tipo: "atipico" as const,
      ano: r.ano,
      n: r.n,
      texto: `${r.n} ${r.n === 1 ? "gasto fora do padrão" : "gastos fora do padrão"} · ${r.ano}`,
      href: href(r.ano),
    }));
  const desc = (x: { ano: number }, y: { ano: number }) => y.ano - x.ano;
  return [...s.toSorted(desc), ...a.toSorted(desc)];
}

/** Anos com algum ponto para verificar: marcados no seletor de ano dos gastos. */
export function anosComPonto(pontos: PontoParaVerificar[]): Set<number> {
  return new Set(pontos.map((p) => p.ano));
}

function Icone({ tipo }: { tipo: PontoParaVerificar["tipo"] }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className="shrink-0"
    >
      {tipo === "sancao" ? (
        <>
          <circle cx="12" cy="12" r="10" />
          <path d="M12 7v6" />
          <path d="M12 17h.01" />
        </>
      ) : (
        <path d="M3 17l6-6 4 4 8-8" />
      )}
    </svg>
  );
}

/** Faixa no topo do perfil (R4: "ponto para verificar", nunca acusação). */
export function PontosParaVerificar({ pontos, periodo }: { pontos: PontoParaVerificar[]; periodo: string }) {
  if (!pontos.length) {
    return (
      <p data-pontos="0" className="text-sm leading-normal text-muted-foreground sm:text-sm">
        Nenhum ponto para verificar {periodo}: empresas punidas e gastos fora do padrão foram conferidos.{" "}
        <Link href="/metodologia#atipico" className="font-semibold">
          Como conferimos
        </Link>
      </p>
    );
  }
  return (
    <section
      aria-labelledby="pontos-titulo"
      data-pontos={pontos.length}
      className="flex flex-col gap-2.5 rounded-[12px] border border-atipico-borda bg-atipico-fundo px-3.5 py-3 sm:px-[18px] sm:py-4"
    >
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <h2 id="pontos-titulo" className="text-base font-bold text-atipico-titulo sm:text-base">
          {pontos.length === 1 ? "1 ponto para verificar" : `${pontos.length} pontos para verificar`} {periodo}
        </h2>
        <p className="text-sm text-atipico">
          Ponto para verificar não é acusação.{" "}
          <Link href="/metodologia#atipico" className="font-semibold text-atipico">
            Como calculamos
          </Link>
        </p>
      </div>
      <ul className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
        {pontos.map((p) => (
          <li key={`${p.tipo}-${p.ano}`}>
            <Link
              href={p.href}
              className={`inline-flex min-h-11 items-center gap-2 rounded-[10px] border bg-card px-3.5 py-2 text-sm font-semibold no-underline ${
                p.tipo === "sancao" ? "border-aviso-fundo text-aviso" : "border-atipico-borda text-atipico"
              }`}
            >
              <Icone tipo={p.tipo} />
              {p.texto}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
