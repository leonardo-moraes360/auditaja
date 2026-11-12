import { normalizarNome } from "@/ingest/arquivos";
import { brlCompacto, dataBr } from "@/lib/format";
import { formatarCnpj, mascararCpfsNoTexto, soDigitos } from "@/lib/privacy";

/** Deputados: emendas ao orçamento de 2023 foram apresentadas em 2022, pela legislatura anterior. */
export const ANO_INICIAL_EMENDAS = 2024;

export const TIPO_TRANSFERENCIA_ESPECIAL = "Emenda Individual - Transferências Especiais";

/** "1.234,56" → "1234.56"; vazio → "0". Mantém string para não perder centavos. */
export function valorBr(s: string | null | undefined): string {
  const t = (s ?? "").trim();
  if (!t) return "0";
  return t.replace(/\./g, "").replace(",", ".");
}

export function ehEmendaIndividual(tipo: string): boolean {
  return tipo.startsWith("Emenda Individual");
}

export function ehTransferenciaEspecial(tipo: string): boolean {
  return tipo === TIPO_TRANSFERENCIA_ESPECIAL;
}

/** Nome parlamentar normalizado → id do deputado; `null` marca homônimo. */
export function indiceDeAutores(parlamentares: { id: number; nome: string }[]): Map<string, number | null> {
  const m = new Map<string, number | null>();
  for (const p of parlamentares) {
    const k = normalizarNome(p.nome);
    m.set(k, m.has(k) ? null : p.id);
  }
  return m;
}

export function autorDoNome(indice: Map<string, number | null>, nome: string): number | null {
  return indice.get(normalizarNome(nome)) ?? null;
}

/** Autor ligado a um perfil e o primeiro ano de orçamento que conta para ele. */
export type AutorEmenda = { id: number; anoInicial: number };

/**
 * Primeiro orçamento do mandato do senador: o do ano seguinte à posse (o orçamento do ano da posse
 * foi votado antes dela). Sem data de início, vale o mesmo corte dos deputados.
 */
export function anoInicialDoSenador(mandatoInicio: string | Date | null): number {
  if (!mandatoInicio) return ANO_INICIAL_EMENDAS;
  const ano = typeof mandatoInicio === "string" ? Number(mandatoInicio.slice(0, 4)) : mandatoInicio.getFullYear();
  return Number.isFinite(ano) ? ano + 1 : ANO_INICIAL_EMENDAS;
}

/**
 * Índice das duas Casas: nome normalizado → autor; `null` marca homônimo dentro da mesma Casa.
 * O deputado tem prioridade: nome que também é de senador (suplentes fora do exercício que hoje são
 * deputados) fica com o deputado e não entra no índice do Senado.
 */
export function indiceDeAutoresDasCasas(
  deputados: { id: number; nome: string }[],
  senadores: { id: number; nome: string; mandato_inicio: string | Date | null }[],
): Map<string, AutorEmenda | null> {
  const m = new Map<string, AutorEmenda | null>();
  for (const [k, id] of indiceDeAutores(deputados))
    m.set(k, id === null ? null : { id, anoInicial: ANO_INICIAL_EMENDAS });
  const doSenado = new Map<string, AutorEmenda | null>();
  for (const s of senadores) {
    const k = normalizarNome(s.nome);
    if (m.has(k)) continue;
    doSenado.set(k, doSenado.has(k) ? null : { id: s.id, anoInicial: anoInicialDoSenador(s.mandato_inicio) });
  }
  for (const [k, v] of doSenado) m.set(k, v);
  return m;
}

const CPF_MASCARADO = /^\*{3}\.\d{3}\.\d{3}-\*{2}$/;

/**
 * R3 e AD-002: favorecido PF vira rótulo genérico e só guarda o CPF se já vier mascarado.
 * CNPJ de 14 dígitos é formatado; qualquer outro documento é descartado.
 */
