/**
 * Métricas do perfil. Funções puras para facilitar teste e auditoria da metodologia.
 * A metodologia descrita em /metodologia deve refletir exatamente este arquivo.
 */

export const METODOLOGIA_VERSAO = "1.6";

/** Órgão cujas votações entram nos indicadores de presença e alinhamento. */
export const ORGAO_PLENARIO = "PLEN";

const ORIENTACOES_COMPARAVEIS = new Set(["Sim", "Não"]);

function norm(s: string): string {
  return s
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toUpperCase();
}

function tokens(s: string): string[] {
  return norm(s)
    .replace(/\.+$/, "")
    .split(/[\s\-/]+/)
    .filter(Boolean);
}

/**
 * Siglas completas de partidos com representação recente. Um pedaço que já é uma
 * sigla completa só casa por igualdade: "PSD" nunca vira prefixo de "PSDB".
 */
const SIGLAS_COMPLETAS = new Set(
  "PL PT UNIAO PP PSD MDB REPUBLICANOS PSB PDT PSDB PSOL PODE AVANTE SOLIDARIEDADE PCDOB PV CIDADANIA NOVO REDE PRD MISSAO DC PMB AGIR MOBILIZA PRTB".split(
    " ",
  ),
);

/** Casa um pedaço abreviado ("CIDADAN", "Solidaried", "Uni") com a sigla completa. */
function casaAbreviado(pedaco: string, partido: string, minimo: number): boolean {
  if (pedaco === partido) return true;
  if (SIGLAS_COMPLETAS.has(pedaco)) return false;
  return pedaco.length >= minimo && partido.startsWith(pedaco);
}

export type TipoOrientacao = "partido" | "federacao" | "bloco";

/** Bloco parlamentar com a lista completa de partidos (API v2 da Câmara, /blocos). */
export type BlocoParlamentar = { nome: string; partidos: string[] };

const chave = (s: string) => tokens(s).join("");

/** Entradas do nome do bloco, na ordem: "UNIÃO, PP, Federação PSDB CIDADANIA" → 3 entradas. */
function entradasDoNome(nome: string): string[][] {
  return nome
    .split(",")
    .map((e) => tokens(e).filter((t) => t !== "FEDERACAO"))
    .filter((e) => e.length > 0);
}

/**
 * Partidos de um bloco a partir do nome, para quando a API não lista os partidos:
 * "AVANTE, SOLIDARIEDADE, PRD" → AVANTE, SOLIDARIEDADE, PRD; "Federação PSDB CIDADANIA" → PSDB, CIDADANIA.
 */
export function partidosDoNomeDoBloco(nome: string): string[] {
  return nome
    .split(",")
    .flatMap((e) => e.trim().split(/\s+/))
    .filter((t) => t && norm(t) !== "FEDERACAO");
}

/**
 * Acha o bloco de uma orientação truncada ("Bl UniPpPsd...") comparando cada pedaço, na ordem,
 * com as entradas do nome do bloco ("UNIÃO, PP, PSD, REPUBLICANOS, ..."). Só devolve um bloco
 * se exatamente um casar.
 */
export function blocoDaBancada(siglaBancada: string, blocos: BlocoParlamentar[]): BlocoParlamentar | null {
  if (!/^Bl\s/i.test(siglaBancada)) return null;
  const bruto = siglaBancada.replace(/^Bl\s+/i, "").replace(/\.+$/, "");
  const pedacos = (bruto.match(/[A-ZÀ-Ý][a-zà-ÿ]*/g) ?? []).map(norm);
  if (pedacos.length === 0) return null;
  const casam = blocos.filter((b) => {
    const entradas = entradasDoNome(b.nome);
    if (entradas.length < pedacos.length) return false;
    return pedacos.every(
      (p, i) => entradas[i].some((t) => casaAbreviado(p, t, 2)) || casaAbreviado(p, entradas[i].join(""), 2),
    );
  });
  return casam.length === 1 ? casam[0] : null;
}

