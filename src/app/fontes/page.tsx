import type { Metadata } from "next";
import { connection } from "next/server";
import { Suspense } from "react";
import { Esqueleto } from "@/components/esqueleto";
import { getDb } from "@/db/client";
import { dataHoraBr } from "@/lib/format";

export const metadata: Metadata = { title: "Fontes e licenças" };

export default function Fontes() {
  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-8">
      <h1 className="font-heading text-3xl font-bold">Fontes e licenças</h1>
      <p className="max-w-3xl text-muted-foreground">
        Coletas mais recentes. Os coletores se identificam pelo User-Agent, respeitam o robots.txt de cada site e fazem
        no máximo uma requisição por segundo. O hash SHA-256 permite conferir que o arquivo é o mesmo publicado pelo
        órgão.
      </p>
      <ul className="max-w-3xl list-disc space-y-1 pl-5 text-sm text-muted-foreground">
        <li>Câmara dos Deputados: API v2 e arquivos em lote de dadosabertos.camara.leg.br.</li>
        <li>
          Senado Federal: API de Dados Abertos (legis.senado.leg.br/dadosabertos) e API de dados administrativos
          (adm.senado.gov.br), sem cadastro nem chave. Os dois endereços respondem 403 ao pedido do robots.txt; seguimos
          a RFC 9309, que trata essa resposta como ausência de restrição, e paramos a coleta se qualquer outro endereço
          responder 401 ou 403.
        </li>
        <li>Tribunal Superior Eleitoral: arquivos em lote de cdn.tse.jus.br.</li>
        <li>
          Controladoria-Geral da União: arquivos em lote do Portal da Transparência em dadosabertos-download.cgu.gov.br
          (emendas parlamentares e cadastros CEIS e CNEP), sem a API e sem chave.
        </li>
      </ul>
      <Suspense fallback={<Esqueleto linhas={4} />}>
        <TabelaColetas />
      </Suspense>
    </div>
  );
}

/** Nome do arquivo ou recurso coletado: "Ano-2025.csv.zip", "despesas_ceaps/2025". */
function arquivoDaUrl(url: string): string {
  try {
    const partes = new URL(url).pathname.split("/").filter(Boolean);
    const ultimo = partes.at(-1) ?? url;
    return /^\d+$/.test(ultimo) && partes.length > 1 ? `${partes.at(-2)}/${ultimo}` : decodeURIComponent(ultimo);
  } catch {
    return url;
  }
}

async function TabelaColetas() {
  await connection();
  const coletas = await getDb()
    .selectFrom("coleta")
    .select(["id", "fonte", "url", "coletado_em", "sha256", "bytes", "licenca"])
    .orderBy("coletado_em", "desc")
    .limit(50)
    .execute();

  return (
    <>
      {coletas.length === 0 ? (
        <p>Nenhuma coleta registrada ainda.</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border bg-superficie">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-muted-foreground">
                <th scope="col" className="p-3 font-medium">
                  Fonte
                </th>
                <th scope="col" className="p-3 font-medium">
                  Arquivo
                </th>
                <th scope="col" className="p-3 font-medium">
                  Coletado em
                </th>
                <th scope="col" className="p-3 font-medium">
                  SHA-256
                </th>
                <th scope="col" className="p-3 font-medium">
                  Licença
                </th>
              </tr>
            </thead>
            <tbody>
              {coletas.map((c) => (
                <tr key={c.id} className="border-b last:border-0 align-top">
                  <td className="p-3">
                    <a href={c.url} target="_blank" rel="noopener noreferrer" className="break-all">
                      {c.fonte}
                    </a>
                  </td>
                  <td className="p-3 break-all">{arquivoDaUrl(c.url)}</td>
                  <td className="p-3 whitespace-nowrap">{dataHoraBr(c.coletado_em)}</td>
                  {/* Hash inteiro: truncado não servia para conferir o arquivo baixado. */}
                  <td className="max-w-[18ch] p-3 font-mono text-xs break-all">{c.sha256}</td>
                  <td className="p-3 text-muted-foreground">{c.licenca}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
