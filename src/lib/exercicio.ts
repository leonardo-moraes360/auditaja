/**
 * Períodos fora do exercício do mandato, a partir do histórico de situação que a Câmara
 * publica em /deputados/{id}/historico. Funções puras para teste e auditoria da metodologia.
 *
 * Regra de dia (presença): uma votação conta quando o deputado esteve em exercício em algum
 * momento do dia dela. Por isso:
 * - saída às 00:00 tira o dia inteiro; saída em outro horário só tira a partir do dia seguinte;
 * - reassunção ou posse em qualquer horário devolve o dia inteiro.
 * Um voto registrado sempre conta, mesmo dentro de um período (quem aplica é o chamador).
 */

/** Situação que a Câmara usa para "em exercício". As demais (Licença, Afastado, CONVOCADO...) tiram do exercício. */
export const SITUACAO_EXERCICIO = "Exercício";
/** Rótulo nosso para o trecho da legislatura antes da primeira posse do deputado. */
export const ANTES_DA_POSSE = "Antes da posse";

export type EventoHistorico = {
  dataHora: string;
  situacao: string | null;
  descricaoStatus: string | null;
};

export type PeriodoFora = {
  /** Primeiro dia inteiro fora do exercício (AAAA-MM-DD). */
  inicio: string;
  /** Último dia inteiro fora; null quando ainda não voltou. */
  fim: string | null;
  situacao: string;
  motivo: string;
};

export type TipoFora = "licenca" | "antes_posse" | "outro";

export function tipoFora(situacao: string): TipoFora {
  if (situacao === "Licença") return "licenca";
  if (situacao === ANTES_DA_POSSE) return "antes_posse";
  return "outro";
}

function somarDias(dia: string, n: number): string {
  const d = new Date(`${dia}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

/** "Saída - Afastamento com prazo determinado - Licença para Tratamento de Saúde" → o último trecho. */
export function motivoDoStatus(descricao: string | null, situacao: string): string {
  const partes = (descricao ?? "")
    .split(" - ")
    .map((s) => s.replace(/\s+/g, " ").trim())
    .filter(Boolean);
  return partes.at(-1) ?? situacao;
}

/**
 * Períodos fora do exercício na legislatura que começa em `inicioLegislatura`.
 * Devolve null quando o histórico não tem nenhum evento de situação (não dá para saber).
 * Renovações seguidas com a mesma situação e o mesmo motivo viram um período só.
 */
export function periodosForaDoExercicio(eventos: EventoHistorico[], inicioLegislatura: string): PeriodoFora[] | null {
  const comSituacao = eventos
    .filter((e): e is EventoHistorico & { situacao: string } => !!e.situacao)
    .toSorted((a, b) => a.dataHora.localeCompare(b.dataHora));
  if (!comSituacao.length) return null;

  const periodos: PeriodoFora[] = [];
  let aberto: PeriodoFora | null = {
    inicio: inicioLegislatura,
    fim: null,
    situacao: ANTES_DA_POSSE,
    motivo: ANTES_DA_POSSE,
  };
  const fechar = (fim: string) => {
    if (aberto && fim >= aberto.inicio) periodos.push({ ...aberto, fim });
    aberto = null;
  };

  for (const e of comSituacao) {
    const dia = e.dataHora.slice(0, 10);
    const hora = e.dataHora.slice(11, 16);
    if (e.situacao === SITUACAO_EXERCICIO) {
      if (aberto) fechar(somarDias(dia, -1));
      continue;
    }
    const motivo = motivoDoStatus(e.descricaoStatus, e.situacao);
    if (!aberto) {
      const inicio = hora === "00:00" || hora === "" ? dia : somarDias(dia, 1);
      aberto = { inicio, fim: null, situacao: e.situacao, motivo };
      continue;
    }
    // Antes da primeira posse, convocação e outros eventos não mudam nada: segue "antes da posse".
    if (aberto.situacao === ANTES_DA_POSSE) continue;
    if (aberto.situacao === e.situacao && aberto.motivo === motivo) continue;
    // Já fora do exercício: o dia do novo evento é fora de qualquer jeito, então o novo período começa nele.
    const inicio: string = dia > aberto.inicio ? dia : aberto.inicio;
    fechar(somarDias(inicio, -1));
    aberto = { inicio, fim: null, situacao: e.situacao, motivo };
  }
  if (aberto) periodos.push(aberto);
  return periodos;
}

/** O período fora do exercício que cobre o dia, se houver. */
export function periodoDoDia<P extends { inicio: string; fim: string | null }>(periodos: P[], dia: string): P | null {
  return periodos.find((p) => p.inicio <= dia && (p.fim === null || dia <= p.fim)) ?? null;
}

export type PeriodoNoAno = PeriodoFora & { tipo: TipoFora; votacoes: number };

/**
 * Presença considerando o exercício. Uma votação fica fora da conta quando cai num período fora
 * do exercício e o deputado não registrou voto nela. `periodos` null = histórico não coletado:
 * todas as votações contam, como antes.
 */
export function presencaEmExercicio(
  votacoes: { id: string; data: string }[],
  votoPorVotacao: Map<string, string>,
  periodos: PeriodoFora[] | null,
  ano: number,
) {
  const presentes = votacoes.filter((v) => (votoPorVotacao.get(v.id) ?? "") !== "").length;
  const fora = new Map<string, TipoFora>();
  const contagem = new Map<PeriodoFora, number>();
  for (const v of votacoes) {
    if ((votoPorVotacao.get(v.id) ?? "") !== "" || !periodos) continue;
    const p = periodoDoDia(periodos, v.data);
    if (!p) continue;
    fora.set(v.id, tipoFora(p.situacao));
    contagem.set(p, (contagem.get(p) ?? 0) + 1);
  }
  const ini = `${ano}-01-01`;
  const fim = `${ano}-12-31`;
  const periodosNoAno: PeriodoNoAno[] = (periodos ?? [])
    .filter((p) => p.inicio <= fim && (p.fim === null || p.fim >= ini))
    .map((p) => ({
      ...p,
      inicio: p.inicio < ini ? ini : p.inicio,
      fim: p.fim !== null && p.fim > fim ? fim : p.fim,
      tipo: tipoFora(p.situacao),
      votacoes: contagem.get(p) ?? 0,
    }));
  const tipos = new Set(fora.values());
  return {
    historicoDisponivel: periodos !== null,
    presentes,
    elegiveis: votacoes.length - fora.size,
    foraDoExercicio: fora.size,
    /** Tipo comum a todas as votações fora; "outro" quando misturam licença e outros motivos. */
    tipoFora: tipos.size === 1 ? [...tipos][0] : tipos.size ? ("outro" as TipoFora) : null,
    foraPorVotacao: fora,
    periodosNoAno,
  };
}
