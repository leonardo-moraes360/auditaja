import type { TrilhaCheia } from "@/data/trilha";
import { brlCompacto, dataBr } from "@auditaja/core/format";
import { formatarCnpj } from "@auditaja/core/privacy";
import { DIAS_RECEM_ABERTA, nomeLegivel, notasAvaliacao, taxaDeBase, type QuemIndicou } from "@auditaja/core/trilha";

/**
 * Grafo do caminho do dinheiro das emendas Pix (artboards GrafoDinheiro*, aprovados em 13/11/2026).
 * Colunas: parlamentar → emendas → municípios → quem recebeu → campanha (TSE). Expansão progressiva:
 * uma emenda e um município abertos por vez; no máximo LIMITE_MUNICIPIOS municípios e
 * LIMITE_RECEBEDORES recebedores à vista por coluna, o resto em nós de grupo. A lista é o equivalente
 * acessível: os mesmos nós, com os grupos abertos um por um.
 * Funções puras: os dados chegam já lidos (dadosDoGrafo, no servidor) e o estado vem do cliente.
 */

export const LIMITE_MUNICIPIOS = 5;
export const LIMITE_RECEBEDORES = 4;
/** Centro de cada coluna, em % da largura do grafo. */
export const COLUNAS_X = [7.5, 27.5, 49.5, 71.5, 91] as const;
export const LARGURA_NO = [140, 176, 176, 184, 168] as const;
export const ALTURA_NO = 72;
export const ALTURA_GRAFO = 740;
const TOPO = 96;
const BASE = ALTURA_GRAFO - 16;
const PASSO_MAX = 88;
/** Passo mínimo entre centros: altura do nó e um respiro. */
const PASSO_MIN = 80;

export const NAO_PROVA = "Indício não é prova de irregularidade.";

export type RecebedorGrafo = {
  cnpj: string;
  nome: string;
  valor: number;
  primeiroPagamento: string;
  recem: { dias: number; abertura: string } | null;
  ciclo: { despesa: number; primeiraDespesa: string; eleicao: number } | null;
};

export type MunicipioGrafo = {
  id: number;
  nome: string;
  uf: string | null;
  recebido: number;
  pago: number;
  recebedores: RecebedorGrafo[];
  pf: { pagamentos: number; valor: number };
};

export type EmendaGrafo = {
  codigo: string;
  funcao: string;
  ano: number;
  empenhado: number;
  transferido: number;
  pago: number;
  indicios: number;
  municipios: MunicipioGrafo[];
  /** Ciclo fechado com favorecido pago direto pela União (sem município no meio). */
  diretos: RecebedorGrafo[];
};

export type DadosGrafo = {
  parlamentar: { id: number; nome: string; cargo: string; uf: string | null };
  quem: QuemIndicou;
  eleicao: number | null;
  avaliado: { recem: boolean; ciclo: boolean };
  notas: string[];
  taxas: { recem: string; ciclo: string };
  totais: { transferido: number; pago: number; emendas: number; entes: number };
  emendas: EmendaGrafo[];
};

/** "R$ 32,0 mi", "R$ 640 mil", "R$ 9.800,00". */
export function valorCurto(v: number): string {
  if (Math.abs(v) >= 1_000_000)
    return `R$ ${(v / 1_000_000).toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 })} mi`;
  return brlCompacto(v);
}

const n = (v: number) => v.toLocaleString("pt-BR");
const plural = (q: number, um: string, varios: string) => `${n(q)} ${q === 1 ? um : varios}`;

/** "MUNICIPIO DE SANTA MARIA" → "Santa Maria"; estados e fundos ficam com o nome inteiro. */
export function nomeDoEnte(nome: string | null): string {
  return (nomeLegivel(nome) || "Ente não informado").replace(/^Munic[ií]pio de /, "");
}

/** Recorte serializável da trilha para o cliente: só o que o grafo mostra. */
export function dadosDoGrafo(
  t: TrilhaCheia,
  p: { id: number; nome: string; cargo: string; uf: string | null },
  quem: QuemIndicou,
): DadosGrafo {
  const recem = t.avaliacao.recemAberta === "avaliado";
  const ciclo = t.avaliacao.ciclo === "avaliado";
  const ciclos = t.indicios.filter((i) => i.tipo === "ciclo-fechado");
  // Ciclo marcado no município do primeiro recebimento (o alvo de "Ver na trilha", DENS-09).
  const cicloDe = (emenda: string, cnpj: string, plano: number) => {
    if (!ciclo) return null;
    const c = ciclos.find((i) => i.emenda === emenda && i.cnpj === cnpj && !i.direto && i.plano === plano);
    return c ? { despesa: c.despesaCampanha, primeiraDespesa: c.primeiraDespesa, eleicao: c.eleicao } : null;
  };
  // Recém-aberta marcada só no plano em que o indício foi calculado (o mesmo CNPJ pode aparecer em outro município).
  const recemNoPlano = (emenda: string, cnpj: string, plano: number) =>
    t.indicios.some((i) => i.tipo === "recem-aberta" && i.emenda === emenda && i.cnpj === cnpj && i.plano === plano);
  return {
    parlamentar: p,
    quem,
    eleicao: t.eleicao,
    avaliado: { recem, ciclo },
    notas: notasAvaliacao(t.avaliacao.recemAberta, t.avaliacao.ciclo, t.receitaBase, t.eleicao),
    taxas: {
      recem: `${taxaDeBase(...t.taxas.recemAberta)} das empresas pagas com emendas Pix caem nesta regra.`,
      ciclo: `${taxaDeBase(...t.taxas.ciclo)} dos parlamentares com emenda Pix têm um caso assim.`,
    },
    totais: {
      transferido: t.totais.transferido,
      pago: t.totais.pago,
      emendas: t.totais.emendas,
      entes: t.totais.entes,
    },
    emendas: t.emendas.map((e) => ({
      codigo: e.codigo,
      funcao: e.funcao,
      ano: e.ano,
      empenhado: e.empenhado,
      transferido: e.transferido,
      pago: e.pago,
      indicios: e.indicios,
      municipios: e.planos.map((pl) => ({
        id: pl.id,
        nome: nomeDoEnte(pl.ente.nome),
        uf: pl.ente.uf,
        recebido: pl.valor,
        pago: pl.pago,
        pf: pl.pf,
        recebedores: pl.recebedores.map((r) => ({
          cnpj: r.cnpj,
          nome: nomeLegivel(r.nome),
          valor: r.valor,
          primeiroPagamento: r.primeiroPagamento,
          recem:
            recem && r.recemAberta?.indicio && r.abertura && recemNoPlano(e.codigo, r.cnpj, pl.id)
              ? { dias: r.recemAberta.dias, abertura: r.abertura.data }
              : null,
          ciclo: cicloDe(e.codigo, r.cnpj, pl.id),
        })),
      })),
      diretos: ciclos
        .filter((i) => i.emenda === e.codigo && i.direto)
        .map((i) => ({
          cnpj: i.cnpj,
          nome: nomeLegivel(i.nome),
          valor: i.recebido,
          primeiroPagamento: i.primeiroRecebimento,
          recem: null,
          ciclo: { despesa: i.despesaCampanha, primeiraDespesa: i.primeiraDespesa, eleicao: i.eleicao },
        })),
    })),
  };
}

