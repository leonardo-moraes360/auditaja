import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { brl, dataBr, dataHoraBr, pct } from "@auditaja/core/format";
import { kpisJudiciario } from "@auditaja/core/kpis-poderes";
import { cargoJudiciario } from "@auditaja/core/poderes";
import { indiceDeJudiciario, judiciarioExiste, perfilJudiciario } from "@/data/judiciario";
import { Esqueleto } from "@/components/esqueleto";
import { metadataDaPagina } from "@/lib/site";

function idValido(s: string) {
  return /^\d{1,9}$/.test(s) ? Number(s) : null;
}

export async function generateStaticParams() {
  try {
    const lista = await indiceDeJudiciario();
    return lista.map((p) => ({ id: String(p.id) }));
  } catch {
    return [{ id: "0" }];
  }
}

export async function generateMetadata({ params }: PageProps<"/judiciario/[id]">): Promise<Metadata> {
  const id = idValido((await params).id);
  const p = id ? await perfilJudiciario(id) : null;
  if (!p) return { title: "Ministro não encontrado", robots: { index: false, follow: true } };
  const cargo = cargoJudiciario(p.titular.cargo, p.titular.sexo);
  return metadataDaPagina({
    titulo: `${p.titular.nome} · ${cargo}`,
    descricao: `Sessões, votos e despesas de ${p.titular.nome} (${cargo}), com fonte oficial.`,
    caminho: `/judiciario/${p.titular.id}`,
    tipo: "profile",
  });
}

export default function PaginaPerfilJudiciario(props: PageProps<"/judiciario/[id]">) {
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

async function Conteudo({ params }: PageProps<"/judiciario/[id]">) {
  await connection();
  const id = idValido((await params).id);
  if (!id || !(await judiciarioExiste(id))) notFound();
  const p = await perfilJudiciario(id);
  if (!p) notFound();
  const sessoes = p.votos.length;
  const presentes = p.votos.filter((v) => v.presente).length;
  const meses = new Set<string>();
  let gastoAno = 0;
  const anoRef = p.despesas[0]?.ano;
  for (const d of p.despesas) {
    if (anoRef !== undefined && d.ano === anoRef) {
      gastoAno += Number(d.valor_liquido);
      meses.add(`${d.ano}-${d.mes}`);
    }
  }
  const kpis = kpisJudiciario({
    comparecimentos: presentes,
    sessoes,
    votos: p.votos.map((v) => ({
      voto: v.voto,
      presente: v.presente,
      maioria: p.maioriaPorSessao.get(v.sessao_id) ?? null,
    })),
    gastoAno,
    mesesComLancamento: meses.size,
  });

  return (
    <div className="mx-auto max-w-[1200px] space-y-8 px-4 py-8 sm:px-6">
      <p className="text-sm text-muted-foreground">
        <Link href="/judiciario">Judiciário</Link> · {cargoJudiciario(p.titular.cargo, p.titular.sexo)}
      </p>
      <header className="space-y-2">
        <h1 className="font-heading text-3xl font-bold sm:text-4xl">{p.titular.nome}</h1>
        <p className="text-lg text-muted-foreground">
          {cargoJudiciario(p.titular.cargo, p.titular.sexo)} · {p.titular.tribunal}
          {p.titular.posse ? ` · posse em ${dataBr(p.titular.posse)}` : ""}
        </p>
      </header>

      <section className="space-y-3 rounded-[14px] border bg-card p-4" aria-labelledby="kpis-jud">
        <h2 id="kpis-jud" className="font-heading text-xl font-bold">
          Indicadores
        </h2>
        <p className="text-sm text-muted-foreground">
          Presença e concordância com a maioria do colegiado — análogos à presença e ao alinhamento do Legislativo.
        </p>
        <ul className="grid gap-3 sm:grid-cols-3">
          <li className="rounded-[10px] border border-borda-suave bg-superficie p-3">
            <p className="text-sm text-muted-foreground">Presença</p>
            <p className="font-heading text-xl font-bold tabular-nums">
              {kpis.presenca.taxa !== null ? `${pct(kpis.presenca.comparecimentos, kpis.presenca.sessoes)}%` : "—"}
            </p>
          </li>
          <li className="rounded-[10px] border border-borda-suave bg-superficie p-3">
            <p className="text-sm text-muted-foreground">Concordância com a maioria</p>
            <p className="font-heading text-xl font-bold tabular-nums">
              {kpis.concordancia.taxa !== null
                ? `${pct(kpis.concordancia.iguais, kpis.concordancia.comparaveis)}%`
                : "—"}
            </p>
          </li>
          <li className="rounded-[10px] border border-borda-suave bg-superficie p-3">
            <p className="text-sm text-muted-foreground">Média mensal de despesas</p>
            <p className="font-heading text-xl font-bold tabular-nums">
              {kpis.mediaMensal !== null ? brl(kpis.mediaMensal) : "—"}
            </p>
          </li>
        </ul>
      </section>

      <section className="space-y-3 rounded-[14px] border bg-card p-4" aria-labelledby="sessoes-jud">
        <h2 id="sessoes-jud" className="font-heading text-xl font-bold">
          Sessões do Plenário
        </h2>
        <p className="text-sm text-muted-foreground">
          Presença e voto nas sessões coletadas. Indicadores são ponto de partida para verificação — não qualificam o
          mérito das decisões.
        </p>
        <p className="text-sm">
          Comparecimento:{" "}
          <strong className="tabular-nums">
            {presentes}/{sessoes}
          </strong>
        </p>
        {p.votos.length === 0 ? (
          <p>Nenhuma sessão coletada neste perfil.</p>
        ) : (
          <ul className="divide-y text-sm">
            {p.votos.map((v) => (
              <li key={v.sessao_id} className="flex flex-wrap justify-between gap-2 py-2">
                <span>
                  {dataBr(v.data)} · {v.tipo} · {v.descricao}
                </span>
                <span className="font-semibold">{v.presente ? v.voto || "Presente" : "Ausente"}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="space-y-3 rounded-[14px] border bg-card p-4" aria-labelledby="gastos-jud">
        <h2 id="gastos-jud" className="font-heading text-xl font-bold">
          Despesas publicadas
        </h2>
        {p.despesas.length === 0 ? (
          <p>Nenhuma despesa coletada neste perfil.</p>
        ) : (
          <ul className="divide-y text-sm">
            {p.despesas.map((d, i) => (
              <li key={`${d.ano}-${d.mes}-${i}`} className="flex flex-wrap justify-between gap-2 py-2">
                <span>
                  {d.mes}/{d.ano} · {d.tipo} · {d.descricao}
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
    </div>
  );
}
