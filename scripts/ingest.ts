/**
 * Coletores manuais. Uso:
 *   pnpm ingest deputados
 *   pnpm ingest orgaos
 *   pnpm ingest blocos
 *   pnpm ingest historico            (situação de cada deputado: ~600 requisições, ~10 min)
 *   pnpm ingest historico faltantes  (só quem ainda não tem histórico coletado)
 *   pnpm ingest ceap 2026
 *   pnpm ingest votacoes 2026
 *   pnpm ingest bens 2022
 *   pnpm ingest emendas     (Portal da Transparência, lote: emendas individuais e favorecidos)
 *   pnpm ingest sancoes     (Portal da Transparência, lote: CEIS e CNEP dos fornecedores da cota)
 *   pnpm ingest tudo 2026   (deputados, histórico, órgãos, blocos, CEAP e votações do ano; bens 2018, 2022 e 2026)
 *
 * Todos usam o ClienteEducado (R7): robots.txt, 1 req/s por host, User-Agent identificado.
 */
import { createDb } from "../src/db/client";
import { coletarBlocos, coletarCeap, coletarDeputados, coletarOrgaos, coletarVotacoes } from "../src/ingest/camara";
import { coletarHistorico } from "../src/ingest/historico";
import { ClienteEducado } from "../src/ingest/http";
import { coletarBens } from "../src/ingest/tse";
import { coletarEmendas, coletarSancoes } from "../src/ingest/transparencia";

const [cmd, anoArg] = process.argv.slice(2);
const ano = Number(anoArg ?? new Date().getFullYear());

async function main() {
  const db = createDb();
  const cli = new ClienteEducado();
  try {
    switch (cmd) {
      case "deputados":
        console.log(`deputados: ${await coletarDeputados(db, cli)}`);
        break;
      case "orgaos":
        console.log(`órgãos: ${await coletarOrgaos(db, cli)}`);
        break;
      case "blocos":
        console.log("blocos:", await coletarBlocos(db, cli));
        break;
      case "historico":
        console.log("histórico:", await coletarHistorico(db, cli, { soFaltantes: anoArg === "faltantes" }));
        break;
      case "ceap":
        console.log(`despesas ${ano}: ${await coletarCeap(db, cli, ano)}`);
        break;
      case "votacoes":
        console.log(`votações ${ano}:`, await coletarVotacoes(db, cli, ano));
        break;
      case "bens":
        console.log(`bens ${ano}:`, await coletarBens(db, cli, ano));
        break;
      case "emendas":
        console.log("emendas:", await coletarEmendas(db, cli));
        break;
      case "sancoes":
        console.log("sanções:", await coletarSancoes(db, cli));
        break;
      case "tudo":
        console.log(`deputados: ${await coletarDeputados(db, cli)}`);
        console.log("histórico:", await coletarHistorico(db, cli));
        console.log(`órgãos: ${await coletarOrgaos(db, cli)}`);
        console.log("blocos:", await coletarBlocos(db, cli));
        console.log(`despesas ${ano}: ${await coletarCeap(db, cli, ano)}`);
        console.log(`votações ${ano}:`, await coletarVotacoes(db, cli, ano));
        for (const a of [2018, 2022, 2026]) console.log(`bens ${a}:`, await coletarBens(db, cli, a));
        break;
      default:
        console.error("comando desconhecido; veja o cabeçalho de scripts/ingest.ts");
        process.exitCode = 1;
    }
  } finally {
    await db.destroy();
  }
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
