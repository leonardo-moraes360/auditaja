import type { Metadata } from "next";
import Link from "next/link";
import { responsavel } from "@/lib/responsavel";

export const metadata: Metadata = { title: "Política de privacidade" };

/** Toda mudança no texto atualiza esta data. */
const PRIVACIDADE_ATUALIZADA_EM = "11/11/2026";

export default function Privacidade() {
  const { controlador, doc, encarregado, email } = responsavel();
  return (
    <article className="mx-auto max-w-3xl space-y-6 px-4 py-8 leading-relaxed">
      <header className="space-y-2">
        <h1 className="font-heading text-3xl font-bold">Política de privacidade</h1>
        <p className="text-sm text-muted-foreground">
          Atualizada em {PRIVACIDADE_ATUALIZADA_EM}. Toda mudança neste texto atualiza a data.
        </p>
        <p>
          Como o Auditaja trata dados pessoais, conforme a Lei Geral de Proteção de Dados Pessoais (LGPD, Lei nº
          13.709/2018).
        </p>
      </header>

      <section className="space-y-2">
        <h2 className="font-heading text-xl font-bold">Quem é o responsável</h2>
        <ul className="list-disc space-y-1 pl-5">
          <li>
            Controlador: {controlador} · {doc}
          </li>
          <li>
            Encarregado pelo tratamento de dados pessoais (LGPD): {encarregado} · {email}
          </li>
        </ul>
        <p>O encarregado é o canal para qualquer assunto sobre seus dados pessoais nesta plataforma.</p>
      </section>

      <section className="space-y-2">
        <h2 className="font-heading text-xl font-bold">Quais dados pessoais tratamos</h2>
        <h3 className="font-heading font-bold">Deputados federais</h3>
        <p>
          Dados que a Câmara dos Deputados e o Tribunal Superior Eleitoral já publicam sobre o exercício do mandato:
          nome parlamentar e civil, partido, UF, foto oficial, cargos em comissões, despesas da cota parlamentar (CEAP),
          votos em votações nominais, candidaturas e bens declarados (só o tipo e o valor de cada bem). A data de
          nascimento é usada apenas para associar a candidatura do TSE ao deputado e não é exibida.
        </p>
        <p>
          Não guardamos o CPF, o título de eleitor, o e-mail, a cor ou raça, o estado civil nem a descrição livre dos
          bens, que pode conter endereço.
        </p>
        <h3 className="font-heading font-bold">Terceiros que aparecem nos dados públicos</h3>
        <p>
          Dados de outras pessoas são minimizados no momento da gravação, antes de chegar ao banco, e não apenas na
          tela. O CPF de fornecedor ou favorecido pessoa física não é gravado, nem mascarado: a Câmara e o Portal da
          Transparência mostram os seis dígitos do meio, o Senado mostra os três primeiros e os dois últimos, e as
          máscaras juntas remontariam o número. O nome é substituído por &quot;Prestador pessoa física&quot;. Nomes de
          passageiros da cota parlamentar não são coletados. Empresas aparecem com nome e CNPJ, como publicados pela
          Câmara.
        </p>
        <h3 className="font-heading font-bold">Quem pede correção de um dado</h3>
        <p>
          O formulário &quot;Pedir correção&quot; grava a parte do perfil escolhida, a descrição escrita por você, a
          data e hora do envio e, se você informar, um e-mail para resposta. O e-mail é opcional, serve só para
          responder ao pedido e não é publicado. Não pedimos nome nem documento. Evite incluir na descrição dados
          pessoais que não sejam necessários para a correção.
        </p>
        <h3 className="font-heading font-bold">Quem só navega</h3>
        <p>
          O Auditaja não tem cadastro nem login e não grava no banco de dados o endereço IP nem o histórico de navegação
          de quem visita o site.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="font-heading text-xl font-bold">Para que usamos e com qual base legal</h2>
        <ul className="list-disc space-y-1 pl-5">
          <li>
            <strong>Dados de deputados:</strong> transparência e controle social da atividade parlamentar, finalidade de
            interesse público que justificou a própria publicação pelos órgãos. Tratamos esses dados com base no
            legítimo interesse (art. 7º, IX), respeitando a finalidade, a boa-fé e o interesse público da publicação
            original (art. 7º, § 3º). Para dados tornados manifestamente públicos pelo titular, o consentimento é
            dispensado, resguardados os direitos do titular e os princípios da lei (art. 7º, § 4º). A filiação
            partidária é dado sensível (art. 5º, II); tratamos apenas a de parlamentares, tornada pública por eles ao se
            candidatar, e nunca listas de filiados. Não tratamos outros dados sensíveis (art. 11).
          </li>
          <li>
            <strong>Dados de terceiros:</strong> aparecem só porque constam dos documentos públicos da cota, e por isso
            são reduzidos ao mínimo (art. 6º, III).
          </li>
          <li>
            <strong>Pedidos de correção:</strong> conferir o dado com a fonte oficial, corrigir o perfil e responder a
            quem pediu, com base no legítimo interesse de atender ao pedido feito pelo próprio titular (art. 7º, IX).
          </li>
        </ul>
        <p>
          Indicadores são pontos de partida para verificação. Não fazemos perfis de comportamento, não tomamos decisões
          automatizadas sobre pessoas e não usamos os dados para publicidade.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="font-heading text-xl font-bold">Com quem compartilhamos</h2>
        <p>
          Os dados de deputados são publicados abertamente no site, com a fonte e a data de coleta de cada registro. Não
          vendemos dados. Os pedidos de correção e o e-mail de contato não são publicados nem repassados a terceiros,
          salvo quando a lei ou uma ordem de autoridade competente exigir.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="font-heading text-xl font-bold">Por quanto tempo guardamos</h2>
        <ul className="list-disc space-y-1 pl-5">
          <li>
            Dados de deputados e de terceiros: enquanto o Auditaja publicar o perfil, atualizados a cada nova coleta na
            fonte oficial.
          </li>
          <li>
            Pedidos de correção: enquanto forem necessários para a análise e para o registro das correções do perfil.
            Hoje não há exclusão automática; você pode pedir a eliminação do seu e-mail de contato a qualquer momento.
          </li>
        </ul>
      </section>

      <section className="space-y-2">
        <h2 className="font-heading text-xl font-bold">Seus direitos e como exercê-los</h2>
        <p>Pelo art. 18 da LGPD, o titular pode pedir:</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>confirmação de que tratamos seus dados e acesso a eles;</li>
          <li>correção de dados incompletos, inexatos ou desatualizados;</li>
          <li>
            anonimização, bloqueio ou eliminação de dados desnecessários, excessivos ou tratados em desconformidade;
          </li>
          <li>informação sobre com quem os dados foram compartilhados;</li>
          <li>oposição ao tratamento, quando ele descumprir a LGPD;</li>
          <li>portabilidade, nos termos da regulamentação da ANPD.</li>
        </ul>
        <p>
          Para corrigir um dado, abra o perfil do deputado em <Link href="/parlamentares">Parlamentares</Link> e use
          &quot;Pedir correção&quot; no topo do perfil ou em cada seção. Para os demais pedidos, escreva ao encarregado
          ({email}). Respondemos nos prazos do art. 19 da LGPD. Como os dados de deputados vêm de fontes oficiais, um
          erro na origem também precisa ser corrigido pelo órgão que o publicou.
        </p>
        <p>
          Você também pode apresentar reclamação à Autoridade Nacional de Proteção de Dados (ANPD), em{" "}
          <a href="https://www.gov.br/anpd" target="_blank" rel="noopener noreferrer">
            gov.br/anpd
          </a>
          .
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="font-heading text-xl font-bold">Cookies</h2>
        <p>
          O Auditaja não usa cookies, ferramentas de análise de audiência nem rastreadores de publicidade. As fontes do
          site são servidas pelo próprio Auditaja. As fotos oficiais dos deputados são carregadas diretamente do
          servidor da Câmara dos Deputados, que recebe a requisição do seu navegador conforme a política dela.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="font-heading text-xl font-bold">Segurança</h2>
        <ul className="list-disc space-y-1 pl-5">
          <li>
            O banco nunca recebe CPF de terceiros, nem completo nem mascarado, o nome de fornecedor pessoa física, o
            nome de passageiros nem a descrição livre de bens: o que não é gravado não pode vazar.
          </li>
          <li>O banco de dados é acessado só pelo servidor da aplicação, nunca pelo navegador.</li>
          <li>Credenciais ficam em variáveis de ambiente, fora do código-fonte.</li>
          <li>O formulário de correção valida no servidor o tamanho de cada campo antes de gravar.</li>
        </ul>
        <p>
          Se houver incidente de segurança que possa causar risco ou dano relevante aos titulares, comunicaremos a ANPD
          e os titulares afetados, como manda o art. 48 da LGPD.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="font-heading text-xl font-bold">Mudanças nesta política</h2>
        <p>
          Quando esta política mudar, a nova versão é publicada nesta página com a data de atualização no topo. Veja
          também a <Link href="/metodologia">metodologia</Link> e as <Link href="/fontes">fontes e licenças</Link>.
        </p>
      </section>
    </article>
  );
}
