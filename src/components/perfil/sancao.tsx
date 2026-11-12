import Link from "next/link";
import type { ResumoSancoesAno, SancaoFornecedor } from "@/data/emendas";
import { frasesNotas, periodoDaSancao, rotuloNotas, rotuloNotasCsv } from "@/lib/emendas";
import { soDigitos } from "@/lib/privacy";

const PORTAL_DOWNLOAD = "https://portaldatransparencia.gov.br/download-de-dados";

function doFornecedor(doc: string | null, sancoes: SancaoFornecedor[]) {
  const d = soDigitos(doc);
  return d.length === 14 ? sancoes.filter((s) => s.cnpj === d) : [];
}

/** SAN-04: selo ao lado do nome do fornecedor, um por cadastro. */
export function SeloSancao({ doc, sancoes }: { doc: string | null; sancoes: SancaoFornecedor[] }) {
  const cadastros = [...new Set(doFornecedor(doc, sancoes).map((s) => s.cadastro))];
  return cadastros.map((c) => (
    <span
      key={c}
      className="ml-2 inline-block rounded-full bg-aviso-fundo px-2 py-[3px] text-xs font-semibold whitespace-nowrap text-aviso"
    >
      Sanção no {c}
    </span>
  ));
}

/**
 * SAN-05..07: aviso factual por sanção dos fornecedores listados (R4: sem linguagem de acusação).
 * Conta as notas do período exibido com data de emissão dentro do período da sanção.
 */
export function AvisoSancao({
  fornecedores,
  sancoes,
  periodo,
  hrefNotas,
  notasEmCsv = false,
}: {
  fornecedores: { fornecedor_nome: string; fornecedor_doc: string | null; documentos: number }[];
  sancoes: SancaoFornecedor[];
  periodo: string;
  /** CSV das notas de um fornecedor no período exibido e dentro do período da sanção (rota gastos.csv). */
  hrefNotas: (doc: string, de: string | null, ate: string | null) => string;
  /** Senado: o link baixa o CSV porque não há documento da nota para abrir. */
  notasEmCsv?: boolean;
}) {
  const itens = fornecedores.flatMap((f) => doFornecedor(f.fornecedor_doc, sancoes).map((s) => ({ f, s })));
  if (!itens.length) return null;
  return (
    <div className="flex flex-col gap-3">
      {itens.map(({ f, s }) => {
        const notas = frasesNotas(s.notas, f.documentos, periodo);
        return (
          <div
            key={`${s.cnpj}-${s.cadastro}-${s.data_inicio}`}
            data-sancao
            className="flex items-start gap-3.5 rounded-[12px] bg-aviso-fundo px-4 py-4 sm:px-[18px]"
          >
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
              className="mt-0.5 shrink-0 text-sancao"
            >
              <circle cx="12" cy="12" r="10" />
              <path d="M12 7v6" />
              <path d="M12 17h.01" />
            </svg>
            <div className="flex min-w-0 flex-col gap-1.5">
              <h3 className="text-base font-bold text-aviso">
                {f.fornecedor_nome} tem sanção registrada no {s.cadastro}
              </h3>
              <p className="text-sm leading-normal text-texto-2">
                {s.categoria} {periodoDaSancao(s)}. Órgão sancionador: {s.orgao}. {notas} O registro é do cadastro
                oficial da CGU e não indica irregularidade do parlamentar: a cota é reembolso de despesa, não contrato
                público.
              </p>
              <p className="flex flex-wrap gap-x-4 gap-y-1 text-sm font-semibold">
                <a
                  href={`${PORTAL_DOWNLOAD}/${s.cadastro.toLowerCase()}`}
                  className="inline-flex min-h-6 items-center text-sancao"
                  rel="noopener noreferrer"
                  target="_blank"
                >
                  Ver a base do {s.cadastro} no Portal
                </a>
                {s.notas > 0 && (
                  <a
                    href={hrefNotas(f.fornecedor_doc!, s.data_inicio, s.data_fim)}
                    download
                    className="inline-flex min-h-6 items-center text-sancao"
                  >
                    {notasEmCsv ? rotuloNotasCsv(s.notas) : rotuloNotas(s.notas)}
                  </a>
                )}
                <Link href="/metodologia#sancoes" className="inline-flex min-h-6 items-center text-sancao">
                  Como cruzamos (metodologia)
                </Link>
              </p>
            </div>
          </div>
        );
      })}
      <p className="text-xs text-muted-foreground">
        Fonte do cruzamento: Portal da Transparência (CGU), CEIS e CNEP, download em lote
        {itens[0].s.base ? ` · base de ${itens[0].s.base}` : ""} · comparação pelo CNPJ.
      </p>
    </div>
  );
}

/**
 * Frase de ausência: o período exibido não tem nota paga a empresa punida na data da nota. Diz que a checagem
 * foi feita (a ausência de aviso, sozinha, não dizia) e aponta os outros anos que têm caso.
 */
export function SemSancao({
  resumo,
  anosExibidos,
  periodo,
  base,
  hrefAno,
}: {
  resumo: ResumoSancoesAno[];
  anosExibidos: number[];
  periodo: string;
  base: string | null;
  hrefAno: (ano: number) => string;
}) {
  const exibidos = resumo.filter((r) => anosExibidos.includes(r.ano));
  if (!exibidos.length || exibidos.some((r) => r.sancionadas > 0)) return null;
  const empresas = exibidos.reduce((s, r) => s + r.empresas, 0);
  const outros = resumo.filter((r) => !anosExibidos.includes(r.ano) && r.sancionadas > 0);
  return (
    <p
      data-sem-sancao
      className="flex items-start gap-2.5 rounded-[10px] bg-sucesso-fundo px-3 py-2.5 text-sm leading-normal text-sucesso sm:px-3.5 sm:py-3 sm:text-sm"
    >
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
        className="mt-0.5 shrink-0"
      >
        <path d="M20 6L9 17l-5-5" />
      </svg>
      <span>
        <strong>Empresas punidas:</strong>{" "}
        {empresas === 1
          ? `a empresa paga com a cota ${periodo} não aparece`
          : `nenhuma das ${empresas} empresas pagas com a cota ${periodo} aparece`}{" "}
        nas listas oficiais de empresas punidas (CEIS e CNEP{base ? `, base de ${base}` : ""}).
        {outros.map((r) => (
          <span key={r.ano}>
            {" "}
            Em {r.ano} há {r.sancionadas === 1 ? "1 caso" : `${r.sancionadas} casos`}:{" "}
            <Link href={hrefAno(r.ano)} className="font-semibold text-sucesso">
              ver
            </Link>
            .
          </span>
        ))}
      </span>
    </p>
  );
}
