import type { Metadata } from "next";
import Link from "next/link";
import { LICENCA_CODIGO, LICENCA_DADOS, REPOSITORIO_URL } from "@/lib/licenca";
import { responsavel } from "@/lib/responsavel";
import { metadataDaPagina } from "@/lib/site";

export const metadata: Metadata = metadataDaPagina({
  titulo: "Termos de uso",
  descricao: "Condições para usar o Auditaja: licença do código e dos dados, limitações e responsabilidades.",
  caminho: "/termos",
});

const TERMOS_ATUALIZADO_EM = "13/11/2026";

export default function Termos() {
  const { controlador, doc, encarregado, email } = responsavel();
  return (
    <article className="mx-auto max-w-3xl space-y-6 px-4 py-8 leading-relaxed">
      <header className="space-y-2">
        <h1 className="font-heading text-3xl font-bold">Termos de uso</h1>
        <p className="text-sm text-muted-foreground">
          Atualizado em {TERMOS_ATUALIZADO_EM}. Toda mudança neste texto atualiza a data.
        </p>
        <p>
          Ao usar o Auditaja você aceita estes termos. Se não concordar, não use o site. Para dúvidas, escreva ao
          encarregado ({email}).
        </p>
      </header>

      <section className="space-y-2">
        <h2 className="font-heading text-xl font-bold">O que é o Auditaja</h2>
        <p>
          O Auditaja é uma plataforma de transparência que reúne, organiza e publica dados que a Câmara dos Deputados, o
          Senado Federal, o Tribunal Superior Eleitoral, a Controladoria-Geral da União e outros órgãos públicos já
          divulgam em dados abertos. O objetivo é facilitar o controle social da atividade parlamentar.
        </p>
        <p>
          Os dados exibidos são <strong>públicos</strong>, coletados de <strong>fontes oficiais</strong>, e cada seção
          do perfil mostra a origem, a data de coleta e o link para o original.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="font-heading text-xl font-bold">Responsável pelo site</h2>
        <ul className="list-disc space-y-1 pl-5">
          <li>
            Controlador: {controlador} · {doc}
          </li>
          <li>
            Encarregado pelo tratamento de dados pessoais (LGPD): {encarregado} · {email}
          </li>
        </ul>
      </section>

      <section className="space-y-2">
        <h2 className="font-heading text-xl font-bold">Licença do código-fonte</h2>
        <p>
          O código-fonte do Auditaja é livre e está disponível no{" "}
          <a href={REPOSITORIO_URL} target="_blank" rel="noopener noreferrer">
            repositório do projeto no GitHub
          </a>
          , sob a licença{" "}
          <a href={LICENCA_CODIGO.url} target="_blank" rel="noopener noreferrer">
            {LICENCA_CODIGO.nome}
          </a>{" "}
          (ou versão posterior).
        </p>
        <p>
          Qualquer pessoa pode usar, modificar e redistribuir o código, desde que mantenha a mesma licença. Quem colocar
          no ar uma versão modificada precisa publicar o código-fonte dela aos usuários.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="font-heading text-xl font-bold">Licença dos dados e textos</h2>
        <p>
          Os dados e textos que o Auditaja produz (planilhas CSV, perfis, totais, indicadores, trilha do dinheiro,
          metodologia e o guia para agentes) estão sob a licença{" "}
          <a href={LICENCA_DADOS.resumo} target="_blank" rel="noopener noreferrer">
            Creative Commons Atribuição 4.0 ({LICENCA_DADOS.nome})
          </a>
          .
        </p>
        <p>
          Você pode copiar, adaptar e republicar, inclusive com fins comerciais, desde que cite &quot;Auditaja&quot;, o
          link da página ou do arquivo e a data da coleta. Ao reusar um indicador, mantenha o aviso de que ele é ponto
          de partida para verificação, não acusação.
        </p>
        <p>
          Os dados de origem (Câmara, Senado, TSE, CGU, Transferegov, Receita Federal) continuam sob a licença de cada
          órgão, listada nas <Link href="/fontes">fontes e licenças</Link>.
        </p>
        <p>O nome Auditaja e o logo não estão licenciados: identificam o projeto.</p>
      </section>

      <section className="space-y-2">
        <h2 className="font-heading text-xl font-bold">Uso permitido</h2>
        <ul className="list-disc space-y-1 pl-5">
          <li>Consultar os dados para fins de informação, pesquisa, jornalismo ou controle social.</li>
          <li>Compartilhar links e trechos, citando a fonte.</li>
          <li>Usar os CSVs e a API respeitando as licenças acima.</li>
          <li>Acessar por navegador ou por ferramentas automatizadas que respeitem o robots.txt.</li>
        </ul>
      </section>

      <section className="space-y-2">
        <h2 className="font-heading text-xl font-bold">Uso proibido</h2>
        <ul className="list-disc space-y-1 pl-5">
          <li>Usar o site para difamar, caluniar ou injuriar qualquer pessoa.</li>
          <li>Afirmar que um indicador é prova de irregularidade sem a verificação correspondente.</li>
          <li>Sobrecarregar o servidor com requisições excessivas ou automatizadas além do razoável.</li>
          <li>Tentar explorar vulnerabilidades ou acessar dados que não sejam públicos.</li>
          <li>
            Usar o nome ou o logo de forma que sugira endosso ou patrocínio por parte do Auditaja sem autorização.
          </li>
        </ul>
      </section>

      <section className="space-y-2">
        <h2 className="font-heading text-xl font-bold">Isenção de garantias</h2>
        <p>
          Os dados do Auditaja vêm de fontes oficiais, mas podem conter erros de origem, de coleta ou de processamento.
          Indicadores são pontos de partida para verificação, não acusações.
        </p>
        <p>
          O Auditaja é fornecido &quot;como está&quot;, sem garantia de qualquer tipo, expressa ou implícita. Não nos
          responsabilizamos por decisões tomadas com base nas informações publicadas aqui. Antes de usar um dado em
          contexto oficial, confira na fonte original.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="font-heading text-xl font-bold">Limitação de responsabilidade</h2>
        <p>
          Na extensão permitida pela lei, o controlador, os desenvolvedores e os colaboradores do Auditaja não serão
          responsáveis por quaisquer danos diretos, indiretos, incidentais, especiais, consequenciais ou punitivos
          decorrentes do uso ou da impossibilidade de uso do site.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="font-heading text-xl font-bold">Privacidade</h2>
        <p>
          O tratamento de dados pessoais pelo Auditaja está descrito na{" "}
          <Link href="/privacidade">política de privacidade</Link>. O Auditaja não tem cadastro nem login e não usa
          cookies, ferramentas de análise de audiência nem rastreadores de publicidade.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="font-heading text-xl font-bold">Alterações</h2>
        <p>
          Estes termos podem ser alterados a qualquer momento. A nova versão é publicada nesta página com a data de
          atualização no topo. O uso continuado do site após a alteração implica aceitação dos novos termos.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="font-heading text-xl font-bold">Foro</h2>
        <p>
          Qualquer controvérsia decorrente destes termos será submetida ao foro da comarca do domicílio do controlador,
          ressalvado o direito do consumidor de optar pelo foro de seu próprio domicílio.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="font-heading text-xl font-bold">Contato</h2>
        <p>
          Dúvidas sobre estes termos ou sobre o site podem ser encaminhadas ao encarregado pelo e-mail {email}. Veja
          também a <Link href="/metodologia">metodologia</Link>, as <Link href="/fontes">fontes e licenças</Link> e a{" "}
          <Link href="/privacidade">política de privacidade</Link>.
        </p>
      </section>
    </article>
  );
}
