import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { brl, dataHoraBr, pct } from "@auditaja/core/format";
import { kpisExecutivo } from "@auditaja/core/kpis-poderes";
import { cargoExecutivo } from "@auditaja/core/poderes";
import { executivoExiste, indiceDeExecutivo, perfilExecutivo } from "@/data/executivo";
import { Esqueleto } from "@/components/esqueleto";
import { metadataDaPagina } from "@/lib/site";

function idValido(s: string) {
  return /^\d{1,9}$/.test(s) ? Number(s) : null;
}

export async function generateStaticParams() {
  try {
    const lista = await indiceDeExecutivo();
    return lista.map((p) => ({ id: String(p.id) }));
  } catch {
    return [{ id: "0" }];
  }
}

export async function generateMetadata({ params }: PageProps<"/executivo/[id]">): Promise<Metadata> {
  const id = idValido((await params).id);
  const p = id ? await perfilExecutivo(id) : null;
  if (!p) return { title: "Titular não encontrado", robots: { index: false, follow: true } };
  const cargo = cargoExecutivo(p.titular.cargo, p.titular.sexo);
  return metadataDaPagina({
    titulo: `${p.titular.nome} · ${cargo}`,
    descricao: `Gastos e bens de ${p.titular.nome} (${cargo}), com fonte oficial e data de coleta.`,
    caminho: `/executivo/${p.titular.id}`,
    tipo: "profile",
  });
}

export default function PaginaPerfilExecutivo(props: PageProps<"/executivo/[id]">) {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-[1200px] px-4 py-6 sm:px-6">
          <Esqueleto linhas={6} />
        </div>
      }
    >
      <Conteudo {...props} />
    </Suspense>
  );
}

async function Conteudo({ params }: PageProps<"/executivo/[id]">) {
  await connection();
  const id = idValido((await params).id);
  if (!id || !(await executivoExiste(id))) notFound();
  const p = await perfilExecutivo(id);
  if (!p) notFound();
  const anosBens = [...p.bensPorAno.keys()].toSorted((a, b) => b - a);
  const porFornecedor = new Map<string, number>();
  const meses = new Set<string>();
  let gastoAno = 0;
  const anoRef = p.despesas[0]?.ano;
  for (const d of p.despesas) {
    if (anoRef !== undefined && d.ano === anoRef) {
      gastoAno += Number(d.valor_liquido);
      meses.add(`${d.ano}-${d.mes}`);
      porFornecedor.set(d.fornecedor_nome, (porFornecedor.get(d.fornecedor_nome) ?? 0) + Number(d.valor_liquido));
    }
  }
  const kpis = kpisExecutivo({
    gastoAno,
    tetoAno: null,
    mesesComLancamento: meses.size,
    valoresPorFornecedor: [...porFornecedor.values()],
    bensAnterior: anosBens.length >= 2 ? p.bensPorAno.get(anosBens[1])! : null,
    bensAtual: anosBens.length >= 1 ? p.bensPorAno.get(anosBens[0])! : null,
  });

  return (
    <div className="mx-auto max-w-[1200px] space-y-8 px-4 py-8 sm:px-6">
      <p className="text-sm text-muted-foreground">
        <Link href="/executivo">Executivo</Link> · {cargoExecutivo(p.titular.cargo, p.titular.sexo)}
      </p>
      <header className="space-y-2">
        <h1 className="font-heading text-3xl font-bold sm:text-4xl">{p.titular.nome}</h1>
        <p className="text-lg text-muted-foreground">
          {cargoExecutivo(p.titular.cargo, p.titular.sexo)}
          {p.titular.orgao ? ` · ${p.titular.orgao}` : ""}
          {p.titular.sigla_partido ? ` · ${p.titular.sigla_partido}` : ""}
        </p>
      </header>

      <section className="space-y-3 rounded-[14px] border bg-card p-4" aria-labelledby="kpis-exec">
        <h2 id="kpis-exec" className="font-heading text-xl font-bold">
          Indicadores
        </h2>
        <p className="text-sm text-muted-foreground">
          Pontos de partida para verificação — mesmos critérios descritos na metodologia dos três poderes.
        </p>
        <ul className="grid gap-3 sm:grid-cols-3">
          <li className="rounded-[10px] border border-borda-suave bg-superficie p-3">
            <p className="text-sm text-muted-foreground">Média mensal ({anoRef ?? "—"})</p>
            <p className="font-heading text-xl font-bold tabular-nums">
              {kpis.mediaMensal !== null ? brl(kpis.mediaMensal) : "—"}
            </p>
          </li>
          <li className="rounded-[10px] border border-borda-suave bg-superficie p-3">
            <p className="text-sm text-muted-foreground">Maior fornecedor</p>
            <p className="font-heading text-xl font-bold tabular-nums">
              {kpis.concentracao.fracao !== null ? `${pct(kpis.concentracao.maior, kpis.concentracao.total)}%` : "—"}
            </p>
          </li>
          <li className="rounded-[10px] border border-borda-suave bg-superficie p-3">
            <p className="text-sm text-muted-foreground">Variação de bens</p>
            <p className="font-heading text-xl font-bold tabular-nums">
              {kpis.variacaoBens !== null ? `${kpis.variacaoBens}%` : "—"}
            </p>
          </li>
        </ul>
      </section>

      <section className="space-y-3 rounded-[14px] border bg-card p-4" aria-labelledby="gastos-exec">
        <h2 id="gastos-exec" className="font-heading text-xl font-bold">
          Gastos publicados
        </h2>
        <p className="text-sm text-muted-foreground">
          Viagens a serviço, cartão de pagamento e diárias do Portal da Transparência (CGU). Indicadores são ponto de
          partida para verificação.
        </p>
        {p.despesas.length === 0 ? (
          <p>Nenhuma despesa coletada neste perfil.</p>
        ) : (
          <ul className="divide-y text-sm">
            {p.despesas.map((d, i) => (
              <li key={`${d.ano}-${d.mes}-${i}`} className="flex flex-wrap justify-between gap-2 py-2">
                <span>
                  {d.mes}/{d.ano} · {d.tipo} · {d.descricao} · {d.fornecedor_nome}
                </span>
                <span className="font-semibold tabular-nums">{brl(Number(d.valor_liquido))}</span>
              </li>
            ))}
          </ul>
        )}
        {p.coleta ? (
          <p className="text-xs text-muted-foreground">
            Fonte:{" "}
            <a href={p.coleta.url} target="_blank" rel="noopener noreferrer">
              {p.coleta.fonte}
            </a>{" "}
            · coletado em {dataHoraBr(p.coleta.coletado_em)}
          </p>
        ) : null}
      </section>

      <section className="space-y-3 rounded-[14px] border bg-card p-4" aria-labelledby="bens-exec">
        <h2 id="bens-exec" className="font-heading text-xl font-bold">
          Bens declarados
        </h2>
        <p className="text-sm text-muted-foreground">
          Só o tipo e o valor (sem descrição livre). Variação nominal entre declarações, quando houver duas eleições.
        </p>
        {anosBens.length === 0 ? (
          <p>Nenhum bem coletado neste perfil.</p>
        ) : (
          <ul className="space-y-1 text-sm">
            {anosBens.map((ano) => (
              <li key={ano}>
                {ano}: <strong className="tabular-nums">{brl(p.bensPorAno.get(ano)!)}</strong>
              </li>
            ))}
          </ul>
        )}
        {kpis.variacaoBens !== null ? (
          <p className="text-sm">
            Variação nominal: <strong className="tabular-nums">{kpis.variacaoBens}%</strong>
          </p>
        ) : null}
      </section>
    </div>
  );
}