export type EstadoGrafo = {
  /** Código da emenda aberta. */
  em: string | null;
  /** Id do plano (município) aberto. */
  mu: number | null;
  /** Nó selecionado (painel de detalhes). */
  sel: string | null;
  /** Só caminhos com indício. */
  so: boolean;
};

export type TipoNo =
  | "parlamentar"
  | "emenda"
  | "municipio"
  | "grupo-municipios"
  | "sem-pagamento"
  | "empresa"
  | "grupo-recebedores"
  | "pessoas-fisicas"
  | "campanha";

export type No = {
  id: string;
  col: 0 | 1 | 2 | 3 | 4;
  tipo: TipoNo;
  nome: string;
  meta: string;
  valor: number;
  /** Texto do selo de indício (vazio: sem selo). */
  selo: string;
  grupo: boolean;
  /** O que o clique faz: abrir a emenda, abrir o município ou só mostrar os detalhes. */
  abre: "emenda" | "municipio" | "detalhe";
  alvo: string | number | null;
  aria: string;
  /** Linha secundária do cartão no celular. */
  resumo: string;
  pai: string | null;
  /** Centro vertical, em px. */
  y: number;
};

export type Aresta = {
  de: string;
  para: string;
  valor: number;
  /** Transferido sem pagamento informado (tracejado). */
  semPagamento: boolean;
  indicio: boolean;
  campanha: boolean;
};

const temIndicio = (r: RecebedorGrafo) => !!(r.recem || r.ciclo);
const seloDe = (r: RecebedorGrafo) =>
  r.recem && r.ciclo ? "2 indícios" : r.recem ? "recém-aberta" : r.ciclo ? "também na campanha" : "";
const indiciosDoMunicipio = (m: MunicipioGrafo) => m.recebedores.filter(temIndicio).length;
const seloQtd = (q: number) => (q ? plural(q, "indício", "indícios") : "");

/** Plano do município, ou `direto-<emenda>` para o favorecido pago direto pela União. */
export const idRecebedor = (plano: number | string, cnpj: string) => `r:${plano}:${cnpj}`;
/** Recebedores do município: as empresas e, somadas numa linha, as pessoas físicas. */
export const qtdRecebedores = (m: MunicipioGrafo) => m.recebedores.length + (m.pf.pagamentos > 0 ? 1 : 0);
const pct = (a: number, b: number) => (b > 0 ? Math.round((a / b) * 100) : 0);

/** Os primeiros `limite` por valor, mais os que têm de aparecer (indício, aberto), na ordem de valor. */
function aVista<T>(lista: T[], limite: number, obrigatorio: (x: T) => boolean): { vistos: T[]; resto: T[] } {
  const fixos = lista.filter(obrigatorio);
  const vagas = Math.max(0, limite - fixos.length);
  const outros = lista.filter((x) => !obrigatorio(x)).slice(0, vagas);
  const vistos = lista.filter((x) => fixos.includes(x) || outros.includes(x));
  return { vistos, resto: lista.filter((x) => !vistos.includes(x)) };
}

export function municipiosOrdenados(e: EmendaGrafo) {
  return e.municipios.toSorted((a, b) => b.pago - a.pago || b.recebido - a.recebido || a.nome.localeCompare(b.nome));
}

