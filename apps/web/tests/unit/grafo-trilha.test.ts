import { describe, expect, it } from "vitest";
import {
  ALTURA_GRAFO,
  ALTURA_NO,
  arcoDoCiclo,
  curva,
  detalheDo,
  espessura,
  idRecebedor,
  LIMITE_MUNICIPIOS,
  LIMITE_RECEBEDORES,
  listaDoGrafo,
  montarGrafo,
  NAO_PROVA,
  valorCurto,
  type DadosGrafo,
  type EmendaGrafo,
  type MunicipioGrafo,
  type RecebedorGrafo,
} from "@/lib/grafo-trilha";

// Dados fictícios no formato real: uma emenda com 92 municípios (2 com indício) e outra sem indício.
const rec = (cnpj: string, nome: string, valor: number, extra: Partial<RecebedorGrafo> = {}): RecebedorGrafo => ({
  cnpj,
  nome,
  valor,
  primeiroPagamento: "2024-03-10",
  recem: null,
  ciclo: null,
  ...extra,
});

function municipios(qtd: number, comPago: number, base = 1000): MunicipioGrafo[] {
  return Array.from({ length: qtd }, (_, i) => ({
    id: base + i,
    nome: `Município ${i}`,
    uf: "RS",
    recebido: 500_000 - i * 1000,
    pago: i < comPago ? 400_000 - i * 1000 : 0,
    pf: { pagamentos: 0, valor: 0 },
    recebedores:
      i < comPago
        ? Array.from({ length: 6 }, (_, k) =>
            rec(`${base + i}${String(k).padStart(10, "0")}`.slice(0, 14), `Empresa ${i}-${k}`, 60_000 - k * 5000),
          )
        : [],
  }));
}

function dados(): DadosGrafo {
  const e1: EmendaGrafo = {
    codigo: "202441840008",
    funcao: "Saúde",
    ano: 2024,
    empenhado: 32_600_000,
    transferido: 32_000_000,
    pago: 15_100_000,
    indicios: 3,
    municipios: municipios(92, 20),
    diretos: [],
  };
  // Município 15 (fora dos 5 maiores) tem a empresa recém-aberta; o 0 tem a gráfica da campanha e PF.
  e1.municipios[15].recebedores[5] = rec("11111111000191", "Construtora Ilustrativa Ltda", 30_000, {
    recem: { dias: 42, abertura: "2024-01-18" },
  });
  e1.municipios[0].recebedores[5] = rec("12345678000195", "Gráfica Exemplo Ltda", 20_000, {
    ciclo: { despesa: 32_000, primeiraDespesa: "2018-09-10", eleicao: 2018 },
  });
  e1.municipios[0].pf = { pagamentos: 2, valor: 4_000 };
  const e2: EmendaGrafo = {
    codigo: "202341840004",
    funcao: "Urbanismo",
    ano: 2023,
    empenhado: 3_000_000,
    transferido: 3_000_000,
    pago: 2_000_000,
    indicios: 0,
    municipios: municipios(4, 4, 5000),
    diretos: [],
  };
  return {
    parlamentar: { id: 1, nome: "João Exemplo Pereira", cargo: "Senador", uf: "RS" },
    quem: "deste senador",
    eleicao: 2018,
    avaliado: { recem: true, ciclo: true },
    notas: [],
    taxas: {
      recem: "3 de 10 (30,0%) das empresas pagas com emendas Pix caem nesta regra.",
      ciclo: "27 de 410 (6,6%) dos parlamentares com emenda Pix têm um caso assim.",
    },
    totais: { transferido: 35_000_000, pago: 17_100_000, emendas: 2, entes: 96 },
    emendas: [e1, e2],
  };
}

const col = (g: ReturnType<typeof montarGrafo>, c: number) => g.nos.filter((n) => n.col === c);

