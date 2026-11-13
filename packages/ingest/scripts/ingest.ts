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
 *   pnpm ingest transferegov-pix  (Transferegov: planos e pagamentos das emendas Pix; ~1.000 requisições, ~17 min)
 *   pnpm ingest tse-contas 2022  (TSE: despesas de campanha com fornecedor PJ; ZIP de ~520 MB, rode depois de `bens`)
 *   pnpm ingest receita --arquivo <zip>  (Receita: lote Estabelecimentos baixado À MÃO; nunca pela rede)
 *   pnpm ingest tudo 2026   (deputados, histórico, órgãos, blocos, CEAP e votações do ano; bens 2018, 2022 e 2026)
 *   pnpm ingest senadores
 *   pnpm ingest ceaps 2026
 *   pnpm ingest votacoes-senado 2026
 *   pnpm ingest senado 2026  (senadores, CEAPS e votações do ano; ~170 requisições a 1 req/s)
 *
 * Rode `senadores` (ou `senado`) antes de `bens` para o TSE casar também os senadores.
 * Rode `emendas` depois de `deputados` e `senadores`, e `sancoes` depois de `ceap` e `ceaps`: as emendas
 * casam com os perfis das duas Casas e as sanções só guardam CNPJs que já estão na cota (CEAP e CEAPS).
 * Rode `transferegov-pix` depois de `emendas`: os planos de ação só são ligados a emendas Pix já gravadas.
 *
 * Receita: o robots.txt de arquivos.receitafederal.gov.br é `Disallow: /`, então não há download por
 * código. Baixe pelo navegador os arquivos Estabelecimentos0.zip a Estabelecimentos9.zip do mês mais
 * recente em https://dados.gov.br/dados/conjuntos-dados/cadastro-nacional-da-pessoa-juridica---cnpj,
 * guarde-os numa pasta com o mês (ex.: ~/receita/2026-10/) e rode o comando uma vez por arquivo,
 * depois de `transferegov-pix`, `emendas` e `tse-contas`: só entram CNPJs que já estão no banco.
 *
 * Todos usam o ClienteEducado (R7): robots.txt, 1 req/s por host, User-Agent identificado.
 *
 * Revalidação automática:
 *   Após a coleta, se REVALIDATE_URL e REVALIDATE_SECRET estiverem definidos, o script chama
 *   POST /api/revalidate no site para atualizar o cache das páginas de perfil. Sem essas variáveis
 *   a revalidação é pulada (aviso no console). Use --no-revalidate para pular intencionalmente.
 */
import { createDb } from "@auditaja/db/client";
import { coletarBlocos, coletarCeap, coletarDeputados, coletarOrgaos, coletarVotacoes } from "../src/camara";
import { coletarHistorico } from "../src/historico";
import { ClienteEducado } from "../src/http";
import { coletarCeaps, coletarSenadores, coletarVotacoesSenado } from "../src/senado";
import { coletarBens, coletarDespesasCampanha } from "../src/tse";
import { importarEstabelecimentos, PAGINA_RECEITA } from "../src/receita";
import { coletarTransferegovPix } from "../src/transferegov";
import { coletarEmendas, coletarSancoes } from "../src/transparencia";

const [cmd, anoArg] = process.argv.slice(2);
const noRevalidate = process.argv.includes("--no-revalidate");