export function montarGrafo(d: DadosGrafo, estado: EstadoGrafo) {
  const so = estado.so && (d.avaliado.recem || d.avaliado.ciclo);
  const nos: No[] = [];
  const arestas: Aresta[] = [];
  const add = (no: Omit<No, "y">) => {
    const x = { ...no, y: 0 };
    nos.push(x);
    return x;
  };
  const p = d.parlamentar;
  const raiz = add({
    id: "parlamentar",
    col: 0,
    tipo: "parlamentar",
    nome: p.nome,
    meta: `${p.cargo}${p.uf ? ` · ${p.uf}` : ""}`,
    valor: d.totais.transferido,
    selo: "",
    grupo: false,
    abre: "detalhe",
    alvo: null,
    pai: null,
    resumo: p.cargo,
    aria: `${p.cargo} ${p.nome}, ${plural(d.totais.emendas, "emenda Pix", "emendas Pix")}, ${valorCurto(d.totais.transferido)} transferidos`,
  });

  const emenda = d.emendas.find((e) => e.codigo === estado.em) ?? null;
  for (const e of d.emendas) {
    if (so && !e.indicios && e !== emenda) continue;
    const selo = seloQtd(e.indicios);
    const no = add({
      id: `e:${e.codigo}`,
      col: 1,
      tipo: "emenda",
      nome: e.codigo,
      meta: `${e.funcao} · ${valorCurto(e.transferido)}`,
      valor: e.transferido,
      selo,
      grupo: false,
      abre: "emenda",
      alvo: e.codigo,
      pai: raiz.id,
      resumo: `${e.funcao} · ${plural(e.municipios.length, "município", "municípios")} · ${pct(e.pago, e.transferido)}% pago`,
      aria: `Emenda ${e.codigo}, ${e.funcao}, ${valorCurto(e.transferido)} transferidos a ${plural(e.municipios.length, "município ou estado", "municípios ou estados")}, ${valorCurto(e.pago)} com pagamento${selo ? `, ${selo}` : ""}. Abrir`,
    });
    arestas.push({
      de: raiz.id,
      para: no.id,
      valor: e.transferido,
      semPagamento: false,
      indicio: !!selo,
      campanha: false,
    });
  }

  let municipio: MunicipioGrafo | null = null;
  if (emenda) {
    const idE = `e:${emenda.codigo}`;
    const todos = municipiosOrdenados(emenda);
    municipio = todos.find((m) => m.id === estado.mu) ?? null;
    const comPago = todos.filter((m) => m.pago > 0 || m === municipio || indiciosDoMunicipio(m) > 0);
    const semPago = todos.filter((m) => !comPago.includes(m));
    const { vistos, resto } = so
      ? { vistos: comPago.filter((m) => indiciosDoMunicipio(m) > 0 || m === municipio), resto: [] as MunicipioGrafo[] }
      : aVista(comPago, LIMITE_MUNICIPIOS, (m) => m === municipio || indiciosDoMunicipio(m) > 0);
    for (const m of vistos) {
      const selo = seloQtd(indiciosDoMunicipio(m));
      const qtd = qtdRecebedores(m);
      add({
        id: `m:${m.id}`,
        col: 2,
        tipo: "municipio",
        nome: m.nome,
        meta: `pagou ${valorCurto(m.pago)}`,
        valor: m.pago,
        selo,
        grupo: false,
        abre: "municipio",
        alvo: m.id,
        pai: idE,
        resumo: `pagou a ${plural(qtd, "recebedor", "recebedores")}`,
        aria: `${m.nome}, recebeu ${valorCurto(m.recebido)} e pagou ${valorCurto(m.pago)} a ${plural(qtd, "recebedor", "recebedores")}${selo ? `, ${selo}` : ""}. Abrir quem recebeu`,
      });
      arestas.push({
        de: idE,
        para: `m:${m.id}`,
        valor: m.pago,
        semPagamento: false,
        indicio: !!selo,
        campanha: false,
      });
    }
    if (!so && resto.length) {
      const v = resto.reduce((t, m) => t + m.pago, 0);
      add({
        id: `mo:${emenda.codigo}`,
        col: 2,
        tipo: "grupo-municipios",
        nome: resto.length === 1 ? "Outro 1 município" : `Outros ${n(resto.length)} municípios`,
        meta: `pagaram ${valorCurto(v)}`,
        valor: v,
        selo: "",
        grupo: true,
        abre: "detalhe",
        alvo: null,
        pai: idE,
        resumo: "grupo · pagaram",
        aria: `Grupo: ${resto.length === 1 ? "outro" : "outros"} ${plural(resto.length, "município", "municípios")} com pagamento, ${valorCurto(v)}. Um por um na lista`,
      });
      arestas.push({
        de: idE,
        para: `mo:${emenda.codigo}`,
        valor: v,
        semPagamento: false,
        indicio: false,
        campanha: false,
      });
    }
    if (!so && semPago.length) {
      const v = semPago.reduce((t, m) => t + m.recebido, 0);
      add({
        id: `ms:${emenda.codigo}`,
        col: 2,
        tipo: "sem-pagamento",
        nome: `${n(semPago.length)} sem pagamento`,
        meta: `receberam ${valorCurto(v)}`,
        valor: v,
        selo: "",
        grupo: true,
        abre: "detalhe",
        alvo: null,
        pai: idE,
        resumo: "transferido, sem pagamento",
        aria: `Grupo: ${plural(semPago.length, "município sem pagamento informado", "municípios sem pagamento informado")}, receberam ${valorCurto(v)}. Um por um na lista`,
      });
      arestas.push({
        de: idE,
        para: `ms:${emenda.codigo}`,
        valor: v,
        semPagamento: true,
        indicio: false,
        campanha: false,
      });
    }

    const visto = new Set(vistos.map((m) => m.id));
    const paiDoMunicipio = (m: MunicipioGrafo) => (visto.has(m.id) ? `m:${m.id}` : `mo:${emenda.codigo}`);
    const addRecebedor = (r: RecebedorGrafo, plano: number | string, pai: string, de: string) => {
      const selo = seloDe(r);
      const direto = typeof plano === "string";
      add({
        id: idRecebedor(plano, r.cnpj),
        col: 3,
        tipo: "empresa",
        nome: r.nome,
        meta: `${valorCurto(r.valor)} · ${direto ? de : `de ${de}`}`,
        resumo: "empresa ou entidade",
        valor: r.valor,
        selo,
        grupo: false,
        abre: "detalhe",
        alvo: null,
        pai,
        aria: `${r.nome}, CNPJ ${formatarCnpj(r.cnpj)}, recebeu ${valorCurto(r.valor)} ${direto ? "direto da União" : `de ${de}`}${selo ? `, indício: ${selo}` : ""}`,
      });
      arestas.push({
        de: pai,
        para: idRecebedor(plano, r.cnpj),
        valor: r.valor,
        semPagamento: false,
        indicio: !!selo,
        campanha: false,
      });
    };

    if (municipio) {
      const m = municipio;
      const ordem = m.recebedores.toSorted((a, b) => b.valor - a.valor || a.nome.localeCompare(b.nome));
      const { vistos: rv, resto: rr } = so
        ? { vistos: ordem.filter(temIndicio), resto: [] as RecebedorGrafo[] }
        : aVista(ordem, LIMITE_RECEBEDORES, temIndicio);
      for (const r of rv) addRecebedor(r, m.id, `m:${m.id}`, m.nome);
      if (rr.length) {
        const v = rr.reduce((t, r) => t + r.valor, 0);
        add({
          id: `ro:${m.id}`,
          col: 3,
          tipo: "grupo-recebedores",
          nome: rr.length === 1 ? "Outra 1 empresa" : `Outras ${n(rr.length)} empresas`,
          meta: `${valorCurto(v)} · de ${m.nome}`,
          resumo: "grupo",
          valor: v,
          selo: "",
          grupo: true,
          abre: "detalhe",
          alvo: null,
          pai: `m:${m.id}`,
          aria: `Grupo: ${rr.length === 1 ? "outra" : "outras"} ${plural(rr.length, "empresa ou entidade", "empresas ou entidades")} pagas por ${m.nome}, ${valorCurto(v)}. Uma por uma na lista`,
        });
        arestas.push({
          de: `m:${m.id}`,
          para: `ro:${m.id}`,
          valor: v,
          semPagamento: false,
          indicio: false,
          campanha: false,
        });
      }
      if (!so && m.pf.pagamentos > 0) {
        add({
          id: `pf:${m.id}`,
          col: 3,
          tipo: "pessoas-fisicas",
          nome: "Pessoas físicas",
          meta: `${valorCurto(m.pf.valor)} · ${plural(m.pf.pagamentos, "pagamento", "pagamentos")}`,
          resumo: "somadas, sem nome nem CPF",
          valor: m.pf.valor,
          selo: "",
          grupo: true,
          abre: "detalhe",
          alvo: null,
          pai: `m:${m.id}`,
          aria: `${plural(m.pf.pagamentos, "pagamento a pessoa física", "pagamentos a pessoas físicas")} de ${m.nome}, somados, sem nome nem CPF: ${valorCurto(m.pf.valor)}`,
        });
        arestas.push({
          de: `m:${m.id}`,
          para: `pf:${m.id}`,
          valor: m.pf.valor,
          semPagamento: false,
          indicio: false,
          campanha: false,
        });
      }
    } else {
      // Sem município aberto: os recebedores com indício (de qualquer município) e o resto num grupo.
      const pares = todos.flatMap((m) => m.recebedores.map((r) => ({ m, r })));
      const comInd = pares.filter(({ r }) => temIndicio(r));
      // Sem indício na emenda: os 2 maiores (nunca com o filtro, que só mostra caminhos com indício).
      const mostrados =
        comInd.length || emenda.diretos.length || so
          ? comInd
          : pares.toSorted((a, b) => b.r.valor - a.r.valor).slice(0, 2);
      for (const { m, r } of mostrados.toSorted((a, b) => b.r.valor - a.r.valor))
        addRecebedor(r, m.id, paiDoMunicipio(m), m.nome);
      for (const r of emenda.diretos) addRecebedor(r, `direto-${emenda.codigo}`, idE, "direto da União");
      const restantesPares = pares.filter((x) => !mostrados.includes(x));
      const restantes = new Set(restantesPares.map(({ r }) => r.cnpj));
      if (!so && restantes.size) {
        const v = restantesPares.reduce((t, { r }) => t + r.valor, 0);
        const id = `ro:${emenda.codigo}`;
        add({
          id,
          col: 3,
          tipo: "grupo-recebedores",
          nome: restantes.size === 1 ? "Outro 1 recebedor" : `Outros ${n(restantes.size)} recebedores`,
          meta: valorCurto(v),
          valor: v,
          selo: "",
          grupo: true,
          abre: "detalhe",
          alvo: null,
          pai: null,
          resumo: "grupo",
          aria: `Grupo: ${restantes.size === 1 ? "outro 1 recebedor" : `outros ${n(restantes.size)} recebedores`} da emenda ${emenda.codigo}, ${valorCurto(v)}. Um por um na lista`,
        });
        const pais = new Map<string, number>();
        for (const { m, r } of restantesPares)
          pais.set(paiDoMunicipio(m), (pais.get(paiDoMunicipio(m)) ?? 0) + r.valor);
        for (const [pai, valor] of pais)
          arestas.push({ de: pai, para: id, valor, semPagamento: false, indicio: false, campanha: false });
      }
    }

    const comCiclo = nos
      .filter((x) => x.col === 3 && x.tipo === "empresa")
      .flatMap((x) => {
        const [, plano, cnpj] = x.id.split(":");
        const r = plano.startsWith("direto-")
          ? emenda.diretos.find((y) => y.cnpj === cnpj)
          : emenda.municipios.find((y) => String(y.id) === plano)?.recebedores.find((y) => y.cnpj === cnpj);
        return r?.ciclo ? [{ no: x, r }] : [];
      });
    if (comCiclo.length) {
      // A despesa de campanha é do CNPJ: conta uma vez, mesmo se ele aparece por dois caminhos.
      const porCnpj = new Map(comCiclo.map((c) => [c.r.cnpj, c.r.ciclo!.despesa]));
      const despesa = [...porCnpj.values()].reduce((t, v) => t + v, 0);
      const eleicao = comCiclo[0].r.ciclo!.eleicao;
      add({
        id: "campanha",
        col: 4,
        tipo: "campanha",
        nome: `Campanha de ${eleicao}`,
        meta: `${valorCurto(despesa)} · TSE`,
        valor: despesa,
        selo: "ciclo com a emenda",
        grupo: false,
        abre: "detalhe",
        alvo: null,
        pai: null,
        resumo: "despesas declaradas ao TSE",
        aria: `Campanha de ${eleicao} ${d.quem}, despesas declaradas ao TSE com ${plural(porCnpj.size, "empresa", "empresas")} desta emenda: ${valorCurto(despesa)}. Indício: ciclo com a emenda`,
      });
      for (const c of comCiclo)
        arestas.push({
          de: c.no.id,
          para: "campanha",
          valor: c.r.ciclo!.despesa,
          semPagamento: false,
          indicio: true,
          campanha: true,
        });
    }
  }

  // Layout: cada coluna centrada na faixa vertical, passo até PASSO_MAX; a altura cresce para não sobrepor nós.
  const maiorColuna = Math.max(...[0, 1, 2, 3, 4].map((c) => nos.filter((x) => x.col === c).length));
  const altura = Math.max(ALTURA_GRAFO, TOPO + maiorColuna * PASSO_MIN + (ALTURA_GRAFO - BASE));
  const base = altura - (ALTURA_GRAFO - BASE);
  for (let c = 0; c < 5; c++) {
    const col = nos.filter((x) => x.col === c);
    const passo = Math.min(PASSO_MAX, (base - TOPO) / Math.max(1, col.length));
    const meio = (TOPO + base) / 2;
    col.forEach((x, i) => (x.y = Math.round(meio + (i - (col.length - 1) / 2) * passo)));
  }

  const porId = new Map(nos.map((x) => [x.id, x]));
  const sel = estado.sel && porId.has(estado.sel) ? estado.sel : null;
  const caminho = new Set<string>(["parlamentar"]);
  if (emenda) caminho.add(`e:${emenda.codigo}`);
  if (municipio) caminho.add(`m:${municipio.id}`);
  if (sel) {
    caminho.add(sel);
    let pai = porId.get(sel)?.pai;
    while (pai) {
      caminho.add(pai);
      pai = porId.get(pai)?.pai;
    }
    if (sel === "campanha") for (const a of arestas) if (a.campanha) caminho.add(a.de);
  }
  const temCiclo = porId.has("campanha");

  return {
    nos,
    arestas,
    caminho,
    sel,
    altura,
    temCiclo,
    emenda,
    municipio,
    so,
    status: statusDoGrafo(d, nos, emenda, municipio, so),
  };
}

