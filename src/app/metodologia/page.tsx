import type { Metadata } from "next";
import { TETO_CEAP_FONTE } from "@/data/teto-ceap";
import { METODOLOGIA_VERSAO } from "@/lib/metrics";

export const metadata: Metadata = { title: "Metodologia" };

export default function Metodologia() {
  return (
    <article className="mx-auto max-w-3xl space-y-6 px-4 py-8 leading-relaxed">
      <header className="space-y-2">
        <h1 className="font-heading text-3xl font-bold">Metodologia</h1>
        <p className="text-sm text-muted-foreground">Versão {METODOLOGIA_VERSAO}. Toda mudança gera nova versão.</p>
      </header>

      <section className="space-y-2">
        <h2 className="font-heading text-xl font-bold">Princípios</h2>
        <ul className="list-disc space-y-1 pl-5">
          <li>Usamos só dados que os órgãos públicos já publicam, por API oficial ou download em lote.</li>
          <li>Cada registro guarda a fonte, o endereço, a data de coleta e o hash do arquivo original.</li>
          <li>Indicadores são pontos de partida para verificação. Não qualificamos pessoas como culpadas de nada.</li>
          <li>
            CPF de terceiros (fornecedores pessoa física) aparece mascarado no padrão da Receita Federal, e o nome é
            substituído por &quot;Prestador pessoa física&quot;. Nomes de passageiros da cota não são coletados.
          </li>
        </ul>
      </section>

      <section className="space-y-2">
        <h2 className="font-heading text-xl font-bold">Cota parlamentar (CEAP)</h2>
        <p>
          Somamos o valor líquido de cada documento (valor do documento menos glosa) no ano, a partir do arquivo anual
          da Câmara. Valores negativos, como compensações de bilhetes, entram na soma como a Câmara os publica.
        </p>
        <p>
          O teto mensal depende da UF. Ele foi atualizado pelo{" "}
          <a href={TETO_CEAP_FONTE} target="_blank" rel="noopener noreferrer">
            Ato da Mesa nº 244/2026
          </a>
          , mas a tabela de valores não está publicada na página do ato. Só exibimos a comparação com o teto depois de
          conferir o valor de cada UF no Diário da Câmara.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="font-heading text-xl font-bold">Presença em votações</h2>
        <p>
          Contamos as votações nominais do Plenário no ano e quantas delas têm voto registrado do deputado (Sim, Não,
          Abstenção, Obstrução ou Artigo 17). O número inclui períodos de licença ou de suplência, então um deputado
          licenciado aparece com presença menor. Votações simbólicas não entram, porque não registram voto individual.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="font-heading text-xl font-bold">Voto conforme a orientação</h2>
        <p>
          Para cada votação, procuramos a orientação que vale para o partido do deputado na data do voto, nesta ordem: a
          do próprio partido; na falta dela, a da federação; na falta das duas, a do bloco. Orientações de Governo,
          Maioria, Minoria e Oposição não contam.
        </p>
        <p>
          Só comparamos votações em que a orientação foi Sim ou Não e o deputado votou Sim ou Não. Liberação, obstrução,
          abstenção e ausência ficam de fora do cálculo.
        </p>
        <p>
          A Câmara abrevia o nome do bloco na orientação (por exemplo &quot;Bl UniPpPsd...&quot;). Para saber quais
          partidos o bloco reúne, usamos a lista de blocos da legislatura na{" "}
          <a href="https://dadosabertos.camara.leg.br/swagger/api.html" target="_blank" rel="noopener noreferrer">
            API de Dados Abertos da Câmara
          </a>{" "}
          (/blocos e /blocos/&#123;id&#125;/partidos): o bloco é aquele cujo nome começa pelas mesmas siglas da
          abreviação, e a orientação vale para todos os seus partidos, inclusive os de federações (como PSDB e
          Cidadania) e os que não couberam na abreviação (como Republicanos). Quando a API não lista os partidos de um
          bloco, eles saem do nome do bloco. Usamos a composição atual do bloco para todas as votações do ano; se um
          partido entrou ou saiu do bloco no meio do ano, isso não aparece. Se nenhum bloco casar com a abreviação, só
          contam os partidos visíveis nela.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="font-heading text-xl font-bold">Bens declarados</h2>
        <p>
          Associamos as candidaturas do TSE aos deputados pelo nome civil e, quando os dois lados publicam, pela data de
          nascimento; sem data, exigimos a mesma UF. Casamentos ambíguos são descartados. Mostramos só o tipo e o valor
          de cada bem, em valores nominais, sem correção pela inflação.
        </p>
      </section>
    </article>
  );
}