async function revalidarCache(): Promise<void> {
  const url = process.env.REVALIDATE_URL;
  const secret = process.env.REVALIDATE_SECRET;

  if (noRevalidate) {
    console.log("revalidação: pulada (--no-revalidate)");
    return;
  }

  if (!url || !secret) {
    console.log("revalidação: pulada (defina REVALIDATE_URL e REVALIDATE_SECRET para atualizar o cache após a coleta)");
    return;
  }

  console.log("revalidação: chamando", url);
  try {
    const res = await fetch(`${url}/api/revalidate`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${secret}`,
        "Content-Type": "application/json",
      },
    });

    const data = (await res.json()) as { revalidated?: boolean; parlamentares?: number; error?: string };

    if (res.ok && data.revalidated) {
      console.log(`revalidação: ${data.parlamentares ?? "?"} perfis atualizados`);
    } else {
      console.error("revalidação: falhou", data.error ?? res.status);
    }
  } catch (err) {
    console.error("revalidação: erro de rede", err instanceof Error ? err.message : err);
  }
}

/** Valor de `--nome <valor>` ou `--nome=<valor>`. */
function opcao(nome: string): string | undefined {
  const args = process.argv.slice(2);
  const i = args.indexOf(`--${nome}`);
  if (i >= 0) return args[i + 1];
  return args.find((a) => a.startsWith(`--${nome}=`))?.slice(nome.length + 3);
}
const ano = Number(anoArg ?? new Date().getFullYear());

async function main() {
  const db = createDb();
  const cli = new ClienteEducado();
  try {
    switch (cmd) {
      case "deputados":
        console.log(`deputados: ${await coletarDeputados(db, cli)}`);
        await revalidarCache();
        break;
      case "orgaos":
        console.log(`órgãos: ${await coletarOrgaos(db, cli)}`);
        await revalidarCache();
        break;
      case "blocos":
        console.log("blocos:", await coletarBlocos(db, cli));
        await revalidarCache();
        break;
      case "historico":
        console.log("histórico:", await coletarHistorico(db, cli, { soFaltantes: anoArg === "faltantes" }));
        await revalidarCache();
        break;
      case "ceap":
        console.log(`despesas ${ano}: ${await coletarCeap(db, cli, ano)}`);
        await revalidarCache();
        break;
      case "votacoes":
        console.log(`votações ${ano}:`, await coletarVotacoes(db, cli, ano));
        await revalidarCache();
        break;
      case "bens":
        console.log(`bens ${ano}:`, await coletarBens(db, cli, ano));
        await revalidarCache();
        break;
      case "tse-contas":
        console.log(`despesas de campanha ${ano}:`, await coletarDespesasCampanha(db, cli, ano));
        await revalidarCache();
        break;
      case "emendas":
        console.log("emendas:", await coletarEmendas(db, cli));
        await revalidarCache();
        break;
      case "sancoes":
        console.log("sanções:", await coletarSancoes(db, cli));
        await revalidarCache();
        break;
      case "transferegov-pix":
        console.log("Transferegov, emendas Pix:", await coletarTransferegovPix(db, cli));
        await revalidarCache();
        break;
      case "receita": {
        const arquivo = opcao("arquivo");
        if (!arquivo || arquivo.startsWith("--")) {
          console.error(
            `uso: pnpm ingest receita --arquivo <Estabelecimentos.zip>\n` +
              `Baixe o lote à mão pelo navegador em ${PAGINA_RECEITA} (o robots.txt da Receita não permite robôs).`,
          );
          process.exitCode = 1;
          break;
        }
        console.log("Receita, Estabelecimentos:", await importarEstabelecimentos(db, arquivo));
        await revalidarCache();
        break;
      }
      case "senadores":
        console.log("senadores:", await coletarSenadores(db, cli));
        await revalidarCache();
        break;
      case "ceaps":
        console.log(`CEAPS ${ano}:`, await coletarCeaps(db, cli, ano));
        await revalidarCache();
        break;
      case "votacoes-senado":
        console.log(`votações do Senado ${ano}:`, await coletarVotacoesSenado(db, cli, ano));
        await revalidarCache();
        break;
      case "senado":
        console.log("senadores:", await coletarSenadores(db, cli));
        console.log(`CEAPS ${ano}:`, await coletarCeaps(db, cli, ano));
        console.log(`votações do Senado ${ano}:`, await coletarVotacoesSenado(db, cli, ano));
        await revalidarCache();
        break;
      case "tudo":
        console.log(`deputados: ${await coletarDeputados(db, cli)}`);
        console.log("histórico:", await coletarHistorico(db, cli));
        console.log(`órgãos: ${await coletarOrgaos(db, cli)}`);
        console.log("blocos:", await coletarBlocos(db, cli));
        console.log(`despesas ${ano}: ${await coletarCeap(db, cli, ano)}`);
        console.log(`votações ${ano}:`, await coletarVotacoes(db, cli, ano));
        for (const a of [2018, 2022, 2026]) console.log(`bens ${a}:`, await coletarBens(db, cli, a));
        await revalidarCache();
        break;
      default:
        console.error("comando desconhecido; veja o cabeçalho de packages/ingest/scripts/ingest.ts");
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