describe("montarGrafo", () => {
  it("sem emenda aberta: só parlamentar e emendas", () => {
    const g = montarGrafo(dados(), { em: null, mu: null, sel: null, so: false });
    expect(col(g, 0)).toHaveLength(1);
    expect(col(g, 1).map((n) => n.nome)).toEqual(["202441840008", "202341840004"]);
    expect(col(g, 2)).toHaveLength(0);
    expect(g.status).toBe("Mostrando 2 emendas Pix. Escolha uma para abrir os municípios.");
  });

  it("emenda aberta: 5 maiores + os com indício à vista, resto e sem pagamento em grupos", () => {
    const g = montarGrafo(dados(), { em: "202441840008", mu: null, sel: null, so: false });
    const m = col(g, 2);
    const vistos = m.filter((n) => n.tipo === "municipio");
    // Indícios em 0 e 15: o 15 entra no lugar de um dos 5 maiores (limite mantido).
    expect(vistos).toHaveLength(LIMITE_MUNICIPIOS);
    expect(vistos.map((n) => n.nome)).toEqual([
      "Município 0",
      "Município 1",
      "Município 2",
      "Município 3",
      "Município 15",
    ]);
    expect(m.find((n) => n.tipo === "grupo-municipios")?.nome).toBe("Outros 15 municípios");
    expect(m.find((n) => n.tipo === "sem-pagamento")?.nome).toBe("72 sem pagamento");
    expect(g.arestas.find((a) => a.para === "ms:202441840008")?.semPagamento).toBe(true);
    // À direita, só os recebedores com indício e um grupo com o resto.
    const r = col(g, 3);
    expect(r.filter((n) => n.tipo === "empresa").map((n) => n.selo)).toEqual(["recém-aberta", "também na campanha"]);
    expect(r.find((n) => n.grupo)?.nome).toBe("Outros 118 recebedores");
    // Ciclo fechado: nó de campanha ligado à gráfica.
    expect(g.temCiclo).toBe(true);
    expect(g.arestas.filter((a) => a.campanha).map((a) => a.de)).toEqual([idRecebedor(1000, "12345678000195")]);
    expect(g.status).toBe(
      "Emenda 202441840008 aberta: 92 municípios ou estados, 5 à vista e o resto agrupado; dos recebedores, só os com indício à vista.",
    );
  });

  it("município aberto: recebedores com limite, grupo e pessoas físicas somadas", () => {
    const g = montarGrafo(dados(), { em: "202441840008", mu: 1000, sel: null, so: false });
    const r = col(g, 3);
    const empresas = r.filter((n) => n.tipo === "empresa");
    expect(empresas).toHaveLength(LIMITE_RECEBEDORES);
    expect(empresas.some((n) => n.nome === "Gráfica Exemplo Ltda")).toBe(true);
    expect(r.find((n) => n.tipo === "grupo-recebedores")?.nome).toBe("Outras 2 empresas");
    const pf = r.find((n) => n.tipo === "pessoas-fisicas")!;
    expect(pf.nome).toBe("Pessoas físicas");
    expect(pf.meta).toMatch(/^R\$\s4\.000 · 2 pagamentos$/);
    expect(pf.aria).toContain("sem nome nem CPF");
  });

  it("o município aberto aparece mesmo fora dos 5 maiores", () => {
    const g = montarGrafo(dados(), { em: "202441840008", mu: 1019, sel: null, so: false });
    expect(col(g, 2).some((n) => n.id === "m:1019")).toBe(true);
  });

  it("filtro: só os caminhos com indício, sem grupos", () => {
    const g = montarGrafo(dados(), { em: "202441840008", mu: null, sel: null, so: true });
    expect(col(g, 1).map((n) => n.nome)).toEqual(["202441840008"]);
    expect(col(g, 2).map((n) => n.nome)).toEqual(["Município 0", "Município 15"]);
    expect(g.nos.some((n) => n.grupo)).toBe(false);
    expect(g.status.startsWith("Filtro ligado: só os caminhos com indício.")).toBe(true);
  });

  it("sem base avaliada: filtro não liga e não há selos nem campanha", () => {
    const d = dados();
    d.avaliado = { recem: false, ciclo: false };
    for (const e of d.emendas)
      for (const m of e.municipios) m.recebedores = m.recebedores.map((r) => ({ ...r, recem: null, ciclo: null }));
    d.emendas[0].indicios = 0;
    const g = montarGrafo(d, { em: "202441840008", mu: null, sel: null, so: true });
    expect(g.so).toBe(false);
    expect(g.nos.some((n) => n.selo)).toBe(false);
    expect(g.temCiclo).toBe(false);
  });

  it("emenda sem indício: os 2 maiores recebedores e o resto agrupado", () => {
    const g = montarGrafo(dados(), { em: "202341840004", mu: null, sel: null, so: false });
    expect(col(g, 2).every((n) => n.tipo === "municipio")).toBe(true);
    expect(col(g, 3).filter((n) => n.tipo === "empresa")).toHaveLength(2);
    expect(g.temCiclo).toBe(false);
    expect(g.status).toContain("4 municípios ou estados, todos à vista.");
  });

  it("layout: nós de uma coluna não se sobrepõem e cabem na altura", () => {
    const g = montarGrafo(dados(), { em: "202441840008", mu: 1000, sel: null, so: false });
    for (let c = 0; c < 5; c++) {
      const ys = col(g, c).map((n) => n.y);
      for (let i = 1; i < ys.length; i++) expect(ys[i] - ys[i - 1]).toBeGreaterThanOrEqual(ALTURA_NO);
      for (const y of ys) {
        expect(y - ALTURA_NO / 2).toBeGreaterThanOrEqual(56);
        expect(y + ALTURA_NO / 2).toBeLessThanOrEqual(ALTURA_GRAFO);
      }
    }
  });

  it("caminho: o selecionado acende até o parlamentar", () => {
    const sel = idRecebedor(1000, "12345678000195");
    const g = montarGrafo(dados(), { em: "202441840008", mu: null, sel, so: false });
    expect([...g.caminho].sort()).toEqual(["e:202441840008", "m:1000", "parlamentar", sel].sort());
  });
});