export type Grafo = ReturnType<typeof montarGrafo>;

function statusDoGrafo(
  d: DadosGrafo,
  nos: No[],
  emenda: EmendaGrafo | null,
  municipio: MunicipioGrafo | null,
  so: boolean,
): string {
  const filtro = so ? "Filtro ligado: só os caminhos com indício. " : "";
  if (!emenda)
    return `${filtro}Mostrando ${plural(nos.filter((x) => x.col === 1).length, "emenda Pix", "emendas Pix")}. Escolha uma para abrir os municípios.`;
  if (municipio) {
    if (so) {
      const q = nos.filter((x) => x.tipo === "empresa").length;
      return q
        ? `${filtro}Mostrando quem ${municipio.nome} pagou com a emenda ${emenda.codigo}: ${plural(q, "recebedor com indício", "recebedores com indício")}.`
        : `${filtro}${municipio.nome} não pagou, com a emenda ${emenda.codigo}, nenhum recebedor com indício.`;
    }
    const q = qtdRecebedores(municipio);
    return `${filtro}Mostrando quem ${municipio.nome} pagou com a emenda ${emenda.codigo}: ${plural(q, "recebedor", "recebedores")}${
      nos.some((x) => x.tipo === "grupo-recebedores") ? ", os maiores à vista e o resto agrupado" : ""
    }.`;
  }
  const vistos = nos.filter((x) => x.tipo === "municipio").length;
  const total = emenda.municipios.length;
  if (!total)
    return `${filtro}Emenda ${emenda.codigo} aberta: nenhum município ou estado com plano de ação no Transferegov${
      emenda.diretos.length
        ? `; ${plural(emenda.diretos.length, "recebedor direto da União", "recebedores diretos da União")} à vista`
        : ""
    }.`;
  const parte = so
    ? `${n(vistos)} com indício`
    : vistos === total
      ? "todos à vista"
      : vistos
        ? `${n(vistos)} à vista e o resto agrupado`
        : "todos agrupados";
  const direita =
    emenda.indicios > 0 && (d.avaliado.recem || d.avaliado.ciclo) ? "; dos recebedores, só os com indício à vista" : "";
  return `${filtro}Emenda ${emenda.codigo} aberta: ${plural(total, "município ou estado", "municípios ou estados")}, ${parte}${direita}.`;
}

