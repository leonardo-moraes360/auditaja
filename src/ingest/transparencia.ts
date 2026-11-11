import type { Insertable, Kysely } from "kysely";
import type { Database, EmendaFavorecidoTable, EmendaTable } from "@/db/types";
import {
  ANO_INICIAL_EMENDAS,
  autorDoNome,
  ehEmendaIndividual,
  favorecidoPublicavel,
  indiceDeAutores,
  valorBr,
} from "@/lib/emendas";
import { linhasCsvDoZip } from "./arquivos";
import { inserirEmBlocos, registrarColeta } from "./coleta";
import type { ClienteEducado } from "./http";

/**
 * Portal da Transparência (CGU), só download em lote (AD-001, AD-004).
 * O host portaldatransparencia.gov.br responde com captcha; os arquivos vêm direto do servidor
 * de arquivos da CGU, destino oficial do redirecionamento de /download-de-dados/...
 */
export const ARQUIVOS_CGU = "https://dadosabertos-download.cgu.gov.br/PortalDaTransparencia/saida";
export const URL_EMENDAS = `${ARQUIVOS_CGU}/emendas-parlamentares/EmendasParlamentares.zip`;
export const LICENCA_CGU = "Portal da Transparência (CGU); dados abertos, Decreto 8.777/2016";

export type ResumoEmendas = { emendas: number; favorecidos: number; autoresDescartados: number };

export async function coletarEmendas(db: Kysely<Database>, cli: ClienteEducado): Promise<ResumoEmendas> {
  const zip = await cli.baixar(URL_EMENDAS, ".cache/ingest");
  const coletaId = await registrarColeta(db, {
    fonte: "cgu_emendas",
    url: URL_EMENDAS,
    sha256: zip.sha256,
    bytes: zip.bytes,
    licenca: LICENCA_CGU,
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
