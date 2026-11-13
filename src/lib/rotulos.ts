/** Rótulos por extenso usados no perfil, como no protótipo aprovado. */

export const NOME_UF: Record<string, string> = {
  AC: "Acre",
  AL: "Alagoas",
  AM: "Amazonas",
  AP: "Amapá",
  BA: "Bahia",
  CE: "Ceará",
  DF: "Distrito Federal",
  ES: "Espírito Santo",
  GO: "Goiás",
  MA: "Maranhão",
  MG: "Minas Gerais",
  MS: "Mato Grosso do Sul",
  MT: "Mato Grosso",
  PA: "Pará",
  PB: "Paraíba",
  PE: "Pernambuco",
  PI: "Piauí",
  PR: "Paraná",
  RJ: "Rio de Janeiro",
  RN: "Rio Grande do Norte",
  RO: "Rondônia",
  RR: "Roraima",
  RS: "Rio Grande do Sul",
  SC: "Santa Catarina",
  SE: "Sergipe",
  SP: "São Paulo",
  TO: "Tocantins",
};

/** Nome dos partidos registrados no TSE (tse.jus.br, "Partidos registrados no TSE"), pela sigla usada pela Câmara. */
export const NOME_PARTIDO: Record<string, string> = {
  AVANTE: "Avante",
  CIDADANIA: "Cidadania",
  MDB: "Movimento Democrático Brasileiro",
  MISSÃO: "Partido Missão",
  NOVO: "Partido Novo",
  PCdoB: "Partido Comunista do Brasil",
  PDT: "Partido Democrático Trabalhista",
  PL: "Partido Liberal",
  PODE: "Podemos",
  PP: "Progressistas",
  PRD: "Partido Renovação Democrática",
  PSB: "Partido Socialista Brasileiro",
  PSD: "Partido Social Democrático",
  PSDB: "Partido da Social Democracia Brasileira",
  PSOL: "Partido Socialismo e Liberdade",
  PT: "Partido dos Trabalhadores",
  PV: "Partido Verde",
  REDE: "Rede Sustentabilidade",
  REPUBLICANOS: "Republicanos",
  SOLIDARIEDADE: "Solidariedade",
  UNIÃO: "União Brasil",
};

/** "São Paulo (SP)"; sem nome conhecido, só a sigla. */
export function ufPorExtenso(uf: string | null): string {
  if (!uf) return "UF não informada";
  return NOME_UF[uf] ? `${NOME_UF[uf]} (${uf})` : uf;
}

/** "Partido dos Trabalhadores (PT)"; sem nome conhecido, só a sigla. */
export function partidoPorExtenso(sigla: string | null): string | null {
  if (!sigla) return null;
  return NOME_PARTIDO[sigla] ? `${NOME_PARTIDO[sigla]} (${sigla})` : sigla;
}

/** "Deputada federal", "Deputado federal" ou "Deputado(a) federal" quando a Câmara não informa. */
export function cargoDeputado(sexo: string | null): string {
  if (sexo === "F") return "Deputada federal";
  if (sexo === "M") return "Deputado federal";
  return "Deputado(a) federal";
}

/** Datas das legislaturas (API v2 da Câmara, /legislaturas). */
export const LEGISLATURAS: Record<number, { inicio: string; fim: string }> = {
  56: { inicio: "2019-02-01", fim: "2023-01-31" },
  57: { inicio: "2023-02-01", fim: "2027-01-31" },
};

/** "2023–2027" para a legislatura. */
export function periodoLegislatura(id: number | null): string | null {
  const l = id ? LEGISLATURAS[id] : undefined;
  return l ? `${l.inicio.slice(0, 4)}–${l.fim.slice(0, 4)}` : null;
}

/** "Senadora", "Senador" ou "Senador(a)" quando o Senado não informa. */
export function cargoSenador(sexo: string | null): string {
  if (sexo === "F") return "Senadora";
  if (sexo === "M") return "Senador";
  return "Senador(a)";
}

/** Cargo pela Casa: "Deputada federal" ou "Senadora". */
export function cargoParlamentar(casa: string, sexo: string | null): string {
  return casa === "senado" ? cargoSenador(sexo) : cargoDeputado(sexo);
}

/** Legislatura que começa no ano dado (57ª em 2023; uma a cada 4 anos). */
export function legislaturaDoAno(ano: number): number {
  return 57 + Math.floor((ano - 2023) / 4);
}

/** Mandato de senador: "2023–2031" e "57ª e 58ª legislaturas". */
export function periodoMandato(inicio: string | null, fim: string | null) {
  if (!inicio || !fim) return null;
  const a = Number(inicio.slice(0, 4));
  const b = Number(fim.slice(0, 4));
  const l1 = legislaturaDoAno(a);
  return { anos: `${a}–${b}`, legislaturas: `${l1}ª e ${l1 + 1}ª legislaturas` };
}

/** "Titular" ou "1º Suplente em exercício". */
export function seloParticipacao(participacao: string | null): string | null {
  if (!participacao) return null;
  return /suplente/i.test(participacao) ? `${participacao} em exercício` : participacao;
}

/**
 * Nome curto das categorias da CEAPS (o Senado publica o texto do ato normativo inteiro). O nome oficial
 * continua no CSV e no `title` da lista.
 */
const TIPOS_CURTOS: [RegExp, string][] = [
  [/^aluguel de im[oó]veis para escrit[oó]rio pol[ií]tico/i, "Aluguel de escritório"],
  [/^aquisi[cç][aã]o de material de consumo/i, "Material de escritório, software e correio"],
  [/^contrata[cç][aã]o de consultorias/i, "Consultorias e assessorias"],
  [/^locomo[cç][aã]o, hospedagem, alimenta[cç][aã]o, combust[ií]veis/i, "Locomoção, hospedagem e combustível"],
  [/^passagens a[eé]reas, aqu[aá]ticas e terrestres nacionais/i, "Passagens"],
];

export function tipoDespesaCurto(tipo: string): string | null {
  return TIPOS_CURTOS.find(([re]) => re.test(tipo))?.[1] ?? null;
}
