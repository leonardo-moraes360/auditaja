import type { Metadata } from "next";
import { metadataDaPagina } from "@/lib/site";
import { TETO_CEAP_ANO, TETO_CEAP_ATO, TETO_CEAP_CONFERIDO_EM, TETO_CEAP_FONTE } from "@/data/teto-ceap";
import { FATOR_TUKEY, MESES_MINIMOS_SALTO, MINIMO_COLEGAS, PISO_REAIS } from "@/lib/atipico";
import { brl } from "@/lib/format";
import { METODOLOGIA_VERSAO } from "@/lib/metrics";
import { LICENCAS_SENADO } from "@/lib/senado";

export const metadata: Metadata = metadataDaPagina({
  titulo: "Metodologia",
  descricao:
    "Como o Auditaja calcula gastos da cota, presença, alinhamento com o partido, padrão atípico e sanções de fornecedores, com versão e regras de privacidade.",
  caminho: "/metodologia",
});

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
            CPF de terceiros (fornecedores e favorecidos pessoa física) não é exibido nem gravado, nem mascarado: cada
            fonte mascara dígitos diferentes e as máscaras juntas remontariam o número. O nome é substituído por
            &quot;Prestador pessoa física&quot;, e os prestadores pessoa física aparecem somados numa linha. Nomes de
            passageiros da cota não são coletados.
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

      <section id="atipico" className="scroll-mt-4 space-y-2">
        <h2 className="font-heading text-xl font-bold">Padrão atípico nos gastos da cota</h2>
        <p>
          O aviso de padrão atípico aponta um gasto da cota muito diferente do comum. É um ponto de partida para
          verificação: não diz que houve irregularidade, e muitos casos têm explicação, como a distância entre o estado
          e Brasília. Usamos duas comparações, que enxergam coisas diferentes, e cada aviso mostra os números usados no
          cálculo para qualquer pessoa refazer a conta.
        </p>
        <h3 className="font-semibold">Acima dos colegas</h3>
        <p>
          Para cada tipo de despesa, dividimos o que o parlamentar gastou no ano pelos meses em que ele apresentou
          alguma nota, e comparamos essa média mensal com a dos colegas da mesma Casa que usaram o mesmo tipo no mesmo
          ano. Deputados são comparados com deputados, senadores com senadores. Ordenamos as médias e pegamos o primeiro
          quartil (Q1, abaixo do qual está um quarto dos colegas) e o terceiro quartil (Q3, três quartos). O limite de
          atipicidade é <strong>Q3 + {FATOR_TUKEY} × (Q3 − Q1)</strong>, a chamada cerca externa de Tukey. Ela não usa a
          média nem supõe que os gastos sigam uma curva normal, então poucos valores muito altos não arrastam o limite.
          O aviso aparece quando a média mensal passa do limite e, no ano, o gasto fica mais de {brl(PISO_REAIS)} acima
          dele (limite mensal vezes os meses do parlamentar).
        </p>
        <h3 className="font-semibold">Salto em relação ao ano anterior</h3>
        <p>
          Para cada tipo de despesa, dividimos o total do ano pelo total do ano anterior. Só entram parlamentares que
          usaram o tipo nos dois anos e apresentaram notas em pelo menos {MESES_MINIMOS_SALTO} meses de cada ano.
          Comparamos o logaritmo dessa razão com o dos colegas pela mesma cerca externa de Tukey; o logaritmo trata
          dobrar e cair pela metade como variações do mesmo tamanho. O aviso aparece quando a razão passa do limite e o
          aumento passa de {brl(PISO_REAIS)}. Sem o ano anterior coletado, como no primeiro ano da legislatura, essa
          comparação não é feita.
        </p>
        <h3 className="font-semibold">Regras comuns</h3>
        <p>
          Só calculamos um limite quando pelo menos {MINIMO_COLEGAS} parlamentares entram na comparação daquele tipo de
          despesa. Usamos o valor líquido de cada nota (Câmara) ou o valor reembolsado (Senado), em valores nominais.
          Testamos os dois métodos nos arquivos da Câmara e do Senado de 2009 a 2026: o aviso de colegas volta no ano
          seguinte em cerca de metade dos casos (mostra hábitos, não acaso), e o de salto alcança tipos grandes, como
          manutenção de escritório e divulgação, que a comparação com os colegas quase nunca alcança. Ficaram de fora
          métodos que não distinguiram ninguém nesse teste, como a lei de Benford e a concentração num único fornecedor.
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

      <section id="senado" className="scroll-mt-4 space-y-2">
        <h2 className="font-heading text-xl font-bold">Senado Federal</h2>
        <p>
          Os senadores seguem as mesmas regras de fonte, de privacidade e de bens dos deputados, com as diferenças
          abaixo. Os dados vêm da{" "}
          <a href="https://legis.senado.leg.br/dadosabertos/" target="_blank" rel="noopener noreferrer">
            API de Dados Abertos do Senado
          </a>{" "}
          (senadores, mandatos, suplentes, comissões, votações e orientações) e da API de dados administrativos do
          Senado (cota dos senadores, CEAPS). Nenhuma das duas exige cadastro ou chave.
        </p>
        <h3 className="font-semibold">Cota do senador (CEAPS)</h3>
        <p>
          Somamos o valor reembolsado de cada nota no ano. O Senado não publica glosa nem, em formato aberto, o teto da
          cota por estado; por isso o perfil do senador não compara o gasto com um teto e mostra a média mensal (total
          do ano dividido pelos meses com notas). CPF de fornecedor pessoa física não é gravado, nem na máscara do
          Senado: a máscara do Senado e a da Câmara mostram dígitos diferentes e, juntas, revelariam o número.
        </p>
        <h3 className="font-semibold">Presença</h3>
        <p>
          Contamos as votações nominais do Plenário do Senado no ano em que o senador tem registro. Contam como
          presença: Sim, Não, Abstenção, Obstrução, &quot;Votou&quot; (votação secreta), presente sem registrar voto
          (P-NRV) e presidência da sessão. Licenças e afastamentos saem da conta ({[...LICENCAS_SENADO].join(", ")}).
          Todo o resto conta como ausência, inclusive missão oficial e atividade parlamentar, que aparecem com o motivo
          na lista de votações. A média do Senado é a média simples da presença dos senadores em exercício.
        </p>
        <h3 className="font-semibold">Voto conforme a liderança</h3>
        <p>
          Vale só a orientação da liderança do próprio partido do senador no Plenário do Senado (por exemplo,
          &quot;Progressistas&quot; para o PP e &quot;Podemos&quot; para o PODE). Orientações de Governo, Maioria,
          Minoria, Oposição, Bancada Feminina e blocos não contam. Como na Câmara, só comparamos votações em que a
          orientação foi Sim ou Não e o senador votou Sim ou Não.
        </p>
        <p>
          Em votação secreta, como a escolha de autoridades, o Senado registra só que o senador votou. Essas votações
          contam para a presença, mas nunca para o alinhamento.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="font-heading text-xl font-bold">Bens declarados</h2>
        <p>
          Associamos as candidaturas do TSE aos deputados e senadores pelo nome civil e, quando os dois lados publicam,
          pela data de nascimento; sem data, exigimos a mesma UF. Casamentos ambíguos são descartados. Mostramos só o
          tipo e o valor de cada bem, em valores nominais, sem correção pela inflação.
        </p>
      </section>

      <section id="emendas" className="space-y-2">
        <h2 className="font-heading text-xl font-bold">Emendas parlamentares</h2>
        <p>
          Usamos o arquivo de emendas parlamentares do Portal da Transparência (CGU), baixado em lote do servidor de
          arquivos da CGU, sem a API e sem chave. Entram só as emendas individuais dos orçamentos votados durante o
          mandato atual. Para deputados, do orçamento de 2024 em diante (57ª legislatura). Para senadores, a partir do
          orçamento do ano seguinte à posse: de 2020 para quem tomou posse em 2019 e de 2024 para quem tomou posse em
          2023, porque o orçamento do ano da posse foi votado antes dela. Emendas de bancada e de comissão têm autoria
          coletiva e ficam de fora.
        </p>
        <p>
          O arquivo identifica o autor pelo nome parlamentar, sem CPF nem código da Câmara ou do Senado. Ligamos a
          emenda ao parlamentar quando o nome do autor, sem acentos e sem diferença de maiúsculas, é igual ao nome
          parlamentar de exatamente um deputado ou de exatamente um senador (titular ou suplente). Se o nome é de um
          deputado federal atual e também de um senador, a emenda fica com o deputado: hoje são suplentes de senador
          fora do exercício, que apresentaram as emendas na Câmara. Quando dois deputados, ou dois senadores, têm o
          mesmo nome, ou quando nenhum casa, a emenda fica de fora.
        </p>
        <p>
          Empenhado é o valor reservado no Orçamento. Pago é a soma do valor pago no ano com os restos a pagar pagos
          depois. Transferências especiais são as emendas que o arquivo chama de &quot;Transferências Especiais&quot;
          (as &quot;emendas Pix&quot;). Emendas marcadas como &quot;Múltiplo&quot; não têm um local único no Orçamento e
          aparecem numa frase à parte, não na lista de locais. Favorecido pessoa física aparece como &quot;Beneficiário
          pessoa física&quot;, sem o CPF: a máscara do Portal mostra os mesmos dígitos que a da Câmara e, junto com a do
          Senado, remontaria o número.
        </p>
      </section>

      <section id="sancoes" className="space-y-2">
        <h2 className="font-heading text-xl font-bold">Sanções de fornecedores</h2>
        <p>
          Cruzamos os fornecedores pessoa jurídica da cota parlamentar (CEAP da Câmara e CEAPS do Senado) com os
          cadastros de empresas sancionadas da CGU, o CEIS e o CNEP, baixados em lote do Portal da Transparência. A
          comparação é pelo CNPJ, e guardamos só as sanções de empresas que aparecem na cota.
        </p>
        <p>
          Para cada sanção, contamos quantas notas do período exibido têm data de emissão dentro do período da sanção,
          do início ao fim, inclusive. Sanção sem data final vale até hoje. O aviso diz o que está no cadastro oficial e
          não indica irregularidade do parlamentar.
        </p>
      </section>

      <section id="trilha" className="scroll-mt-4 space-y-2">
        <h2 className="font-heading text-xl font-bold">Para onde foi o dinheiro das emendas Pix</h2>
        <p>
          Na transferência especial (&quot;emenda Pix&quot;) o dinheiro vai para o caixa do município ou do estado, que
          depois paga empresas e entidades. O ente informa esses pagamentos no Transferegov. Seguimos o dinheiro em três
          elos, sempre por identificador e nunca pelo nome: a emenda (Portal da Transparência) liga-se ao plano de ação
          pelo código da emenda; o plano liga-se aos relatórios de gestão e aos documentos de liquidação, que trazem o
          CNPJ, o valor e a data de cada pagamento. A API pública do Transferegov é lida uma página por vez, a uma
          requisição por segundo. Banco, agência e conta nunca são guardados; pagamento a pessoa física aparece somado,
          sem nome nem documento. CNPJ com dígito verificador inválido é descartado. O que o ente não informou aparece
          como &quot;Sem pagamento registrado&quot;.
        </p>
        <p>
          Os dois sinais abaixo são indícios, calculados a cada exibição do perfil com regras fixas e públicas. Cada
          regra só usa fatos datados até a data do pagamento avaliado. Ao lado de cada aviso mostramos a taxa de base
          (quantos casos a mesma regra encontra na base inteira) e os arquivos usados, com data e SHA-256. Indício não é
          prova de irregularidade.
        </p>
      </section>

      <section id="recem-aberta" className="scroll-mt-4 space-y-2">
        <h2 className="font-heading text-xl font-bold">Indício: empresa recém-aberta</h2>
        <p>
          <strong>Fonte:</strong> data de início de atividade e CNAE principal do lote &quot;Estabelecimentos&quot; do
          CNPJ, publicado pela Receita Federal. O robots.txt do servidor da Receita não permite robôs: o arquivo é
          baixado à mão pelo navegador e importado localmente, e só entram CNPJs que já estão no Auditaja. Não lemos
          sócios, endereço, telefone nem e-mail.
        </p>
        <p>
          <strong>Regra e limiar:</strong> a matriz da empresa (os 8 primeiros dígitos do CNPJ) começou a funcionar
          menos de 180 dias antes do primeiro pagamento que a empresa recebeu ligado à emenda. Com 180 dias ou mais, não
          há indício. Uma filial nova de empresa antiga vale pela data da matriz; se a matriz não está no lote, usamos a
          data da filial e dizemos isso. Outro ente público (CNAE da divisão 84 ou CNPJ de ente que recebe
          transferências) não é avaliado. A situação cadastral de hoje (ativa, baixada) não entra, porque não diz como a
          empresa estava na data do pagamento.
        </p>
        <p>
          <strong>Exemplo:</strong> empresa aberta em 12/02/2025 que recebeu o primeiro pagamento ligado à emenda em
          25/03/2025: 41 dias, indício. Aberta 180 dias antes do pagamento: sem indício.
        </p>
        <p>
          <strong>Causas conhecidas de falso positivo:</strong> empresa nova legítima, criada para atender uma demanda
          real; MEI ou pequena empresa aberta para formalizar um prestador que já trabalhava; fornecedor único da
          região; reorganização societária, em que um CNPJ novo continua o negócio de um antigo.
        </p>
      </section>

      <section id="ciclo-fechado" className="scroll-mt-4 space-y-2">
        <h2 className="font-heading text-xl font-bold">Indício: ciclo fechado entre emenda e campanha</h2>
        <p>
          <strong>Fonte:</strong> despesas contratadas da prestação de contas de candidatos do TSE (download em lote).
          Guardamos só despesas com fornecedor pessoa jurídica (CNPJ, valor e data) dos candidatos já ligados a um
          parlamentar pelo número sequencial do candidato. Doação de pessoa jurídica é proibida desde 2015 e doador
          pessoa física não é cruzado.
        </p>
        <p>
          <strong>Regra:</strong> o mesmo CNPJ recebeu dinheiro de emenda do parlamentar (pago pelo ente com a emenda
          Pix, ou favorecido direto do Portal da Transparência) e aparece como fornecedor da campanha que deu o mandato
          a esse parlamentar (eleição de 2022 para deputados da 57ª legislatura; para senadores, a eleição anterior à
          posse). A despesa de campanha precisa ter data até a data do pagamento avaliado. CNPJ que aparece na campanha
          de outro parlamentar não gera indício no perfil de quem indicou a emenda. Não há limiar de valor.
        </p>
        <p>
          <strong>Exemplo:</strong> gráfica que vendeu R$ 32 mil à campanha de 2022 e recebeu R$ 86 mil do município com
          a emenda em 2024: indício.
        </p>
        <p>
          <strong>Causas conhecidas de falso positivo:</strong> gráficas, agências de comunicação e serviços comuns
          atendem campanhas e prefeituras com frequência, sobretudo em cidades pequenas; fornecedor único da região;
          pagamento direto da União, em que o parlamentar não escolhe quem o ente contrata.
        </p>
      </section>
    </article>
  );
}
