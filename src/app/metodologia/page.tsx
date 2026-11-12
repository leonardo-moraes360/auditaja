import type { Metadata } from "next";
import { TETO_CEAP_ANO, TETO_CEAP_ATO, TETO_CEAP_CONFERIDO_EM, TETO_CEAP_FONTE } from "@/data/teto-ceap";
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
          O teto mensal depende da UF. Usamos os valores de {TETO_CEAP_ANO} publicados pela Câmara na página{" "}
          <a href={TETO_CEAP_FONTE} target="_blank" rel="noopener noreferrer">
            Cota Parlamentar
          </a>{" "}
          (conferidos em {TETO_CEAP_CONFERIDO_EM}), que refletem o{" "}
          <a href={TETO_CEAP_ATO} target="_blank" rel="noopener noreferrer">
            Ato da Mesa nº 244/2026
          </a>
          , em vigor desde 20/02/2026. O teto acumulado é o valor mensal vezes o número de meses até o último mês com
          dados publicados. É uma aproximação: janeiro e o começo de fevereiro de {TETO_CEAP_ANO} ainda seguiam o valor
          anterior, um pouco menor, então o teto exibido fica um pouco acima do real. Para outros anos, não exibimos a
          comparação até conferir os valores vigentes.
        </p>
      </section>

      <section id="presenca" className="scroll-mt-4 space-y-2">
        <h2 className="font-heading text-xl font-bold">Presença em votações</h2>
        <p>
          Contamos as votações nominais do Plenário no ano em que o deputado estava em exercício e quantas delas têm
          voto registrado (Sim, Não, Abstenção, Obstrução ou Artigo 17). Usamos o histórico de situação publicado pela
          Câmara: dias de licença, afastamento, suplência, vacância, suspensão ou antes da posse ficam fora da conta. Se
          a situação muda no dia da votação, ela conta quando o deputado esteve em exercício em algum momento daquele
          dia, e um voto registrado sempre conta. Votações simbólicas não entram, porque não registram voto individual.
        </p>
        <p>
          A média da Câmara é a média simples da presença dos deputados em exercício, calculada do mesmo jeito. Enquanto
          o histórico de um deputado não foi coletado, a conta dele usa todas as votações do ano, e o perfil avisa.
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

      <section id="emendas" className="space-y-2">
        <h2 className="font-heading text-xl font-bold">Emendas parlamentares</h2>
        <p>
          Usamos o arquivo de emendas parlamentares do Portal da Transparência (CGU), baixado em lote do servidor de
          arquivos da CGU, sem a API e sem chave. Entram só as emendas individuais com orçamento de 2024 em diante, que
          são as apresentadas na legislatura atual. Emendas de bancada e de comissão têm autoria coletiva e ficam de
          fora.
        </p>
        <p>
          O arquivo identifica o autor pelo nome parlamentar, sem CPF nem código da Câmara. Ligamos a emenda ao deputado
          quando o nome do autor, sem acentos e sem diferença de maiúsculas, é igual ao nome parlamentar de exatamente
          um deputado. Quando dois deputados têm o mesmo nome, ou quando nenhum casa (senadores, por exemplo), a emenda
          fica de fora.
        </p>
        <p>
          Empenhado é o valor reservado no Orçamento. Pago é a soma do valor pago no ano com os restos a pagar pagos
          depois. Transferências especiais são as emendas que o arquivo chama de &quot;Transferências Especiais&quot;
          (as &quot;emendas Pix&quot;). Emendas marcadas como &quot;Múltiplo&quot; não têm um local único no Orçamento e
          aparecem numa frase à parte, não na lista de locais. Favorecido pessoa física aparece como &quot;Beneficiário
          pessoa física&quot;, com o CPF mascarado como o Portal publica.
        </p>
      </section>

      <section id="sancoes" className="space-y-2">
        <h2 className="font-heading text-xl font-bold">Sanções de fornecedores</h2>
        <p>
          Cruzamos os fornecedores pessoa jurídica da cota parlamentar com os cadastros de empresas sancionadas da CGU,
          o CEIS e o CNEP, baixados em lote do Portal da Transparência. A comparação é pelo CNPJ, e guardamos só as
          sanções de empresas que aparecem na cota.
        </p>
        <p>
          Para cada sanção, contamos quantas notas do período exibido têm data de emissão dentro do período da sanção,
          do início ao fim, inclusive. Sanção sem data final vale até hoje. O aviso diz o que está no cadastro oficial e
          não indica irregularidade do parlamentar.
        </p>
      </section>
    </article>
  );
}
