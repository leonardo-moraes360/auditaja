import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  montarComissoes,
  montarSenadores,
  type ComissoesApi,
  type ListaAtualApi,
  type ListaLegislaturaApi,
} from "@/ingest/senado";

/** Respostas reais da API do Senado (11/11/2026), reduzidas a poucos senadores. */
const fixture = <T>(nome: string): T =>
  JSON.parse(readFileSync(path.join(import.meta.dirname, "../fixtures/senado", nome), "utf8")) as T;

const leg = fixture<ListaLegislaturaApi>("lista-legislatura-57.json");
const atual = fixture<ListaAtualApi>("lista-atual.json");

describe("cadastro de senadores (SCAD-01..04)", () => {
  const m = montarSenadores(leg, atual, new Map([["5672", "1976-10-23"]]), 7);
  const alan = m.parlamentares.find((p) => p.id === 10005672)!;

  it("grava cada senador da legislatura com casa senado e id deslocado", () => {
    expect(m.parlamentares.map((p) => p.id).toSorted()).toEqual([10005672, 10005918, 10006358]);
    expect(m.parlamentares.every((p) => p.casa === "senado")).toBe(true);
    expect(alan.nome).toBe("Alan Rick");
    expect(alan.nome_civil).toBe("Alan Rick Miranda");
    expect(alan.sigla_uf).toBe("AC");
    expect(alan.sigla_partido).toBe("REPUBLICANOS");
    expect(alan.coleta_id).toBe(7);
  });

  it("marca em exercício só quem está na lista atual", () => {
    const ex = m.parlamentares.find((p) => p.id === 10005918)!;
    expect(alan.em_exercicio).toBe(true);
    expect(ex.em_exercicio).toBe(false);
    expect(ex.sigla_partido).toBeNull();
    expect(ex.sigla_uf).toBe("PE");
  });

  it("grava mandato, participação, bloco e suplentes", () => {
    expect(alan.mandato_inicio).toBe("2023-02-01");
    expect(alan.mandato_fim).toBe("2031-01-31");
    expect(alan.participacao).toBe("Titular");
    expect(alan.bloco).toBe("Bloco Parlamentar Aliança");
    const sup = m.suplentes.filter((s) => s.parlamentar_id === 10005672);
    expect(sup.map((s) => [s.ordem, s.nome, s.codigo])).toEqual([
      [1, "Gemil Junior", 6343],
      [2, "Coronel Casagrande", 6344],
    ]);
    const anaPaula = m.parlamentares.find((p) => p.id === 10006358)!;
    expect(anaPaula.participacao).toBe("1º Suplente");
  });

  it("grava sexo e nascimento", () => {
    expect(alan.sexo).toBe("M");
    expect(alan.data_nascimento).toBe("1976-10-23");
    const anaPaula = m.parlamentares.find((p) => p.id === 10006358)!;
    expect(anaPaula.sexo).toBe("F");
    expect(anaPaula.data_nascimento).toBeNull();
  });

  it("aponta para a fonte do Senado (SCAD-05)", () => {
    expect(alan.source_url).toBe("https://legis.senado.leg.br/dadosabertos/senador/5672");
    expect(alan.url_foto).toBe("https://www.senado.leg.br/senadores/img/fotos-oficiais/senador5672.jpg");
  });

  it("aceita objeto único no lugar de lista (SERR-02)", () => {
    const um: ListaAtualApi = {
      ListaParlamentarEmExercicio: {
        Parlamentares: {
          Parlamentar: (atual.ListaParlamentarEmExercicio.Parlamentares!.Parlamentar as never[])[0],
        },
      },
    };
    const r = montarSenadores({ ListaParlamentarLegislatura: {} }, um, new Map(), 1);
    expect(r.parlamentares).toHaveLength(1);
    expect(r.parlamentares[0].em_exercicio).toBe(true);
  });
});

describe("comissões do senador", () => {
  it("guarda só as atuais da Casa SF", () => {
    const r = montarComissoes("5672", fixture<ComissoesApi>("comissoes-5672.json"), 3);
    expect(r.map((c) => c.sigla_orgao)).toEqual(["CAE", "CE"]);
    expect(r.every((c) => c.parlamentar_id === 10005672 && c.data_fim === null)).toBe(true);
  });
});
