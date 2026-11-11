import Link from "next/link";
import type { SancaoFornecedor } from "@/data/emendas";
import { frasesNotas, periodoDaSancao } from "@/lib/emendas";
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
}: {
  fornecedores: { fornecedor_nome: string; fornecedor_doc: string | null; documentos: number }[];
  sancoes: SancaoFornecedor[];
  periodo: string;
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
              className="mt-0.5 shrink-0 text-teto"
            >
              <circle cx="12" cy="12" r="10" />
              <path d="M12 7v6" />
              <path d="M12 17h.01" />
            </svg>
            <div className="flex min-w-0 flex-col gap-1.5">
              <h3 className="text-[15px] font-bold text-aviso">
                {f.fornecedor_nome} tem sanção registrada no {s.cadastro}
              </h3>
              <p className="text-sm leading-normal text-texto-2">
                {s.categoria} {periodoDaSancao(s)}, aplicada por {s.orgao}. {notas} O registro é do cadastro oficial da
                CGU e não indica irregularidade do parlamentar.
              </p>
              <p className="flex flex-wrap gap-x-4 gap-y-1 text-sm font-semibold">
                <a
                  href={`${PORTAL_DOWNLOAD}/${s.cadastro.toLowerCase()}`}
                  className="inline-flex min-h-6 items-center text-teto"
                  rel="noopener noreferrer"
                  target="_blank"
                >
                  Ver a base do {s.cadastro} no Portal
                </a>
                <Link href="/metodologia#sancoes" className="inline-flex min-h-6 items-center text-teto">
                  Como cruzamos (metodologia)
                </Link>
              </p>
            </div>
          </div>
        );
      })}
      <p className="text-xs text-muted-foreground">
        Fonte do cruzamento: Portal da Transparência (CGU), CEIS e CNEP, download em lote · comparação pelo CNPJ.
      </p>
    </div>
  );
}
