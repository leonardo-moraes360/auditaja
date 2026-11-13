import { mascararCpfsNoTexto, soDigitos } from "@/lib/privacy";

/**
 * Trilha do dinheiro das emendas Pix (metodologia v1.11). Funções puras, para teste e auditoria:
 * /metodologia#recem-aberta e /metodologia#ciclo-fechado descrevem exatamente o que está aqui.
 *
 * Dois indícios, calculados na leitura (nunca gravados):
 * - "empresa recém-aberta": a matriz começou a funcionar menos de 180 dias antes do primeiro
 *   pagamento que a empresa recebeu ligado à emenda;
 * - "ciclo fechado": o mesmo CNPJ recebeu dinheiro da emenda e vendeu para a campanha que elegeu
 *   quem indicou a emenda.
 * Cada regra só usa fatos datados até a data do pagamento avaliado (LING-06).
 * Indício não é prova de irregularidade (R4).
 */

/** D4: limiar de "empresa recém-aberta", em dias. */
export const DIAS_RECEM_ABERTA = 180;

const DIA_MS = 86_400_000;

/** Dias inteiros de `de` até `ate` (datas ISO "AAAA-MM-DD", contadas em UTC). */
export function diasEntre(de: string, ate: string): number {
  return Math.round(
    (Date.parse(`${ate.slice(0, 10)}T00:00:00Z`) - Date.parse(`${de.slice(0, 10)}T00:00:00Z`)) / DIA_MS,
  );
}

/**
 * CNPJ-03/CNPJ-04: indício se a abertura veio menos de D4 dias antes do primeiro pagamento.
 * Abertura depois do pagamento não era fato conhecido na data dele (LING-06): sem indício.
 */
export function recemAberta(abertura: string, primeiroPagamento: string): { dias: number; indicio: boolean } {
  const dias = diasEntre(abertura, primeiroPagamento);
  return { dias, indicio: dias >= 0 && dias < DIAS_RECEM_ABERTA };
}

/** D12/EDGE-05: data da matriz do CNPJ básico; sem ela, a do próprio estabelecimento (filial). */
export function aberturaConsiderada(
  matriz: { inicio: string | null } | null,
  propria: { inicio: string | null } | null,
): { data: string | null; origem: "matriz" | "filial" | null } {
  if (matriz?.inicio) return { data: matriz.inicio, origem: "matriz" };
  if (propria?.inicio) return { data: propria.inicio, origem: "filial" };
  return { data: null, origem: null };
}

export type Recebimento = { cnpj: string; parlamentarId: number; data: string; valor: number };
export type DespesaCampanha = { cnpj: string; parlamentarId: number; data: string | null; valor: number };
export type Ciclo = {
  cnpj: string;
  recebido: number;
  primeiroRecebimento: string;
  ultimoRecebimento: string;
  despesaCampanha: number;
  primeiraDespesa: string;
  ultimaDespesa: string;
};

/**
 * CICLO-03: CNPJ que recebeu dinheiro da emenda do parlamentar e aparece nas despesas da campanha
 * dele (CICLO-04: só a campanha do mesmo parlamentar). LING-06: um recebimento só entra se houver
 * despesa de campanha com data até a data dele; despesas sem data não são avaliadas.
 */
export function cicloFechado(recebimentos: Recebimento[], despesas: DespesaCampanha[]): Ciclo[] {
  const chave = (cnpj: string, p: number) => `${p}|${cnpj}`;
  const porChave = new Map<string, DespesaCampanha[]>();
  for (const d of despesas) {
    if (!d.data) continue;
    const k = chave(d.cnpj, d.parlamentarId);
    porChave.set(k, [...(porChave.get(k) ?? []), d]);
  }
  const ciclos = new Map<string, { receb: Recebimento[]; desp: Set<DespesaCampanha> }>();
  for (const r of recebimentos) {
    const anteriores = (porChave.get(chave(r.cnpj, r.parlamentarId)) ?? []).filter((d) => d.data! <= r.data);
    if (!anteriores.length) continue;
    const k = chave(r.cnpj, r.parlamentarId);
    const c = ciclos.get(k) ?? { receb: [], desp: new Set<DespesaCampanha>() };
    c.receb.push(r);
    for (const d of anteriores) c.desp.add(d);
    ciclos.set(k, c);
  }
  return [...ciclos.values()].map(({ receb, desp }) => {
    const datasR = receb.map((r) => r.data).toSorted();
    const ds = [...desp];
    const datasD = ds.map((d) => d.data!).toSorted();
    return {
      cnpj: receb[0].cnpj,
      recebido: soma(receb.map((r) => r.valor)),
      primeiroRecebimento: datasR[0],
      ultimoRecebimento: datasR.at(-1)!,
      despesaCampanha: soma(ds.map((d) => d.valor)),
      primeiraDespesa: datasD[0],
      ultimaDespesa: datasD.at(-1)!,
    };
  });
}