/** Caminho de curva entre centros de nós, no viewBox 0 0 1000 × altura. */
export function curva(de: No, para: No): string {
  const x1 = COLUNAS_X[de.col] * 10;
  const x2 = COLUNAS_X[para.col] * 10;
  const xm = (x1 + x2) / 2;
  return `M ${x1} ${de.y} C ${xm} ${de.y}, ${xm} ${para.y}, ${x2} ${para.y}`;
}

/** Arco do ciclo fechado: da campanha, por cima, de volta ao parlamentar. */
export function arcoDoCiclo(campanha: No, raiz: No): string {
  const x1 = COLUNAS_X[4] * 10;
  const x0 = COLUNAS_X[0] * 10;
  return `M ${x1} ${campanha.y} C ${x1} 8, ${x0} 8, ${x0} ${raiz.y}`;
}

/** Espessura da linha (px), pela raiz do valor relativo ao maior da camada. */
export function espessura(valor: number, maior: number): number {
  if (maior <= 0) return 2;
  return Math.round((2 + 12 * Math.sqrt(Math.min(1, Math.max(0, valor) / maior))) * 10) / 10;
}

export type LinhaLista = {
  id: string;
  nome: string;
  meta: string;
  veioDe: string;
  valor: string;
  selo: string;
  abre: No["abre"];
  alvo: string | number | null;
};

