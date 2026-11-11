import type { Insertable, Kysely } from "kysely";
import type { Database, EmendaFavorecidoTable, EmendaTable, SancaoTable } from "@/db/types";
import {
  ANO_INICIAL_EMENDAS,
  autorDoNome,
  dataLocalBr,
  ehEmendaIndividual,
  favorecidoPublicavel,
  indiceDeAutores,
  valorBr,
} from "@/lib/emendas";
import { dataBrParaIso, dataDaEntrada, linhasCsvDoZip } from "./arquivos";
import { inserirEmBlocos, registrarColeta } from "./coleta";
import { soDigitos } from "@/lib/privacy";
import type { ClienteEducado } from "./http";

/**
 * Portal da Transparência (CGU), só download em lote (AD-001, AD-004).
 * O host portaldatransparencia.gov.br responde com captcha; os arquivos vêm direto do servidor
 * de arquivos da CGU, destino oficial do redirecionamento de /download-de-dados/...
 */
export const ARQUIVOS_CGU = "https://dadosabertos-download.cgu.gov.br/PortalDaTransparencia/saida";
export const URL_EMENDAS = `${ARQUIVOS_CGU}/emendas-parlamentares/EmendasParlamentares.zip`;
export const LICENCA_CGU = "Portal da Transparência (CGU); dados abertos, Decreto 8.777/2016";

function naturezaJuridica(s: string | undefined): string | null {
  const t = (s ?? "").trim();
  return t && t !== "Sem informação" ? t : null;
}

export type ResumoEmendas = { emendas: number; favorecidos: number; autoresDescartados: number };

export async function coletarEmendas(db: Kysely<Database>, cli: ClienteEducado): Promise<ResumoEmendas> {
  const zip = await cli.baixar(URL_EMENDAS, ".cache/ingest");
  const coletaId = await registrarColeta(db, {
    fonte: "cgu_emendas",
    url: URL_EMENDAS,
    sha256: zip.sha256,
    bytes: zip.bytes,
    licenca: LICENCA_CGU,
    observacao: `base de ${dataLocalBr(await dataDaEntrada(zip.buf, "EmendasParlamentares.csv"))}`,
  });
  const indice = indiceDeAutores(await db.selectFrom("parlamentar").select(["id", "nome"]).execute());

  const emendas: Insertable<EmendaTable>[] = [];
  const descartados = new Set<string>();
  const donoDaEmenda = new Map<string, { parlamentar_id: number; ano: number }>();
  for await (const l of linhasCsvDoZip(zip.buf, "EmendasParlamentares.csv")) {
    const ano = Number(l["Ano da Emenda"]);
    const tipo = l["Tipo de Emenda"] ?? "";
    if (!(ano >= ANO_INICIAL_EMENDAS) || !ehEmendaIndividual(tipo)) continue;
    const autor = l["Nome do Autor da Emenda"] ?? "";
    const parlamentar_id = autorDoNome(indice, autor);
    if (parlamentar_id === null) {
      descartados.add(autor);
      continue;
    }
    const codigo = l["Código da Emenda"];
    donoDaEmenda.set(codigo, { parlamentar_id, ano });
    emendas.push({
      codigo,
      ano,
      tipo,
      autor_nome: autor,
      parlamentar_id,
      localidade: l["Localidade de aplicação do recurso"] ?? "",
      uf: l["UF"] || null,
      funcao: l["Nome Função"] ?? "",
      empenhado: valorBr(l["Valor Empenhado"]),
      liquidado: valorBr(l["Valor Liquidado"]),
      pago: valorBr(l["Valor Pago"]),
      rp_pagos: valorBr(l["Valor Restos A Pagar Pagos"]),
      coleta_id: coletaId,
    });
  }

  const favorecidos: Insertable<EmendaFavorecidoTable>[] = [];
  for await (const l of linhasCsvDoZip(zip.buf, "EmendasParlamentares_PorFavorecido.csv")) {
    const dono = donoDaEmenda.get(l["Código da Emenda"]);
    if (!dono) continue;
    const tipo = l["Tipo Favorecido"] ?? "";
    const f = favorecidoPublicavel(tipo, l["Código do Favorecido"] ?? "", l["Favorecido"] ?? "");
    favorecidos.push({
      codigo_emenda: l["Código da Emenda"],
      parlamentar_id: dono.parlamentar_id,
      ano_emenda: dono.ano,
      ano_mes: l["Ano/Mês"] ?? "",
      favorecido_nome: f.nome,
      favorecido_doc: f.doc,
      tipo_favorecido: tipo,
      natureza_juridica: naturezaJuridica(l["Natureza Jurídica"]),
      uf: l["UF Favorecido"] || null,
      municipio: l["Município Favorecido"] || null,
      valor: valorBr(l["Valor Recebido"]),
      coleta_id: coletaId,
    });
  }

  await db.transaction().execute(async (trx) => {
    await trx.deleteFrom("emenda_favorecido").execute();
    await trx.deleteFrom("emenda").execute();
    await inserirEmBlocos(trx, "emenda", emendas);
    await inserirEmBlocos(trx, "emenda_favorecido", favorecidos);
  });
  return { emendas: emendas.length, favorecidos: favorecidos.length, autoresDescartados: descartados.size };
}

