import type { EmendasDoParlamentar } from "@/data/emendas";
import type { Perfil } from "@/data/perfil";
import { brl, dataHoraBr, MESES, pct } from "@auditaja/core/format";
import { METODOLOGIA_VERSAO } from "@auditaja/core/metrics";
import {
  cargoParlamentar,
  partidoPorExtenso,
  periodoLegislatura,
  periodoMandato,
  ufPorExtenso,
} from "@auditaja/core/rotulos";
import { caminhoDoPerfil, markdownEmLinha, perfilOficial, tituloDoPerfil } from "@/lib/seo-perfil";
import { rotuloVotoSenado } from "@auditaja/core/senado";
import { SITE_NOME, urlAbsoluta } from "@/lib/site";

/** Texto vindo da fonte numa célula de tabela Markdown: sem quebra de linha nem "|" solto. */
const celula = markdownEmLinha;

/**
 * Resumo do perfil em Markdown, para agentes e leitores de texto. Mesmos números da página (mesma
 * consulta, `perfilParlamentar`), sem nada que a página não mostre. Pessoa física (fornecedor da cota ou
 * favorecido de emenda) aparece só como rótulo genérico, sem nome nem documento (R2, R3).
 */
export function markdownDoPerfil(perfil: Perfil, emendas: EmendasDoParlamentar, base: string): string {
  const { parlamentar: p, ceap, votacoes } = perfil;
  const senado = p.casa === "senado";
  const url = urlAbsoluta(caminhoDoPerfil(p.id), base);
  const cargo = cargoParlamentar(p.casa, p.sexo);
  const linhas: string[] = [];
  const add = (...l: string[]) => linhas.push(...l);

  add(`# ${markdownEmLinha(tituloDoPerfil(p))}`, "");
  add(
    `> Resumo em Markdown do perfil publicado em ${url}. Dados abertos oficiais, com fonte e data de coleta. ` +
      `Indicadores são pontos de partida para verificação, não acusação. Metodologia versão ${METODOLOGIA_VERSAO}: ${urlAbsoluta("/metodologia", base)}.`,
    "",
  );

  add("## Identificação", "");
  add(`- Cargo: ${cargo}`);
  add(`- Casa: ${senado ? "Senado Federal" : "Câmara dos Deputados"}`);
  add(`- Partido: ${partidoPorExtenso(p.sigla_partido) ?? "não informado"}`);
  add(`- UF: ${ufPorExtenso(p.sigla_uf)}`);
  add(`- Situação: ${p.em_exercicio ? "em exercício" : "fora de exercício"}`);
  const mandato = senado ? periodoMandato(p.mandato_inicio, p.mandato_fim)?.anos : periodoLegislatura(p.id_legislatura);
  if (mandato) add(`- Mandato: ${mandato}`);
  if (p.participacao) add(`- Participação: ${p.participacao}`);
  add(`- Perfil oficial: ${perfilOficial(p)}`, "");

  const periodo = perfil.mandato ? "no mandato" : `em ${perfil.ano}`;
  add(`## Gastos da cota parlamentar (${senado ? "CEAPS" : "CEAP"}) ${periodo}`, "");
  if (!ceap.documentos) {
    add("Sem notas publicadas no período.", "");
  } else {
    add(`- Total: ${brl(ceap.totalAno)} em ${ceap.documentos.toLocaleString("pt-BR")} documentos`);
    if (ceap.mediaMensal != null) add(`- Média por mês com notas: ${brl(ceap.mediaMensal)}`);
    if (ceap.tetoAcumulado) {
      add(
        `- Teto acumulado até ${MESES[ceap.ultimoMes - 1].toLowerCase()}/${perfil.ano}: ${brl(ceap.tetoAcumulado)} (${pct(ceap.totalAno, ceap.tetoAcumulado)}% usado)`,
      );
    }
    add("", "### Por tipo de despesa", "", "| Tipo | Valor |", "| --- | ---: |");
    for (const t of ceap.porTipo.slice(0, 10)) add(`| ${celula(t.tipo)} | ${brl(t.total)} |`);
    add(
      "",
      "### Maiores fornecedores",
      "",
      "| Fornecedor | CNPJ | Documentos | Valor |",
      "| --- | --- | ---: | ---: |",
    );
    for (const f of ceap.fornecedores) {
      const pf = f.fornecedor_classe === "terceiro_pf";
      const nome = pf ? "Prestadores pessoa física (somados)" : celula(f.fornecedor_nome);
      add(`| ${nome} | ${pf ? "não exibido" : (f.fornecedor_doc ?? "—")} | ${f.documentos} | ${brl(f.total)} |`);
    }
    add("", `Notas fiscais em CSV: ${url}/gastos.csv${perfil.mandato ? "?ano=mandato" : `?ano=${perfil.ano}`}`, "");
  }

  add(`## Votações nominais no Plenário em ${votacoes.ano}`, "");
  if (!votacoes.totalPlenario) {
    add("Sem votações nominais registradas no ano.", "");
  } else {
    const presenca = pct(votacoes.presentes, votacoes.elegiveis);
    add(`- Votações no ano: ${votacoes.totalPlenario}`);
    if (presenca != null) {
      add(
        `- Presença: ${presenca}% (${votacoes.presentes} de ${votacoes.elegiveis})` +
          (votacoes.mediaPresenca != null ? `; média da Casa: ${votacoes.mediaPresenca}%` : ""),
      );
    }
    const alin = pct(votacoes.alinhamento.iguais, votacoes.alinhamento.comparaveis);
    if (alin != null) {
      add(
        `- Votou como ${senado ? "a liderança" : "o partido"} orientou: ${alin}% (${votacoes.alinhamento.iguais} de ${votacoes.alinhamento.comparaveis} votações com orientação)`,
      );
    }
    add("", "| Data | Proposição | Voto |", "| --- | --- | --- |");
    for (const v of votacoes.lista.slice(0, 20)) {
      add(
        `| ${String(v.data).slice(0, 10)} | ${celula(v.proposicao_sigla ?? v.descricao.slice(0, 80))} | ${celula(senado ? rotuloVotoSenado(v.voto, v.secreta) : v.voto || (v.foraDoExercicio ? "fora do exercício" : "sem registro"))} |`,
      );
    }
    add("");
  }

  add("## Emendas parlamentares", "");
  if (emendas.vazio) {
    add("Sem emendas coletadas.", "");
  } else {
    add(`- Período: ${emendas.periodo === "mandato" ? "mandato" : emendas.periodo}`);
    add(`- Empenhado: ${brl(emendas.totais.empenhado)}; pago: ${brl(emendas.totais.pago)}`);
    add(`- Emendas: ${emendas.totais.emendas}`);
    if (emendas.favorecidos.length) {
      add("", "| Quem recebeu | Tipo | Município | Valor |", "| --- | --- | --- | ---: |");
      for (const f of emendas.favorecidos.slice(0, 10)) {
        const nome = f.pessoaFisica ? "Beneficiário pessoa física" : celula(f.nome);
        add(`| ${nome} | ${celula(f.tipo)} | ${celula(f.municipio ?? "—")} | ${brl(f.valor)} |`);
      }
    }
    add("", `Emendas em CSV: ${url}/emendas.csv`, "");
  }

  add("## Bens declarados ao TSE", "");
  const anos = [...new Set(perfil.bens.map((b) => b.ano_eleicao))].sort();
  if (!anos.length) add("Sem declaração de bens encontrada.", "");
  else {
    for (const a of anos) {
      const total = perfil.bens.filter((b) => b.ano_eleicao === a).reduce((s, b) => s + Number(b.total), 0);
      add(`- Eleição de ${a}: ${brl(total)}`);
    }
    add("");
  }

  add("## Fontes", "");
  for (const c of Object.values(perfil.coletas)) {
    add(`- ${c.url} (coletado em ${dataHoraBr(c.coletado_em)}; licença: ${c.licenca})`);
  }
  add("", `Atualizações (Atom): ${url}/feed.xml`);
  add(`Pedir correção: ${url}/contestar`);
  add("", `---`, `${SITE_NOME} · ${urlAbsoluta("/", base)} · Guia para agentes: ${urlAbsoluta("/llms.txt", base)}`, "");
  return linhas.join("\n");
}
