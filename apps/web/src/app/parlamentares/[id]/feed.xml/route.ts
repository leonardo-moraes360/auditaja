import type { NextRequest } from "next/server";
import { perfilParlamentar } from "@/data/perfil";
import { brl, dataBr, MESES } from "@auditaja/core/format";
import { rotuloVotoSenado } from "@auditaja/core/senado";

const xml = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/**
 * "Receber atualizações": feed Atom público por parlamentar, sem conta nem e-mail.
 * Uma entrada por votação nominal do Plenário no ano (com o voto) e uma por mês com gasto da cota
 * (CEAP na Câmara, CEAPS no Senado).
 */
export async function GET(request: NextRequest, ctx: RouteContext<"/parlamentares/[id]/feed.xml">) {
  const { id: idTexto } = await ctx.params;
  const id = /^\d{1,9}$/.test(idTexto) ? Number(idTexto) : null;
  const perfil = id ? await perfilParlamentar(id) : null;
  if (!perfil) return new Response("Parlamentar não encontrado", { status: 404 });

  const { parlamentar: p, ceap, votacoes, ano } = perfil;
  const base = request.nextUrl.origin;
  const perfilUrl = `${base}/parlamentares/${p.id}`;
  const senado = p.casa === "senado";
  const casa = senado ? "do Senado Federal" : "da Câmara dos Deputados";
  // Senado: o voto vem como sigla ("P-NRV", "NCom"...); o rótulo é o mesmo da lista de votações do perfil.
  const voto = (v: (typeof votacoes.lista)[number]) =>
    senado ? rotuloVotoSenado(v.voto, v.secreta) : `Votou: ${v.voto ?? "sem registro"}`;
  const resumoCota = senado
    ? "Valor reembolsado da cota do senador (CEAPS) no mês, segundo os dados abertos do Senado Federal."
    : "Gasto líquido da CEAP no mês, segundo os Dados Abertos da Câmara.";
  const entradas = [
    ...votacoes.lista.slice(0, 30).map((v) => ({
      id: `${perfilUrl}#votacao-${v.id}`,
      data: `${String(v.data).slice(0, 10)}T12:00:00-03:00`,
      titulo: `${voto(v)} · ${v.proposicao_sigla ?? v.descricao.slice(0, 80)}`,
      resumo: `${dataBr(v.data)}. ${v.descricao}`,
      link: v.source_url,
    })),
    ...ceap.porMes.map((m) => {
      const fim = new Date(Date.UTC(ano, m.mes, 0)).toISOString().slice(0, 10);
      return {
        id: `${perfilUrl}#ceap-${ano}-${m.mes}`,
        data: `${fim}T12:00:00-03:00`,
        titulo: `Cota parlamentar em ${MESES[m.mes - 1].toLowerCase()}/${ano}: ${brl(m.total)}`,
        resumo: resumoCota,
        link: `${perfilUrl}?ano=${ano}#gastos`,
      };
    }),
  ].sort((a, b) => b.data.localeCompare(a.data));
  const atualizado = entradas[0]?.data ?? new Date().toISOString();

  const corpo = `<?xml version="1.0" encoding="utf-8"?>
<feed xmlns="http://www.w3.org/2005/Atom" xml:lang="pt-BR">
  <title>${xml(`${p.nome} · Auditaja`)}</title>
  <subtitle>${xml(`Votações e gastos da cota parlamentar, com dados abertos ${casa}.`)}</subtitle>
  <id>${xml(perfilUrl)}</id>
  <link rel="self" href="${xml(`${perfilUrl}/feed.xml`)}"/>
  <link rel="alternate" href="${xml(perfilUrl)}"/>
  <updated>${atualizado}</updated>
${entradas
  .map(
    (e) => `  <entry>
    <id>${xml(e.id)}</id>
    <title>${xml(e.titulo)}</title>
    <updated>${e.data}</updated>
    <link href="${xml(e.link)}"/>
    <summary>${xml(e.resumo)}</summary>
  </entry>`,
  )
  .join("\n")}
</feed>
`;
  return new Response(corpo, { headers: { "content-type": "application/atom+xml; charset=utf-8" } });
}
