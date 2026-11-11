import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Sobre" };

export default function Sobre() {
  return (
    <article className="mx-auto max-w-3xl space-y-6 px-4 py-8 leading-relaxed">
      <h1 className="font-heading text-3xl font-bold">Sobre o Auditaja</h1>
      <p>
        O Auditaja reúne, num só perfil por deputado federal, o que a Câmara dos Deputados e o Tribunal Superior
        Eleitoral já publicam em dados abertos: os gastos da cota parlamentar, os votos nas votações nominais do
        Plenário e os bens declarados à Justiça Eleitoral.
      </p>
      <section className="space-y-2">
        <h2 className="font-heading text-xl font-bold">Como trabalhamos</h2>
        <ul className="list-disc space-y-1 pl-5">
          <li>Só usamos dados públicos, coletados por download em lote ou pela API oficial de cada órgão.</li>
          <li>Cada número mostra a fonte, a data da coleta e um link para o original.</li>
          <li>Indicadores são pontos de partida para verificação, não acusações.</li>
          <li>Qualquer pessoa, inclusive o próprio parlamentar, pode pedir a correção de um dado.</li>
        </ul>
      </section>
      <section className="space-y-2">
        <h2 className="font-heading text-xl font-bold">O que ainda não cobrimos</h2>
        <p>
          Nesta primeira versão, só deputados federais. Senado, alertas de padrão atípico e outros gastos públicos vêm
          em etapas próprias, cada uma com a metodologia publicada antes.
        </p>
      </section>
      <p>
        Veja a <Link href="/metodologia">metodologia</Link>, as <Link href="/fontes">fontes e licenças</Link> e a{" "}
        <Link href="/privacidade">política de privacidade</Link>.
      </p>
    </article>
  );
}