describe("regressões da segunda verificação", () => {
  it("filtro com município aberto conta só os recebedores com indício", () => {
    const d = dados();
    const g = montarGrafo(d, { em: "202441840008", mu: 1000, sel: null, so: true });
    expect(g.status).toBe(
      "Filtro ligado: só os caminhos com indício. Mostrando quem Município 0 pagou com a emenda 202441840008: 1 recebedor com indício.",
    );
    const vazio = montarGrafo(d, { em: "202441840008", mu: 1001, sel: null, so: true });
    expect(vazio.status).toContain("Município 1 não pagou, com a emenda 202441840008, nenhum recebedor com indício.");
  });

  it("painel do município conta pessoas físicas como um recebedor", () => {
    const d = dados();
    const g = montarGrafo(d, { em: "202441840008", mu: 1000, sel: "m:1000", so: false });
    expect(detalheDo(d, g, "m:1000").linhas).toContainEqual({ r: "Recebedores", v: "7" });
  });

  it("singular em 'Ver o município na lista' e fonte no grupo de recebedores da emenda", () => {
    const d = dados();
    d.emendas[1].municipios = d.emendas[1].municipios.slice(0, 1);
    const g = montarGrafo(d, { em: "202341840004", mu: null, sel: "e:202341840004", so: false });
    expect(detalheDo(d, g, "e:202341840004").verNaLista).toBe("Ver o município na lista");
    const g1 = montarGrafo(d, { em: "202441840008", mu: null, sel: null, so: false });
    const det = detalheDo(d, g1, "ro:202441840008");
    expect(det.fonte?.texto).toBe("Transferegov · pagamentos");
    expect(det.nota).toContain("Pagamentos a pessoas físicas ficam de fora deste grupo.");
  });

  it("emenda só com recebedores diretos da União diz isso no status", () => {
    const d = dados();
    d.emendas[1].municipios = [];
    d.emendas[1].diretos = [
      rec("12345678000195", "Gráfica Exemplo Ltda", 20_000, {
        ciclo: { despesa: 32_000, primeiraDespesa: "2018-09-10", eleicao: 2018 },
      }),
    ];
    const g = montarGrafo(d, { em: "202341840004", mu: null, sel: null, so: false });
    expect(g.status).toBe(
      "Emenda 202341840004 aberta: nenhum município ou estado com plano de ação no Transferegov; 1 recebedor direto da União à vista.",
    );
  });
});