export type GrupoLista = { titulo: string; linhas: LinhaLista[] };

/** Equivalente acessível do grafo: as mesmas colunas, com os grupos abertos um por um. */
export function listaDoGrafo(d: DadosGrafo, g: Grafo): GrupoLista[] {
  const grupos: GrupoLista[] = [];
  const emendas = g.nos.filter((x) => x.col === 1);
  grupos.push({
    titulo: `Emendas Pix (${n(emendas.length)})`,
    linhas: emendas.map((x) => {
      const e = d.emendas.find((y) => y.codigo === x.alvo)!;
      return {
        id: x.id,
        nome: e.codigo,
        meta: `${e.funcao} · ${plural(e.municipios.length, "município", "municípios")}`,
        veioDe: d.parlamentar.nome,
        valor: valorCurto(e.transferido),
        selo: x.selo,
        abre: "emenda",
        alvo: e.codigo,
      };
    }),
  });
  const e = g.emenda;
  if (!e) return grupos;
  const todos = municipiosOrdenados(e).filter((m) => !g.so || indiciosDoMunicipio(m) > 0 || m === g.municipio);
  grupos.push({
    titulo: `Municípios da emenda ${e.codigo} (${n(todos.length)})`,
    linhas: todos.map((m) => ({
      id: `m:${m.id}`,
      nome: m.nome,
      meta: m.pago > 0 ? `recebeu ${valorCurto(m.recebido)}` : "sem pagamento informado",
      veioDe: e.codigo,
      valor: m.pago > 0 ? valorCurto(m.pago) : `${valorCurto(m.recebido)} transferido`,
      selo: seloQtd(indiciosDoMunicipio(m)),
      abre: "municipio",
      alvo: m.id,
    })),
  });
  const m = g.municipio;
  if (m) {
    const ordem = m.recebedores
      .toSorted((a, b) => b.valor - a.valor || a.nome.localeCompare(b.nome))
      .filter((r) => !g.so || temIndicio(r));
    const linhas: LinhaLista[] = ordem.map((r) => ({
      id: idRecebedor(m.id, r.cnpj),
      nome: r.nome,
      meta: `CNPJ ${formatarCnpj(r.cnpj)}`,
      veioDe: m.nome,
      valor: valorCurto(r.valor),
      selo: seloDe(r),
      abre: "detalhe",
      alvo: null,
    }));
    if (!g.so && m.pf.pagamentos)
      linhas.push({
        id: `pf:${m.id}`,
        nome: "Pessoas físicas",
        meta: `${plural(m.pf.pagamentos, "pagamento", "pagamentos")}, somados, sem nome nem CPF`,
        veioDe: m.nome,
        valor: valorCurto(m.pf.valor),
        selo: "",
        abre: "detalhe",
        alvo: null,
      });
    grupos.push({ titulo: `Quem ${m.nome} pagou (${n(linhas.length)})`, linhas });
  } else {
    // Sem município aberto: todos os recebedores da emenda, um por um (o grupo "Outros" do grafo aberto).
    const pares = municipiosOrdenados(e)
      .flatMap((mm) => mm.recebedores.map((r) => ({ id: idRecebedor(mm.id, r.cnpj), r, de: mm.nome })))
      .concat(e.diretos.map((r) => ({ id: idRecebedor(`direto-${e.codigo}`, r.cnpj), r, de: "direto da União" })))
      .filter(({ r }) => !g.so || temIndicio(r))
      .toSorted((a, b) => b.r.valor - a.r.valor || a.r.nome.localeCompare(b.r.nome));
    if (pares.length)
      grupos.push({
        titulo: `${g.so ? "Recebedores com indício" : "Recebedores da emenda"} (${n(pares.length)})`,
        linhas: pares.map(({ id, r, de }) => ({
          id,
          nome: r.nome,
          meta: `CNPJ ${formatarCnpj(r.cnpj)}`,
          veioDe: de,
          valor: valorCurto(r.valor),
          selo: seloDe(r),
          abre: "detalhe",
          alvo: null,
        })),
      });
  }
  const camp = g.nos.find((x) => x.id === "campanha");
  if (camp)
    grupos.push({
      titulo: "Campanha (TSE)",
      linhas: [
        {
          id: camp.id,
          nome: camp.nome,
          meta: "despesas declaradas ao TSE",
          veioDe: listaNomes([
            ...new Set(g.arestas.filter((a) => a.campanha).map((a) => g.nos.find((y) => y.id === a.de)?.nome ?? "")),
          ]),
          valor: valorCurto(camp.valor),
          selo: camp.selo,
          abre: "detalhe",
          alvo: null,
        },
      ],
    });
  return grupos;
}

/** "A", "A e B", "A, B e C". */
export function listaNomes(xs: string[]): string {
  return xs.length <= 1 ? (xs[0] ?? "") : `${xs.slice(0, -1).join(", ")} e ${xs.at(-1)}`;
}