export function favorecidoPublicavel(tipo: string, codigo: string, nome: string): { nome: string; doc: string | null } {
  if (tipo === "Pessoa Fisica") {
    const c = codigo.trim();
    return { nome: "Beneficiário pessoa física", doc: CPF_MASCARADO.test(c) ? c : null };
  }
  const d = soDigitos(codigo);
  // MEI: a razão social traz o CPF do dono ("FULANO 12345678901"); sai mascarado (R3).
  return { nome: mascararCpfsNoTexto(nome.trim()), doc: d.length === 14 ? formatarCnpj(d) : null };
}

const MINUSCULAS = new Set(["de", "da", "do", "das", "dos", "e"]);

function caixaDeTitulo(s: string): string {
  return s
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .map((p, i) => (i > 0 && MINUSCULAS.has(p) ? p : p.charAt(0).toUpperCase() + p.slice(1)))
    .join(" ");
}

/** "FRANCISCO SANTOS - PI" → "Francisco Santos (PI)"; "SÃO PAULO (UF)" → "São Paulo (UF)". */
export function rotuloLocalidade(s: string): string {
  const t = s.trim();
  const mun = /^(.*\S)\s+-\s+([A-Z]{2})$/.exec(t);
  if (mun) return `${caixaDeTitulo(mun[1])} (${mun[2]})`;
  const uf = /^(.*\S)\s+\(UF\)$/.exec(t);
  if (uf) return `${caixaDeTitulo(uf[1])} (UF)`;
  return caixaDeTitulo(t);
}

export type PeriodoEmendas = number | "mandato";

/** `?emendas=` válido só se for um ano com emenda do deputado; senão, o mandato todo. */
export function periodoEmendas(param: string | string[] | undefined, anos: number[]): PeriodoEmendas {
  if (typeof param !== "string" || !/^\d{4}$/.test(param)) return "mandato";
  const ano = Number(param);
  return anos.includes(ano) ? ano : "mandato";
}

/** Quantas notas do período exibido caem dentro do período da sanção, com concordância. */
export function frasesNotas(n: number, docs: number, periodo: string) {
  if (docs === 1)
    return `A única nota paga a essa empresa ${periodo} ${n ? "tem" : "não tem"} data dentro desse período.`;
  const quantas = n === 0 ? "Nenhuma" : String(n);
  return `${quantas} das ${docs} notas pagas a essa empresa ${periodo} ${n > 1 ? "têm" : "tem"} data dentro desse período.`;
}

export function periodoDaSancao(s: { data_inicio: string | null; data_fim: string | null }) {
  const inicio = s.data_inicio ? dataBr(s.data_inicio) : "data não informada";
  return s.data_fim ? `de ${inicio} a ${dataBr(s.data_fim)}` : `desde ${inicio}, sem data final`;
}

/** "R$ 74,2 mi" (uma casa) a partir de 1 milhão; abaixo disso, o formato compacto do perfil. */
export function brlMi(v: number): string {
  if (Math.abs(v) >= 1_000_000) {
    return `R$ ${(v / 1_000_000).toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 })} mi`;
  }
  return brlCompacto(v);
}

/** Data da base publicada, guardada em `coleta.observacao` como "base de DD/MM/AAAA". */
export function baseDaColeta(observacao: string | null | undefined): string | null {
  return /base de (\d{2}\/\d{2}\/\d{4})/.exec(observacao ?? "")?.[1] ?? null;
}

/** Date local → "DD/MM/AAAA" (datas de entrada de ZIP não têm fuso). */
export function dataLocalBr(d: Date): string {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${p(d.getDate())}/${p(d.getMonth() + 1)}/${d.getFullYear()}`;
}

/** Link para as notas dentro do período da sanção: "Ver a nota" / "Ver as N notas". */
export function rotuloNotas(n: number): string {
  return n === 1 ? "Ver a nota" : `Ver as ${n} notas`;
}

/** Senado: não publica a imagem da nota, então o link deixa claro que baixa a planilha. */
export function rotuloNotasCsv(n: number): string {
  return n === 1 ? "Baixar a nota (CSV)" : `Baixar as ${n} notas (CSV)`;
}