describe("regressões da verificação independente", () => {
  const semOrfas = (g: ReturnType<typeof montarGrafo>) => {
    const ids = new Set(g.nos.map((n) => n.id));
    return g.arestas.every((a) => ids.has(a.de) && ids.has(a.para));
  };

  it("filtro com emenda sem indício aberta: sem arestas órfãs nem recebedores sem indício", () => {
    const d = dados();
    for (const so of [false, true]) {
      const g = montarGrafo(d, { em: "202341840004", mu: null, sel: null, so });
      expect(semOrfas(g)).toBe(true);
      if (so) expect(col(g, 3)).toHaveLength(0);
    }
    for (const mu of [null, 1000, 1019])
      for (const so of [false, true])
        expect(semOrfas(montarGrafo(d, { em: "202441840008", mu, sel: null, so }))).toBe(true);
  });

  it('lista de emenda sem indício não diz "com indício"', () => {
    const d = dados();
    const g = montarGrafo(d, { em: "202341840004", mu: null, sel: null, so: false });
    const titulos = listaDoGrafo(d, g).map((x) => x.titulo);
    expect(titulos).toContain("Recebedores da emenda (24)");
    expect(titulos.join()).not.toContain("com indício");
  });

  it("campanha conta a despesa do CNPJ uma vez, mesmo paga por dois municípios", () => {
    const d = dados();
    const graf = d.emendas[0].municipios[0].recebedores[5];
    d.emendas[0].municipios[1].recebedores[5] = { ...graf, valor: 10_000 };
    const g = montarGrafo(d, { em: "202441840008", mu: null, sel: "campanha", so: false });
    expect(g.nos.find((n) => n.id === "campanha")?.valor).toBe(32_000);
    const det = detalheDo(d, g, "campanha");
    expect(det.linhas[0].r).toBe("Pago a Gráfica Exemplo Ltda");
    expect(det.indicios[0].frase.startsWith("Gráfica Exemplo Ltda recebeu dinheiro")).toBe(true);
  });

  it("o grupo de recebedores soma o que não está à vista (por pagamento, não por CNPJ)", () => {
    const d = dados();
    const e = d.emendas[1];
    const g = montarGrafo(d, { em: e.codigo, mu: null, sel: null, so: false });
    const soma = col(g, 3).reduce((t, n) => t + n.valor, 0);
    const total = e.municipios.flatMap((m) => m.recebedores).reduce((t, r) => t + r.valor, 0);
    expect(soma).toBeCloseTo(total, 2);
  });

  it("muitos municípios com indício: a altura cresce e os nós não se sobrepõem", () => {
    const d = dados();
    d.emendas[0].municipios.slice(20, 32).forEach((m, i) => {
      m.pago = 1000;
      m.recebedores = [
        rec(`9${String(i).padStart(13, "0")}`, `Nova ${i}`, 500, { recem: { dias: 10, abertura: "2024-01-01" } }),
      ];
    });
    const g = montarGrafo(d, { em: "202441840008", mu: null, sel: null, so: true });
    expect(g.altura).toBeGreaterThan(ALTURA_GRAFO);
    for (let c = 0; c < 5; c++) {
      const ys = col(g, c).map((n) => n.y);
      for (let i = 1; i < ys.length; i++) expect(ys[i] - ys[i - 1]).toBeGreaterThanOrEqual(ALTURA_NO);
    }
  });

  it('município só com pessoas físicas não diz "resto agrupado"; emenda sem município tem frase própria', () => {
    const d = dados();
    const m = d.emendas[0].municipios[19];
    m.recebedores = [];
    m.pf = { pagamentos: 3, valor: 9_000 };
    expect(montarGrafo(d, { em: "202441840008", mu: m.id, sel: null, so: false }).status).toBe(
      "Mostrando quem Município 19 pagou com a emenda 202441840008: 1 recebedor.",
    );
    d.emendas[1].municipios = [];
    const g = montarGrafo(d, { em: "202341840004", mu: null, sel: "e:202341840004", so: false });
    expect(g.status).toBe("Emenda 202341840004 aberta: nenhum município ou estado com plano de ação no Transferegov.");
    expect(detalheDo(d, g, "e:202341840004").verNaLista).toBe("");
  });
});