/** Soma em centavos inteiros, para não acumular erro de ponto flutuante. */
function soma(vs: number[]): number {
  return vs.reduce((t, v) => t + Math.round(v * 100), 0) / 100;
}

/** LING-07: "M de N (x,x%)" com o universo explícito no texto que a envolve. */
export function taxaDeBase(m: number, n: number): string {
  const f = (v: number) => v.toLocaleString("pt-BR");
  if (n <= 0) return `${f(m)} de ${f(n)}`;
  const pct = ((m / n) * 100).toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
  return `${f(m)} de ${f(n)} (${pct}%)`;
}

/** Dígitos verificadores do CNPJ (módulo 11). */
export function cnpjValido(raw: string | null | undefined): boolean {
  const d = soDigitos(raw);
  if (d.length !== 14 || /^(\d)\1{13}$/.test(d)) return false;
  const dv = (base: string) => {
    const pesos = base.length === 12 ? [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2] : [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
    const r = [...base].reduce((t, c, i) => t + Number(c) * pesos[i], 0) % 11;
    return r < 2 ? 0 : 11 - r;
  };
  const d1 = dv(d.slice(0, 12));
  const d2 = dv(d.slice(0, 12) + d1);
  return d.endsWith(`${d1}${d2}`);
}

export type Recebedor = { tipo: "pj"; cnpj: string; nome: string } | { tipo: "pf" } | { tipo: "invalido" };

/**
 * Recebedor de um documento de liquidação do Transferegov.
 * TRI-03/TRI-07: pessoa física não guarda nome nem documento (nem a máscara da fonte).
 * EDGE-02: CNPJ com dígito verificador inválido é descartado.
 */
export function recebedorPublicavel(tipoDoc: string, identificacao: string, nome: string): Recebedor {
  const d = soDigitos(identificacao);
  if (tipoDoc.trim().toUpperCase() === "CPF" || d.length === 11 || identificacao.includes("*")) return { tipo: "pf" };
  if (!cnpjValido(d)) return { tipo: "invalido" };
  return { tipo: "pj", cnpj: d, nome: mascararCpfsNoTexto(nome.trim()) };
}

/** EDGE-03: divisão 84 da CNAE (administração pública, defesa e seguridade social). */
export function ehEntePublico(cnae: string | null | undefined): boolean {
  return soDigitos(cnae).startsWith("84");
}

/**
 * D8: eleição que deu o mandato da emenda. Deputado: a da legislatura (57ª → 2022, de 4 em 4 anos).
 * Senador: o ano anterior à posse (posse em 2019 → 2018; 2023 → 2022). Sem dado, não há eleição.
 */
export function eleicaoDoMandato(p: {
  casa: "camara" | "senado";
  id_legislatura: number | null;
  mandato_inicio: string | null;
}): number | null {
  if (p.casa === "senado") {
    const ano = Number((p.mandato_inicio ?? "").slice(0, 4));
    return ano > 0 ? ano - 1 : null;
  }
  return p.id_legislatura ? 2022 + 4 * (p.id_legislatura - 57) : null;
}

/** "202603" (ano/mês do Portal) → "2026-03-01": data do pagamento direto, no primeiro dia do mês. */
export function dataDoAnoMes(anoMes: string): string | null {
  const m = /^(\d{4})(0[1-9]|1[0-2])$/.exec(anoMes.trim());
  return m ? `${m[1]}-${m[2]}-01` : null;
}

const ACENTOS: Record<string, string> = {
  municipio: "Município",
  sao: "São",
  saude: "Saúde",
  educacao: "Educação",
  assistencia: "Assistência",
  associacao: "Associação",
  servicos: "Serviços",
  medicos: "Médicos",
  ficticios: "Fictícios",
  grafica: "Gráfica",
  comunicacao: "Comunicação",
  joao: "João",
  goias: "Goiás",
  amapa: "Amapá",
  piaui: "Piauí",
  ceara: "Ceará",
  maranhao: "Maranhão",
  parana: "Paraná",
  rondonia: "Rondônia",
  espirito: "Espírito",
};
const MINUSCULAS = new Set(["de", "da", "do", "das", "dos", "e"]);
const SIGLAS = /^(ltda|me|epp|eireli|s\.?a\.?|s\/a|mei)$/i;

/**
 * "MUNICIPIO DE SOROCABA" → "Município de Sorocaba"; siglas societárias ficam como estão. DENS-10: só acentua
 * palavras sem outro sentido (nunca "para" → "Pará", que estragava razões sociais).
 */
export function nomeLegivel(s: string | null | undefined): string {
  return (s ?? "")
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((p, i) => {
      if (SIGLAS.test(p)) return p.length <= 4 ? p.charAt(0).toUpperCase() + p.slice(1).toLowerCase() : p.toUpperCase();
      const min = p.toLowerCase();
      if (i > 0 && MINUSCULAS.has(min)) return min;
      return ACENTOS[min] ?? min.charAt(0).toUpperCase() + min.slice(1);
    })
    .join(" ")
    .replace(/\bS\.a\.?$/i, "S.A.")
    .replace(/\bLtda\b/i, "Ltda");
}

/**
 * DENS-06: "avaliado"; "sem_base" = a base do sinal não foi importada; "sem_dado" = foi importada, mas não
 * tem nada deste perfil (nenhuma empresa paga está na Receita; nenhuma despesa de campanha dele no TSE).
 */
export type EstadoAvaliacao = "avaliado" | "sem_base" | "sem_dado";

export function estadoAvaliacao(baseImportada: boolean, temDado: boolean): EstadoAvaliacao {
  if (!baseImportada) return "sem_base";
  return temDado ? "avaliado" : "sem_dado";
}

export type QuemIndicou = "deste deputado" | "desta deputada" | "deste senador" | "desta senadora";

export function quemIndicou(casa: "camara" | "senado", sexo: string | null): QuemIndicou {
  if (casa === "senado") return sexo === "F" ? "desta senadora" : "deste senador";
  return sexo === "F" ? "desta deputada" : "deste deputado";
}

/** EDGE-04: frase do perfil sem emenda Pix, com gênero e Casa. */
export function fraseSemPix(quem: QuemIndicou): string {
  return `${quem.replace(/^dest/, "Est")} não indicou transferências especiais no período`;
}

/**
 * DENS-06: por que um sinal não foi avaliado. "sem_base": a base não foi importada; "sem_dado": foi importada,
 * mas não tem nada deste perfil.
 */
export function notasAvaliacao(
  recem: EstadoAvaliacao,
  ciclo: EstadoAvaliacao,
  receitaBase: string | null,
  eleicao: number | null,
): string[] {
  const campanha = `as despesas de campanha${eleicao ? ` de ${eleicao}` : ""}`;
  const notas: string[] = [];
  if (recem === "sem_base" && ciclo === "sem_base")
    notas.push(
      `Ainda não importamos a data de abertura das empresas (Receita Federal) nem ${campanha} (TSE): os dois indícios não foram avaliados.`,
    );
  else {
    if (recem === "sem_base")
      notas.push(
        "Ainda não importamos a data de abertura das empresas (Receita Federal): empresa recém-aberta não foi avaliada.",
      );
    if (ciclo === "sem_base")
      notas.push(`Ainda não importamos ${campanha} (TSE): ciclo com a campanha não foi avaliado.`);
  }
  if (recem === "sem_dado")
    notas.push(
      `Nenhuma empresa paga com estas emendas está na base da Receita${receitaBase ? ` de ${receitaBase.slice(5, 7)}/${receitaBase.slice(0, 4)}` : ""}: empresa recém-aberta não foi avaliada.`,
    );
  if (ciclo === "sem_dado")
    notas.push(
      `O TSE não tem despesas de campanha${eleicao ? ` de ${eleicao}` : ""} com fornecedor pessoa jurídica neste perfil: ciclo com a campanha não foi avaliado.`,
    );
  return notas;
}