export type Cadastro = "CEIS" | "CNEP";
/** Hoje e até 7 dias atrás: o arquivo leva a data de geração e pode não existir ainda de manhã. */
export const DIAS_DE_RECUO = 7;

/** "AAAAMMDD" no fuso de Brasília, `dias` antes de `hoje`. */
export function dataDoArquivo(hoje: Date, dias: number): string {
  const d = new Date(hoje.getTime() - dias * 86_400_000);
  const p = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo" }).format(d); // AAAA-MM-DD
  return p.replaceAll("-", "");
}

export function urlSancoes(cadastro: Cadastro, data: string): string {
  return `${ARQUIVOS_CGU}/${cadastro.toLowerCase()}/${data}_${cadastro}.zip`;
}

async function baixarSancoesRecentes(cli: ClienteEducado, cadastro: Cadastro, hoje: Date) {
  for (let dias = 0; dias <= DIAS_DE_RECUO; dias++) {
    const url = urlSancoes(cadastro, dataDoArquivo(hoje, dias));
    try {
      return { url, data: dataDoArquivo(hoje, dias), ...(await cli.baixar(url, ".cache/ingest")) };
    } catch (e) {
      if (!(e instanceof Error) || !e.message.endsWith("HTTP 404")) throw e;
    }
  }
  throw new Error(`nenhum arquivo do ${cadastro} nos últimos ${DIAS_DE_RECUO} dias`);
}

/**
 * CEIS e CNEP: guarda só sanções de pessoa jurídica cujo CNPJ forneceu à cota parlamentar (R2).
 * Cada cadastro é substituído inteiro, numa transação, depois do download bem-sucedido.
 */
export async function coletarSancoes(db: Kysely<Database>, cli: ClienteEducado, hoje = new Date()) {
  const cnpjs = new Set(
    (
      await db
        .selectFrom("despesa_ceap")
        .select("fornecedor_doc")
        .distinct()
        .where("fornecedor_classe", "=", "pessoa_juridica")
        .execute()
    ).map((r) => soDigitos(r.fornecedor_doc)),
  );
  const resumo: Record<Cadastro, number> = { CEIS: 0, CNEP: 0 };
  for (const cadastro of ["CEIS", "CNEP"] as const) {
    const arq = await baixarSancoesRecentes(cli, cadastro, hoje);
    const coletaId = await registrarColeta(db, {
      fonte: `cgu_${cadastro.toLowerCase()}`,
      url: arq.url,
      sha256: arq.sha256,
      bytes: arq.bytes,
      licenca: LICENCA_CGU,
      observacao: `base de ${arq.data.slice(6, 8)}/${arq.data.slice(4, 6)}/${arq.data.slice(0, 4)}`,
    });
    const linhas: Insertable<SancaoTable>[] = [];
    for await (const l of linhasCsvDoZip(arq.buf, (n) => n.endsWith(".csv"))) {
      const cnpj = soDigitos(l["CPF OU CNPJ DO SANCIONADO"]);
      if (l["TIPO DE PESSOA"] !== "J" || cnpj.length !== 14 || !cnpjs.has(cnpj)) continue;
      linhas.push({
        cadastro,
        codigo: l["CÓDIGO DA SANÇÃO"] ?? "",
        cnpj,
        nome: (l["NOME DO SANCIONADO"] ?? "").trim(),
        categoria: (l["CATEGORIA DA SANÇÃO"] ?? "").trim(),
        data_inicio: dataBrParaIso(l["DATA INÍCIO SANÇÃO"]),
        data_fim: dataBrParaIso(l["DATA FINAL SANÇÃO"]),
        orgao: (l["ÓRGÃO SANCIONADOR"] ?? "").trim(),
        coleta_id: coletaId,
      });
    }
    await db.transaction().execute(async (trx) => {
      await trx.deleteFrom("sancao").where("cadastro", "=", cadastro).execute();
      await inserirEmBlocos(trx, "sancao", linhas);
    });
    resumo[cadastro] = linhas.length;
  }
  return resumo;
}