export type Detalhe = {
  tipo: string;
  titulo: string;
  sub: string;
  linhas: { r: string; v: string }[];
  nota: string;
  fonte: { texto: string; href: string } | null;
  indicios: { tipo: "recem-aberta" | "ciclo-fechado"; titulo: string; frase: string; base: string }[];
  /** Rótulo do botão que abre os itens na lista (vazio: sem botão). */
  verNaLista: string;
};

const API = "https://api-publica.transferegov.gestao.gov.br/especiais";
const PORTAL = "https://portaldatransparencia.gov.br/download-de-dados/emendas-parlamentares";

function acharRecebedor(d: DadosGrafo, id: string) {
  const [, plano, cnpj] = id.split(":");
  for (const e of d.emendas) {
    if (plano.startsWith("direto-")) {
      const r = plano === `direto-${e.codigo}` ? e.diretos.find((x) => x.cnpj === cnpj) : undefined;
      if (r) return { e, m: null, r };
      continue;
    }
    const m = e.municipios.find((x) => String(x.id) === plano);
    const r = m?.recebedores.find((x) => x.cnpj === cnpj);
    if (m && r) return { e, m, r };
  }
  return null;
}

/** Painel de detalhes do nó (ou da linha da lista) selecionado. */
export function detalheDo(d: DadosGrafo, g: Grafo, id: string | null): Detalhe {
  const vazio: Detalhe = {
    tipo: "Como ler",
    titulo: "Escolha um nó para ver os detalhes",
    sub: "",
    linhas: [],
    nota: `Da esquerda para a direita: ${d.quem.replace(/^deste /, "o ").replace(/^desta /, "a ")}, as emendas Pix, os municípios que receberam e quem eles pagaram. A espessura da linha é o valor.`,
    fonte: null,
    indicios: [],
    verNaLista: "",
  };
  if (!id) return vazio;
  const p = d.parlamentar;
  if (id === "parlamentar")
    return {
      ...vazio,
      tipo: p.cargo,
      titulo: p.nome,
      sub: p.uf ?? "",
      linhas: [
        { r: "Emendas Pix", v: n(d.totais.emendas) },
        { r: "Transferido", v: valorCurto(d.totais.transferido) },
        { r: "Pagamento informado", v: valorCurto(d.totais.pago) },
        { r: "Municípios ou estados", v: n(d.totais.entes) },
      ],
      nota: "Contamos só emendas individuais na modalidade transferência especial (Pix).",
      fonte: { texto: "Portal da Transparência · emendas", href: PORTAL },
    };
  if (id.startsWith("e:")) {
    const e = d.emendas.find((x) => `e:${x.codigo}` === id);
    if (!e) return vazio;
    return {
      ...vazio,
      tipo: "Emenda Pix",
      titulo: `${e.codigo} · ${e.funcao}`,
      sub: plural(e.municipios.length, "município ou estado", "municípios ou estados"),
      linhas: [
        { r: "Reservado no Orçamento", v: valorCurto(e.empenhado) },
        { r: "Transferido", v: valorCurto(e.transferido) },
        {
          r: "Pagamento informado",
          v: `${valorCurto(e.pago)}${e.transferido > 0 ? ` (${pct(e.pago, e.transferido)}%)` : ""}`,
        },
        {
          r: "Recebedores",
          v: n(
            new Set([...e.municipios.flatMap((m) => m.recebedores.map((r) => r.cnpj)), ...e.diretos.map((r) => r.cnpj)])
              .size,
          ),
        },
      ],
      nota:
        d.avaliado.recem || d.avaliado.ciclo
          ? e.indicios
            ? "Os caminhos em âmbar levam aos indícios desta emenda."
            : "Nenhum indício nesta emenda pelas regras atuais."
          : "",
      fonte: {
        texto: "Transferegov · planos de ação",
        href: `${API}/planos-acao-especiais?numero_emenda_parlamentar_plano_acao=${e.codigo}`,
      },
      verNaLista: !e.municipios.length
        ? ""
        : e.municipios.length === 1
          ? "Ver o município na lista"
          : `Ver os ${n(e.municipios.length)} municípios na lista`,
    };
  }
  if (id.startsWith("m:")) {
    for (const e of d.emendas) {
      const m = e.municipios.find((x) => `m:${x.id}` === id);
      if (!m) continue;
      return {
        ...vazio,
        tipo: "Município ou estado",
        titulo: `${m.nome}${m.uf ? ` (${m.uf})` : ""}`,
        sub: `Emenda ${e.codigo}`,
        linhas: [
          { r: "Recebeu da emenda", v: valorCurto(m.recebido) },
          { r: "Pagou com ela", v: valorCurto(m.pago) },
          { r: "Recebedores", v: n(qtdRecebedores(m)) },
        ],
        nota: "O município informa no Transferegov quem pagou com o dinheiro da emenda.",
        fonte: {
          texto: "Transferegov · pagamentos",
          href: `${API}/relatorios-gestao-novos-especiais?id_plano_acao=${m.id}`,
        },
      };
    }
    return vazio;
  }
  if (id.startsWith("mo:") || id.startsWith("ms:")) {
    const no = g.nos.find((x) => x.id === id);
    if (!no || !g.emenda) return vazio;
    const sem = id.startsWith("ms:");
    return {
      ...vazio,
      tipo: "Grupo de municípios",
      titulo: no.nome,
      sub: `Emenda ${g.emenda.codigo}`,
      linhas: [
        { r: sem ? "Transferido" : "Pagaram", v: valorCurto(no.valor) },
        { r: "Municípios", v: no.nome.replace(/\D/g, "") },
      ],
      nota: sem
        ? "Receberam a emenda e ainda não informaram nenhum pagamento no Transferegov."
        : "Agrupados para o grafo continuar legível. Na lista estão um por um, em ordem de valor pago.",
      fonte: {
        texto: "Transferegov",
        href: `${API}/planos-acao-especiais?numero_emenda_parlamentar_plano_acao=${g.emenda.codigo}`,
      },
      verNaLista: `Ver os ${no.nome.replace(/\D/g, "")} na lista`,
    };
  }
  if (id.startsWith("ro:")) {
    const no = g.nos.find((x) => x.id === id);
    if (!no) return vazio;
    return {
      ...vazio,
      tipo: "Grupo de recebedores",
      titulo: no.nome,
      sub: no.meta,
      linhas: [{ r: "Valor somado", v: valorCurto(no.valor) }],
      nota: g.municipio
        ? "Somados para o grafo continuar legível. Na lista estão um por um, com CNPJ e valor."
        : "Empresas e entidades pagas pelos municípios desta emenda, somadas para o grafo continuar legível. Pagamentos a pessoas físicas ficam de fora deste grupo. Na lista estão um por um, com CNPJ e valor.",
      fonte: g.municipio
        ? {
            texto: "Transferegov · pagamentos",
            href: `${API}/relatorios-gestao-novos-especiais?id_plano_acao=${g.municipio.id}`,
          }
        : g.emenda
          ? {
              texto: "Transferegov · pagamentos",
              href: `${API}/planos-acao-especiais?numero_emenda_parlamentar_plano_acao=${g.emenda.codigo}`,
            }
          : null,
      verNaLista: "Ver um por um na lista",
    };
  }
  if (id.startsWith("pf:")) {
    const no = g.nos.find((x) => x.id === id);
    if (!no) return vazio;
    return {
      ...vazio,
      tipo: "Pessoas físicas",
      titulo: no.nome,
      sub: g.municipio ? `de ${g.municipio.nome}` : "",
      linhas: [{ r: "Valor somado", v: valorCurto(no.valor) }],
      nota: "Pagamentos a pessoa física aparecem somados, sem nome nem CPF.",
      fonte: g.municipio
        ? {
            texto: "Transferegov · pagamentos",
            href: `${API}/relatorios-gestao-novos-especiais?id_plano_acao=${g.municipio.id}`,
          }
        : null,
    };
  }
  if (id === "campanha") {
    const no = g.nos.find((x) => x.id === id);
    if (!no) return vazio;
    const achados = g.arestas.filter((a) => a.campanha).flatMap((a) => acharRecebedor(d, a.de) ?? []);
    const empresas = [...new Set(achados.map((a) => a.r.nome))];
    const datas = achados.flatMap((a) => (a.r.ciclo ? [a.r.ciclo.primeiraDespesa] : [])).toSorted();
    return {
      ...vazio,
      tipo: "Campanha (TSE)",
      titulo: `${no.nome} ${d.quem}`,
      sub: "Despesas declaradas ao TSE",
      linhas: [
        { r: `Pago a ${listaNomes(empresas)}`, v: valorCurto(no.valor) },
        ...(datas.length ? [{ r: "1ª despesa", v: dataBr(datas[0]) }] : []),
      ],
      nota: "",
      fonte: {
        texto: "TSE · prestação de contas",
        href: "https://dadosabertos.tse.jus.br/dataset/?groups=prestacao-de-contas",
      },
      indicios: [
        {
          tipo: "ciclo-fechado",
          titulo: "Indício: empresa da emenda também na campanha",
          frase: `${listaNomes(empresas)} ${empresas.length === 1 ? "recebeu" : "receberam"} dinheiro da emenda ${g.emenda?.codigo ?? ""} e ${empresas.length === 1 ? "aparece" : "aparecem"} nas despesas declaradas da campanha de ${no.nome.replace(/\D/g, "")} ${d.quem}, com data até o pagamento.`,
          base: d.taxas.ciclo,
        },
      ],
    };
  }
  if (id.startsWith("r:")) {
    const a = acharRecebedor(d, id);
    if (!a) return vazio;
    const { e, m, r } = a;
    const indicios: Detalhe["indicios"] = [];
    if (r.recem)
      indicios.push({
        tipo: "recem-aberta",
        titulo: "Indício: empresa aberta pouco antes de receber",
        frase: `Aberta ${plural(r.recem.dias, "dia", "dias")} antes do 1º pagamento${m ? ` de ${m.nome}` : ""} com esta emenda (regra: menos de ${DIAS_RECEM_ABERTA} dias).`,
        base: d.taxas.recem,
      });
    if (r.ciclo)
      indicios.push({
        tipo: "ciclo-fechado",
        titulo: "Indício: empresa da emenda também na campanha",
        frase: `O mesmo CNPJ aparece nas despesas declaradas da campanha de ${r.ciclo.eleicao} ${d.quem}: ${valorCurto(r.ciclo.despesa)}, a primeira em ${dataBr(r.ciclo.primeiraDespesa)}.`,
        base: d.taxas.ciclo,
      });
    const linhas = [
      { r: m ? `Recebeu de ${m.nome}` : "Recebido direto da União (no ciclo)", v: valorCurto(r.valor) },
      { r: "1º pagamento", v: dataBr(r.primeiroPagamento) },
    ];
    if (r.recem) linhas.push({ r: "Abertura da empresa", v: dataBr(r.recem.abertura) });
    return {
      ...vazio,
      tipo: "Empresa ou entidade",
      titulo: r.nome,
      sub: `CNPJ ${formatarCnpj(r.cnpj)} · emenda ${e.codigo}`,
      linhas,
      nota: "",
      fonte: m
        ? { texto: "Transferegov · pagamentos", href: `${API}/relatorios-gestao-novos-especiais?id_plano_acao=${m.id}` }
        : { texto: "Portal da Transparência · emendas", href: PORTAL },
      indicios,
    };
  }
  return vazio;
}