/**
 * Diz se a orientação de uma bancada vale para o partido do deputado, e de que tipo.
 * A Câmara publica bancadas como:
 * - partido: "PL", "PT", às vezes truncado ("Solidaried");
 * - federação: "Fdr PSDB-CIDADAN";
 * - bloco: "Bl UniPpPsd..." (siglas em CamelCase, lista truncada).
 * Com a lista de blocos da API, o bloco é identificado e vale a composição completa
 * (partidos que não couberam na abreviação, como REPUBLICANOS, e os de federações, como PSDB).
 * Sem bloco identificado, só os partidos visíveis na abreviação contam.
 * "Governo", "Maioria", "Minoria" e "Oposição" não contam.
 */
export function tipoBancadaParaPartido(
  siglaBancada: string,
  siglaPartido: string,
  blocos: BlocoParlamentar[] = [],
): TipoOrientacao | null {
  const partido = chave(siglaPartido);
  if (!partido) return null;
  const bt = tokens(siglaBancada);
  if (bt.length === 1 && casaAbreviado(bt[0], partido, 5)) return "partido";
  if (bt[0] === "FDR" && bt.slice(1).some((t) => casaAbreviado(t, partido, 4))) return "federacao";
  if (bt[0] === "BL") {
    const bloco = blocoDaBancada(siglaBancada, blocos);
    if (bloco) return bloco.partidos.some((p) => chave(p) === partido) ? "bloco" : null;
    const bruto = siglaBancada.replace(/^Bl\s+/i, "").replace(/\.+$/, "");
    const pedacos = (bruto.match(/[A-ZÀ-Ý][a-zà-ÿ]*/g) ?? []).map(norm);
    if (pedacos.some((t) => casaAbreviado(t, partido, 3))) return "bloco";
  }
  return null;
}

export function bancadaIncluiPartido(siglaBancada: string, siglaPartido: string, blocos: BlocoParlamentar[] = []) {
  return tipoBancadaParaPartido(siglaBancada, siglaPartido, blocos) !== null;
}

export type VotoComOrientacoes = {
  voto: string;
  siglaPartido: string | null;
  orientacoes: { siglaBancada: string; orientacao: string }[];
};

const PRECEDENCIA: TipoOrientacao[] = ["partido", "federacao", "bloco"];

/** Orientação aplicável: a do partido; na falta, a da federação; na falta, a do bloco. */
export function orientacaoDoPartido(
  v: VotoComOrientacoes,
  blocos: BlocoParlamentar[] = [],
): { orientacao: string; tipo: TipoOrientacao } | null {
  if (!v.siglaPartido) return null;
  const candidatas = v.orientacoes
    .filter((o) => o.orientacao)
    .map((o) => ({ orientacao: o.orientacao, tipo: tipoBancadaParaPartido(o.siglaBancada, v.siglaPartido!, blocos) }))
    .filter((o): o is { orientacao: string; tipo: TipoOrientacao } => o.tipo !== null);
  for (const t of PRECEDENCIA) {
    const achou = candidatas.find((c) => c.tipo === t);
    if (achou) return achou;
  }
  return null;
}

/**
 * Alinhamento: entre as votações em que o partido orientou "Sim" ou "Não"
 * e o deputado votou "Sim" ou "Não", em quantas o voto coincidiu.
 */
export function alinhamento(votos: VotoComOrientacoes[], blocos: BlocoParlamentar[] = []) {
  let comparaveis = 0;
  let iguais = 0;
  for (const v of votos) {
    const o = orientacaoDoPartido(v, blocos)?.orientacao;
    if (!o || !ORIENTACOES_COMPARAVEIS.has(o) || !ORIENTACOES_COMPARAVEIS.has(v.voto)) continue;
    comparaveis++;
    if (o === v.voto) iguais++;
  }
  return { comparaveis, iguais, divergencias: comparaveis - iguais };
}

export type Teto = { mensal: number; verificado: boolean };

/** Teto acumulado da cota até o último mês com dados no ano. */
export function tetoAcumulado(teto: Teto | null, ultimoMes: number): number | null {
  if (!teto || ultimoMes < 1) return null;
  return teto.mensal * ultimoMes;
}

/** Variação nominal entre duas declarações de bens, em %. */
export function variacaoNominal(anterior: number, atual: number): number | null {
  if (anterior <= 0) return null;
  return Math.round(((atual - anterior) / anterior) * 100);
}