describe("listaDoGrafo", () => {
  it("abre os grupos: todos os municípios, em ordem de valor pago", () => {
    const d = dados();
    const g = montarGrafo(d, { em: "202441840008", mu: null, sel: null, so: false });
    const l = listaDoGrafo(d, g);
    expect(l.map((x) => x.titulo)).toEqual([
      "Emendas Pix (2)",
      "Municípios da emenda 202441840008 (92)",
      "Recebedores da emenda (120)",
      "Campanha (TSE)",
    ]);
    expect(l[1].linhas).toHaveLength(92);
    expect(l[1].linhas.at(-1)?.valor).toMatch(/transferido$/);
  });

  it("município aberto: todos os recebedores com CNPJ e a linha de pessoas físicas", () => {
    const d = dados();
    const g = montarGrafo(d, { em: "202441840008", mu: 1000, sel: null, so: false });
    const q = listaDoGrafo(d, g).find((x) => x.titulo.startsWith("Quem"))!;
    expect(q.titulo).toBe("Quem Município 0 pagou (7)");
    expect(q.linhas.at(-1)?.meta).toBe("2 pagamentos, somados, sem nome nem CPF");
    expect(q.linhas[0].meta).toMatch(/^CNPJ \d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/);
  });
});

describe("detalheDo", () => {
  it("empresa recém-aberta: regra, limiar e taxa de base", () => {
    const d = dados();
    const id = idRecebedor(1015, "11111111000191");
    const g = montarGrafo(d, { em: "202441840008", mu: null, sel: id, so: false });
    const det = detalheDo(d, g, id);
    expect(det.titulo).toBe("Construtora Ilustrativa Ltda");
    expect(det.indicios).toEqual([
      {
        tipo: "recem-aberta",
        titulo: "Indício: empresa aberta pouco antes de receber",
        frase: "Aberta 42 dias antes do 1º pagamento de Município 15 com esta emenda (regra: menos de 180 dias).",
        base: d.taxas.recem,
      },
    ]);
  });

  it("campanha: ciclo com o quem do parlamentar", () => {
    const d = dados();
    const g = montarGrafo(d, { em: "202441840008", mu: null, sel: "campanha", so: false });
    const det = detalheDo(d, g, "campanha");
    expect(det.titulo).toBe("Campanha de 2018 deste senador");
    expect(det.indicios[0].frase).toContain("Gráfica Exemplo Ltda recebeu dinheiro da emenda 202441840008");
  });

  it("sem seleção: como ler", () => {
    const d = dados();
    const det = detalheDo(d, montarGrafo(d, { em: null, mu: null, sel: null, so: false }), null);
    expect(det.nota).toContain("o senador, as emendas Pix");
  });
});

describe("auxiliares", () => {
  it("valorCurto, espessura e curvas", () => {
    expect(valorCurto(32_000_000)).toBe("R$ 32,0 mi");
    expect(valorCurto(640_000)).toBe("R$ 640 mil");
    expect(espessura(0, 10)).toBe(2);
    expect(espessura(10, 10)).toBe(14);
    const g = montarGrafo(dados(), { em: "202441840008", mu: null, sel: null, so: false });
    const raiz = g.nos[0];
    const camp = g.nos.find((n) => n.id === "campanha")!;
    expect(curva(raiz, g.nos[1])).toMatch(/^M 75 \d+ C 175 \d+, 175 \d+, 275 \d+$/);
    expect(arcoDoCiclo(camp, raiz)).toMatch(/^M 910 \d+ C 910 8, 75 8, 75 \d+$/);
    expect(NAO_PROVA).toBe("Indício não é prova de irregularidade.");
  });
});
