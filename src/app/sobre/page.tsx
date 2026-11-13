import type { Metadata } from "next";
import { metadataDaPagina } from "@/lib/site";
import Link from "next/link";

export const metadata: Metadata = metadataDaPagina({
  titulo: "Sobre",
  descricao:
    "O que é o Auditaja, quem pode usar e como ler os dados de deputados federais e senadores publicados aqui.",
  caminho: "/sobre",
});

export default function Sobre() {
  return (
    <article className="mx-auto max-w-3xl space-y-6 px-4 py-8 leading-relaxed">
      <h1 className="font-heading text-3xl font-bold">Sobre o Auditaja</h1>
      <p>
        O Auditaja reúne, num só perfil por parlamentar, o que a Câmara dos Deputados, o Senado Federal, o Tribunal
        Superior Eleitoral e a Controladoria-Geral da União já publicam em dados abertos.
      </p>
      <section className="space-y-2">
        <h2 className="font-heading text-xl font-bold">O que você encontra</h2>
        <ul className="list-disc space-y-1 pl-5">
          <li>Deputados federais e senadores, com partido, UF e situação de exercício.</li>
          <li>
            Gastos da cota parlamentar. Na Câmara (CEAP), comparados ao teto da UF. No Senado (CEAPS), com a média
            mensal, porque o Senado não publica o teto em formato aberto.
          </li>
          <li>
            Presença nas votações nominais do Plenário, comparada à média da Casa, sem contar as votações em que o
            parlamentar estava fora do exercício (licença, afastamento, antes da posse) quando a Casa publica esse
            histórico, e quanto o voto acompanhou a orientação do partido (Câmara) ou da liderança (Senado).
          </li>
          <li>Bens declarados à Justiça Eleitoral nas eleições de 2018, 2022 e 2026.</li>
          <li>
            Emendas individuais dos orçamentos do mandato (deputados: de 2024 em diante; senadores: a partir do ano
            seguinte à posse), com valor empenhado, valor pago e transferências especiais, e quem recebeu os pagamentos,
            do Portal da Transparência.
          </li>
          <li>
            Aviso quando um fornecedor da cota (CEAP ou CEAPS) aparece nos cadastros de empresas sancionadas da CGU
            (CEIS e CNEP).
          </li>
          <li>
            Aviso de padrão atípico nos gastos da cota, quando um tipo de despesa fica muito acima do que os colegas
            gastam ou dá um salto em relação ao ano anterior, com a{" "}
            <Link href="/metodologia#atipico">conta publicada na metodologia</Link>.
          </li>
          <li>Planilha CSV de gastos e de emendas e um feed para acompanhar as atualizações de cada perfil.</li>
        </ul>
      </section>
      <section className="space-y-2">
        <h2 className="font-heading text-xl font-bold">Como trabalhamos</h2>
        <ul className="list-disc space-y-1 pl-5">
          <li>Só usamos dados públicos, coletados por download em lote ou pela API oficial de cada órgão.</li>
          <li>Cada seção do perfil mostra a fonte, a data da coleta e um link para o original.</li>
          <li>Indicadores são pontos de partida para verificação, não acusações.</li>
          <li>Fornecedor pessoa física aparece como &quot;Prestador pessoa física&quot;, sem nenhum dígito do CPF.</li>
          <li>Qualquer pessoa, inclusive o próprio parlamentar, pode pedir a correção de um dado.</li>
        </ul>
      </section>
      <section className="space-y-2">
        <h2 className="font-heading text-xl font-bold">O que ainda não cobrimos</h2>
        <ul className="list-disc space-y-1 pl-5">
          <li>Emendas de bancada e de comissão, e emendas de orçamentos anteriores ao mandato atual.</li>
          <li>Deputados estaduais, vereadores, contratos, licitações e outros gastos públicos.</li>
        </ul>
        <p>Cada etapa nova sai com a metodologia publicada antes.</p>
      </section>
      <p>
        Veja a <Link href="/metodologia">metodologia</Link>, as <Link href="/fontes">fontes e licenças</Link> e a{" "}
        <Link href="/privacidade">política de privacidade</Link>.
      </p>
    </article>
  );
}
